import React from 'react';

interface OnboardingTooltipProps {
    onDismiss: () => void;
}

export const OnboardingTooltip: React.FC<OnboardingTooltipProps> = ({ onDismiss }) => {
    return (
        <>
            <div
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: 'rgba(0,0,0,0.4)',
                    zIndex: 9998,
                }}
                onClick={onDismiss}
                role="presentation"
            />
            <div
                className="card"
                style={{
                    position: 'fixed',
                    top: '120px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '420px',
                    zIndex: 9999,
                    boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
                    padding: '30px',
                }}
                role="dialog"
                aria-label="Welcome to Memoria Clew"
            >
                <div>
                    <h3 className="mono" style={{ fontSize: '14px', marginBottom: '15px', borderBottom: '1px solid #000', paddingBottom: '10px' }}>
                        HOW_IT_WORKS
                    </h3>

                    <div style={{ marginBottom: '20px' }}>
                        <h4 className="mono" style={{ fontSize: '11px', color: '#666', marginBottom: '8px' }}>THE_PROBLEM</h4>
                        <div className="mono" style={{ fontSize: '11px', textTransform: 'none', lineHeight: '1.4' }}>
                            <p style={{ marginBottom: '8px' }}>You discover amazing tools, articles, and resources everywhere.</p>
                            <p style={{ marginBottom: '8px' }}>But they disappear into your browser history.</p>
                            <p>And you never know which ones matter for YOUR projects.</p>
                        </div>
                    </div>

                    <div style={{ marginBottom: '25px' }}>
                        <h4 className="mono" style={{ fontSize: '11px', color: '#666', marginBottom: '8px' }}>THE_SOLUTION</h4>
                        <div className="mono" style={{ fontSize: '11px', textTransform: 'none', lineHeight: '1.4' }}>
                            <p style={{ marginBottom: '10px' }}>Memoria Clew connects your research to your actual work.</p>
                            <div style={{ paddingLeft: '5px' }}>
                                <div style={{ marginBottom: '4px' }}>→ Paste a link</div>
                                <div style={{ marginBottom: '4px' }}>→ AI learns from your GitHub repos</div>
                                <div style={{ marginBottom: '4px' }}>→ Recalls it when you need it</div>
                                <div>→ The right tool finds the right project</div>
                            </div>
                        </div>
                    </div>

                    <button
                        className="btn-black mono"
                        style={{ width: '100%' }}
                        onClick={onDismiss}
                    >
                        START_CAPTURING
                    </button>
                </div>
            </div>
        </>
    );
};
