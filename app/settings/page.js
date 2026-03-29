'use client';

import { useState, useEffect } from 'react';

export default function SettingsPage() {
    const [config, setConfig] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/config')
            .then(res => res.json())
            .then(data => {
                setConfig(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    return (
        <div className="settings-page">
            <div className="settings-container">
                <div className="section-header" style={{ marginBottom: '2rem' }}>
                    <h2>⚙ <span className="gradient-text">Settings</span></h2>
                    <p>Configure your AI provider and API keys</p>
                </div>

                {loading ? (
                    <div className="glass-card" style={{ padding: '2rem', textAlign: 'center' }}>
                        Loading configuration...
                    </div>
                ) : (
                    <>
                        {/* Current Status */}
                        <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
                            <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>📊 Current Status</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                                <div>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Provider</span>
                                    <p style={{ fontWeight: 600, color: 'var(--accent-gold-light)' }}>
                                        {config?.provider === 'muapi' ? 'muapi.ai' : 'Google Gemini'}
                                    </p>
                                </div>
                                <div>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Model</span>
                                    <p style={{ fontWeight: 600, color: 'var(--accent-gold-light)' }}>
                                        {config?.modelId || 'Unknown'}
                                    </p>
                                </div>
                                <div>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>API Key Status</span>
                                    <p style={{ fontWeight: 600 }}>
                                        {(config?.provider === 'google' ? config?.hasGeminiKey : config?.hasMuapiKey) ? (
                                            <span style={{ color: 'var(--accent-emerald)' }}>✓ Configured</span>
                                        ) : (
                                            <span style={{ color: 'var(--accent-rose)' }}>✕ Not Set</span>
                                        )}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Configuration Instructions */}
                        <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
                            <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>🔧 How to Configure</h3>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.8 }}>
                                Edit the <code style={{
                                    background: 'rgba(212, 168, 83, 0.1)',
                                    padding: '0.15rem 0.5rem',
                                    borderRadius: '4px',
                                    color: 'var(--accent-gold-light)',
                                    fontSize: '0.85rem',
                                }}>.env.local</code> file in your project root:
                            </p>

                            <div style={{
                                background: 'var(--bg-primary)',
                                borderRadius: 'var(--radius-md)',
                                padding: '1.5rem',
                                marginTop: '1rem',
                                fontFamily: 'monospace',
                                fontSize: '0.85rem',
                                lineHeight: 1.8,
                                color: 'var(--text-secondary)',
                                overflowX: 'auto',
                            }}>
                                <div><span style={{ color: 'var(--text-muted)' }}># Switch provider</span></div>
                                <div><span style={{ color: 'var(--accent-gold-light)' }}>AI_PROVIDER</span>=google  <span style={{ color: 'var(--text-muted)' }}># or "muapi"</span></div>
                                <br />
                                <div><span style={{ color: 'var(--text-muted)' }}># Google Gemini API Key</span></div>
                                <div><span style={{ color: 'var(--accent-gold-light)' }}>GEMINI_API_KEY</span>=your-key-here</div>
                                <br />
                                <div><span style={{ color: 'var(--text-muted)' }}># muapi.ai API Key</span></div>
                                <div><span style={{ color: 'var(--accent-gold-light)' }}>MUAPI_API_KEY</span>=your-key-here</div>
                                <div><span style={{ color: 'var(--accent-gold-light)' }}>MUAPI_BASE_URL</span>=https://api.muapi.ai/v1</div>
                                <br />
                                <div><span style={{ color: 'var(--text-muted)' }}># Model selection</span></div>
                                <div><span style={{ color: 'var(--accent-gold-light)' }}>AI_MODEL</span>=pro  <span style={{ color: 'var(--text-muted)' }}># "pro" or "flash"</span></div>
                            </div>
                        </div>

                        {/* Model Info */}
                        <div className="glass-card" style={{ padding: '1.5rem' }}>
                            <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>🤖 Available Models</h3>
                            <div style={{ display: 'grid', gap: '1rem' }}>
                                <div style={{
                                    padding: '1rem',
                                    background: 'var(--bg-secondary)',
                                    borderRadius: 'var(--radius-md)',
                                    border: '1px solid var(--border-subtle)',
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                        <h4 style={{ fontSize: '0.95rem' }}>Intelligent AI Engine</h4>
                                        <span className="analysis-tag">Recommended</span>
                                    </div>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                        <strong>Google:</strong> gemini-3-pro-image-preview<br />
                                        <strong>muapi:</strong> nano-banana-pro<br />
                                        Best quality, 4K output, thinking mode, search grounding
                                    </p>
                                </div>
                                <div style={{
                                    padding: '1rem',
                                    background: 'var(--bg-secondary)',
                                    borderRadius: 'var(--radius-md)',
                                    border: '1px solid var(--border-subtle)',
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                        <h4 style={{ fontSize: '0.95rem' }}>Nano Banana 2</h4>
                                        <span className="analysis-tag" style={{ background: 'rgba(52, 211, 153, 0.1)', color: 'var(--accent-emerald)', borderColor: 'rgba(52, 211, 153, 0.2)' }}>Fast</span>
                                    </div>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                        <strong>Google:</strong> gemini-3.1-flash-image-preview<br />
                                        <strong>muapi:</strong> nano-banana-2<br />
                                        Faster, more affordable, great for testing
                                    </p>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
