import { describe, it, expect, jest, beforeAll } from '@jest/globals';

describe('memoriaRecallTool', () => {
    let recallHandler: any;

    beforeAll(async () => {
        // unstable_mockModule must be called before import
        jest.unstable_mockModule('../services/recallEngine.js', () => ({
            recallWithContext: jest.fn().mockResolvedValue({
                matches: [],
                explanation: 'Mock Explanation',
                timestamp: 123
            })
        }));

        // Dynamic import after mocking
        const module = await import('./memoriaRecall.js');
        recallHandler = module.recallHandler;
    });

    it('sanity check', () => {
        expect(true).toBe(true);
    });

    it('handler executes logic with mock', async () => {
        const result = await recallHandler({
            userId: 'u',
            projectTags: ['t'],
            query: 'q'
        });
        expect(result.explanation).toBe('Mock Explanation');
    });
});
