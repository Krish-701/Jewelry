'use client';

export default function LoadingSpinner({ message, subMessage }) {
    return (
        <div className="spinner-overlay">
            <div className="spinner-ring" />
            <div className="spinner-text">
                <strong>{message || 'Processing...'}</strong>
                {subMessage && <span>{subMessage}</span>}
            </div>
        </div>
    );
}
