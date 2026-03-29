'use client';

const SIZE_LABELS = {
    portrait:  'Portrait 3:4',
    square2k:  '2048 × 2048',
    landscape: '1920 × 1080',
};

/**
 * Generates a unique, readable download filename.
 * Format: nana-{templateId}-{outputSize}-{shortId}.{ext}
 * e.g.: nana-south-indian-portrait-a3f7b.jpg
 */
function makeFilename(templateId, outputSize, mimeType) {
    const ext = mimeType?.includes('png') ? 'png' : 'jpg';
    const template = (templateId || 'result').toLowerCase().replace(/\s+/g, '-');
    const size = (outputSize || 'portrait').toLowerCase();
    const shortId = Math.random().toString(36).slice(2, 7);
    return `nana-${template}-${size}-${shortId}.${ext}`;
}

export default function ResultGallery({ results }) {
    if (!results || results.length === 0) return null;

    const downloadImage = (imageData, mimeType, templateId, outputSize) => {
        const filename = makeFilename(templateId, outputSize, mimeType);
        const link = document.createElement('a');
        link.href = `data:${mimeType};base64,${imageData}`;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const viewFull = (imageData, mimeType) => {
        const dataUrl = `data:${mimeType};base64,${imageData}`;
        const w = window.open('', '_blank');
        w.document.write(`<!DOCTYPE html>
<html><head><title>Premium Jewelry Model Studio – Full View</title>
<style>
  body{margin:0;background:#0a0a0f;display:flex;align-items:center;justify-content:center;min-height:100vh;}
  img{max-width:100%;max-height:100vh;object-fit:contain;}
</style></head>
<body><img src="${dataUrl}" alt="Generated jewelry image" /></body></html>`);
        w.document.close();
    };

    return (
        <div>
            <div className="results-gallery">
                {results.map((result, idx) => (
                    <div key={result.uid || idx} className="result-card animate-fade-in">
                        <div className="result-image-wrap" style={{ position: 'relative' }}>
                            {result.status === 'processing' ? (
                                <>
                                    <img
                                        className="result-image"
                                        src={result.thumbnail || ''}
                                        alt={`Generating...`}
                                        style={{
                                            filter: 'blur(4px) brightness(0.5)',
                                            aspectRatio: result.outputSize === 'landscape'
                                                ? '16/9'
                                                : result.outputSize === 'square2k'
                                                    ? '1/1'
                                                    : '3/4',
                                        }}
                                    />
                                    <div style={{
                                        position: 'absolute', top: '50%', left: '50%', 
                                        transform: 'translate(-50%, -50%)', textAlign: 'center', zIndex: 10
                                    }}>
                                        <div className="spinner" style={{ borderColor: 'rgba(255,255,255,0.2)', borderTopColor: 'var(--accent-gold)', width: '30px', height: '30px', borderWidth: '3px', margin: '0 auto 10px' }}></div>
                                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff', letterSpacing: '1px', textTransform: 'uppercase' }}>GENERATING</span>
                                    </div>
                                </>
                            ) : (
                                <img
                                    className="result-image"
                                    src={result.imageUrl ? result.imageUrl : `data:${result.mimeType || 'image/jpeg'};base64,${result.data}`}
                                    alt={`Generated jewelry image ${idx + 1}`}
                                    style={{
                                        aspectRatio: result.outputSize === 'landscape'
                                            ? '16/9'
                                            : result.outputSize === 'square2k'
                                                ? '1/1'
                                                : '3/4',
                                    }}
                                />
                            )}
                            {result.status !== 'processing' && (
                                <div className="result-overlay">
                                    <button
                                        className="overlay-btn"
                                        onClick={() => viewFull(result.data, result.mimeType)}
                                    >
                                        🔍
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="result-info">
                            <div className="result-meta">
                                <h4>Generation #{idx + 1}</h4>
                                <span className="result-badge">
                                    {SIZE_LABELS[result.outputSize] || 'Portrait 3:4'}
                                </span>
                            </div>
                            <p>{result.templateName || 'AI Generated'}</p>

                            <div className="result-actions">
                                <button
                                    className="btn btn-primary"
                                    style={{ fontSize: '0.82rem', padding: '0.5rem 1.1rem', opacity: result.status === 'processing' ? 0.5 : 1, cursor: result.status === 'processing' ? 'not-allowed' : 'pointer' }}
                                    disabled={result.status === 'processing'}
                                    onClick={() => downloadImage(
                                        result.data,
                                        result.mimeType,
                                        result.templateId,
                                        result.outputSize
                                    )}
                                >
                                    ⬇ Download
                                </button>
                                <button
                                    className="btn btn-secondary"
                                    style={{ fontSize: '0.82rem', padding: '0.5rem 1.1rem', opacity: result.status === 'processing' ? 0.5 : 1, cursor: result.status === 'processing' ? 'not-allowed' : 'pointer' }}
                                    disabled={result.status === 'processing'}
                                    onClick={() => viewFull(result.data, result.mimeType)}
                                >
                                    🔍 Full View
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
