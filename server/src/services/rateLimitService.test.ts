import { checkRateLimit } from './rateLimitService.js';

describe('Rate Limit Service', () => {
    it('allows request within limits', async () => {
        const result = await checkRateLimit('gemini', 'test-key-1');
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBeLessThan(100);
    });
});
