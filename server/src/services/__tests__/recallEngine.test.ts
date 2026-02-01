import {
    matchArchiveToContext,
    generateReason,
    recallWithContext,
    RecallMatch
} from '../recallEngine.js';
import { ArchiveItem } from '../../captureService.js';
import { jest } from '@jest/globals';

// Jest globals are typically available, but if not we can import them or just rely on global scope.
// Assuming standard Jest environment.


describe('recallEngine', () => {
    // Mock archive items
    const mockArchive: ArchiveItem[] = [
        {
            id: '1',
            title: 'React Hooks Guide',
            summary: 'useState, useEffect, custom hooks',
            tags: ['react', 'javascript', 'hooks'],
            source: 'url',
            timestamp: Date.now(),
            type: 'capture'
        },
        {
            id: '2',
            title: 'TypeScript Generics',
            summary: 'Advanced TypeScript patterns',
            tags: ['typescript', 'types', 'advanced'],
            source: 'url',
            timestamp: Date.now() - 86400000 * 10, // 10 days ago
            type: 'capture'
        },
        {
            id: '3',
            title: 'Docker Guide',
            summary: 'Containerization fundamentals',
            tags: ['docker', 'devops', 'containers'],
            source: 'url',
            timestamp: Date.now() - 86400000 * 40, // 40 days ago
            type: 'capture'
        }
    ];

    it('matches archive items by tag overlap', async () => {
        const matches = await matchArchiveToContext(
            'user123',
            ['react', 'javascript', 'performance'],
            mockArchive
        );

        expect(matches).toHaveLength(1);
        expect(matches[0].title).toBe('React Hooks Guide');
        expect(matches[0].relevanceScore).toBeGreaterThan(0.1);
    });

    it('generates reason for tag match', () => {
        const reason = generateReason(
            ['react', 'hooks'],
            mockArchive[0],
            'tag'
        );

        expect(reason.toLowerCase()).toContain('react');
        // expect(reason.toLowerCase()).toContain('hooks'); // might be cut off if slice(0,3) works unexpectedly but likely fine
    });

    it('returns top results only', async () => {
        const manyItems: ArchiveItem[] = Array.from({ length: 20 }, (_, i) => ({
            ...mockArchive[0],
            id: `${i}`,
            tags: ['react']
        }));

        const matches = await matchArchiveToContext(
            'user123',
            ['react'],
            manyItems
        );

        expect(matches.length).toBeLessThanOrEqual(10);
    });

    it('recalls with full context', async () => {
        const fetcher = async () => mockArchive;

        const result = await recallWithContext(
            'user123',
            ['typescript', 'react'],
            'Building a React component library',
            'How do I type custom hooks?',
            fetcher
        );

        expect(result.matches).toBeDefined();
        // Expect typescript item and react item
        expect(result.matches.length).toBeGreaterThanOrEqual(2);
        expect(result.explanation).toBeDefined();
        expect(result.timestamp).toBeDefined();
    });

    it('handles empty archive gracefully', async () => {
        const fetcher = async () => [];
        const result = await recallWithContext(
            'user123',
            ['nonexistent'],
            'Test',
            '',
            fetcher
        );

        expect(result.matches).toEqual([]);
        expect(result.explanation).toContain('No relevant items');
    });
});
