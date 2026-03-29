'use client';

import { TEMPLATES } from '@/lib/templates';

export default function TemplateSelector({ selected, onSelect, customPrompt, onCustomPromptChange, customModelPhoto }) {
    return (
        <div>
            <div className="template-row" style={{
                display: 'flex',
                gap: '0.75rem',
                overflowX: 'auto',
                paddingBottom: '0.5rem',
                scrollbarWidth: 'thin',
            }}>
                {TEMPLATES.map((template) => (
                    <div
                        key={template.id}
                        className={`glass-card template-card ${selected === template.id ? 'selected' : ''}`}
                        onClick={() => onSelect(template.id)}
                        style={{
                            flex: '0 0 auto',
                            width: '160px',
                            minWidth: '160px',
                            padding: '1rem',
                            cursor: 'pointer',
                            textAlign: 'center',
                        }}
                    >
                        <span className="check-mark" style={{ 
                            position: 'absolute', 
                            top: '8px', 
                            right: '8px',
                            opacity: selected === template.id ? 1 : 0,
                        }}>✓</span>
                        <span className="template-emoji" style={{ fontSize: '1.75rem', display: 'block', marginBottom: '0.5rem' }}>{template.emoji}</span>
                        <h4 style={{ fontSize: '0.85rem', margin: '0 0 0.25rem 0', whiteSpace: 'nowrap' }}>{template.name}</h4>
                        <p style={{ fontSize: '0.7rem', margin: 0, color: 'var(--text-secondary)', lineHeight: 1.3 }}>{template.description}</p>
                    </div>
                ))}
            </div>

            {selected === 'custom-model' && !customModelPhoto && (
                <div className="glass-card" style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(248,113,113,0.1)', borderColor: 'rgba(248,113,113,0.3)' }}>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#f87171' }}>
                        ⚠️ Please upload a custom model photo below to use this template
                    </p>
                </div>
            )}

            {selected === 'custom' && (
                <div className="glass-card" style={{ marginTop: '1.5rem', padding: '1.5rem' }}>
                    <h4 style={{ marginBottom: '1rem', fontSize: '1rem' }}>✨ Custom Template Settings</h4>

                    <div className="form-field">
                        <label>Model Description</label>
                        <textarea
                            placeholder="e.g., A beautiful woman wearing a flowing red gown..."
                            value={customPrompt?.modelPrompt || ''}
                            onChange={(e) => onCustomPromptChange({ ...customPrompt, modelPrompt: e.target.value })}
                        />
                    </div>

                    <div className="form-field">
                        <label>Setting / Background</label>
                        <textarea
                            placeholder="e.g., A luxurious penthouse with city skyline view..."
                            value={customPrompt?.settingPrompt || ''}
                            onChange={(e) => onCustomPromptChange({ ...customPrompt, settingPrompt: e.target.value })}
                        />
                    </div>

                    <div className="form-field">
                        <label>Lighting Style</label>
                        <input
                            type="text"
                            placeholder="e.g., Soft golden hour light with warm tones..."
                            value={customPrompt?.lightingPrompt || ''}
                            onChange={(e) => onCustomPromptChange({ ...customPrompt, lightingPrompt: e.target.value })}
                        />
                    </div>

                    <div className="form-field">
                        <label>Pose / Expression</label>
                        <input
                            type="text"
                            placeholder="e.g., Confident pose, looking directly at camera..."
                            value={customPrompt?.posePrompt || ''}
                            onChange={(e) => onCustomPromptChange({ ...customPrompt, posePrompt: e.target.value })}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
