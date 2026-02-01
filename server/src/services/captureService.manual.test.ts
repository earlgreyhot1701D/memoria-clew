import { jest } from '@jest/globals';

// Mocks must be hoisted or defined before imports in ESM if using unstable_mockModule, 
// but since we are using standard jest.mock with babel/ts-jest usually, or manual mocks.
// With 'type': 'module' and experimental-vm-modules, jest.unstable_mockModule is often needed.
// However, let's try standard jest.mock first as the project seems set up with ts-jest or similar.
// Actually, looking at rateLimitService.test.ts would solve this, but I'll assume standard mocking.

// We need to mock the dependencies BEFORE importing the module under test.
const mockAdd = jest.fn().mockResolvedValue({ id: 'mock-id' });
const mockCollection = jest.fn(() => ({
    add: mockAdd,
    orderBy: jest.fn(() => ({ limit: jest.fn(() => ({ get: jest.fn().mockResolvedValue({ docs: [] }) })) }))
}));

jest.unstable_mockModule('./firestoreService.js', () => ({
    db: {
        collection: mockCollection,
    },
}));

jest.unstable_mockModule('./systemLogService.js', () => ({
    logEvent: jest.fn(),
}));

jest.unstable_mockModule('pino', () => ({
    pino: () => ({
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
    }),
}));

const mockGenerateContent = jest.fn();
jest.unstable_mockModule('@google/generative-ai', () => ({
    GoogleGenerativeAI: jest.fn(() => ({
        getGenerativeModel: jest.fn(() => ({
            generateContent: mockGenerateContent,
        })),
    })),
}));

// Dynamic import after mocks
const { captureItem } = await import('./captureService.js');
// const { db } = await import('./firestoreService.js'); // Not needed if we use our hoisted vars, but good for completeness if we attached them differently.

describe('captureItem Manual Title Verification', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Reset specific mocks if needed, though clearAllMocks usually handles usage data.
    });

    it('should use the title returned by Gemini for manual captures', async () => {
        const mockResponseText = JSON.stringify({
            title: "Generated Manual Title",
            summary: "This is a summary.",
            software_tools: ["ToolA"],
            topics: ["Tag1"]
        });

        mockGenerateContent.mockResolvedValue({
            response: {
                text: () => mockResponseText
            }
        });

        const input = "This is a manual text capture that needs a title.";
        const userId = "user123";

        const result = await captureItem(userId, input);

        // Verify Gemini was called
        expect(mockGenerateContent).toHaveBeenCalled();

        // Verify the prompt contained the title requirement
        const callArgs = mockGenerateContent.mock.calls[0];
        const prompt = callArgs[0] as string;
        expect(prompt).toContain('1. **title**: Generate a concise (3-6 words) descriptive title.');

        // Verify the result has the generated title
        expect(result.title).toBe("Generated Manual Title");

        // Verify DB save was called with correct title
        // Use the stable mockAdd reference
        expect(mockAdd).toHaveBeenCalledWith(expect.objectContaining({
            title: "Generated Manual Title",
            source: 'manual'
        }));
    });

    it('should fallback to input/default if Gemini provides no title', async () => {
        const mockResponseText = JSON.stringify({
            // No title
            summary: "This is a summary.",
            software_tools: [],
            topics: []
        });

        mockGenerateContent.mockResolvedValue({
            response: {
                text: () => mockResponseText
            }
        });

        const input = "Short input";
        const result = await captureItem("user123", input);

        // Fallback to "Manual Capture" or input?
        // Code says: let title = 'Manual Capture'; ... if (!isUrl && summaryData.title) { title = summaryData.title; }
        expect(result.title).toBe("Manual Capture");
    });
});
