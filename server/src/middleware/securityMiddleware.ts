import helmet from 'helmet';
import cors from 'cors';
import express, { Express, Request, Response, NextFunction } from 'express';
import pino from 'pino';

const logger = pino();

export function setupSecurityMiddleware(app: Express): void {
    app.use(helmet());

    app.use(cors({
        origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
        credentials: true,
    }));

    app.use(express.json({ limit: '1mb' }));

    app.use((req: Request, res: Response, next: NextFunction) => {
        logger.info({
            method: req.method,
            path: req.path,
            ip: req.ip,
        }, 'Incoming request');
        next();
    });
}
