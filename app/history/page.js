'use client';

import { useState, useEffect, useCallback } from 'react';

const SIZE_LABELS = {
    portrait:   'Portrait 3:4',
    square2k:   '2048 × 2048',
    landscape:  '1920 × 1080',
    portrait4k: 'Portrait 4K',
    square4k:   '4096 × 4096',
    ultrawide4k:'3840 × 1080',
    auto:       'Match Input',
};

function getImageSrc(item) {
    if (item.imageUrl) return item.imageUrl;
    if (item.data) return `data:${item.mimeType || 'image/jpeg'};base64,${item.data}`;
    return '';
}

function getAspectRatio(outputSize) {
    switch (outputSize) {
        case 'landscape': return '16/9';
        case 'square2k':
        case 'square4k': return '1/1';
        case 'ultrawide4k': return '32/9';
        case 'auto': return '3/4'; // Default, will be detected from image
        case 'portrait':
        case 'portrait4k':
        default: return '3/4';
    }
}

const ITEMS_PER_PAGE = 12;

export default function HistoryPage() {
    const [history, setHistory] = useState([]);
    const [mounted, setMounted] = useState(false);
    const [selected, setSelected] = useState(new Set());
    const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
    const [loading, setLoading] = useState(true);

    // Load history from server
    useEffect(() => {
        setMounted(true);
        loadHistory();
    }, []);

    const loadHistory = async () => {
        try {
            const res = await fetch('/api/history');
            if (res.ok) {
                const data = await res.json();
                setHistory(data.history || []);
            }
        } catch (e) {
            console.error('Error loading history:', e);
        } finally {
            setLoading(false);
        }
    };

    // Background Polling for processing items
    useEffect(() => {
        if (!mounted || history.length === 0) return;

        const hasProcessing = history.some(item => item.status === 'processing');
        if (!hasProcessing) return;

        const intervalId = setInterval(async () => {
            let updated = false;
            const newHistory = [...history];

            for (let i = 0; i < newHistory.length; i++) {
                const item = newHistory[i];
                if (item.status === 'processing' && item.jobId) {
                    try {
                        const res = await fetch(`/api/status?jobId=${item.jobId}`);
                        if (res.ok) {
                            const data = await res.json();
                            if (data.status === 'completed' && data.imageUrl) {
                                newHistory[i] = {
                                    ...item,
                                    status: 'completed',
                                    imageUrl: data.imageUrl,
                                };
                                updated = true;
                            } else if (data.status === 'failed') {
                                newHistory[i] = {
                                    ...item,
                                    status: 'failed',
                                    error: data.error || 'Generation failed'
                                };
                                updated = true;
                            }
                        }
                    } catch (err) {
                        console.error('Polling error:', err);
                    }
                }
            }

            if (updated) {
                setHistory(newHistory);
            }
        }, 3000);

        return () => clearInterval(intervalId);
    }, [history, mounted]);

    const deleteFromServer = async (jobId) => {
        try {
            await fetch(`/api/history?jobId=${jobId}`, { method: 'DELETE' });
        } catch (e) {
            console.error('Delete error:', e);
        }
    };

    const toggleSelect = (uid) => {
        setSelected(prev => {
            const next = new Set(prev);
            if (next.has(uid)) next.delete(uid);
            else next.add(uid);
            return next;
        });
    };

    const selectAll = () => {
        const completedUids = history
            .filter(item => item.status !== 'processing')
            .map(item => item.jobId);
        setSelected(new Set(completedUids));
    };

    const deselectAll = () => setSelected(new Set());

    const deleteSelected = async () => {
        if (selected.size === 0) return;
        if (!confirm(`Delete ${selected.size} selected image(s)?`)) return;
        
        for (const jobId of selected) {
            await deleteFromServer(jobId);
        }
        
        const newHistory = history.filter(item => !selected.has(item.jobId));
        setHistory(newHistory);
        setSelected(new Set());
    };

    const deleteSingle = async (jobId) => {
        if (!confirm('Delete this image?')) return;
        await deleteFromServer(jobId);
        const newHistory = history.filter(item => item.jobId !== jobId);
        setHistory(newHistory);
        selected.delete(jobId);
        setSelected(new Set(selected));
    };

    const clearHistory = async () => {
        if (confirm('Are you sure you want to clear your entire generation history?')) {
            for (const item of history) {
                await deleteFromServer(item.jobId);
            }
            setHistory([]);
            setSelected(new Set());
        }
    };

    const downloadImage = (item) => {
        const src = getImageSrc(item);
        if (!src) return;
        const ext = (item.mimeType || 'image/jpeg').includes('png') ? 'png' : 'jpg';
        const template = (item.templateId || 'result').toLowerCase().replace(/\s+/g, '-');
        const shortId = Math.random().toString(36).slice(2, 7);
        const filename = `nana-${template}-${shortId}.${ext}`;
        const link = document.createElement('a');
        link.href = src;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const downloadSelected = () => {
        const items = history.filter(item => selected.has(item.jobId));
        items.forEach((item, i) => {
            setTimeout(() => downloadImage(item), i * 300);
        });
    };

    const viewFull = (item) => {
        const src = getImageSrc(item);
        if (!src) return;
        const w = window.open('', '_blank');
        w.document.write(`<!DOCTYPE html>
<html><head><title>Full View</title>
<style>body{margin:0;background:#0a0a0f;display:flex;align-items:center;justify-content:center;min-height:100vh;}
img{max-width:100%;max-height:100vh;object-fit:contain;}</style></head>
<body><img src="${src}" alt="Generated jewelry" /></body></html>`);
        w.document.close();
    };

    const viewPrompt = (item) => {
        if (item.promptText) {
            alert(`Prompt:\n\n${item.promptText}`);
        } else if (item.prompt) {
            alert(`Prompt:\n\n${item.prompt}`);
        } else {
            alert('No prompt available for this image.');
        }
    };

    if (!mounted) return null;

    const completedCount = history.filter(h => h.status !== 'processing').length;
    const allSelected = completedCount > 0 && selected.size === completedCount;
    const visibleHistory = history.slice(0, visibleCount);
    const hasMore = visibleCount < history.length;

    return (
        <div className="studio">
            <div className="studio-container animate-fade-in">
                {/* Header */}
                <div className="section-header" style={{ marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                        <div>
                            <h2>Generation <span className="gradient-text">History</span></h2>
                            <p style={{ margin: 0 }}>{history.length} image{history.length !== 1 ? 's' : ''}{selected.size > 0 ? ` · ${selected.size} selected` : ''}</p>
                        </div>
                        {history.length > 0 && (
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                <button className="btn btn-secondary" onClick={allSelected ? deselectAll : selectAll} style={{ fontSize: '0.8rem', padding: '0.4rem 0.9rem' }}>
                                    {allSelected ? '☐ Deselect All' : '☑ Select All'}
                                </button>
                                {selected.size > 0 && (
                                    <>
                                        <button className="btn btn-primary" onClick={downloadSelected} style={{ fontSize: '0.8rem', padding: '0.4rem 0.9rem' }}>
                                            ⬇ Download ({selected.size})
                                        </button>
                                        <button className="btn btn-secondary" onClick={deleteSelected} style={{ fontSize: '0.8rem', padding: '0.4rem 0.9rem', borderColor: '#f87171', color: '#f87171' }}>
                                            🗑 Delete ({selected.size})
                                        </button>
                                    </>
                                )}
                                <button className="btn btn-secondary" onClick={clearHistory} style={{ fontSize: '0.8rem', padding: '0.4rem 0.9rem' }}>
                                    🗑️ Clear All
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {loading && (
                    <div className="glass-card" style={{ padding: '2rem', textAlign: 'center' }}>
                        <div className="spinner" style={{ margin: '0 auto 1rem', width: '40px', height: '40px' }}></div>
                        <p>Loading history...</p>
                    </div>
                )}

                {/* Grid */}
                {!loading && history.length === 0 ? (
                    <div className="empty-state glass-card" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🕰️</div>
                        <h3>No History Yet</h3>
                        <p style={{ color: 'var(--text-secondary)' }}>
                            Your generated images will appear here automatically.
                        </p>
                    </div>
                ) : (
                    <div className="results-gallery">
                        {visibleHistory.map((item, idx) => {
                            const uid = item.jobId;
                            const isSelected = selected.has(uid);
                            const isProcessing = item.status === 'processing';
                            const isFailed = item.status === 'failed';
                            const src = getImageSrc(item);

                            return (
                                <div
                                    key={uid || idx}
                                    className="result-card animate-fade-in"
                                    style={{
                                        outline: isSelected ? '2px solid var(--accent-gold)' : 'none',
                                        outlineOffset: '2px',
                                        transition: 'outline 0.15s ease',
                                    }}
                                >
                                    {/* Image area */}
                                    <div className="result-image-wrap" style={{ position: 'relative', cursor: 'pointer' }}
                                        onClick={() => !isProcessing && toggleSelect(uid)}
                                    >
                                        {isProcessing ? (
                                            <>
                                                <img
                                                    className="result-image"
                                                    src={item.thumbnail || ''}
                                                    alt="Generating..."
                                                    style={{
                                                        filter: 'blur(4px) brightness(0.5)',
                                                        aspectRatio: getAspectRatio(item.outputSize),
                                                    }}
                                                />
                                                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', zIndex: 10 }}>
                                                    <div className="spinner" style={{ borderColor: 'rgba(255,255,255,0.2)', borderTopColor: 'var(--accent-gold)', width: '30px', height: '30px', borderWidth: '3px', margin: '0 auto 10px' }}></div>
                                                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff', letterSpacing: '1px', textTransform: 'uppercase' }}>GENERATING</span>
                                                </div>
                                            </>
                                        ) : isFailed ? (
                                            <div style={{
                                                aspectRatio: '3/4', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                background: 'rgba(248,113,113,0.1)', borderRadius: '0.75rem', flexDirection: 'column', gap: '0.5rem'
                                            }}>
                                                <span style={{ fontSize: '2rem' }}>❌</span>
                                                <span style={{ fontSize: '0.8rem', color: '#f87171' }}>Failed</span>
                                                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', maxWidth: '80%', textAlign: 'center' }}>{item.error}</span>
                                            </div>
                                        ) : (
                                            <img
                                                className="result-image"
                                                src={src}
                                                alt={`Generated #${idx + 1}`}
                                                loading="lazy"
                                                decoding="async"
                                                style={{
                                                    aspectRatio: getAspectRatio(item.outputSize),
                                                }}
                                            />
                                        )}

                                        {/* Selection checkbox */}
                                        {!isProcessing && !isFailed && (
                                            <div style={{
                                                position: 'absolute', top: '8px', left: '8px', zIndex: 10,
                                                width: '24px', height: '24px', borderRadius: '6px',
                                                background: isSelected ? 'var(--accent-gold)' : 'rgba(0,0,0,0.5)',
                                                border: '2px solid rgba(255,255,255,0.4)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: '14px', color: '#fff', fontWeight: 'bold',
                                                transition: 'all 0.15s ease',
                                            }}>
                                                {isSelected ? '✓' : ''}
                                            </div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="result-info">
                                        <div className="result-meta">
                                            <h4>#{history.length - idx}</h4>
                                            <span className="result-badge">
                                                {SIZE_LABELS[item.outputSize] || 'Portrait 3:4'}
                                            </span>
                                        </div>
                                        <p style={{ fontSize: '0.8rem', margin: '0.25rem 0' }}>{item.templateName || 'AI Generated'}</p>
                                        {item.timestamp && (
                                            <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', margin: 0 }}>
                                                {new Date(item.timestamp).toLocaleString()}
                                            </p>
                                        )}

                                        {/* Actions */}
                                        <div className="result-actions" style={{ marginTop: '0.5rem' }}>
                                            {!isProcessing && !isFailed && (
                                                <>
                                                    <button
                                                        className="btn btn-primary"
                                                        style={{ fontSize: '0.75rem', padding: '0.35rem 0.8rem' }}
                                                        onClick={() => downloadImage(item)}
                                                    >
                                                        ⬇ Download
                                                    </button>
                                                    <button
                                                        className="btn btn-secondary"
                                                        style={{ fontSize: '0.75rem', padding: '0.35rem 0.8rem' }}
                                                        onClick={() => viewFull(item)}
                                                    >
                                                        🔍 View
                                                    </button>
                                                    <button
                                                        className="btn btn-secondary"
                                                        style={{ fontSize: '0.75rem', padding: '0.35rem 0.8rem' }}
                                                        onClick={() => viewPrompt(item)}
                                                    >
                                                        📝 Prompt
                                                    </button>
                                                </>
                                            )}
                                            <button
                                                className="btn btn-secondary"
                                                style={{ fontSize: '0.75rem', padding: '0.35rem 0.8rem', borderColor: '#f87171', color: '#f87171' }}
                                                onClick={() => deleteSingle(uid)}
                                            >
                                                🗑
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {hasMore && (
                    <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                        <button
                            className="btn btn-secondary"
                            onClick={() => setVisibleCount(prev => prev + ITEMS_PER_PAGE)}
                            style={{ padding: '0.6rem 1.5rem', fontSize: '0.9rem' }}
                        >
                            Load More ({history.length - visibleCount} remaining)
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
