/**
 * Prompt Builder with Input Understanding Layer
 * 
 * This module processes all user inputs (sizes, presets, jewelry analysis)
 * and builds a comprehensive, constraint-enforced prompt for image generation.
 * 
 * The key issue it solves: User inputs like "5cm" were getting lost in the prompt.
 * Now we create explicit, multi-level size constraints that the AI must follow.
 */

import { BACKGROUND_PRESETS, RELIGION_PRESETS, DRESS_CODE_PRESETS, MODEL_CONSISTENCY_OPTIONS, getPresetById } from './presets.js';

// ═══════════════════════════════════════════════════════════════════════════════
// JEWELRY TYPE DEFINITIONS - What sizes mean for each type
// ═══════════════════════════════════════════════════════════════════════════════

const JEWELRY_TYPE_CONFIG = {
    ring: {
        sizeMeaning: 'inner diameter or circumference',
        placement: 'worn on finger',
        visualScale: 'proportionate to finger width',
        sizeExamples: 'Size 16 India = ~1.8cm diameter, Size 7 US = ~1.7cm diameter',
        enforcements: [
            'Ring must appear proportionate to the model\'s finger',
            'Band width and stone setting must scale with ring size',
            'Ring should not look oversized or undersized on the hand'
        ]
    },
    earrings: {
        sizeMeaning: 'total length from top to bottom',
        placement: 'hanging from earlobe',
        visualScale: 'proportionate to face/ear size',
        sizeExamples: '3cm = medium drop, 5cm = long statement earrings, 1.5cm = small studs',
        enforcements: [
            'Earring length must match specified measurement',
            'Should hang naturally from earlobe at correct length',
            'Must be proportionate to model\'s face and neck'
        ]
    },
    necklace: {
        sizeMeaning: 'total chain length when laid flat',
        placement: 'around neck, hanging to chest',
        visualScale: 'proportionate to neck/chest',
        sizeExamples: '40-45cm = choker/princess, 50cm = standard, 60cm = matinee',
        enforcements: [
            'Must sit at correct position on chest based on length',
            'Chain length must match specified measurement exactly',
            'Pendant position must reflect necklace length accurately'
        ]
    },
    chain: {
        sizeMeaning: 'total length when laid flat',
        placement: 'around neck',
        visualScale: 'proportionate to neck/chest area',
        sizeExamples: '45cm = short, 60cm = medium, 75cm = long',
        enforcements: [
            'Chain must hang at correct length on model\'s chest',
            'Links must be proportionate to overall chain length'
        ]
    },
    bracelet: {
        sizeMeaning: 'length when laid flat (including clasp)',
        placement: 'worn around wrist',
        visualScale: 'proportionate to wrist width',
        sizeExamples: '16cm = small wrist, 18cm = average, 20cm = large',
        enforcements: [
            'Must fit wrist naturally without gaps or tightness',
            'Length should match specified measurement exactly'
        ]
    },
    bangle: {
        sizeMeaning: 'inner diameter',
        placement: 'worn on wrist/forearm',
        visualScale: 'proportionate to wrist size',
        sizeExamples: '2.4 = ~5.7cm diameter, 2.6 = ~6.2cm diameter, 2.8 = ~6.7cm diameter',
        enforcements: [
            'Bangle diameter must match specified size',
            'Must slide onto wrist naturally at correct size',
            'Width/thickness should be proportionate to diameter'
        ]
    },
    'maang tikka': {
        sizeMeaning: 'total length from forehead to end of pendant',
        placement: 'forehead to hair partition',
        visualScale: 'proportionate to face length',
        sizeExamples: '12cm = standard, 15cm = long, 8cm = small',
        enforcements: [
            'Must extend correct distance from hairline',
            'Chain length and pendant drop must match specification'
        ]
    },
    nath: {
        sizeMeaning: 'ring diameter or total span',
        placement: 'worn on nose',
        visualScale: 'proportionate to nose/face size',
        sizeExamples: '2.5cm = medium, 2cm = small, 3cm = large statement',
        enforcements: [
            'Ring must fit nose naturally at specified diameter',
            'Chain to ear must be appropriate length',
            'Must not look oversized or undersized on face'
        ]
    },
    anklet: {
        sizeMeaning: 'length when laid flat',
        placement: 'worn around ankle',
        visualScale: 'proportionate to ankle width',
        sizeExamples: '22cm = small, 25cm = medium, 28cm = large',
        enforcements: [
            'Must fit ankle naturally at specified length',
            'Should sit correctly above foot, not too high or low'
        ]
    },
    pendant: {
        sizeMeaning: 'height/length of pendant only',
        placement: 'hanging from chain',
        visualScale: 'proportionate to chest area',
        sizeExamples: '3cm = small, 5cm = medium, 8cm = large statement',
        enforcements: [
            'Pendant dimensions must match specified size',
            'Must be clearly visible and proportionate to chain'
        ]
    }
};

