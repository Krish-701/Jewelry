'use client';

import { useState, useRef } from 'react';
import { MODEL_CONSISTENCY_OPTIONS } from '@/lib/presets';

export default function CustomModelUpload({ modelPhoto, onModelPhotoChange, consistencyMode, onConsistencyChange }) {
    const fileInputRef = useRef(null);
    const [dragOver, setDragOver] = useState(false);

    const handleFile = (file) => {
        if (!file || !file.type.startsWith('image/')) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            const base64 = e.target.result.split(',')[1];
            onModelPhotoChange({
                base64,
                mimeType: file.type,
                preview: e.target.result,
                name: file.name,
            });
        };
        reader.readAsDataURL(file);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer?.files?.[0];
        if (file) handleFile(file);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setDragOver(true);
    };

    const handleRemove = () => {
        onModelPhotoChange(null);
    };

    return (
        <div className="custom-model-section">
            <div className="custom-model-header">
                <h3 className="options-title">
                    <span className="options-icon">📸</span>
                    Custom Model Photo
                    <span className="options-badge">Optional</span>
                </h3>
                <p className="options-desc">
                    Upload your own model photo — AI will add the jewelry onto this model instead of generating a new one
                </p>
            </div>

            {!modelPhoto ? (
                <div
                    className={`custom-model-dropzone glass-card ${dragOver ? 'drag-over' : ''}`}
                    onClick={() => fileInputRef.current?.click()}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={() => setDragOver(false)}
                >
                    <div className="custom-model-dropzone-content">
                        <span className="custom-model-dropzone-icon">👤</span>
                        <p className="custom-model-dropzone-text">
                            Drop a model photo here or <span className="custom-model-browse">browse</span>
                        </p>
                        <span className="custom-model-dropzone-hint">JPG, PNG • The model's face and body will be preserved</span>
                    </div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFile(e.target.files?.[0])}
                        style={{ display: 'none' }}
                    />
                </div>
            ) : (
                <div className="custom-model-preview glass-card">
                    <div className="custom-model-preview-image-wrap">
                        <img src={modelPhoto.preview} alt="Custom model" className="custom-model-preview-image" />
                        <button className="custom-model-remove-btn" onClick={handleRemove} title="Remove photo">✕</button>
                    </div>
                    <div className="custom-model-preview-info">
                        <span className="custom-model-preview-name">{modelPhoto.name}</span>
                        <span className="custom-model-preview-badge">✓ Model photo loaded</span>
                    </div>
                </div>
            )}

            {modelPhoto && (
                <div className="consistency-options">
                    <label className="preset-label">
                        <span className="preset-label-icon">🎯</span>
                        Consistency Mode
                    </label>
                    <div className="consistency-grid">
                        {MODEL_CONSISTENCY_OPTIONS.map(opt => (
                            <button
                                key={opt.id}
                                className={`consistency-card glass-card ${consistencyMode === opt.id ? 'selected' : ''}`}
                                onClick={() => onConsistencyChange(opt.id)}
                            >
                                <span className="consistency-emoji">{opt.emoji}</span>
                                <span className="consistency-name">{opt.name}</span>
                                <span className="consistency-desc">{opt.description}</span>
                                {consistencyMode === opt.id && <span className="consistency-check">✓</span>}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
