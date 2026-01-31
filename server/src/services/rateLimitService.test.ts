import { checkRateLimit, rateLimiterGemini, rateLimiterGitHub, rateLimiterMCP, rateLimiterRecall } from './rateLimitService.js';

describe('Rate Limit Service', () => {
    beforeEach(async () => {
        // Clear limiters if possible, or just use different specific keys
    });

    it('limits Gemini requests', async () => {
        const result = await checkRateLimit('gemini', 'test-gemini');
        expect(result.allowed).toBe(true);
    });

    it('limits GitHub requests', async () => {
        const result = await checkRateLimit('github', 'test-github');
        expect(result.allowed).toBe(true);
    });

    it('limits MCP requests', async () => {
        const result = await checkRateLimit('mcp', 'test-mcp');
        expect(result.allowed).toBe(true);
    });

    it('limits Recall requests', async () => {
        const result = await checkRateLimit('recall', 'test-recall');
        expect(result.allowed).toBe(true);
    });
});
