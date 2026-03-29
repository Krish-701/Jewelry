'use client';

import { useState, useEffect } from 'react';

// Default size configurations for different jewelry types
const SIZE_CONFIGS = {
    'ring': {
        label: 'Ring Size',
        placeholder: 'e.g., 16 (India) or 7 (US)',
        hint: 'Enter ring size number',
        unit: 'India size',
    },
    'earrings': {
        label: 'Earring Length',
        placeholder: 'e.g., 3.5',
        hint: 'Length in centimeters',
        unit: 'cm',
    },
    'necklace': {
        label: 'Necklace Length',
        placeholder: 'e.g., 45',
        hint: 'Length in centimeters (e.g., 40-45cm for choker, 50-60cm for regular)',
        unit: 'cm',
    },
    'chain': {
        label: 'Chain Length',
        placeholder: 'e.g., 50',
        hint: 'Length in centimeters',
        unit: 'cm',
    },
    'bracelet': {
        label: 'Bracelet Length',
        placeholder: 'e.g., 18',
        hint: 'Length in centimeters',
        unit: 'cm',
    },
    'bangle': {
        label: 'Bangle Size',
        placeholder: 'e.g., 2-6 or 2.6',
        hint: 'Bangle size (2, 2.2, 2.4, 2.6, 2.8, etc.)',
        unit: 'India size',
    },
    'maang tikka': {
        label: 'Length',
        placeholder: 'e.g., 12',
        hint: 'Total length in centimeters',
        unit: 'cm',
    },
    'nath': {
        label: 'Nath Size',
        placeholder: 'e.g., 2.5',
        hint: 'Diameter in centimeters',
        unit: 'cm',
    },
    'anklet': {
        label: 'Anklet Length',
        placeholder: 'e.g., 25',
        hint: 'Length in centimeters',
        unit: 'cm',
    },
    'pendant': {
        label: 'Pendant Size',
        placeholder: 'e.g., 4',
        hint: 'Height/length in centimeters',
        unit: 'cm',
    },
};

function getSizeConfig(piece) {
    // Try to match by type
    const type = piece.type?.toLowerCase() || '';
    for (const [key, config] of Object.entries(SIZE_CONFIGS)) {
        if (type.includes(key)) {
            return config;
        }
    }
    
    // Try description if type doesn't match
    const desc = piece.description?.toLowerCase() || '';
    for (const [key, config] of Object.entries(SIZE_CONFIGS)) {
        if (desc.includes(key)) {
            return config;
        }
    }
    
    // Default fallback
    return {
        label: piece.sizeHint || 'Size',
        placeholder: 'Enter size',
        hint: piece.sizeUnit ? `Enter in ${piece.sizeUnit}` : 'Enter approximate size',
        unit: piece.sizeUnit || 'cm',
    };
}

