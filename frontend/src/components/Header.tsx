import React from 'react';

interface HeaderProps {
    contextStatus: 'ok' | 'error';
    scanReady: boolean;
    onShowOnboarding?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ contextStatus, scanReady, onShowOnboarding }) => (
    <header className="recap-header" aria-label="Dashboard header">
        <div>
            <div className="mono status-indicator" style={{ fontSize: '11px', marginBottom: '10px' }}>
                <span
                    style={{
                        width: '10px',
                        height: '10px',
                        background: contextStatus === 'ok' ? '#00FF00' : '#ff0033',
                        display: 'inline-block',
                        marginRight: '5px',
                    }}
                    aria-hidden="true"
                />
                MEMORIA: READY // SCAN_READY ({scanReady ? 'MANUAL' : 'INIT'})
            </div>
            <h1 className="dot-title mono">MEMORIA CLEW</h1>

            <div style={{ marginTop: '15px' }}>
                <div className="mono" style={{ fontSize: '12px', color: '#666666', marginBottom: '5px' }}>
                    Remember everything. Find anything.
                </div>
                <a
                    href="https://github.com/earlgreyhot1701D/memoria-clew"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="tagline-link"
                >
                    "Let's separate signal from hype with a cool head and a sharp knife."
                </a>
            </div>
        </div>
        <div className="mono" style={{ fontSize: '11px', textAlign: 'right' }}>
            LOCAL_FIRST: ON<br />
            <span style={{ color: '#ff0033' }}>NO BACKGROUND JOBS (MVP)</span>
            <div style={{ marginTop: '10px' }}>
                <button
                    onClick={onShowOnboarding}
                    className="btn-minimal"
                    style={{ border: 'none', background: 'transparent', textDecoration: 'underline', padding: 0 }}
                >
                    How it Works?
                </button>
            </div>
        </div>
    </header>
);