// ═══════════════════════════════════════════════════════════════════════════════
// INPUT UNDERSTANDING & VALIDATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Analyzes the jewelry type and returns configuration for size interpretation
 */
function understandJewelryType(type, description = '') {
    const typeLower = (type || '').toLowerCase();
    const descLower = (description || '').toLowerCase();
    
    // Try direct type match first
    for (const [key, config] of Object.entries(JEWELRY_TYPE_CONFIG)) {
        if (typeLower.includes(key)) {
            return { type: key, config };
        }
    }
    
    // Try description match
    for (const [key, config] of Object.entries(JEWELRY_TYPE_CONFIG)) {
        if (descLower.includes(key)) {
            return { type: key, config };
        }
    }
    
    // Default fallback
    return { 
        type: typeLower || 'jewelry', 
        config: {
            sizeMeaning: 'overall dimension',
            placement: 'worn appropriately',
            visualScale: 'proportionate to body',
            sizeExamples: 'varies by piece',
            enforcements: ['Size must match user specification exactly']
        }
    };
}

/**
 * Validates and normalizes size input
 */
function validateSize(sizeData, pieceInfo, pieceIndex) {
    const { value, unit } = sizeData || {};
    const { type, config } = understandJewelryType(pieceInfo?.type, pieceInfo?.description);
    
    // Parse numeric value
    const numericValue = parseFloat(value);
    const isValid = !isNaN(numericValue) && numericValue > 0;
    
    return {
        index: pieceIndex,
        type,
        originalValue: value,
        numericValue: isValid ? numericValue : null,
        unit: unit || 'cm',
        isValid,
        config,
        pieceDescription: pieceInfo?.description || pieceInfo?.type || `Piece ${pieceIndex + 1}`,
        // Build human-readable size description
        displaySize: isValid ? `${numericValue} ${unit}` : 'unspecified',
        // Build AI instruction
        aiInstruction: isValid 
            ? buildSizeInstruction(type, numericValue, unit, config, pieceInfo)
            : null
    };
}

/**
 * Builds a detailed size instruction for the AI
 */
function buildSizeInstruction(jewelryType, value, unit, config, pieceInfo) {
    const parts = [];
    
    // Primary size constraint
    parts.push(`SIZE CONSTRAINT [CRITICAL]: The ${jewelryType} MUST be exactly ${value} ${unit}.`);
    
    // What the size means
    parts.push(`This measurement refers to ${config.sizeMeaning}.`);
    
    // Visual scale guidance
    parts.push(`Visual scale: ${config.visualScale}.`);
    
    // Placement context
    parts.push(`Placement: ${config.placement}.`);
    
    // Examples for context
    if (config.sizeExamples) {
        parts.push(`Reference: ${config.sizeExamples}.`);
    }
    
    // Specific enforcements
    parts.push(...config.enforcements);
    
    // Piece-specific details if available
    if (pieceInfo?.description) {
        parts.push(`Piece details: ${pieceInfo.description}.`);
    }
    
    return parts.join(' ');
}

/**
 * Main function: Processes ALL inputs and builds comprehensive understanding
 */
