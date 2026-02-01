import { describe, it, expect, beforeEach, afterAll, jest } from '@jest/globals';

// Mocks
const mockAxiosGet = jest.fn();
jest.unstable_mockModule('axios', () => ({
    default: {
        get: mockAxiosGet
    }
}));

const mockAdd = jest.fn().mockResolvedValue({ id: 'new-id' });
const mockGet = jest.fn();
jest.unstable_mockModule('./firestoreService.js', () => ({
    db: {
        collection: jest.fn(() => ({
            add: mockAdd,
            orderBy: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            get: mockGet,
            where: jest.fn().mockReturnThis(),
            doc: jest.fn().mockReturnThis(),
        })),
    },
}));

const mockSummarizeContent = jest.fn();
jest.unstable_mockModule('./llmService.js', () => ({
    summarizeContent: mockSummarizeContent
}));

jest.unstable_mockModule('./systemLogService.js', () => ({
    logEvent: jest.fn(),
}));

jest.unstable_mockModule('pino', () => ({
    pino: () => ({
        info: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
    }),
}));

// Dynamic import
const getService = async () => {
    return import('./captureService.js');
};

describe('captureService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockSummarizeContent.mockResolvedValue({
            summary: 'Mock Summary',
            tags: ['mock-tag'],
            detectedTools: [],
            title: 'Mock Title'
        });
    });

    it('should capture a generic text item', async () => {
        const { captureItem } = await getService();

        const result = await captureItem('user-1', 'Test idea');

        expect(result.summary).toBe('Mock Summary');
        // Ensure db.collection was called
        const { db } = await import('./firestoreService.js');
        expect(db.collection).toHaveBeenCalledWith('archive');
        expect(mockAdd).toHaveBeenCalled();
    });

    it('should fetch archive items', async () => {
        const { getArchive } = await getService();
        const mockData = { id: '1', title: 'Test', timestamp: 1000 };
        mockGet.mockResolvedValue({
            docs: [{ id: '1', data: () => mockData }],
        });

        const items = await getArchive('user-1');

        expect(items).toHaveLength(1);
        expect(items[0].title).toBe('Test');
    });

    it('should handle URL capture', async () => {
        const { captureItem } = await getService();
        const url = 'http://example.com';

        mockAxiosGet.mockResolvedValue({
            data: '<html><title>Example Page</title><body>Content of page</body></html>'
        });

        await captureItem('user-1', url);

        expect(mockAxiosGet).toHaveBeenCalledWith(url, expect.any(Object));
        expect(mockSummarizeContent).toHaveBeenCalledWith(expect.stringContaining('Content of page'), true);
    });
});
