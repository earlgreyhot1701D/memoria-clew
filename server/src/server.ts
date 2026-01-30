import express from 'express';
// @ts-ignore
import { MCPServer, createHTTPServer } from './lib/leanmcp.js';
import { setupSecurityMiddleware } from './middleware/securityMiddleware.js';
import { memoriaRecall } from './tools/memoriaRecall.js';
import { pino } from 'pino';
import { seedGitHubContext, getGitHubContext } from './services/githubService.js';
import { checkRateLimit } from './services/rateLimitService.js';
import 'dotenv/config';

const logger = pino();

const app = express();
setupSecurityMiddleware(app);

app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

// GitHub Context Seeding Endpoint
app.post('/api/context/sync', async (req, res) => {
    try {
        const githubToken = process.env.GITHUB_TOKEN!;
        const githubUsername = process.env.GITHUB_USERNAME!;

        const rateLimit = await checkRateLimit('github', githubUsername);
        if (!rateLimit.allowed) {
            return res.status(429).json({
                error: 'Rate limit exceeded',
                resetSeconds: rateLimit.resetSeconds,
            });
        }

        const result = await seedGitHubContext(githubToken, githubUsername);
        res.json({
            success: true,
            data: result,
            message: 'GitHub context seeded successfully',
        });
    } catch (err: any) {
        logger.error({ error: err.message }, 'Context sync failed');
        res.status(500).json({
            error: 'Failed to sync GitHub context',
            details: err.message,
        });
    }
});

// Get Cached GitHub Context
app.get('/api/context', async (req, res) => {
    try {
        const githubUsername = process.env.GITHUB_USERNAME!;
        const context = await getGitHubContext(githubUsername);

        if (!context) {
            return res.status(404).json({
                error: 'No cached context found',
                message: 'Run /api/context/sync first',
            });
        }

        res.json({
            success: true,
            data: context,
        });
    } catch (err: any) {
        logger.error({ error: err.message }, 'Get context failed');
        res.status(500).json({
            error: 'Failed to retrieve context',
            details: err.message,
        });
    }
});

const mcpServer = new MCPServer({
    name: 'memoria-mcp',
    version: '1.0.0',
});

// @ts-ignore
mcpServer.tool('memoria_recall', memoriaRecall);

// @ts-ignore
await createHTTPServer(() => mcpServer.getServer(), {
    port: parseInt(process.env.MCP_PORT || '3001'),
});

logger.info(
    { port: process.env.MCP_PORT || 3001 },
    '✓ Memoria MCP server running'
);
