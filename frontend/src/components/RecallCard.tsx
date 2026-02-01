import React from 'react';
import { RecallMatch } from '../hooks/useRecall';

interface RecallCardProps {
    match: RecallMatch;
    onArchiveClick?: (id: string) => void;
}

export const RecallCard: React.FC<RecallCardProps> = ({ match, onArchiveClick }) => (
    <article
        className="card recall-card"
        style={{
            border: '1px solid #0056b3',
            background: '#f0f7ff',
            padding: '10px'
        }}
    >
        <div style={{ fontSize: '9px', color: '#0056b3', marginBottom: '6px', fontWeight: 'bold' }}>
            [RECALL MATCH - {(match.relevanceScore * 100).toFixed(0)}%]
        </div>

        <h3 className="mono" style={{
            fontSize: '12px',
            marginBottom: '6px'
        }}>
            {match.url ? (
                <a
                    href={match.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#0056b3', textDecoration: 'none' }}
                >
                    {(match.title || 'UNTITLED').toUpperCase()} ↗
                </a>
            ) : (
                (match.title || 'UNTITLED').toUpperCase()
            )}
        </h3>

        <div style={{ fontSize: '10px', color: '#0056b3', marginBottom: '4px' }}>
            WHY: {match.matchReason}
        </div>

        <p style={{
            fontSize: '10px',
            color: '#333',
            marginBottom: '8px'
        }}>
            {match.summary}
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {match.tags?.map((tag) => (
                <span
                    key={tag}
                    style={{
                        padding: '1px 4px',
                        background: '#e6f2ff',
                        color: '#0056b3',
                        fontSize: '8px',
                        border: '1px solid #b8daff',
                        borderRadius: '2px'
                    }}
                >
                    {tag}
                </span>
            ))}
        </div>

        <button
            onClick={() => onArchiveClick?.(match.archiveItemId)}
            style={{
                marginTop: '8px',
                padding: '3px 6px',
                fontSize: '8px',
                background: '#0056b3',
                color: 'white',
                border: '1px solid #0056b3',
                cursor: 'pointer'
            }}
        >
            VIEW IN ARCHIVE
        </button>
    </article>
);
