import React, { useState, useEffect } from 'react';

interface PatternData {
    themes: string[];
    gaps: string[];
    recommendations: string[];
    summary: string;
}

interface PatternAnalysisViewProps {
    userId?: string;
    onClose: () => void;
}

export const PatternAnalysisView: React.FC<PatternAnalysisViewProps> = ({ userId, onClose }) => {
    const [data, setData] = useState<PatternData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const analyze = async () => {
            try {
                // Use x-user-id header as expected by the backend
                const headers: Record<string, string> = {};
                if (userId) {
                    headers['x-user-id'] = userId;
                }

                // Allow a mock ID if none provided (for dev/demo)
                if (!headers['x-user-id']) {
                    headers['x-user-id'] = 'demo-user';
                }

                const res = await fetch('/api/patterns', { headers });

                if (!res.ok) throw new Error('Analysis failed');

                const json = await res.json();
                setData(json.data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        analyze();
    }, [userId]);

    return (
        <div className="card" style={{
            marginTop: '20px',
            border: '2px solid #000',
            background: '#fff'
        }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '15px',
                borderBottom: '1px solid #eee',
                paddingBottom: '10px'
            }}>
                <h3 className="mono" style={{ margin: 0, fontSize: '14px' }}>DEEP_PATTERN_ANALYSIS_ENGINE</h3>
                <button
                    onClick={onClose}
                    className="btn-minimal mono"
                    style={{ color: '#666' }}
                >
                    CLOSE [X]
                </button>
            </div>

            {loading && (
                <div className="mono" style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                    ANALYZING_ARCHIVE_PATTERNS...
                </div>
            )}

            {error && (
                <div className="mono" style={{ padding: '20px', color: 'red' }}>
                    ERROR: {error}
                </div>
            )}

            {data && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>

                    {/* SUMMARY */}
                    <div style={{ gridColumn: '1 / -1', marginBottom: '10px' }}>
                        <div className="mono" style={{ fontSize: '10px', color: '#666', marginBottom: '5px' }}>
                            EXECUTIVE_SUMMARY
                        </div>
                        <p className="mono" style={{ fontSize: '12px', lineHeight: '1.4' }}>
                            {data.summary}
                        </p>
                    </div>

                    {/* THEMES */}
                    <div>
                        <div className="mono" style={{ fontSize: '10px', color: '#0056b3', marginBottom: '8px', fontWeight: 'bold' }}>
                            DETECTED_THEMES
                        </div>
                        {data.themes.length === 0 ? (
                            <div className="mono" style={{ fontSize: '11px', color: '#999' }}>None detected</div>
                        ) : (
                            <ul style={{ paddingLeft: '15px', margin: 0 }}>
                                {data.themes.map((t, i) => (
                                    <li key={i} className="mono" style={{ fontSize: '11px', marginBottom: '4px' }}>
                                        {t}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* GAPS */}
                    <div>
                        <div className="mono" style={{ fontSize: '10px', color: '#d63384', marginBottom: '8px', fontWeight: 'bold' }}>
                            KNOWLEDGE_GAPS
                        </div>
                        {data.gaps.length === 0 ? (
                            <div className="mono" style={{ fontSize: '11px', color: '#999' }}>None detected</div>
                        ) : (
                            <ul style={{ paddingLeft: '15px', margin: 0 }}>
                                {data.gaps.map((t, i) => (
                                    <li key={i} className="mono" style={{ fontSize: '11px', marginBottom: '4px' }}>
                                        {t}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* RECOMMENDATIONS */}
                    <div>
                        <div className="mono" style={{ fontSize: '10px', color: '#198754', marginBottom: '8px', fontWeight: 'bold' }}>
                            RECOMMENDED_NEXT_STEPS
                        </div>
                        {data.recommendations.length === 0 ? (
                            <div className="mono" style={{ fontSize: '11px', color: '#999' }}>None detected</div>
                        ) : (
                            <ul style={{ paddingLeft: '15px', margin: 0 }}>
                                {data.recommendations.map((t, i) => (
                                    <li key={i} className="mono" style={{ fontSize: '11px', marginBottom: '4px' }}>
                                        {t}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                </div>
            )}
        </div>
    );
};
