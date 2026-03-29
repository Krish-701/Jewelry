'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import ImageUploader from '@/components/ImageUploader';
import TemplateSelector from '@/components/TemplateSelector';
import PresetDropdowns from '@/components/PresetDropdowns';
import CustomModelUpload from '@/components/CustomModelUpload';
import JewelryAnalysis from '@/components/JewelryAnalysis';
import ResultGallery from '@/components/ResultGallery';
import LoadingSpinner from '@/components/LoadingSpinner';
import StepProgress from '@/components/StepProgress';

const OUTPUT_SIZES = [
    { id: 'auto',       label: 'Match Input',     sub: 'Same as upload',     icon: '📐' },
    { id: 'portrait',   label: 'Portrait',        sub: '3:4 ratio',         icon: '🖼️' },
    { id: 'square2k',   label: '2048 × 2048',     sub: 'Square / Instagram', icon: '⬛' },
    { id: 'landscape',  label: '1920 × 1080',     sub: 'Widescreen / HD',    icon: '🎬' },
    { id: 'portrait4k', label: 'Portrait 4K',     sub: '4K portrait',        icon: '📸' },
    { id: 'square4k',   label: '4096 × 4096',     sub: '4K Square',          icon: '🔲' },
    { id: 'ultrawide4k', label: '3840 × 1080',    sub: '4K Ultrawide',       icon: '🖥️' },
];

// Detect aspect ratio from uploaded image
function detectAspectRatio(width, height) {
    const ratio = width / height;
    if (ratio > 1.7) return '16:9';
    if (ratio > 1.4) return '3:2';
    if (ratio > 1.1) return '1:1';
    if (ratio > 0.8) return '4:5';
    if (ratio > 0.65) return '2:3';
    return '9:16';
}

