import { NextResponse } from 'next/server';
import { generateImage, buildJewelryPrompt } from '@/lib/ai-provider';
import { getTemplateById } from '@/lib/templates';
import { saveImage, savePrompt, saveHistoryEntry, updateHistoryEntry } from '@/lib/storage';

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

        // Build preset options for prompt generation
        const presetOptions = {
            backgroundPreset,
            religionPreset,
            dressCodePreset,
            hasCustomModelPhoto: !!customModelPhoto,
            consistencyMode,
            sizes,
        };

        // Build prompt — passes extraPrompt + presets so everything influences output
        const prompt = buildJewelryPrompt(
            analysis || {},
            effectiveTemplate,
            images.length,
            extraPrompt,
            presetOptions
        );

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
