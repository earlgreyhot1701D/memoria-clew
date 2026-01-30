import React, { useEffect, useRef } from 'react';
import { LogEntry } from '../types/memoria';

interface SystemLogProps {
    entries: LogEntry[];
}

export const SystemLog: React.FC<SystemLogProps> = ({ entries }) => {
    const logRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (logRef.current) {
            logRef.current.scrollTop = logRef.current.scrollHeight;
        }
    }, [entries]);

    return (
        <aside aria-label="System log">
            <h2 className="mono" style={{ fontSize: '12px', marginBottom: '15px' }}>
                ACTIVE_LOG
            </h2>
            <div
                ref={logRef}
                className="system-log mono"
                role="region"
                style={{
                    fontSize: '11px',
                    color: '#555',
                    lineHeight: '1.8',
                    background: '#f9f9f9',
                    padding: '15px',
                    border: '1px inset #eee',
                    maxHeight: '360px',
                    overflow: 'auto',
                }}
            >
                {entries.map((entry, idx) => (
                    <div key={idx}>
                        &gt; {entry.action}
                        {entry.details && `: ${entry.details}`}
                        <br />
                    </div>
                ))}
                <div>&gt; _</div>
            </div>
        </aside>
    );
};
