import { describe, it, expect } from '@jest/globals';
import { matchArchiveToContext } from './recallEngine.js';
import { ArchiveItem } from './captureService.js';

describe('Recall Engine (matchArchiveToContext)', () => {
    const userId = 'test-user';

    it('should find items matching current context (Sanity Check)', async () => {
        const contextTags = ['react', 'typescript'];
        const archiveItems: ArchiveItem[] = [
            {
                id: '1',
                title: 'React Hooks Guide',
                summary: 'Guide to hooks',
                source: 'url',
                tags: ['react', 'javascript'],
                detectedTools: [],
                timestamp: Date.now() - 10000000000,
                type: 'capture',
                userId
            },
            {
                id: '3',
                title: 'Python ML',
                summary: 'ML guide',
                source: 'url',
                tags: ['python', 'ml'],
                detectedTools: [],
                timestamp: Date.now() - 10000000000,
                type: 'capture',
                userId
            },
        ];

        const matches = await matchArchiveToContext(userId, contextTags, archiveItems);

        // Ensure at least one match (React)
        expect(matches.length).toBeGreaterThan(0);
        const titles = matches.map(m => m.title);
        expect(titles).toContain('React Hooks Guide');
    });
});
