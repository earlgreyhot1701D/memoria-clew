import React from 'react';
import { ArchiveItem } from '../types/memoria';

interface ArchiveCardProps {
    item: ArchiveItem;
    onOpen?: (id: string) => void;
}

export const ArchiveCard: React.FC<ArchiveCardProps> = ({ item }) => (
    <article
        className="card"
        style={{ border: '1px solid #ddd' }}
        role="listitem"
    >
        <div className="mono" style={{ fontSize: '9px', marginBottom: '10px', color: '#ff0033' }}>
            [{item.type.toUpperCase()}]
        </div>
        <h3 className="mono" style={{ fontSize: '14px' }}>
            {item.title.toUpperCase()}
        </h3>
        <p style={{ fontSize: '12px', color: '#555', marginTop: '5px' }}>
            {item.summary}
        </p>
    </article>
);
