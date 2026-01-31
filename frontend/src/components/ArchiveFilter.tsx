import React from 'react';

interface ArchiveFilterProps {
    tags: string[];
    selectedTag: string | null;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    onTagSelect: (tag: string | null) => void;
}

export const ArchiveFilter: React.FC<ArchiveFilterProps> = ({
    tags,
    selectedTag,
    searchQuery,
    onSearchChange,
    onTagSelect
}) => {
    return (
        <div className="archive-filter" style={{ marginBottom: '20px' }}>
            {/* Search Input */}
            <input
                type="text"
                placeholder="SEARCH ARCHIVE..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="mono"
                style={{
                    width: '100%',
                    padding: '8px',
                    marginBottom: '10px',
                    border: '1px solid #333',
                    background: '#f5f5f5',
                    fontSize: '11px'
                }}
            />

            {/* Tag Cloud */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                <button
                    onClick={() => onTagSelect(null)}
                    className="mono"
                    style={{
                        padding: '2px 8px',
                        fontSize: '10px',
                        border: '1px solid #333',
                        background: selectedTag === null ? '#000' : 'transparent',
                        color: selectedTag === null ? '#fff' : '#000',
                        cursor: 'pointer'
                    }}
                >
                    ALL
                </button>
                {tags.map(tag => (
                    <button
                        key={tag}
                        onClick={() => onTagSelect(tag === selectedTag ? null : tag)}
                        className="mono"
                        style={{
                            padding: '2px 8px',
                            fontSize: '10px',
                            border: '1px solid #333',
                            background: selectedTag === tag ? '#000' : 'transparent',
                            color: selectedTag === tag ? '#fff' : '#000',
                            cursor: 'pointer'
                        }}
                    >
                        {tag.toUpperCase()}
                    </button>
                ))}
            </div>
        </div>
    );
};
