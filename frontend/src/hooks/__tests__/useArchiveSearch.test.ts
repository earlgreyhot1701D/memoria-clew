import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useArchiveSearch } from '../useArchiveSearch';
import { ArchiveItem } from '../../types/memoria';

const mockItems: ArchiveItem[] = [
    {
        id: '1',
        title: 'React Hooks Guide',
        summary: 'Learn about useState and useEffect',
        tags: ['react', 'javascript'],
        type: 'article',
        source: 'manual',
        timestamp: 1000,
        confidence: 1,
        url: 'https://react.dev'
    },
    {
        id: '2',
        title: 'Python Data Science',
        summary: 'Pandas and NumPy basics',
        tags: ['python', 'data'],
        type: 'article',
        source: 'url',
        timestamp: 2000,
        confidence: 1
    },
    {
        id: '3',
        title: 'TypeScript Tips',
        summary: 'Advanced types and generics',
        tags: ['typescript', 'javascript'],
        type: 'article',
        source: 'manual',
        timestamp: 3000,
        confidence: 1
    }
];

describe('useArchiveSearch', () => {
    it('returns all items initially', () => {
        const { result } = renderHook(() => useArchiveSearch(mockItems));
        expect(result.current.filteredItems).toHaveLength(3);
    });

    it('extracts all unique tags', () => {
        const { result } = renderHook(() => useArchiveSearch(mockItems));
        expect(result.current.allTags).toEqual(['data', 'javascript', 'python', 'react', 'typescript']);
    });

    it('filters by keyword (title)', () => {
        const { result } = renderHook(() => useArchiveSearch(mockItems));
        act(() => {
            result.current.setSearchQuery('Python');
        });
        expect(result.current.filteredItems).toHaveLength(1);
        expect(result.current.filteredItems[0].title).toBe('Python Data Science');
    });

    it('filters by keyword (summary)', () => {
        const { result } = renderHook(() => useArchiveSearch(mockItems));
        act(() => {
            result.current.setSearchQuery('generics');
        });
        expect(result.current.filteredItems).toHaveLength(1);
        expect(result.current.filteredItems[0].title).toBe('TypeScript Tips');
    });

    it('filters by tag', () => {
        const { result } = renderHook(() => useArchiveSearch(mockItems));
        act(() => {
            result.current.setSelectedTag('javascript');
        });
        expect(result.current.filteredItems).toHaveLength(2); // React and TS items
    });

    it('filters by tag AND keyword', () => {
        const { result } = renderHook(() => useArchiveSearch(mockItems));
        act(() => {
            result.current.setSelectedTag('javascript');
            result.current.setSearchQuery('hooks');
        });
        expect(result.current.filteredItems).toHaveLength(1);
        expect(result.current.filteredItems[0].title).toBe('React Hooks Guide');
    });

    it('handles empty results', () => {
        const { result } = renderHook(() => useArchiveSearch(mockItems));
        act(() => {
            result.current.setSearchQuery('invalidsearchterm');
        });
        expect(result.current.filteredItems).toHaveLength(0);
    });
});
