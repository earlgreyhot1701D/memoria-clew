import React from 'react';

interface HeaderProps {
    contextStatus: 'ok' | 'error';
    scanReady: boolean;
}

export const Header: React.FC<HeaderProps> = ({ contextStatus, scanReady }) => (
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
        </div>
        <div className="mono" style={{ fontSize: '11px', textAlign: 'right' }}>
            LOCAL_FIRST: ON<br />
            <span style={{ color: '#ff0033' }}>NO BACKGROUND JOBS (MVP)</span>
        </div>
    </header>
);
