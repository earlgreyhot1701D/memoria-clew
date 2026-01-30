import React from 'react';
import { RecallCard as RecallCardType } from '../types/memoria';

interface RecallCardProps {
    item: RecallCardType;
    onUseful: (id: string) => void;
    onNotRelevant: (id: string) => void;
    onDismiss: (id: string) => void;
}

export const RecallCard: React.FC<RecallCardProps> = ({
    item,
    onUseful,
    onNotRelevant,
    onDismiss,
}) => (
    <section className="recall-card" aria-label="Recalled item from memory">
        <div className="mono" style={{ fontSize: '10px', color: '#ff0033' }}>
            RECALLED_FROM_MEMORIA // {item.daysAgo} DAYS AGO
        </div>
        <h3 className="mono" style={{ margin: '10px 0', fontSize: '16px' }}>
            {item.title}
        </h3>
        <p style={{ fontSize: '13px', color: '#333' }}>
            This matches technologies detected in your projects (<b>{item.matchedTag}</b>).
        </p>
        <div className="tag match-alert mono">CONTEXT_MATCH: {item.matchedTag.toUpperCase()}</div>
        <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
            <button
                className="btn-minimal mono"
                onClick={() => onUseful(item.id)}
            >
                USEFUL
            </button>
            <button
                className="btn-minimal mono"
                onClick={() => onNotRelevant(item.id)}
            >
                NOT_RELEVANT
            </button>
            <button
                className="btn-minimal mono"
                onClick={() => onDismiss(item.id)}
            >
                DISMISS
            </button>
        </div>
        <p className="mono" style={{ fontSize: '10px', color: '#555', marginTop: '10px' }}>
            CONFIDENCE: {(item.confidence * 100).toFixed(0)}%
        </p>
    </section>
);
