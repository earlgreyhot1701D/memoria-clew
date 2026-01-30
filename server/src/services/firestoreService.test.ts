import { jest } from '@jest/globals';

const mockFirestore = {
    collection: jest.fn(),
};

const mockAdmin = {
    credential: {
        cert: jest.fn(),
    },
    initializeApp: jest.fn(),
    firestore: jest.fn(() => mockFirestore),
};

jest.unstable_mockModule('firebase-admin', () => ({
    default: mockAdmin,
}));

describe('firestoreService', () => {
    let db: any;

    beforeAll(async () => {
        const module = await import('./firestoreService.js');
        db = module.db;
    });

    it('should initialize Firebase Admin SDK', () => {
        expect(mockAdmin.initializeApp).toHaveBeenCalled();
        expect(mockAdmin.credential.cert).toHaveBeenCalled();
    });

    it('should export Firestore database instance', () => {
        expect(db).toBeDefined();
        expect(db).toBe(mockFirestore);
    });

    it('should be able to reference collections', () => {
        db.collection('test');
        expect(mockFirestore.collection).toHaveBeenCalledWith('test');
    });
});
