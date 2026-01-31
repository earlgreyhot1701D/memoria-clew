import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { captureItem, getArchive } from './captureService.js';
import { db } from './firestoreService.js';
import axios from 'axios';

// Mock dependencies
// Note: unstable_mockModule is needed for ESM in some Jest setups, 
// but let's try standard jest.mock first with full path if enabled.
// If this fails, we might need a manual __mocks__ folder or different config.
// But first, let's fix the imports.

jest.mock('axios');

jest.mock('./firestoreService.js', () => ({
    db: {
        collection: jest.fn(() => ({
            add: jest.fn(),
            orderBy: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            get: jest.fn(),
            doc: jest.fn().mockReturnThis(),
        })),
    },
}));

jest.mock('../services/systemLogService.js', () => ({
    logEvent: jest.fn(),
}));

describe('captureService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should capture a generic text item', async () => {
        const mockAdd = jest.fn().mockResolvedValue({ id: 'new-id' });
        // @ts-ignore
        (db.collection as any).mockReturnValue({ add: mockAdd });

        const result = await captureItem('user-1', 'Test idea');

        expect(result.summary).toContain('Test idea');
        expect(db.collection).toHaveBeenCalledWith('archive');
        expect(mockAdd).toHaveBeenCalled();
    });

    it('should fetch archive items', async () => {
        const mockData = { id: '1', title: 'Test' };
        const mockGet = jest.fn().mockResolvedValue({
            docs: [{ id: '1', data: () => mockData }],
        });

        const collectionMock = {
            orderBy: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            get: mockGet,
        };
        // @ts-ignore
        (db.collection as any).mockReturnValue(collectionMock);

        const items = await getArchive('user-1');
        expect(items).toHaveLength(1);
        expect(items[0].title).toBe('Test');
    });
});
