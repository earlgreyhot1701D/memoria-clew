import { jest } from '@jest/globals';
import 'dotenv/config';

// Mock DB and Logs to avoid side effects
jest.unstable_mockModule('./firestoreService.js', () => ({
    db: {
        collection: jest.fn(() => ({
            add: jest.fn().mockResolvedValue({ id: 'mock-id' }),
            orderBy: jest.fn(() => ({ limit: jest.fn(() => ({ get: jest.fn().mockResolvedValue({ docs: [] }) })) }))
        })),
    },
}));

jest.unstable_mockModule('./systemLogService.js', () => ({
    logEvent: jest.fn(),
}));

jest.unstable_mockModule('pino', () => ({
    pino: () => ({
        info: jest.fn((msg) => console.log('INFO:', msg)), // Print logs to see what's happening
        warn: jest.fn((msg) => console.warn('WARN:', msg)),
        error: jest.fn((msg) => console.error('ERROR:', msg)),
    }),
}));

// Do NOT mock @google/generative-ai
// We want the REAL implementation to run.

const { captureItem } = await import('./captureService.js');

describe('captureItem Live Verification', () => {
    // Increase timeout for real API call
    jest.setTimeout(30000);

    it('should generate a title using real Gemini API', async () => {
        if (!process.env.GEMINI_API_KEY) {
            console.warn('Skipping live test: GEMINI_API_KEY not found');
            return;
        }

        const input = "React is a JavaScript library for building user interfaces. It is maintained by Facebook and a community of individual developers and companies. React can be used as a base in the development of single-page or mobile applications. However, React is only concerned with state management and rendering that state to the DOM, so creating React applications usually requires the use of additional libraries for routing, as well as certain client-side functionality.";
        const userId = "test-user-live";

        console.log('Sending request to Gemini...');
        const result = await captureItem(userId, input);

        console.log('Result:', JSON.stringify(result, null, 2));

        // Verify title is NOT "Manual Capture" and matches expected length/format
        expect(result.title).not.toBe("Manual Capture");
        expect(result.title).toBeTruthy();
        expect(result.title.length).toBeGreaterThan(5);
        expect(result.detectedTools).toContain("React");
    });
});
