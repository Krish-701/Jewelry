/**
 * Two-Step Verification API
 * 
 * This endpoint validates all user inputs BEFORE generation
 * and returns a detailed breakdown of what will be generated.
 * 
 * This allows the frontend to show the user a confirmation
 * screen with all settings clearly displayed.
 */

import { NextResponse } from 'next/server';
import { getTemplateById } from '@/lib/templates';
import { verifyAndBuildPrompt, resolveConflicts } from '@/lib/prompt-verifier';

export const maxDuration = 30;

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
            backgroundPreset = null,
            religionPreset = null,
            dressCodePreset = null,
            customModelPhoto = null,
            consistencyMode = 'exact',
        } = await request.json();

        if (!images || images.length === 0) {
            return NextResponse.json({ error: 'No images provided' }, { status: 400 });
        }

        // Get template
        const template = getTemplateById(templateId || 'south-indian');
        
        // Handle custom template
        const effectiveTemplate = templateId === 'custom'
            ? {
                ...template,
                modelPrompt: customPrompt?.modelPrompt || '',
                settingPrompt: customPrompt?.settingPrompt || '',
                lightingPrompt: customPrompt?.lightingPrompt || '',
                posePrompt: customPrompt?.posePrompt || '',
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
            resolvedTemplate: resolved.template
        };

        // STEP 3: Verify and build prompt with full validation
        const verification = verifyAndBuildPrompt({
            analysis: analysis || {},
            template: resolved.template,
            imageCount: images.length,
            extraPrompt,
            presetOptions
        });

        // STEP 4: Build human-readable summary
        const summary = buildVerificationSummary(verification, resolved, sizes, template, analysis);

        return NextResponse.json({
            verified: verification.isValid,
            warnings: verification.warnings,
            errors: verification.errors,
            summary,
            prompt: verification.prompt,
            resolvedSettings: {
                templateId,
                originalTemplate: template.name,
                backgroundPreset: resolved.backgroundPreset,
                religionPreset: resolved.religionPreset,
                dressCodePreset: resolved.dressCodePreset,
                conflictsResolved: resolved.conflicts,
                modifications: resolved.modifications
            },
            sizeValidation: verification.sizeValidation,
            // For display in confirmation UI
            displayData: {
                jewelryType: analysis?.type || 'jewelry',
                pieces: analysis?.pieces || [],
                sizes: formatSizesForDisplay(sizes, analysis),
                modelDescription: resolved.template.modelPrompt?.substring(0, 200) + '...',
                settingDescription: resolved.template.settingPrompt?.substring(0, 200) + '...',
                religion: getReligionDisplayName(resolved.religionPreset),
                dressCode: getDressCodeDisplayName(resolved.dressCodePreset),
                background: getBackgroundDisplayName(resolved.backgroundPreset)
            }
        });

    } catch (error) {
        console.error('Verify error:', error);
        return NextResponse.json(
            { error: error.message || 'Verification failed' },
            { status: 500 }
        );
    }
}

function formatSizesForDisplay(sizes, analysis) {
    const pieces = analysis?.pieces || [];
    const hasPieces = pieces.length > 0;
    
    const formatted = [];
    
    if (hasPieces) {
        pieces.forEach((piece, index) => {
            const sizeData = sizes?.[index];
            if (sizeData?.value) {
                formatted.push({
                    name: piece.type || piece.description || `Piece ${index + 1}`,
                    size: `${sizeData.value} ${sizeData.unit}`,
                    description: piece.description
                });
            }
        });
    } else {
        const sizeData = sizes?.[0] || Object.values(sizes || {})[0];
        if (sizeData?.value) {
            formatted.push({
                name: analysis?.type || 'Jewelry',
                size: `${sizeData.value} ${sizeData.unit}`,
                description: analysis?.description
            });
        }
    }
    
    return formatted;
}

function getReligionDisplayName(religionId) {
    const map = {
        'hindu': 'Hindu',
        'christian': 'Christian',
        'muslim': 'Muslim',
        'other': 'Universal/Other',
        null: 'Not specified'
    };
    return map[religionId] || religionId;
}