export default function StudioPage() {
    const [step, setStep] = useState(1);
    const [images, setImages] = useState([]);
    const [analysis, setAnalysis] = useState(null);
    const [selectedTemplate, setSelectedTemplate] = useState('south-indian');
    const [customPrompt, setCustomPrompt] = useState({});
    const [extraPrompt, setExtraPrompt] = useState('');
    const [outputSize, setOutputSize] = useState('portrait');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [error, setError] = useState('');
    const [promptPreview, setPromptPreview] = useState('');
    const router = useRouter();

    // ── New preset state ──────────────────
    const [backgroundPreset, setBackgroundPreset] = useState(null);
    const [religionPreset, setReligionPreset] = useState(null);
    const [dressCodePreset, setDressCodePreset] = useState(null);
    const [customModelPhoto, setCustomModelPhoto] = useState(null);
    const [consistencyMode, setConsistencyMode] = useState('exact');
    const [detectedAspectRatio, setDetectedAspectRatio] = useState(null);

    // Handle first image load for auto-ratio detection
    const handleFirstImageLoad = useCallback((dims) => {
        const ratio = detectAspectRatio(dims.width, dims.height);
        setDetectedAspectRatio(ratio);
        // Auto-select 'auto' if this is the first image
        if (images.length === 1) {
            setOutputSize('auto');
        }
    }, [images.length]);

    // Step 1 → 2: Analyze
    const handleAnalyze = useCallback(async () => {
        if (images.length === 0) { setError('Please upload at least one jewelry image'); return; }
        setLoading(true);
        setLoadingMessage(`Analyzing ${images.length} reference image${images.length > 1 ? 's' : ''} together…`);
        setError('');
        try {
            const allImages = images.map(img => ({ base64: img.base64, mimeType: img.mimeType }));
            const res = await fetch('/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ images: allImages }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Analysis failed');
            setAnalysis(data.analysis);
            setStep(2);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [images]);

    // Step 3 → 4: Generate
    const handleGenerate = useCallback(async () => {
        setLoading(true);
        setLoadingMessage(`Starting generation with ${images.length} reference${images.length > 1 ? 's' : ''} • ${OUTPUT_SIZES.find(s => s.id === outputSize)?.label || outputSize}…`);
        setError('');
        try {
            const allImages = images.map(img => ({ base64: img.base64, mimeType: img.mimeType }));
            
            // Handle auto-ratio
            let effectiveOutputSize = outputSize;
            let aspectRatio = detectedAspectRatio;
            if (outputSize === 'auto' && detectedAspectRatio) {
                // Map detected ratio to closest output size
                if (detectedAspectRatio === '1:1') effectiveOutputSize = 'square4k';
                else if (detectedAspectRatio === '16:9') effectiveOutputSize = 'landscape';
                else effectiveOutputSize = 'portrait4k';
            }
            
            const res = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    images: allImages,
                    templateId: selectedTemplate,
                    analysis,
                    customPrompt: selectedTemplate === 'custom' ? customPrompt : undefined,
                    outputSize: effectiveOutputSize,
                    originalOutputSize: outputSize,
                    aspectRatio,
                    extraPrompt,
                    backgroundPreset,
                    religionPreset,
                    dressCodePreset,
                    customModelPhoto: customModelPhoto ? {
                        base64: customModelPhoto.base64,
                        mimeType: customModelPhoto.mimeType,
                    } : null,
                    consistencyMode,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Generation failed');

            setPromptPreview(data.prompt);

            const templateLabel = selectedTemplate.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            const uid = Date.now().toString(36) + Math.random().toString(36).slice(2, 5);

            if (data.status === 'processing') {
                const newJob = {
                    jobId: data.jobId,
                    status: 'processing',
                    prompt: data.prompt,
                    templateName: `${templateLabel} — ${images.length} ref${images.length > 1 ? 's' : ''}`,
                    templateId: data.templateId || selectedTemplate,
                    outputSize: data.outputSize || outputSize,
                    uid: uid,
                    thumbnail: images[0]?.preview, 
                    timestamp: Date.now()
                };

                try {
                    const history = JSON.parse(localStorage.getItem('jewelryGenHistory') || '[]');
                    const combined = [newJob, ...history].slice(0, 50);
                    localStorage.setItem('jewelryGenHistory', JSON.stringify(combined));
                } catch (e) {
                    console.error('Failed to save to history', e);
                }

                router.push('/history');
                return;
            }

            const newResults = data.images.map((imgData, i) => ({
                ...imgData,
                templateName: `${templateLabel} — ${images.length} ref${images.length > 1 ? 's' : ''}`,
                templateId: data.templateId || selectedTemplate,
                outputSize: data.outputSize || outputSize,
                uid: `${uid}-${i}`,
            }));

            setResults(prev => {
                const updatedResults = [...newResults, ...prev];
                try {
                    const history = JSON.parse(localStorage.getItem('jewelryGenHistory') || '[]');
                    const combined = [...newResults, ...history].slice(0, 50);
                    localStorage.setItem('jewelryGenHistory', JSON.stringify(combined));
                } catch (e) {
                    console.error('Failed to save to history', e);
                }
                return updatedResults;
            });
            setStep(4);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [images, selectedTemplate, analysis, customPrompt, outputSize, extraPrompt, backgroundPreset, religionPreset, dressCodePreset, customModelPhoto, consistencyMode, router]);

    const handleReset = () => {
        setStep(1); setImages([]); setAnalysis(null);
        setResults([]); setError(''); setPromptPreview('');
        setExtraPrompt(''); setOutputSize('portrait');
        setBackgroundPreset(null); setReligionPreset(null);
        setDressCodePreset(null); setCustomModelPhoto(null);
        setConsistencyMode('exact');
    };

    return (
        <div className="studio">
            <div className="studio-container">
                {loading && (
                    <LoadingSpinner
                        message={loadingMessage}
                        subMessage="AI engine is processing — this may take 30–90 seconds"
                    />
                )}

                <StepProgress currentStep={step} />

                {error && (
                    <div className="error-banner">
                        <span>⚠</span> {error}
                    </div>
                )}

                {/* ── STEP 1: Upload ─────────────────────────────── */}
                {step === 1 && (
                    <div className="animate-fade-in">
                        <div className="section-header" style={{ marginBottom: '2rem' }}>
                            <h2>Upload Your <span className="gradient-text">Jewelry</span></h2>
                            <p>Add multiple photos of the <strong style={{ color: 'var(--accent-gold-light)' }}>same piece from different angles</strong> — more images = better consistency</p>
                        </div>

                        <ImageUploader images={images} setImages={setImages} onImageLoad={handleFirstImageLoad} />

                        {images.length > 0 && (
                            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                                <div className="ref-hint glass-card" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', padding: '0.6rem 1.2rem', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
                                    <span style={{ color: 'var(--accent-gold)' }}>✦</span>
                                    <span style={{ color: 'var(--text-secondary)' }}>
                                        {images.length} image{images.length > 1 ? 's' : ''} — all will be used as references together for better accuracy
                                    </span>
                                </div>
                                <br />
                                <button className="btn btn-primary" onClick={handleAnalyze}>
                                    🔍 Analyze {images.length} Piece{images.length > 1 ? 's' : ''} →
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* ── STEP 2: Analysis ───────────────────────────── */}
                {step === 2 && (
                    <div className="animate-fade-in">
                        <div className="section-header" style={{ marginBottom: '2rem' }}>
                            <h2>Jewelry <span className="gradient-text">Analysis</span></h2>
                            <p>AI analyzed {images.length} reference{images.length > 1 ? 's' : ''} as a unified collection</p>
                        </div>

                        <div className="ref-thumbnails">
                            {images.map(img => (
                                <div key={img.id} className="ref-thumb glass-card">
                                    <img src={img.preview} alt={img.name} />
                                </div>
                            ))}
                        </div>

                        <JewelryAnalysis analysis={analysis} />

                        <div className="step-nav">
                            <button className="btn btn-secondary" onClick={() => setStep(1)}>← Back</button>
                            <button className="btn btn-primary" onClick={() => setStep(3)}>🎭 Choose Template →</button>
                        </div>
                    </div>
                )}

                {/* ── STEP 3: Template + Options ─────────────────── */}
                {step === 3 && (
                    <div className="animate-fade-in">
                        <div className="section-header" style={{ marginBottom: '2rem' }}>
                            <h2>Choose <span className="gradient-text">Template & Options</span></h2>
                            <p>Select a model style, presets, output size, and optionally add extra instructions</p>
                        </div>

                        <TemplateSelector
                            selected={selectedTemplate}
                            onSelect={setSelectedTemplate}
                            customPrompt={customPrompt}
                            onCustomPromptChange={setCustomPrompt}
                            customModelPhoto={customModelPhoto}
                        />

                        {/* ── Scene Presets (3 Dropdowns) ── */}
                        <PresetDropdowns
                            backgroundPreset={backgroundPreset}
                            religionPreset={religionPreset}
                            dressCodePreset={dressCodePreset}
                            onBackgroundChange={setBackgroundPreset}
                            onReligionChange={setReligionPreset}
                            onDressCodeChange={setDressCodePreset}
                        />

                        {/* ── Custom Model Photo Upload ── */}
                        <CustomModelUpload
                            modelPhoto={customModelPhoto}
                            onModelPhotoChange={setCustomModelPhoto}
                            consistencyMode={consistencyMode}
                            onConsistencyChange={setConsistencyMode}
                        />

                        {/* ── Output Size ── */}
                        <div className="options-section">
                            <h3 className="options-title">
                                <span className="options-icon">📐</span>
                                Output Size
                            </h3>
                            <div className="size-grid">
                                {OUTPUT_SIZES.map(size => (
                                    <button
                                        key={size.id}
                                        className={`size-card glass-card ${outputSize === size.id ? 'selected' : ''}`}
                                        onClick={() => setOutputSize(size.id)}
                                    >
                                        <span className="size-icon">{size.icon}</span>
                                        <span className="size-label">{size.label}</span>
                                        <span className="size-sub">{size.sub}</span>
                                        {outputSize === size.id && <span className="size-check">✓</span>}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* ── Extra Prompt ── */}
                        <div className="options-section">
                            <h3 className="options-title">
                                <span className="options-icon">✍️</span>
                                Extra Instructions
                                <span className="options-badge">Optional</span>
                            </h3>
                            <p className="options-desc">
                                Anything you add here will be appended to the final AI prompt — e.g., <em>"add a white flowers background"</em>, <em>"model should be smiling"</em>, <em>"outdoor setting"</em>
                            </p>
                            <textarea
                                className="extra-prompt-input"
                                placeholder="e.g., The model should have a warm smile, add soft bokeh bokeh flowers in the background, golden hour lighting..."
                                value={extraPrompt}
                                onChange={e => setExtraPrompt(e.target.value)}
                                rows={3}
                            />
                            {extraPrompt.trim() && (
                                <div className="extra-prompt-preview">
                                    <span style={{ color: 'var(--accent-gold)', fontSize: '0.75rem', marginRight: '0.4rem' }}>✦</span>
                                    Will be added: <em>"{extraPrompt.trim()}"</em>
                                </div>
                            )}
                        </div>

                        <div className="step-nav">
                            <button className="btn btn-secondary" onClick={() => setStep(2)}>← Back</button>
                            <button className="btn btn-primary" onClick={handleGenerate}>
                                ✨ Generate — {images.length} Ref{images.length > 1 ? 's' : ''} · {OUTPUT_SIZES.find(s => s.id === outputSize)?.label}
                            </button>
                        </div>
                    </div>
                )}

                {/* ── STEP 4: Results ────────────────────────────── */}
                {step === 4 && (
                    <div className="animate-fade-in">
                        <div className="section-header" style={{ marginBottom: '2rem' }}>
                            <h2>Your <span className="gradient-text">Results</span></h2>
                            <p>{results.length} image{results.length !== 1 ? 's' : ''} generated from {images.length} reference{images.length > 1 ? 's' : ''}</p>
                        </div>

                        <ResultGallery results={results} />

                        {promptPreview && (
                            <details className="prompt-details glass-card" style={{ marginTop: '2rem' }}>
                                <summary>📝 View Generated Prompt</summary>
                                <div className="prompt-preview" style={{ marginTop: '1rem' }}>{promptPreview}</div>
                            </details>
                        )}

                        <div className="step-nav" style={{ marginTop: '2rem' }}>
                            <button className="btn btn-secondary" onClick={() => setStep(3)}>← Change Template</button>
                            <button className="btn btn-primary" onClick={handleGenerate}>🔄 Regenerate</button>
                            <button className="btn btn-secondary" onClick={handleReset}>🆕 Start New</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
