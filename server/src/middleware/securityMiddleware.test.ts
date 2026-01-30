import express, { Express } from 'express';
import request from 'supertest';
import { setupSecurityMiddleware } from './securityMiddleware.js';

describe('securityMiddleware', () => {
    let app: Express;

    beforeEach(() => {
        app = express();
    });

    it('should setup security middleware without throwing', () => {
        expect(() => setupSecurityMiddleware(app)).not.toThrow();
    });

    it('should add middleware to express app', () => {
        setupSecurityMiddleware(app);
        expect(app._router).toBeDefined();
    });

    it('should accept POST requests (CORS enabled)', async () => {
        setupSecurityMiddleware(app);

        app.post('/test', (req, res) => {
            res.status(200).json({ success: true });
        });

        const res = await request(app).post('/test');
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    it('should parse JSON bodies', async () => {
        setupSecurityMiddleware(app);

        app.post('/test', (req, res) => {
            res.json(req.body);
        });

        const res = await request(app)
            .post('/test')
            .send({ name: 'test' })
            .set('Content-Type', 'application/json');

        expect(res.status).toBe(200);
        expect(res.body.name).toBe('test');
    });
});
