import React, { useEffect, useRef } from 'react';
import { LogEntry } from '../types/memoria';

interface SystemLogProps {
    entries: LogEntry[];
}

export const SystemLog: React.FC<SystemLogProps> = ({ entries }) => {
    const logRef = useRef<HTMLDivElement>(null);
    const [isHovered, setIsHovered] = React.useState(false);

    // Inverted Log: Auto-scroll to TOP when new entries arrive
    useEffect(() => {
        if (logRef.current && !isHovered) {
            logRef.current.scrollTop = 0;
        }
    }, [entries, isHovered]);

    const formatTime = (ts: string) => {
        try {
            const date = new Date(ts);
            return date.toLocaleTimeString('en-US', {
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
        } catch (e) {
            return '00:00:00';
        }
    };

    // Create a copy and reverse for display (Newest First)
    const displayEntries = [...entries].reverse();

    return (
        <aside aria-label="System log">
            <h2 className="mono" style={{ fontSize: '12px', marginBottom: '15px' }}>
                ACTIVE_LOG
            </h2>
            <div
                ref={logRef}
                className="system-log mono"
                role="region"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                style={{
                    fontSize: '11px',
                    color: '#555',
                    lineHeight: '1.8',
                    background: '#f9f9f9',
                    padding: '15px',
                    border: '1px inset #eee',
                    maxHeight: '360px',
                    overflow: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                {/* Cursor at TOP for Inverted Feed */}
                <div style={{ marginBottom: '8px' }}>
                    <span style={{ color: '#999', visibility: 'hidden' }}>[00:00:00]</span>
                    <span>&gt; _</span>
                </div>

                {displayEntries.map((entry, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '8px' }}>
                        <span style={{ color: '#999', flexShrink: 0 }}>
                            [{formatTime(entry.timestamp)}]
                        </span>
                        <span>
                            &gt; {entry.action}
                            {entry.details && `: ${entry.details}`}
                        </span>
                    </div>
                ))}
            </div>
        </aside>
    );
};
