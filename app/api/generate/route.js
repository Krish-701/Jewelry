import { NextResponse } from 'next/server';
import { generateImage } from '@/lib/ai-provider';
import { getTemplateById } from '@/lib/templates';
import { saveImage, savePrompt, saveHistoryEntry, updateHistoryEntry } from '@/lib/storage';
import { verifyAndBuildPrompt, resolveConflicts } from '@/lib/prompt-verifier';

export const maxDuration = 300;

export async function POST(request) {
    try {
        const {
            images,
            templateId,
            analysis,
            sizes = {},
            customPrompt,
            outputSize = 'portrait',
            extraPrompt = '',
            // New preset fields
            backgroundPreset = null,
            religionPreset = null,
            dressCodePreset = null,
            customModelPhoto = null,
            consistencyMode = 'exact',
        } = await request.json();

        if (!images || images.length === 0) {
            return NextResponse.json({ error: 'No images provided' }, { status: 400 });
        }

        if (templateId === 'custom-model' && !customModelPhoto) {
            return NextResponse.json({ error: 'Custom Model template requires a model photo upload' }, { status: 400 });
        }

        const template = getTemplateById(templateId || 'south-indian');

        const effectiveTemplate = templateId === 'custom'
            ? {
                ...template,
                modelPrompt:   customPrompt?.modelPrompt   || '',
                settingPrompt: customPrompt?.settingPrompt || '',
                lightingPrompt: customPrompt?.lightingPrompt || '',
                posePrompt:    customPrompt?.posePrompt    || '',
            }
            : template;

        // STEP 1: Resolve conflicts between template and presets
        const resolved = resolveConflicts({
            template: effectiveTemplate,
            templateId,
            backgroundPreset,
            religionPreset,
            dressCodePreset,
            customModelPhoto,
            consistencyMode,
            analysis
        });

        // STEP 2: Build preset options with conflict resolution
        const presetOptions = {
            backgroundPreset: resolved.backgroundPreset,
            religionPreset: resolved.religionPreset,
            dressCodePreset: resolved.dressCodePreset,
            hasCustomModelPhoto: !!customModelPhoto,
            consistencyMode,
            sizes,
        };

        // STEP 3: Verify and build prompt with full validation
        const verification = verifyAndBuildPrompt({
            analysis: analysis || {},
            template: resolved.template,
            imageCount: images.length,
            extraPrompt,
            presetOptions
        });

        // Log verification for debugging
        console.log('\n' + '='.repeat(70));
        console.log('GENERATION VERIFICATION REPORT');
        console.log('='.repeat(70));
        console.log('Template:', template.name);
        console.log('Conflicts resolved:', resolved.conflicts.length);
        resolved.conflicts.forEach(c => console.log('  -', c.description, '→', c.resolution));
        console.log('Modifications:', resolved.modifications.length);
        resolved.modifications.forEach(m => console.log('  -', m));
        console.log('Verification valid:', verification.isValid);
        console.log('Warnings:', verification.warnings.length);
        verification.warnings.forEach(w => console.log('  ⚠️', w));
        console.log('='.repeat(70) + '\n');

        const prompt = verification.prompt;

        // Combine jewelry + custom model images for generation
        const allImages = [...images];
        if (customModelPhoto) {
            allImages.push({
                base64: customModelPhoto.base64,
                mimeType: customModelPhoto.mimeType || 'image/jpeg',
            });
        }

        const result = await generateImage(prompt, allImages, { outputSize });

        if (!result.images && result.status !== 'processing') {
            return NextResponse.json(
                { error: 'No image was generated. Try again or adjust the template.' },
                { status: 500 }
            );
        }

        // Save prompt to disk
        savePrompt(result.jobId, prompt);

        // If completed immediately, save image to disk
        let imageUrl = null;
        let imageFilename = null;
        if (result.images && result.images.length > 0) {
            const img = result.images[0];
            imageFilename = `${result.jobId}.${img.mimeType?.includes('png') ? 'png' : 'jpg'}`;
            imageUrl = saveImage(result.jobId, img.data, img.mimeType);
        }

        // Save history entry
        const templateLabel = templateId?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'South Indian';
        const historyEntry = saveHistoryEntry({
            jobId: result.jobId,
            status: result.status || 'completed',
            prompt: prompt.substring(0, 200) + '...', // Short version
            templateName: `${templateLabel} — ${images.length} ref${images.length > 1 ? 's' : ''}`,
            templateId: templateId || 'south-indian',
            outputSize,
            imageUrl,
            imageFilename,
            thumbnail: images[0]?.base64?.substring(0, 100) + '...', // Small preview
            timestamp: Date.now(),
        });

        return NextResponse.json({
            images:     result.images || [],
            jobId:      result.jobId,
            status:     result.status || 'completed',
            prompt,
            text:       result.text,
            outputSize,
            templateId: templateId || 'south-indian',
            imageUrl,
        });
    } catch (error) {
        console.error('Generate error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to generate image' },
            { status: 500 }
        );
    }
}