export function understandInputs(analysis, sizes, presetOptions = {}) {
    const pieces = analysis?.pieces || [];
    const hasPieces = pieces.length > 0;
    
    // Understand jewelry type
    const jewelryType = understandJewelryType(analysis?.type, analysis?.description);
    
    // Process sizes for each piece
    const sizeUnderstandings = [];
    
    if (hasPieces) {
        // Multiple pieces detected
        pieces.forEach((piece, index) => {
            const sizeData = sizes?.[index];
            if (sizeData?.value) {
                sizeUnderstandings.push(validateSize(sizeData, piece, index));
            }
        });
    } else {
        // Single jewelry piece (no pieces array)
        const sizeData = sizes?.[0] || Object.values(sizes || {})[0];
        if (sizeData?.value) {
            sizeUnderstandings.push(validateSize(sizeData, { 
                type: analysis?.type, 
                description: analysis?.description 
            }, 0));
        }
    }
    
    // Process presets
    const presetUnderstandings = {
        background: presetOptions.backgroundPreset 
            ? getPresetById(BACKGROUND_PRESETS, presetOptions.backgroundPreset)
            : null,
        religion: presetOptions.religionPreset
            ? getPresetById(RELIGION_PRESETS, presetOptions.religionPreset)
            : null,
        dressCode: presetOptions.dressCodePreset
            ? getPresetById(DRESS_CODE_PRESETS, presetOptions.dressCodePreset)
            : null,
        consistency: presetOptions.consistencyMode
            ? getPresetById(MODEL_CONSISTENCY_OPTIONS, presetOptions.consistencyMode)
            : null,
        hasCustomModelPhoto: presetOptions.hasCustomModelPhoto || false
    };
    
    // Validation warnings
    const warnings = [];
    if (sizeUnderstandings.length === 0) {
        warnings.push('No sizes specified - AI will estimate scale, which may not match your product');
    }
    if (sizeUnderstandings.some(s => !s.isValid)) {
        warnings.push('Some size values are invalid - please check your inputs');
    }
    
    // Build summary
    const summary = {
        jewelryType: jewelryType.type,
        jewelryStyle: analysis?.style || 'traditional',
        material: analysis?.material || 'gold',
        stones: analysis?.stones || [],
        pieceCount: hasPieces ? pieces.length : 1,
        sizesConfigured: sizeUnderstandings.filter(s => s.isValid).length,
        totalPieces: hasPieces ? pieces.length : 1,
        presetsActive: [
            presetUnderstandings.background?.name,
            presetUnderstandings.religion?.name,
            presetUnderstandings.dressCode?.name
        ].filter(Boolean).join(', ') || 'None'
    };
    
    return {
        jewelryType,
        sizeUnderstandings,
        presetUnderstandings,
        warnings,
        summary,
        analysis
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// PROMPT CONSTRUCTION
// ═══════════════════════════════════════════════════════════════════════════════

const CAMERA_ANGLES = [
    'eye-level portrait shot',
    'slightly low artistic angle',
    'dynamic fashion editorial angle',
    'straight-on symmetrical shot',
    'subtle 3/4 profile angle'
];

const LIGHTING_MODIFIERS = [
    'soft volumetric rays',
    'cinematic side lighting',
    'natural window light',
    'golden rim lighting',
    'diffused studio lighting',
    'dramatic Rembrandt lighting'
];

const EXPRESSIONS = [
    'subtle elegant smile',
    'confident piercing gaze',
    'serene mysterious look',
    'soft natural expression',
    'empowered editorial expression'
];

/**
 * Builds the complete prompt with enforced constraints
 */
export function buildEnhancedPrompt(understanding, template, imageCount, extraPrompt = '') {
    const parts = [];
    const { jewelryType, sizeUnderstandings, presetUnderstandings, summary, analysis } = understanding;
    
    const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];
    const variety = `${getRandom(CAMERA_ANGLES)}, ${getRandom(EXPRESSIONS)}, accented with ${getRandom(LIGHTING_MODIFIERS)}`;
    
    // ═══════════════════════════════════════════════════════════════════════════
    // SECTION 1: Photography Foundation
    // ═══════════════════════════════════════════════════════════════════════════
    parts.push(
        `Ultra-photorealistic professional jewelry advertisement photograph, ${variety}, 8K resolution, ` +
        'shot on Hasselblad H6D-400c medium format camera with 120mm macro lens, ' +
        'RAW file quality, tack-sharp focus on jewelry details'
    );
    
    // ═══════════════════════════════════════════════════════════════════════════
    // SECTION 2: Model Consistency (if custom photo uploaded)
    // ═══════════════════════════════════════════════════════════════════════════
    if (presetUnderstandings.hasCustomModelPhoto && presetUnderstandings.consistency) {
        parts.push(presetUnderstandings.consistency.promptSnippet);
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // SECTION 3: Cultural/Religious Context
    // ═══════════════════════════════════════════════════════════════════════════
    if (presetUnderstandings.religion) {
        parts.push(presetUnderstandings.religion.promptSnippet);
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // SECTION 4: Model Description from Template
    // ═══════════════════════════════════════════════════════════════════════════
    if (template.modelPrompt) {
        parts.push(template.modelPrompt);
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // SECTION 5: Dress Code
    // ═══════════════════════════════════════════════════════════════════════════
    if (presetUnderstandings.dressCode) {
        parts.push(`Outfit: ${presetUnderstandings.dressCode.promptSnippet}`);
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // SECTION 6: JEWELRY DESCRIPTION WITH ENFORCED SIZES [CRITICAL SECTION]
    // ═══════════════════════════════════════════════════════════════════════════
    
    const jewelryDesc = analysis?.description || 'elegant jewelry piece';
    const material = analysis?.material || 'precious metal';
    const stones = analysis?.stones?.length ? analysis?.stones.join(', ') : '';
    const finish = analysis?.finish || '';
    const style = analysis?.style || '';
    
    const multiRef = imageCount > 1 
        ? `(${imageCount} reference photos showing all angles and close-ups)` 
        : '';
    
    // Build the size constraint block - THIS IS THE KEY FIX
    let sizeConstraintBlock = '';
    let sizeSummaryBlock = '';
    
    if (sizeUnderstandings.length > 0) {
        const validSizes = sizeUnderstandings.filter(s => s.isValid);
        
        if (validSizes.length > 0) {
            // Individual piece constraints
            const individualConstraints = validSizes.map(s => 
                `[${s.type.toUpperCase()} ${s.index + 1}]: ${s.aiInstruction}`
            ).join('\n\n');
            
            // Summary for quick reference
            const sizeSummary = validSizes.map(s => 
                `${s.pieceDescription}: ${s.displaySize}`
            ).join('; ');
            
            sizeConstraintBlock = `

╔══════════════════════════════════════════════════════════════════╗
║                    SIZE CONSTRAINTS [MANDATORY]                  ║
╚══════════════════════════════════════════════════════════════════╝

${individualConstraints}

CRITICAL: These sizes MUST be followed exactly. The jewelry pieces must appear at the specified dimensions relative to the model's body. Do not creative interpret or adjust these sizes.
`;
            
            sizeSummaryBlock = `EXACT SPECIFIED SIZES: ${sizeSummary}. `;
        }
    }
    
    // Build jewelry description with size enforcement
    if (summary.pieceCount > 1 || imageCount > 1) {
        const piecesList = analysis?.pieces?.map(p => p.type || p.description).join(', ') || 'multiple jewelry pieces';
        
        parts.push(
            `The model is elegantly wearing ALL the jewelry pieces from the reference images ${multiRef} — ${piecesList}. ` +
            `${jewelryDesc}. ` +
            `${sizeSummaryBlock}` +
            `The ${material}${style ? ' ' + style : ''} jewelry${stones ? ` adorned with ${stones}` : ''}${finish ? `, ${finish} finish,` : ''} ` +
            `is the undisputed focal point — EVERY intricate detail from ALL reference angles is reproduced with photographic accuracy. ` +
            `All pieces are worn simultaneously, perfectly styled and harmoniously arranged.`
        );
    } else {
        parts.push(
            `The model is elegantly wearing the exact ${summary.jewelryType} from the reference image ${multiRef}. ` +
            `${jewelryDesc}. ` +
            `${sizeSummaryBlock}` +
            `The ${material}${style ? ' ' + style : ''} piece${stones ? ` with ${stones}` : ''}${finish ? `, ${finish} finish,` : ''} ` +
            `is the clear hero of the shot — every engraving, stone, and surface texture reproduced with photographic accuracy.`
        );
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // SECTION 7: DETAILED SIZE CONSTRAINTS (if sizes provided)
    // ═══════════════════════════════════════════════════════════════════════════
    if (sizeConstraintBlock) {
        parts.push(sizeConstraintBlock);
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // SECTION 8: Exclusions (prevent unwanted jewelry)
    // ═══════════════════════════════════════════════════════════════════════════
    const baseExclusions = "NO OTHER jewelry, NO additional earrings, NO additional necklaces, NO additional rings, NO additional bangles, NO maang tikka unless specified, bare skin where jewelry is not explicitly referenced";
    
    if (extraPrompt && extraPrompt.toLowerCase().match(/(earring|necklace|ring|bangle|bracelet|jewelry|jewellery|accessories)/)) {
        parts.push(`The model is ONLY wearing the referenced ${summary.jewelryType} and the items requested in the additional instructions.`);
    } else {
        parts.push(
            `CRITICAL REQUIREMENT: The model MUST wear ONLY the exact referenced jewelry from the images. ` +
            `ABSOLUTELY ${baseExclusions}. The rest of the model\'s neck, ears, and hands MUST be completely bare of any accessories.`
        );
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // SECTION 9: Background
    // ═══════════════════════════════════════════════════════════════════════════
    if (presetUnderstandings.background) {
        parts.push(`Background/Setting: ${presetUnderstandings.background.promptSnippet}`);
    } else if (template.settingPrompt) {
        parts.push(`Setting: ${template.settingPrompt}`);
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // SECTION 10: Lighting
    // ═══════════════════════════════════════════════════════════════════════════
    if (template.lightingPrompt) {
        parts.push(`Lighting: ${template.lightingPrompt}`);
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // SECTION 11: Pose
    // ═══════════════════════════════════════════════════════════════════════════
    if (template.posePrompt) {
        parts.push(`Pose: ${template.posePrompt}`);
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // SECTION 12: Technical Quality
    // ═══════════════════════════════════════════════════════════════════════════
    parts.push(
        'Shallow depth of field with creamy bokeh background, professional color grading, ' +
        'magazine-quality retouching, no artifacts, no distortion, no text overlays, ' +
        'hyperrealistic skin texture, jewelry metal and gemstone reflections are physically accurate'
    );
    
    // ═══════════════════════════════════════════════════════════════════════════
    // SECTION 13: Extra User Prompt (HIGHEST PRIORITY)
    // ═══════════════════════════════════════════════════════════════════════════
    if (extraPrompt?.trim()) {
        parts.push(
            `\n\n╔══════════════════════════════════════════════════════════════════╗\n` +
            `║     USER INSTRUCTION [OVERRIDE PRIORITY - MUST FOLLOW]          ║\n` +
            `╚══════════════════════════════════════════════════════════════════╝\n\n` +
            `"${extraPrompt.trim()}"\n\n` +
            `The above user instruction takes PRECEDENCE over all other guidelines if there is any conflict.`
        );
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // SECTION 14: Final Size Reminder (reinforce at the end)
    // ═══════════════════════════════════════════════════════════════════════════
    if (sizeUnderstandings.length > 0) {
        const validSizes = sizeUnderstandings.filter(s => s.isValid);
        if (validSizes.length > 0) {
            const finalReminder = validSizes.map(s => 
                `- ${s.pieceDescription}: MUST BE ${s.displaySize}`
            ).join('\n');
            
            parts.push(
                `\n\n╔══════════════════════════════════════════════════════════════════╗\n` +
                `║     FINAL REMINDER: EXACT SIZES [DO NOT IGNORE]                  ║\n` +
                `╚══════════════════════════════════════════════════════════════════╝\n\n` +
                `${finalReminder}\n\n` +
                `These dimensions are CRITICAL requirements. Render the jewelry at EXACTLY these sizes.`
            );
        }
    }
    
    return parts.join('. ');
}

/**
 * Main entry point: Build complete prompt from raw inputs
 */
export function buildJewelryPromptV2(analysis, template, imageCount, extraPrompt = '', presetOptions = {}) {
    // Step 1: Understand all inputs
    const understanding = understandInputs(analysis, presetOptions.sizes || {}, presetOptions);
    
    // Step 2: Build enhanced prompt with constraints
    const prompt = buildEnhancedPrompt(understanding, template, imageCount, extraPrompt);
    
    // Return both the prompt and the understanding for debugging/logging
    return {
        prompt,
        understanding,
        // For backwards compatibility - just return the prompt string
        toString() { return this.prompt; }
    };
}

/**
 * Get a human-readable summary of what's being generated
 */
export function getGenerationSummary(understanding) {
    const { summary, warnings, sizeUnderstandings } = understanding;
    
    const lines = [
        `📿 Jewelry Type: ${summary.jewelryType}`,
        `✨ Style: ${summary.jewelryStyle}`,
        `💎 Material: ${summary.material}`,
        summary.stones.length > 0 ? `💍 Stones: ${summary.stones.join(', ')}` : '',
        `📦 Pieces: ${summary.pieceCount}`,
        `📏 Sizes Configured: ${summary.sizesConfigured}/${summary.totalPieces}`,
        sizeUnderstandings.length > 0 
            ? sizeUnderstandings.filter(s => s.isValid).map(s => `   • ${s.pieceDescription}: ${s.displaySize}`).join('\n')
            : '   • No sizes specified',
        `🎨 Presets: ${summary.presetsActive}`,
        warnings.length > 0 ? `⚠️ Warnings:\n${warnings.map(w => `   • ${w}`).join('\n')}` : ''
    ];
    
    return lines.filter(Boolean).join('\n');
}

// Individual exports for advanced usage
export { validateSize, understandJewelryType };
