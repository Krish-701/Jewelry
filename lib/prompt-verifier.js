/**
 * Prompt Verifier & Conflict Resolver
 * 
 * This module handles the CRITICAL logic of resolving conflicts between
 * templates and user-selected presets, ensuring user choices take priority.
 */

import { BACKGROUND_PRESETS, RELIGION_PRESETS, DRESS_CODE_PRESETS, MODEL_CONSISTENCY_OPTIONS, getPresetById } from './presets.js';

// ═══════════════════════════════════════════════════════════════════════════════
// CONFLICT RESOLUTION RULES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * TEMPLATE CONFLICT MAP
 * Defines which template elements conflict with which presets
 */
const TEMPLATE_CONFLICTS = {
    'south-indian': {
        // When user selects Christian/Muslim/Other religion, we must modify the template
        religionConflicts: ['christian', 'muslim', 'other'],
        // Elements in the template that need modification
        conflictingElements: {
            modelPrompt: [
                { pattern: /South Indian woman/gi, replacement: 'Indian woman' },
                { pattern: /jasmine flowers \(gajra\)/gi, replacement: 'elegant hairstyle' },
                { pattern: /traditional temple-style hair/gi, replacement: 'elegant hairstyle' },
                { pattern: /standing in an ornate temple corridor/gi, replacement: 'in an elegant indoor setting' },
                { pattern: /with carved stone pillars/gi, replacement: '' },
            ],
            settingPrompt: [
                { pattern: /traditional South Indian temple/gi, replacement: 'elegant indoor setting' },
                { pattern: /golden oil lamps/gi, replacement: 'soft ambient lighting' },
                { pattern: /intricate gopuram architecture/gi, replacement: 'sophisticated interior design' },
                { pattern: /marigold flower decorations/gi, replacement: 'subtle floral accents' },
            ],
            lightingPrompt: [
                { pattern: /divine glow/gi, replacement: 'warm glow' },
                { pattern: /oil lamp reflections/gi, replacement: 'soft light reflections' },
            ]
        },
        // Replacement prompts based on religion
        religionReplacements: {
            'christian': {
                modelPrompt: 'A beautiful Indian Christian woman wearing elegant attire, with a graceful and modest appearance, subtle makeup, in a refined indoor setting',
                settingPrompt: 'elegant church interior or sophisticated Christian wedding venue with soft lighting, white floral arrangements, refined and peaceful atmosphere',
                lightingPrompt: 'soft natural lighting with warm gentle tones, serene and peaceful ambiance'
            },
            'muslim': {
                modelPrompt: 'A beautiful Indian Muslim woman wearing elegant modest attire, graceful and dignified appearance, in a refined indoor setting',
                settingPrompt: 'elegant indoor setting with Islamic architectural elements, soft lighting, peaceful and refined atmosphere',
                lightingPrompt: 'soft warm lighting with gentle shadows, serene and dignified ambiance'
            },
            'other': {
                modelPrompt: 'A beautiful Indian woman wearing elegant modern attire, sophisticated and graceful appearance, in a contemporary indoor setting',
                settingPrompt: 'modern elegant indoor setting with sophisticated design, clean lines, soft ambient lighting',
                lightingPrompt: 'modern professional lighting with clean warm tones, contemporary ambiance'
            }
        }
    },
    'north-indian': {
        religionConflicts: ['christian', 'muslim', 'other'],
        conflictingElements: {
            modelPrompt: [
                { pattern: /North Indian woman/gi, replacement: 'Indian woman' },
            ],
            settingPrompt: [
                { pattern: /Mughal palace interior/gi, replacement: 'elegant indoor setting' },
                { pattern: /marble jali screens/gi, replacement: 'elegant window treatments' },
            ]
        },
        religionReplacements: {
            'christian': {
                modelPrompt: 'A beautiful Indian Christian woman wearing elegant attire, graceful and sophisticated appearance',
                settingPrompt: 'elegant church hall or sophisticated Christian venue with soft lighting and white floral arrangements',
                lightingPrompt: 'soft natural lighting with warm gentle tones'
            },
            'muslim': {
                modelPrompt: 'A beautiful Indian Muslim woman wearing elegant modest attire, graceful and dignified appearance',
                settingPrompt: 'elegant indoor venue with Islamic architectural influences, soft dignified lighting',
                lightingPrompt: 'soft warm lighting with gentle shadows'
            },
            'other': {
                modelPrompt: 'A beautiful Indian woman wearing elegant modern attire, sophisticated appearance',
                settingPrompt: 'modern elegant indoor setting with sophisticated design',
                lightingPrompt: 'modern professional lighting'
            }
        }
    }
};

