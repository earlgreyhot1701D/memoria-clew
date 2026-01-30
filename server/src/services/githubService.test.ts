import { jest } from '@jest/globals';

// Mocks
const mockAxios = {
    get: jest.fn(),
};

const mockFirestore = {
    doc: jest.fn(() => ({
        get: jest.fn(),
        set: jest.fn(),
    })),
    collection: jest.fn(() => ({
        doc: mockFirestore.doc,
    })),
};

const mockDb = {
    collection: mockFirestore.collection,
};

// Mock modules
jest.unstable_mockModule('axios', () => ({
    default: mockAxios,
}));

jest.unstable_mockModule('./firestoreService.js', () => ({
    db: mockDb,
}));

describe('GitHub Service', () => {
    let seedGitHubContext: any;
    let getGitHubContext: any;

    beforeAll(async () => {
        const module = await import('./githubService.js');
        seedGitHubContext = module.seedGitHubContext;
        getGitHubContext = module.getGitHubContext;
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should seed GitHub context successfully', async () => {
        // Mock DB cache miss
        (mockFirestore.doc as any).mockReturnValue({
            get: jest.fn().mockResolvedValue({ exists: false }),
            set: jest.fn(),
        });

        // Mock GitHub Repos response
        mockAxios.get.mockResolvedValueOnce({
            data: [
                {
                    id: 1,
                    name: 'repo1',
                    owner: { login: 'user' },
                    html_url: 'http://github.com/user/repo1',
                    description: 'test repo',
                },
            ],
        });

        // Mock GitHub README response
        mockAxios.get.mockResolvedValueOnce({
            data: 'This is a TypeScript and React project.',
        });

        const result = await seedGitHubContext('token', 'user');

        expect(result.repos).toBe("1");
        expect(result.tags).toContain('typescript');
        expect(result.tags).toContain('react');

        // Verify DB writes
        expect(mockDb.collection).toHaveBeenCalledWith('memoria');
    });

    it('should return cached context if available', async () => {
        // Mock DB cache hit
        (mockFirestore.doc as any).mockReturnValue({
            get: jest.fn().mockResolvedValue({
                exists: true,
                data: () => ({
                    timestamp: Date.now(),
                    repos: [{ id: 1 }],
                    allTags: ['cached-tag'],
                }),
            }),
        });

        const result = await seedGitHubContext('token', 'user');
        expect(result.reason).toContain('Served from 24h cache');
        expect(result.tags).toBe('cached-tag');
        expect(mockAxios.get).not.toHaveBeenCalled();
    });

    it('should get cached context', async () => {
        (mockFirestore.doc as any).mockReturnValue({
            get: jest.fn().mockResolvedValue({
                exists: true,
                data: () => ({ some: 'data' }),
            }),
        });

        const data = await getGitHubContext('user');
        expect(data).toEqual({ some: 'data' });
    });
});

