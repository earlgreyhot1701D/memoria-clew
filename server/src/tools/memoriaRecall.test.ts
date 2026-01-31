import { memoriaRecallTool } from './memoriaRecall.js';
import { describe, it, expect } from '@jest/globals';

describe('MemoriaRecall Tool', () => {
    it('recalls items based on tags', async () => {
        const mockArchive = [
            { title: 'React Guide', tags: ['react', 'frontend'], source: 'web' },
            { title: 'Node Guide', tags: ['node', 'backend'], source: 'web' },
        ];

        const result = await memoriaRecallTool.execute({
            newItemTags: ['react'],
            currentContext: [],
            archiveItems: mockArchive,
        });

        expect(result.matched_items).toHaveLength(1);
        expect(result.matched_items[0].title).toBe('React Guide');
    });

    it('returns empty if no matches', async () => {
        const mockArchive = [
            { title: 'Node Guide', tags: ['node', 'backend'], source: 'web' },
        ];

        const result = await memoriaRecallTool.execute({
            newItemTags: ['react'],
            currentContext: [],
            archiveItems: mockArchive,
        });

        expect(result.matched_items).toHaveLength(0);
        expect(result.reasoning).toContain('No matching items');
    });
});