// ═══════════════════════════════════════════════════════════════════════════════
// CONFLICT RESOLUTION ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Resolves conflicts between template and user-selected presets
 * USER CHOICES ALWAYS TAKE PRIORITY
 */
export function resolveConflicts({
    template,
    templateId,
    backgroundPreset,
    religionPreset,
    dressCodePreset,
    customModelPhoto,
    consistencyMode,
    analysis
}) {
    const conflicts = [];
    const modifications = [];
    
    // Start with a copy of the template
    let resolvedTemplate = { ...template };
    
    // Get conflict rules for this template
    const conflictRules = TEMPLATE_CONFLICTS[templateId];
    
    // Check for religion conflicts
    if (conflictRules && religionPreset && conflictRules.religionConflicts.includes(religionPreset)) {
        conflicts.push({
            type: 'religion_template_mismatch',
            description: `Template "${template.name}" contains religious elements that conflict with "${religionPreset}" religion preset`,
            resolution: `Modified template to match ${religionPreset} aesthetic`
        });
        
        // Apply religion-specific replacements
        const replacements = conflictRules.religionReplacements[religionPreset];
        if (replacements) {
            resolvedTemplate.modelPrompt = replacements.modelPrompt;
            resolvedTemplate.settingPrompt = replacements.settingPrompt;
            resolvedTemplate.lightingPrompt = replacements.lightingPrompt;
            modifications.push(`Model description changed to match ${religionPreset} aesthetic`);
            modifications.push(`Setting changed from temple/palace to appropriate venue`);
            modifications.push(`Lighting adjusted for ${religionPreset} atmosphere`);
        }
    }
    
    // If dress code is specified, it overrides the template's outfit description
    if (dressCodePreset) {
        const dressPreset = getPresetById(DRESS_CODE_PRESETS, dressCodePreset);
        if (dressPreset && resolvedTemplate.modelPrompt) {
            // Remove clothing references from model prompt
            const clothingPatterns = [
                /wearing a rich Kanjivaram silk saree[^,]*/gi,
                /wearing an embroidered royal blue and gold lehenga[^,]*/gi,
                /wearing elegant black cocktail dress[^,]*/gi,
                /wearing a flowing champagne-colored silk gown[^,]*/gi,
            ];
            
            let modifiedModelPrompt = resolvedTemplate.modelPrompt;
            clothingPatterns.forEach(pattern => {
                modifiedModelPrompt = modifiedModelPrompt.replace(pattern, `wearing ${dressPreset.name}`);
            });
            
            if (modifiedModelPrompt !== resolvedTemplate.modelPrompt) {
                resolvedTemplate.modelPrompt = modifiedModelPrompt;
                modifications.push(`Outfit changed to: ${dressPreset.name}`);
            }
        }
    }
    
    // If background preset is specified, it completely overrides template setting
    if (backgroundPreset) {
        const bgPreset = getPresetById(BACKGROUND_PRESETS, backgroundPreset);
        if (bgPreset) {
            conflicts.push({
                type: 'background_override',
                description: `User-selected background "${bgPreset.name}" overrides template default`,
                resolution: `Background set to: ${bgPreset.name}`
            });
            modifications.push(`Background changed from "${template.settingPrompt?.substring(0, 50)}..." to "${bgPreset.name}"`);
        }
    }
    
    // If custom model photo is used, template model description is irrelevant
    if (customModelPhoto) {
        const consistencyOpt = getPresetById(MODEL_CONSISTENCY_OPTIONS, consistencyMode || 'exact');
        conflicts.push({
            type: 'custom_model_override',
            description: 'Custom model photo uploaded - template model description will be ignored',
            resolution: `Using uploaded photo with ${consistencyOpt?.name || 'Exact Match'} mode`
        });
        modifications.push('Template model replaced with uploaded custom model photo');
        
        // Use the custom-model template prompts
        resolvedTemplate.modelPrompt = 'Use the uploaded model reference photo exactly as-is — same person, same face, same skin tone, same body proportions, same hair style and color, same outfit, same background. The model and the entire scene must remain completely unchanged.';
        resolvedTemplate.settingPrompt = 'Keep the exact same background, setting, and environment from the uploaded model reference photo. No changes to the scene whatsoever.';
        resolvedTemplate.lightingPrompt = 'Preserve the exact same lighting conditions from the uploaded model reference photo.';
        resolvedTemplate.posePrompt = 'Keep the exact same pose, expression, and body position from the uploaded model reference photo.';
    }
    
    return {
        template: resolvedTemplate,
        backgroundPreset,
        religionPreset,
        dressCodePreset,
        conflicts,
        modifications,
        wasModified: conflicts.length > 0 || modifications.length > 0
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// SIZE VALIDATION & ENFORCEMENT
// ═══════════════════════════════════════════════════════════════════════════════

const JEWELRY_SIZE_GUIDE = {
    ring: {
        unit: 'cm',
        typicalRange: { min: 1.5, max: 2.5 },
        visualReference: {
            small: '1.6cm - Small finger, delicate band',
            medium: '1.8cm - Average adult finger',
            large: '2.1cm - Larger finger, statement piece'
        },
        bodyProportion: 'Ring diameter should be approximately 1/4 to 1/3 of finger width',
        strictEnforcement: true
    },
    earrings: {
        unit: 'cm',
        typicalRange: { min: 0.5, max: 10 },
        visualReference: {
            small: '1-2cm - Stud or small drop',
            medium: '3-5cm - Standard drop earrings',
            large: '6-8cm - Statement chandelier',
            extraLarge: '10cm+ - Dramatic shoulder dusters'
        },
        bodyProportion: 'Earring length should be proportionate to face length (typically 1/4 to 1/2 of face height)',
        strictEnforcement: true
    },
    necklace: {
        unit: 'cm',
        typicalRange: { min: 35, max: 90 },
        visualReference: {
            choker: '35-40cm - Sits at base of throat',
            princess: '45-50cm - Sits at collarbone',
            matinee: '55-60cm - Sits at bust line',
            opera: '70-90cm - Sits below bust or doubled'
        },
        bodyProportion: 'Necklace length determines pendant position on chest',
        strictEnforcement: true
    },
    bracelet: {
        unit: 'cm',
        typicalRange: { min: 15, max: 22 },
        visualReference: {
            small: '15-16cm - Small wrist',
            medium: '17-18cm - Average wrist',
            large: '19-21cm - Large wrist'
        },
        bodyProportion: 'Should fit wrist with 1-2cm of movement',
        strictEnforcement: true
    },
    bangle: {
        unit: 'India size',
        typicalRange: { min: 2.0, max: 2.10 },
        visualReference: {
            small: '2.2-2.4 - Small hand',
            medium: '2.6-2.8 - Average hand',
            large: '2.10+ - Large hand'
        },
        bodyProportion: 'Inner diameter must allow hand to pass through but not fall off',
        strictEnforcement: true
    },
    'maang tikka': {
        unit: 'cm',
        typicalRange: { min: 8, max: 18 },
        visualReference: {
            small: '8-10cm - Forehead to hairline',
            medium: '12-14cm - Standard length',
            large: '15-18cm - Dramatic long tikka'
        },
        bodyProportion: 'Length from hairline to end of pendant, proportionate to face length',
        strictEnforcement: true
    },
    nath: {
        unit: 'cm',
        typicalRange: { min: 1.5, max: 4 },
        visualReference: {
            small: '1.5-2cm - Small nose ring',
            medium: '2.5-3cm - Standard nath',
            large: '3.5-4cm - Large statement nath'
        },
        bodyProportion: 'Ring diameter proportionate to nose width, typically 1.5x nostril width',
        strictEnforcement: true
    },
    anklet: {
        unit: 'cm',
        typicalRange: { min: 20, max: 30 },
        visualReference: {
            small: '21-23cm - Small ankle',
            medium: '24-26cm - Average ankle',
            large: '27-29cm - Large ankle'
        },
        bodyProportion: 'Should sit above the ankle bone with slight movement',
        strictEnforcement: true
    },
    pendant: {
        unit: 'cm',
        typicalRange: { min: 1, max: 8 },
        visualReference: {
            small: '1-2cm - Delicate pendant',
            medium: '3-4cm - Standard size',
            large: '5-6cm - Statement pendant',
            extraLarge: '7-8cm - Dramatic showpiece'
        },
        bodyProportion: 'Height of pendant only, proportionate to chest area and chain',
        strictEnforcement: true
    }
};

function identifyJewelryType(piece) {
    const typeStr = (piece?.type || '').toLowerCase();
    const descStr = (piece?.description || '').toLowerCase();
    
    // Sort keys by length (longest first) to avoid partial matches
    // e.g., "earrings" should match before "ring" because "earrings".includes("ring") is true
    const sortedTypes = Object.keys(JEWELRY_SIZE_GUIDE).sort((a, b) => b.length - a.length);
    
    for (const type of sortedTypes) {
        // Check for exact match or whole word match to avoid "earrings" matching "ring"
        const typePattern = new RegExp(`\\b${type}\\b`, 'i');
        if (typePattern.test(typeStr) || typePattern.test(descStr)) {
            return type;
        }
    }
    
    // Fallback: check for simple includes if whole word didn't match
    for (const type of sortedTypes) {
        if (typeStr.includes(type) || descStr.includes(type)) {
            return type;
        }
    }
    
    return 'unknown';
}

function validateSizeValue(value, unit, jewelryType) {
    const numValue = parseFloat(value);
    const guide = JEWELRY_SIZE_GUIDE[jewelryType];
    
    const result = {
        isValid: !isNaN(numValue) && numValue > 0,
        numericValue: numValue,
        unit,
        jewelryType,
        warnings: [],
        guide
    };
    
    if (!result.isValid) {
        result.warnings.push('Invalid size value - must be a positive number');
        return result;
    }
    
    // Check if value is in reasonable range
    if (guide) {
        const { min, max } = guide.typicalRange;
        if (numValue < min * 0.5) {
            result.warnings.push(`Size seems very small for ${jewelryType} (typical: ${min}-${max} ${guide.unit})`);
        } else if (numValue > max * 1.5) {
            result.warnings.push(`Size seems very large for ${jewelryType} (typical: ${min}-${max} ${guide.unit})`);
        }
    }
    
    return result;
}

// ═══════════════════════════════════════════════════════════════════════════════
// PROMPT BUILDING WITH STRICT ENFORCEMENT
// ═══════════════════════════════════════════════════════════════════════════════

function buildStrictSizePrompt(sizeValidations, imageCount) {
    if (!sizeValidations || sizeValidations.length === 0) {
        return {
            sizeBlock: '',
            sizeConstraints: ''
        };
    }
    
    const validSizes = sizeValidations.filter(sv => sv.isValid);
    
    if (validSizes.length === 0) {
        return {
            sizeBlock: '',
            sizeConstraints: ''
        };
    }
    
    // Build detailed size instructions with body proportions
    const sizeInstructions = validSizes.map((sv, idx) => {
        const guide = sv.guide;
        const jewelryType = sv.jewelryType || 'jewelry';
        const pieceName = sv.pieceName || `${jewelryType} ${idx + 1}`;
        const visualRef = guide ? Object.entries(guide.visualReference).map(([k, v]) => `  • ${k}: ${v}`).join('\n') : '';
        const proportion = guide?.bodyProportion || '';
        
        // Calculate body proportion ratio for better enforcement
        let bodyRatioHint = '';
        if (jewelryType === 'earrings') {
            // For 5cm earrings on average face (22cm), that's about 23% of face height
            const faceRatio = Math.round((sv.numericValue / 22) * 100);
            bodyRatioHint = `\nBODY RATIO REFERENCE: On an average adult female face (approx 20-23cm height), ${sv.numericValue}cm earrings will occupy approximately ${faceRatio}% of the face height from earlobe to tip. The earrings should hang down ${sv.numericValue}cm below the earlobe.`;
        } else if (jewelryType === 'necklace') {
            bodyRatioHint = `\nPLACEMENT REFERENCE: A ${sv.numericValue}cm necklace will sit ${sv.numericValue < 45 ? 'high on the neck/choker position' : sv.numericValue < 55 ? 'at the collarbone' : 'at the bust line'}.`;
        } else if (jewelryType === 'ring') {
            const fingerRatio = Math.round((sv.numericValue / 2) * 100); // average finger width ~2cm
            bodyRatioHint = `\nBODY RATIO REFERENCE: Ring diameter ${sv.numericValue}cm is approximately ${fingerRatio}% of average finger width.`;
        }
        
        return `
┌─────────────────────────────────────────────────────────────────┐
│  SIZE CONSTRAINT ${idx + 1}: ${pieceName.toUpperCase()}         │
└─────────────────────────────────────────────────────────────────┘

JEWELRY TYPE: ${jewelryType.toUpperCase()}
ABSOLUTE REQUIREMENT: The ${pieceName} MUST be rendered at EXACTLY ${sv.numericValue} ${sv.unit}.

WHAT THIS MEANS:
- ${proportion}${bodyRatioHint}
- This is a HARD CONSTRAINT - do not interpret creatively
- The AI must render the jewelry at this exact dimension

VISUAL REFERENCE GUIDE:
${visualRef}

ENFORCEMENT RULES - FOLLOW EXACTLY:
✗ DO NOT make the ${pieceName} larger than ${sv.numericValue} ${sv.unit}
✗ DO NOT make the ${pieceName} smaller than ${sv.numericValue} ${sv.unit}
✗ DO NOT use artistic license to adjust the size
✓ MUST render ${pieceName} at exactly ${sv.numericValue} ${sv.unit}
✓ MUST maintain proper proportion to the model's body

SIZE VERIFICATION CHECKLIST:
Before finalizing the image, verify:
1. Is the ${pieceName} exactly ${sv.numericValue} ${sv.unit}? (Measure it)
2. Does the ${pieceName} look proportionate on the model's body?
3. Would a jeweler with a ruler measure it as ${sv.numericValue} ${sv.unit}?
4. For reference: a credit card is 8.5cm wide, a finger is ~2cm wide
If NO to any question, regenerate with correct size.
`;
    }).join('\n');
    
    // Build summary constraints for the main prompt
    const sizeSummary = validSizes.map(sv => 
        `${sv.pieceName}: EXACTLY ${sv.numericValue} ${sv.unit}`
    ).join('; ');
    
    const sizeConstraints = `
╔══════════════════════════════════════════════════════════════════╗
║     CRITICAL SIZE REQUIREMENTS - ABSOLUTE AND NON-NEGOTIABLE     ║
╚══════════════════════════════════════════════════════════════════╝

MANDATORY DIMENSIONS - DO NOT DEVIATE:
${validSizes.map((sv, i) => `  ${i + 1}. ${sv.pieceName}: ${sv.numericValue} ${sv.unit} (EXACT - NO VARIATION)`).join('\n')}

⚠️  FAILURE TO FOLLOW THESE SIZES = INVALID GENERATION
⚠️  DO NOT INTERPRET CREATIVELY
⚠️  USE THE EXACT NUMBERS PROVIDED

${sizeInstructions}

PRE-FINALIZATION CHECKLIST:
  ☐ Each piece is exactly the specified size
  ☐ Proportions are correct relative to model's body
  ☐ Measurements would match input values with a ruler
  ☐ Size is physically accurate and realistic

IF ANY CHECK FAILS → REGENERATE WITH CORRECT SIZES.
`;
    
    return {
        sizeBlock: sizeConstraints,
        sizeConstraints: `CRITICAL SIZE REQUIREMENTS: ${sizeSummary}. `
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN VERIFICATION FUNCTION
// ═══════════════════════════════════════════════════════════════════════════════

export function verifyAndBuildPrompt({
    analysis,
    template,
    imageCount,
    extraPrompt,
    presetOptions
}) {
    const warnings = [];
    const errors = [];
    const sizeValidation = [];
    
    const sizes = presetOptions.sizes || {};
    const pieces = analysis?.pieces || [];
    const hasPieces = pieces.length > 0;
    
    // Validate sizes
    if (hasPieces) {
        pieces.forEach((piece, index) => {
            const sizeData = sizes?.[index];
            if (sizeData?.value) {
                const jewelryType = identifyJewelryType(piece);
                const validation = validateSizeValue(sizeData.value, sizeData.unit, jewelryType);
                
                sizeValidation.push({
                    index,
                    pieceName: piece.type || piece.description || `Piece ${index + 1}`,
                    ...validation,
                    displaySize: `${sizeData.value} ${sizeData.unit}`
                });
                
                if (validation.warnings.length > 0) {
                    warnings.push(...validation.warnings.map(w => `Size for ${piece.type || 'piece'}: ${w}`));
                }
            } else {
                warnings.push(`No size specified for ${piece.type || `piece ${index + 1}`}`);
            }
        });
    } else {
        const sizeData = sizes?.[0] || Object.values(sizes || {})[0];
        if (sizeData?.value) {
            const jewelryType = identifyJewelryType({ type: analysis?.type, description: analysis?.description });
            const validation = validateSizeValue(sizeData.value, sizeData.unit, jewelryType);
            
            sizeValidation.push({
                index: 0,
                pieceName: analysis?.type || 'Jewelry',
                ...validation,
                displaySize: `${sizeData.value} ${sizeData.unit}`
            });
        } else {
            warnings.push('No size specified - AI will estimate scale');
        }
    }
    
    // Check for critical conflicts
    if (presetOptions.religionPreset && presetOptions.backgroundPreset) {
        const bgPreset = getPresetById(BACKGROUND_PRESETS, presetOptions.backgroundPreset);
        const religionPreset = getPresetById(RELIGION_PRESETS, presetOptions.religionPreset);
        
        // Check for obvious mismatches
        if (presetOptions.religionPreset === 'christian') {
            if (presetOptions.backgroundPreset?.includes('temple') || 
                presetOptions.backgroundPreset?.includes('marble-courtyard')) {
                warnings.push('Background may not match Christian aesthetic - consider a different background');
            }
        }
    }
    
    // Build the prompt with strict size enforcement
    const { sizeBlock, sizeConstraints } = buildStrictSizePrompt(sizeValidation, imageCount);
    
    // Build main prompt components
    const promptParts = [];
    
    // Base photography
    promptParts.push(
        'Ultra-photorealistic professional jewelry advertisement photograph, 8K resolution, ' +
        'shot on Hasselblad H6D-400c medium format camera with 120mm macro lens, ' +
        'RAW file quality, tack-sharp focus on jewelry details'
    );
    
    // Model consistency if custom photo
    if (presetOptions.hasCustomModelPhoto) {
        const consistencyOpt = getPresetById(MODEL_CONSISTENCY_OPTIONS, presetOptions.consistencyMode || 'exact');
        if (consistencyOpt) {
            promptParts.push(consistencyOpt.promptSnippet);
        }
    }
    
    // Religion/Culture - STRONG ENFORCEMENT
    if (presetOptions.religionPreset) {
        const religionOpt = getPresetById(RELIGION_PRESETS, presetOptions.religionPreset);
        if (religionOpt) {
            promptParts.push(`CULTURAL CONTEXT [MANDATORY]: ${religionOpt.promptSnippet}`);
            promptParts.push(`CRITICAL: The model MUST reflect ${religionOpt.name} cultural aesthetic. This is NON-NEGOTIABLE.`);
        }
    }
    
    // Model description from template (potentially modified)
    if (template.modelPrompt) {
        promptParts.push(`Model: ${template.modelPrompt}`);
    }
    
    // Dress code
    if (presetOptions.dressCodePreset) {
        const dressOpt = getPresetById(DRESS_CODE_PRESETS, presetOptions.dressCodePreset);
        if (dressOpt) {
            promptParts.push(`Outfit [MANDATORY]: ${dressOpt.promptSnippet}`);
        }
    }
    
    // Jewelry description with size constraints
    const jewelryDesc = analysis?.description || 'elegant jewelry piece';
    const material = analysis?.material || 'precious metal';
    const stones = analysis?.stones?.length ? analysis.stones.join(', ') : '';
    const finish = analysis?.finish || '';
    const style = analysis?.style || '';
    
    const multiRef = imageCount > 1 ? `(${imageCount} reference photos)` : '';
    
    if (hasPieces || imageCount > 1) {
        const piecesList = pieces.map(p => p.type || p.description).join(', ') || 'jewelry pieces';
        promptParts.push(
            `The model is wearing ALL jewelry pieces from the reference images ${multiRef}: ${piecesList}. ` +
            `${jewelryDesc}. ` +
            `${sizeConstraints}` +
            `The ${material}${style ? ' ' + style : ''} jewelry${stones ? ` with ${stones}` : ''}${finish ? `, ${finish} finish,` : ''} ` +
            `is the focal point — every detail reproduced with photographic accuracy.`
        );
    } else {
        promptParts.push(
            `The model is wearing the exact ${analysis?.type || 'jewelry'} from the reference image ${multiRef}. ` +
            `${jewelryDesc}. ` +
            `${sizeConstraints}` +
            `The ${material}${style ? ' ' + style : ''} piece${stones ? ` with ${stones}` : ''}${finish ? `, ${finish} finish,` : ''} ` +
            `is the hero of the shot.`
        );
    }
    
    // Add detailed size block if sizes specified
    if (sizeBlock) {
        promptParts.push(sizeBlock);
    }
    
    // Exclusions
    promptParts.push(
        'CRITICAL: The model wears ONLY the referenced jewelry. ' +
        'NO other earrings, necklaces, rings, or accessories unless specified. ' +
        'All other skin areas MUST be bare.'
    );
    
    // Background - STRONG ENFORCEMENT
    if (presetOptions.backgroundPreset) {
        const bgOpt = getPresetById(BACKGROUND_PRESETS, presetOptions.backgroundPreset);
        if (bgOpt) {
            promptParts.push(`BACKGROUND [MANDATORY - USER SELECTED]: ${bgOpt.promptSnippet}`);
            promptParts.push(`CRITICAL: Use EXACTLY this background. Do NOT use temple or religious setting unless specified.`);
        }
    } else if (template.settingPrompt) {
        promptParts.push(`Setting: ${template.settingPrompt}`);
    }
    
    // Lighting
    if (template.lightingPrompt) {
        promptParts.push(`Lighting: ${template.lightingPrompt}`);
    }
    
    // Pose
    if (template.posePrompt) {
        promptParts.push(`Pose: ${template.posePrompt}`);
    }
    
    // Technical quality
    promptParts.push(
        'Shallow depth of field, professional color grading, magazine-quality, ' +
        'hyperrealistic skin, accurate jewelry reflections'
    );
    
    // Extra prompt with highest priority
    if (extraPrompt?.trim()) {
        promptParts.push(
            `\n╔══════════════════════════════════════════════════════════════════╗\n` +
            `║  USER OVERRIDE INSTRUCTIONS [HIGHEST PRIORITY]                   ║\n` +
            `╚══════════════════════════════════════════════════════════════════╝\n` +
            `"${extraPrompt.trim()}"\n` +
            `These user instructions OVERRIDE all other settings if there's any conflict.`
        );
    }
    
    // Final verification block
    promptParts.push(
        `\n╔══════════════════════════════════════════════════════════════════╗\n` +
        `║  PRE-GENERATION VERIFICATION CHECKLIST                           ║\n` +
        `╚══════════════════════════════════════════════════════════════════╝\n` +
        `□ Religion/Culture: ${presetOptions.religionPreset || 'Not specified'}\n` +
        `□ Background: ${presetOptions.backgroundPreset || 'Template default'}\n` +
        `□ Dress Code: ${presetOptions.dressCodePreset || 'Template default'}\n` +
        `□ Sizes: ${sizeValidation.filter(sv => sv.isValid).map(sv => `${sv.pieceName}=${sv.numericValue}${sv.unit}`).join(', ') || 'Not specified'}\n` +
        `\nIf any setting above is wrong, STOP and use the correct values.`
    );
    
    return {
        isValid: errors.length === 0,
        warnings,
        errors,
        sizeValidation,
        prompt: promptParts.join('. ')
    };
}
