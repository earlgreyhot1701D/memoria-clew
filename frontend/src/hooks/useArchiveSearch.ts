import { useState, useMemo } from 'react';
import { ArchiveItem } from '../types/memoria';

export function useArchiveSearch(items: ArchiveItem[]) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTag, setSelectedTag] = useState<string | null>(null);

    const allTags = useMemo(() => {
        const tags = new Set<string>();
        items.forEach(item => {
            item.tags?.forEach(tag => tags.add(tag));
        });
        return Array.from(tags).sort();
    }, [items]);

    const filteredItems = useMemo(() => {
        console.log('useArchiveSearch: filtering...', { query: searchQuery, totalItems: items.length });
        const results = items.filter(item => {
            const matchesTag = selectedTag ? item.tags?.includes(selectedTag) : true;

            const query = searchQuery.toLowerCase();
            const matchesSearch = !searchQuery ||
                (item.title && item.title.toLowerCase().includes(query)) ||
                (item.summary && item.summary.toLowerCase().includes(query)) ||
                (item.content && item.content.toLowerCase().includes(query)) ||
                (item.detectedTools && item.detectedTools.some(tool => tool.toLowerCase().includes(query)));

            return matchesTag && matchesSearch;
        });
        console.log('useArchiveSearch: results found', results.length);
        return results;
    }, [items, selectedTag, searchQuery]);

    return {
        searchQuery,
        setSearchQuery,
        selectedTag,
        setSelectedTag,
        filteredItems,
        allTags
    };
}
