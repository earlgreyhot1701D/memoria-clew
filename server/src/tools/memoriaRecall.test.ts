import { memoriaRecall } from './memoriaRecall.js';

describe('MemoriaRecall Tool', () => {
    it('recalls items based on tags', async () => {
        const mockArchive = [
            { title: 'React Guide', tags: ['react', 'frontend'], source: 'web' },
            { title: 'Node Guide', tags: ['node', 'backend'], source: 'web' },
        ];

        // @ts-ignore
        const result = await memoriaRecall({
            newItemTags: ['react'],
            currentContext: [],
            archive: mockArchive,
        });

        expect(result.matched_items).toHaveLength(1);
        expect(result.matched_items[0].title).toBe('React Guide');
    });

    it('returns empty if no matches', async () => {
        const mockArchive = [
            { title: 'Node Guide', tags: ['node', 'backend'], source: 'web' },
        ];

        // @ts-ignore
        const result = await memoriaRecall({
            newItemTags: ['react'],
            currentContext: [],
            archive: mockArchive,
        });

        expect(result.matched_items).toHaveLength(0);
        expect(result.reasoning).toContain('No matching items');
    });
});
