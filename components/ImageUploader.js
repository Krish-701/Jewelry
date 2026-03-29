'use client';

import { useState, useRef, useCallback } from 'react';

export default function ImageUploader({ images, setImages, maxImages = 10, onImageLoad }) {
    const [dragging, setDragging] = useState(false);
    const fileInputRef = useRef(null);

    const getImageDimensions = (base64) => {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                resolve({ width: img.width, height: img.height });
            };
            img.src = base64;
        });
    };

    const handleFiles = useCallback(async (files) => {
        const fileArray = Array.from(files).filter(f => f.type.startsWith('image/'));
        const remaining = maxImages - images.length;
        const toAdd = fileArray.slice(0, remaining);

        for (const file of toAdd) {
            const reader = new FileReader();
            reader.onload = async (e) => {
                const base64Full = e.target.result;
                const base64Data = base64Full.split(',')[1];
                
                // Get image dimensions for auto-ratio
                const dims = await getImageDimensions(base64Full);
                
                const newImage = {
                    id: Date.now() + Math.random(),
                    file,
                    preview: base64Full,
                    base64: base64Data,
                    mimeType: file.type,
                    name: file.name,
                    width: dims.width,
                    height: dims.height,
                    aspectRatio: dims.width / dims.height,
                };
                
                setImages(prev => {
                    if (prev.length >= maxImages) return prev;
                    return [...prev, newImage];
                });
                
                // Notify parent of first image dimensions
                if (onImageLoad && images.length === 0) {
                    onImageLoad(dims);
                }
            };
            reader.readAsDataURL(file);
        }
    }, [images.length, maxImages, setImages, onImageLoad]);

    const handleDragOver = (e) => {
        e.preventDefault();
        setDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragging(false);
        handleFiles(e.dataTransfer.files);
    };

    const handleInputChange = (e) => {
        handleFiles(e.target.files);
        e.target.value = '';
    };

    const removeImage = (id) => {
        setImages(prev => prev.filter(img => img.id !== id));
    };

    return (
        <div>
            <div
                className={`upload-area ${dragging ? 'dragging' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
            >
                <div className="upload-icon">📸</div>
                <h3>Drop your jewelry photos here</h3>
                <p>or click to browse • Up to {maxImages} images • JPG, PNG, WebP</p>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleInputChange}
                    style={{ display: 'none' }}
                />
            </div>

            {images.length > 0 && (
                <div className="image-preview-grid">
                    {images.map((img) => (
                        <div key={img.id} className="image-preview-item">
                            <img src={img.preview} alt={img.name} />
                            <button
                                className="remove-btn"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    removeImage(img.id);
                                }}
                            >
                                ✕
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