function getDressCodeDisplayName(dressCodeId) {
    const map = {
        'cream-silk-saree': 'Cream/Ivory Silk Saree',
        'white-anarkali': 'White/Off-White Anarkali Suit',
        'beige-kurta-palazzo': 'Beige Champagne Kurta + Palazzo',
        'blush-lehenga': 'Light Blush Pink Lehenga Choli',
        'red-silk-saree': 'Classic Red/Maroon Silk Saree',
        'white-maxi-gown': 'White/Ivory Maxi Dress/Gown',
        'mint-anarkali': 'Soft Pastel Green/Mint Anarkali',
        'cream-kurti-dupatta': 'Cream/Beige Kurti with Dupatta',
        'black-silk-saree': 'Black/Deep Charcoal Silk Saree',
        'gold-silk-lehenga': 'Ivory/Light Gold Silk Lehenga',
        null: 'Default from template'
    };
    return map[dressCodeId] || dressCodeId;
}

function getBackgroundDisplayName(backgroundId) {
    const map = {
        'white-studio': 'Pure White Studio',
        'grey-neutral': 'Light Grey/Beige Neutral',
        'white-marble': 'Luxurious White Marble',
        'black-charcoal': 'Soft Black/Deep Charcoal',
        'cream-silk': 'Cream Ivory Silk Drape',
        'gold-champagne': 'Gold-Flecked Champagne',
        'marble-courtyard': 'Marble Courtyard/Jharokha',
        'pastel-blush': 'Soft Pastel Pink/Blush',
        'wood-neutral': 'Polished Wood + Neutral Wall',
        'window-natural': 'Studio with Natural Window Light',
        null: 'Default from template'
    };
    return map[backgroundId] || backgroundId;
}

function buildVerificationSummary(verification, resolved, sizes, template, analysis) {
    const lines = [];
    
    // Header
    lines.push('╔══════════════════════════════════════════════════════════════════╗');
    lines.push('║               GENERATION VERIFICATION REPORT                     ║');
    lines.push('╚══════════════════════════════════════════════════════════════════╝');
    lines.push('');
    
    // Jewelry Info
    lines.push('📿 JEWELRY');
    lines.push(`   Type: ${analysis?.type || 'Not specified'}`);
    lines.push(`   Style: ${analysis?.style || 'Not specified'}`);
    lines.push(`   Material: ${analysis?.material || 'Not specified'}`);
    if (analysis?.stones?.length) {
        lines.push(`   Stones: ${analysis.stones.join(', ')}`);
    }
    lines.push('');
    
    // Sizes
    lines.push('📏 SIZES');
    if (verification.sizeValidation?.length > 0) {
        verification.sizeValidation.forEach(sv => {
            const status = sv.isValid ? '✓' : '✗';
            lines.push(`   ${status} ${sv.pieceName}: ${sv.displaySize}`);
            if (sv.warning) {
                lines.push(`     ⚠️  ${sv.warning}`);
            }
        });
    } else {
        lines.push('   ⚠️  No sizes specified');
    }
    lines.push('');
    
    // Template & Presets
    lines.push('🎭 TEMPLATE & PRESETS');
    lines.push(`   Template: ${template.name}`);
    
    if (resolved.conflicts.length > 0) {
        lines.push('');
        lines.push('   🔄 CONFLICTS RESOLVED:');
        resolved.conflicts.forEach(conflict => {
            lines.push(`      • ${conflict.description}`);
            lines.push(`        → ${conflict.resolution}`);
        });
    }
    
    if (resolved.modifications.length > 0) {
        lines.push('');
        lines.push('   📝 MODIFICATIONS APPLIED:');
        resolved.modifications.forEach(mod => {
            lines.push(`      • ${mod}`);
        });
    }
    
    lines.push('');
    lines.push(`   Religion/Culture: ${getReligionDisplayName(resolved.religionPreset)}`);
    lines.push(`   Dress Code: ${getDressCodeDisplayName(resolved.dressCodePreset)}`);
    lines.push(`   Background: ${getBackgroundDisplayName(resolved.backgroundPreset)}`);
    lines.push('');
    
    // Warnings & Errors
    if (verification.warnings.length > 0) {
        lines.push('⚠️  WARNINGS');
        verification.warnings.forEach(w => lines.push(`   • ${w}`));
        lines.push('');
    }
    
    if (verification.errors.length > 0) {
        lines.push('❌ ERRORS');
        verification.errors.forEach(e => lines.push(`   • ${e}`));
        lines.push('');
    }
    
    // Final status
    lines.push('╔══════════════════════════════════════════════════════════════════╗');
    if (verification.isValid) {
        lines.push('║  ✓ VERIFICATION PASSED - Ready to generate                       ║');
    } else {
        lines.push('║  ✗ VERIFICATION FAILED - Please fix errors above                ║');
    }
    lines.push('╚══════════════════════════════════════════════════════════════════╝');
    
    return lines.join('\n');
}
