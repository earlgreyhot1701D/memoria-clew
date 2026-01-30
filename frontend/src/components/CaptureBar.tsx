import React, { useState } from 'react';

interface CaptureBarProps {
    onCapture: (input: string) => Promise<void>;
    disabled?: boolean;
}

export const CaptureBar: React.FC<CaptureBarProps> = ({ onCapture, disabled = false }) => {
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        try {
            setLoading(true);
            await onCapture(input);
            setInput('');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form
            className="card capture-bar"
            aria-label="Quick capture"
            onSubmit={handleSubmit}
        >
            <span className="mono" style={{ fontSize: '11px', whiteSpace: 'nowrap' }}>
                QUICK_CAPTURE &gt;
            </span>

            <label htmlFor="capture-input" className="sr-only">
                Paste a URL or content snippet
            </label>
            <input
                id="capture-input"
                type="text"
                className="capture-input"
                placeholder="PASTE URL OR CONTENT..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={disabled || loading}
            />

            <button
                className="mono btn-black"
                type="submit"
                disabled={disabled || loading}
            >
                {loading ? 'PROCESSING...' : 'PROCESS'}
            </button>
        </form>
    );
};
