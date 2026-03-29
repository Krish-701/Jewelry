'use client';

import { BACKGROUND_PRESETS, RELIGION_PRESETS, DRESS_CODE_PRESETS } from '@/lib/presets';

function PresetDropdown({ label, icon, presets, value, onChange, placeholder }) {
    const selected = presets.find(p => p.id === value);
    
    return (
        <div className="preset-dropdown-wrapper">
            <label className="preset-label">
                <span className="preset-label-icon">{icon}</span>
                {label}
            </label>
            <div className="preset-select-container">
                <select
                    className="preset-select"
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value || null)}
                >
                    <option value="">{placeholder || `Select ${label}...`}</option>
                    {presets.map(p => (
                        <option key={p.id} value={p.id}>
                            {p.emoji} {p.name}
                        </option>
                    ))}
                </select>
                <span className="preset-select-arrow">▾</span>
            </div>
            {selected && (
                <div className="preset-hint">
                    <span className="preset-hint-icon">✦</span>
                    {selected.description}
                </div>
            )}
        </div>
    );
}

export default function PresetDropdowns({ backgroundPreset, religionPreset, dressCodePreset, onBackgroundChange, onReligionChange, onDressCodeChange }) {
    return (
        <div className="preset-dropdowns-section">
            <div className="preset-dropdowns-header">
                <h3 className="options-title">
                    <span className="options-icon">🎨</span>
                    Scene Presets
                </h3>
                <p className="options-desc">
                    Select background, cultural style, and outfit — these presets shape the AI prompt for perfect results
                </p>
            </div>
            <div className="preset-dropdowns-grid">
                <PresetDropdown
                    label="Background"
                    icon="🖼️"
                    presets={BACKGROUND_PRESETS}
                    value={backgroundPreset}
                    onChange={onBackgroundChange}
                    placeholder="Select background style..."
                />
                <PresetDropdown
                    label="Religion / Culture"
                    icon="🌏"
                    presets={RELIGION_PRESETS}
                    value={religionPreset}
                    onChange={onReligionChange}
                    placeholder="Select cultural style..."
                />
                <PresetDropdown
                    label="Dress Code"
                    icon="👗"
                    presets={DRESS_CODE_PRESETS}
                    value={dressCodePreset}
                    onChange={onDressCodeChange}
                    placeholder="Select outfit style..."
                />
            </div>
        </div>
    );
}
