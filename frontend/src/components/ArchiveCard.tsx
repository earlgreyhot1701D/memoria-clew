import React from 'react';
import { ArchiveItem } from '../types/memoria';

interface ArchiveCardProps {
    item: ArchiveItem;
    onOpen?: (id: string) => void;
    onTagSelect?: (tag: string) => void;
}

export const ArchiveCard: React.FC<ArchiveCardProps> = ({ item, onTagSelect }) => (
    <article
        className="card"
        style={{ border: '1px solid #ddd' }}
        role="listitem"
    >
        <div className="mono" style={{ fontSize: '9px', marginBottom: '10px', color: '#ff0033' }}>
            [{item.type.toUpperCase()}]
        </div>
        <h3 className="mono" style={{ fontSize: '14px', display: 'flex', alignItems: 'center', gap: '5px' }}>
            {item.url ? (
                <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#000', textDecoration: 'none', borderBottom: '1px dotted #000' }}
                >
                    {item.title.toUpperCase()} ↗
                </a>
            ) : (
                item.title.toUpperCase()
            )}
        </h3>
        <div className="mono" style={{ fontSize: '9px', color: '#666', marginBottom: '5px' }}>
            {new Date(item.timestamp).toLocaleDateString()} • {item.source.toUpperCase()}
        </div>
        <p style={{ fontSize: '12px', color: '#555', marginTop: '5px' }}>
            {item.summary}
        </p>
        <div style={{ marginTop: '10px' }}>
            {item.tags?.map((tag) => (
                <span
                    key={tag}
                    className="tag"
                    style={{
                        display: 'inline-block',
                        padding: '2px 6px',
                        background: '#000',
                        color: '#fff',
                        fontSize: '9px',
                        marginRight: '5px',
                        borderRadius: '2px',
                    }}
                >
                    {tag}
                </span>
            ))}
        </div>
        {
            item.detectedTools && item.detectedTools.length > 0 && (
                <div style={{ marginTop: '10px', borderTop: '1px dotted #ccc', paddingTop: '8px' }}>
                    <div className="mono" style={{ fontSize: '9px', color: '#007bff', marginBottom: '4px' }}>
                        DETECTED_TOOLS:
                    </div>
                    {item.detectedTools.map((tool) => (
                        <button
                            key={tool}
                            onClick={(e) => {
                                e.stopPropagation();
                                onTagSelect?.(tool.toLowerCase());
                            }}
                            className="mono tool-pill"
                            style={{
                                display: 'inline-block',
                                padding: '2px 6px',
                                background: '#e6f2ff', // Very light blue
                                color: '#0056b3', // Darker blue for contrast
                                border: '1px solid #b8daff',
                                fontSize: '9px',
                                fontWeight: 'bold',
                                marginRight: '5px',
                                marginBottom: '4px',
                                borderRadius: '2px',
                                cursor: 'pointer',
                            }}
                        >
                            {tool}
                        </button>
                    ))}
                </div>
            )
        }
    </article >
);
