import { RateLimiterMemory, RateLimiterRes } from 'rate-limiter-flexible';
import { pino } from 'pino';

const logger = pino();

export const rateLimiterGemini = new RateLimiterMemory({
    points: 100,
    duration: 60,
});

export const rateLimiterGitHub = new RateLimiterMemory({
    points: 60,
    duration: 3600,
});

export const rateLimiterMCP = new RateLimiterMemory({
    points: 1000,
    duration: 60,
});

export const rateLimiterRecall = new RateLimiterMemory({
    points: 100,
    duration: 60,
});

export const rateLimiterCapture = new RateLimiterMemory({
    points: 20,
    duration: 60,
});

export async function checkRateLimit(
    limiterId: 'gemini' | 'github' | 'mcp' | 'recall' | 'capture',
    key: string
): Promise<{ allowed: boolean; remaining: number; resetSeconds: number }> {
    const limiter =
        limiterId === 'gemini' ? rateLimiterGemini :
            limiterId === 'github' ? rateLimiterGitHub :
                limiterId === 'mcp' ? rateLimiterMCP :
                    limiterId === 'capture' ? rateLimiterCapture :
                        rateLimiterRecall;


    try {
        const res: RateLimiterRes = await limiter.consume(key);
        logger.info({ limiterId, key, remaining: res.remainingPoints }, 'Rate limit OK');
        return {
            allowed: true,
            remaining: res.remainingPoints,
            resetSeconds: Math.ceil(res.msBeforeNext / 1000),
        };
    } catch (err: any) {
        logger.warn({ limiterId, key }, 'Rate limit exceeded');
        return {
            allowed: false,
            remaining: 0,
            resetSeconds: Math.ceil(err.msBeforeNext / 1000),
        };
    }
}
