import express from 'express';
// @ts-ignore
import { MCPServer, createHTTPServer } from './lib/leanmcp.js';
import { setupSecurityMiddleware } from './middleware/securityMiddleware.js';
import { memoriaRecall } from './tools/memoriaRecall.js';
import { pino } from 'pino';
import 'dotenv/config';

const logger = pino();

const app = express();
setupSecurityMiddleware(app);

app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
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
