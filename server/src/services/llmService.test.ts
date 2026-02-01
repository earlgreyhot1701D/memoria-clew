import { describe, it, expect, beforeEach, afterAll, jest } from '@jest/globals';

// Define mock factory
const mockPost = jest.fn();

// Mock axios using unstable_mockModule for ESM
jest.unstable_mockModule('axios', () => ({
    default: {
        post: mockPost
    }
}));

// Dynamic import helper
const getService = async () => {
    return import('./llmService.js');
};

describe('llmService', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        jest.clearAllMocks();
        process.env = { ...originalEnv };
        delete process.env.ANTHROPIC_API_KEY;
        delete process.env.GEMINI_API_KEY;
    });

    afterAll(() => {
        process.env = originalEnv;
    });

    it('should use Claude when ANTHROPIC_API_KEY is present', async () => {
        const { summarizeContent } = await getService();
        process.env.ANTHROPIC_API_KEY = 'test-claude-key';

        mockPost.mockResolvedValueOnce({
            data: {
                content: [{
                    text: JSON.stringify({
                        title: 'Claude Title',
                        summary: 'Claude Summary',
                        topics: ['ai', 'claude'],
                        software_tools: ['tool1']
                    })
                }]
            }
        });

        const result = await summarizeContent('test content', true);

        expect(mockPost).toHaveBeenCalledWith(
            expect.stringContaining('api.anthropic.com'),
            expect.any(Object),
            expect.any(Object)
        );
        expect(result.title).toBe('Claude Title');
        expect(result.tags).toContain('claude');
    });

    it('should fall back to Gemini when ANTHROPIC_API_KEY is missing but GEMINI_API_KEY is present', async () => {
        const { summarizeContent } = await getService();
        process.env.GEMINI_API_KEY = 'test-gemini-key';

        mockPost.mockResolvedValueOnce({
            data: {
                candidates: [{
                    content: {
                        parts: [{
                            text: JSON.stringify({
                                title: 'Gemini Title',
                                summary: 'Gemini Summary',
                                topics: ['ai', 'gemini'],
                                software_tools: ['tool2']
                            })
                        }]
                    }
                }]
            }
        });

        const result = await summarizeContent('test content', true);

        expect(mockPost).toHaveBeenCalledWith(
            expect.stringContaining('generativelanguage.googleapis.com'),
            expect.any(Object)
        );
        expect(result.title).toBe('Gemini Title');
        expect(result.tags).toContain('gemini');
    });

    it('should fall back to manual capture when NO API keys are present', async () => {
        const { summarizeContent } = await getService();
        // Ensure keys are deleted
        delete process.env.ANTHROPIC_API_KEY;
        delete process.env.GEMINI_API_KEY;

        const result = await summarizeContent('test content', true);

        expect(mockPost).not.toHaveBeenCalled();
        expect(result.summary).toContain('captured (No API Configured)');
        expect(result.tags).toContain('manual');
    });

    it('should handle API errors gracefully (fallback)', async () => {
        const { summarizeContent } = await getService();
        process.env.ANTHROPIC_API_KEY = 'test-claude-key';
        mockPost.mockRejectedValueOnce(new Error('API Error'));

        const result = await summarizeContent('test content', true);

        expect(result.summary).toContain('Claude Error: API Error');
        expect(result.tags).toContain('manual');
    });
});
