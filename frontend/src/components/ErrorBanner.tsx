import React from 'react';

interface ErrorBannerProps {
    message: string;
    onDismiss: () => void;
}

export const ErrorBanner: React.FC<ErrorBannerProps> = ({ message, onDismiss }) => (
    <div className="error-banner mono" role="alert" aria-live="polite">
        <div>
            <strong>NOTICE:</strong> {message}
        </div>
        <button
            className="btn-minimal mono"
            onClick={onDismiss}
        >
            DISMISS
        </button>
    </div>
);
