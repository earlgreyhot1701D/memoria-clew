import { describe, it, expect, beforeAll } from '@jest/globals';
import { recallEngine, type RecallInput } from './recallEngine.js';

describe('Recall Engine (Shared Core)', () => {
    it('should find items matching current context', async () => {
        const input: RecallInput = {
            currentContext: ['react', 'typescript'],
            archiveItems: [
                {
                    id: '1',
                    title: 'React Hooks Guide',
                    source: 'blog.com',
                    tags: ['react', 'javascript'],
                },
                {
                    id: '2',
                    title: 'TypeScript Advanced Types',
                    source: 'docs.ts.org',
                    tags: ['typescript', 'types'],
                },
                {
                    id: '3',
                    title: 'Python ML',
                    source: 'medium.com',
                    tags: ['python', 'ml'],
                },
            ],
        };

        const result = await recallEngine(input);

        expect(result.matched_items.length).toBe(2);
        expect(result.total_matches).toBe(2);
        expect(result.matched_items[0].tags).toContain('react');
    });

    it('should rank by confidence (matching tags)', async () => {
        const input: RecallInput = {
            currentContext: ['react', 'typescript', 'nodejs'],
            archiveItems: [
                {
                    id: '1',
                    title: 'Full Stack App',
                    source: 'example.com',
                    tags: ['react', 'typescript', 'nodejs'],
                },
                {
                    id: '2',
                    title: 'React Only',
                    source: 'example.com',
                    tags: ['react'],
                },
            ],
        };

        const result = await recallEngine(input);

        // Full stack should rank higher (3 matching tags vs 1)
        expect(result.matched_items[0].id).toBe('1');
        expect(result.matched_items[0].confidence).toBeGreaterThan(
            result.matched_items[1].confidence
        );
    });

    it('should return empty results when no matches', async () => {
        const input: RecallInput = {
            currentContext: ['rust', 'webassembly'],
            archiveItems: [
                {
                    id: '1',
                    title: 'Python ML',
                    source: 'medium.com',
                    tags: ['python', 'ml'],
                },
            ],
        };

        const result = await recallEngine(input);

        expect(result.matched_items.length).toBe(0);
        expect(result.reasoning).toContain('No matching items');
    });

    it('should incorporate newItemTags in matching', async () => {
        const input: RecallInput = {
            currentContext: ['react'],
            newItemTags: ['typescript'],
            archiveItems: [
                { id: '1', title: 'TS Guide', tags: ['typescript'] },
            ],
        };
        const result = await recallEngine(input);
        expect(result.matched_items).toHaveLength(1);
    });

    it('should handle optional newItemTags', async () => {
        const input: RecallInput = {
            currentContext: ['react'],
            archiveItems: [{ id: '1', title: 'React', tags: ['react'] }],
            // newItemTags undefined
        };
        const result = await recallEngine(input);
        expect(result.matched_items).toHaveLength(1);
    });

    it('should handle empty context gracefully', async () => {
        const input: RecallInput = {
            currentContext: [],
            archiveItems: [{ id: '1', title: 'React', tags: ['react'] }],
        };
        const result = await recallEngine(input);
        expect(result.matched_items).toHaveLength(0);
    });
});