export default function SizeInput({ analysis, sizes, onSizesChange }) {
    const pieces = analysis?.pieces || [];
    const hasPieces = pieces.length > 0;
    
    // Initialize sizes when pieces change
    useEffect(() => {
        if (hasPieces && Object.keys(sizes).length === 0) {
            const initialSizes = {};
            pieces.forEach((piece, index) => {
                initialSizes[index] = { value: '', unit: piece.sizeUnit || getSizeConfig(piece).unit };
            });
            onSizesChange(initialSizes);
        }
    }, [hasPieces, pieces, sizes, onSizesChange]);

    const handleSizeChange = (index, value) => {
        onSizesChange(prev => ({
            ...prev,
            [index]: { ...prev[index], value }
        }));
    };

    const handleUnitChange = (index, unit) => {
        onSizesChange(prev => ({
            ...prev,
            [index]: { ...prev[index], unit }
        }));
    };

    // If no pieces detected, show single input for overall jewelry
    if (!hasPieces) {
        const jewelryType = analysis?.type || 'jewelry';
        const config = SIZE_CONFIGS[jewelryType.toLowerCase()] || {
            label: 'Approximate Size',
            placeholder: 'e.g., 5',
            hint: 'Enter approximate size for scale reference',
            unit: 'cm',
        };

        return (
            <div className="glass-card size-input-panel">
                <h3 style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>📏</span> Size Reference
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                    Enter the actual size for accurate representation on the model. 
                    This helps the AI render the jewelry at the correct scale.
                </p>

                <div className="size-input-row">
                    <div className="size-input-label">
                        <span className="jewelry-icon">💎</span>
                        <div>
                            <span className="jewelry-name">{jewelryType.charAt(0).toUpperCase() + jewelryType.slice(1)}</span>
                            <span className="jewelry-desc">{analysis?.description?.substring(0, 60)}...</span>
                        </div>
                    </div>
                    <div className="size-input-field-group">
                        <input
                            type="text"
                            className="size-input-field"
                            placeholder={config.placeholder}
                            value={sizes[0]?.value || ''}
                            onChange={(e) => handleSizeChange(0, e.target.value)}
                        />
                        <select
                            className="size-unit-select"
                            value={sizes[0]?.unit || config.unit}
                            onChange={(e) => handleUnitChange(0, e.target.value)}
                        >
                            <option value="cm">cm</option>
                            <option value="mm">mm</option>
                            <option value="inches">inches</option>
                            <option value="India size">India size</option>
                            <option value="US size">US size</option>
                        </select>
                    </div>
                    <span className="size-hint">{config.hint}</span>
                </div>
            </div>
        );
    }

    return (
        <div className="glass-card size-input-panel">
            <h3 style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>📏</span> Size Reference for Each Piece
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                Enter the actual size for each jewelry piece. This ensures accurate scale when rendered on the model.
                <br />
                <span style={{ color: 'var(--accent-gold)', fontSize: '0.8rem' }}>
                    ✦ Tip: Use a measuring tape or refer to the actual product specifications
                </span>
            </p>

            <div className="size-input-list">
                {pieces.map((piece, index) => {
                    const config = getSizeConfig(piece);
                    return (
                        <div key={index} className="size-input-row">
                            <div className="size-input-label">
                                <span className="jewelry-icon">{getJewelryIcon(piece.type)}</span>
                                <div>
                                    <span className="jewelry-name">
                                        {piece.type?.charAt(0).toUpperCase() + piece.type?.slice(1) || `Piece ${index + 1}`}
                                    </span>
                                    {piece.description && (
                                        <span className="jewelry-desc">{piece.description.substring(0, 50)}...</span>
                                    )}
                                </div>
                            </div>
                            <div className="size-input-field-group">
                                <input
                                    type="text"
                                    className="size-input-field"
                                    placeholder={config.placeholder}
                                    value={sizes[index]?.value || ''}
                                    onChange={(e) => handleSizeChange(index, e.target.value)}
                                />
                                <select
                                    className="size-unit-select"
                                    value={sizes[index]?.unit || config.unit}
                                    onChange={(e) => handleUnitChange(index, e.target.value)}
                                >
                                    <option value="cm">cm</option>
                                    <option value="mm">mm</option>
                                    <option value="inches">inches</option>
                                    <option value="India size">India size</option>
                                    <option value="US size">US size</option>
                                </select>
                            </div>
                            <span className="size-hint">{config.hint}</span>
                        </div>
                    );
                })}
            </div>

            <div className="size-summary" style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {Object.values(sizes).filter(s => s.value).length} of {pieces.length} pieces configured
                </span>
            </div>
        </div>
    );
}

function getJewelryIcon(type) {
    const icons = {
        'ring': '💍',
        'earrings': '👂',
        'necklace': '📿',
        'chain': '⛓️',
        'bracelet': '✨',
        'bangle': '⚪',
        'maang tikka': '👑',
        'nath': '👃',
        'anklet': '🦶',
        'pendant': '🔷',
    };
    
    const typeLower = type?.toLowerCase() || '';
    for (const [key, icon] of Object.entries(icons)) {
        if (typeLower.includes(key)) return icon;
    }
    return '💎';
}
