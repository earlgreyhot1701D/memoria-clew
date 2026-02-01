import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import * as patternService from './patternAnalysisService.js';
import * as captureService from './captureService.js';

// Mock captureService
jest.unstable_mockModule('./captureService.js', () => ({
    getArchive: jest.fn()
}));

// Mock axios for LLM calls
jest.unstable_mockModule('axios', () => ({
    default: {
        post: jest.fn()
    }
}));

// Dynamic imports for testing
const getService = async () => import('./patternAnalysisService.js');
const getCaptureService = async () => import('./captureService.js');
const getAxios = async () => import('axios');

describe('patternAnalysisService', () => {
    let service: any;
    let captureMock: any;
    let axiosMock: any;

    beforeEach(async () => {
        jest.clearAllMocks();
        service = await getService();
        captureMock = await getCaptureService();
        axiosMock = await getAxios();
    });

    it('should handle empty archive gracefully', async () => {
        captureMock.getArchive.mockResolvedValue([]);

        const analysis = await service.analyzeResearchPatterns('user-1');

        expect(analysis).toHaveProperty('themes');
        expect(analysis).toHaveProperty('gaps');
        expect(analysis).toHaveProperty('recommendations');
        expect(analysis.gaps).toContain('Start capturing research to get pattern analysis');
    });

    it('should extract themes from archive items and call LLM', async () => {
        const mockItems = [
            {
                id: 'item-1',
                title: 'Docker Guide',
                tags: ['docker', 'containers'],
                detectedTools: ['kubernetes'],
                summary: 'Learn Docker',
                timestamp: Date.now()
            }
        ];

        captureMock.getArchive.mockResolvedValue(mockItems);

        // Mock Axios response for Anthropic/Gemini
        // We need to set API key in env for this to trigger
        process.env.ANTHROPIC_API_KEY = 'test-key';

        axiosMock.default.post.mockResolvedValue({
            data: {
                content: [{
                    text: JSON.stringify({
                        themes: ['docker'],
                        gaps: ['security'],
                        recommendations: ['learn k8s security'],
                        summary: 'Good progress'
                    })
                }]
            }
        });

        const analysis = await service.analyzeResearchPatterns('user-1');

        expect(analysis.themes).toContain('docker');
        expect(axiosMock.default.post).toHaveBeenCalled();
    });

    it('should fallback to extraction if LLM fails', async () => {
        const mockItems = [
            {
                id: 'item-1',
                title: 'Docker Guide',
                tags: ['docker'],
                detectedTools: [],
                summary: 'Learn Docker',
                timestamp: Date.now()
            }
        ];

        captureMock.getArchive.mockResolvedValue(mockItems);
        process.env.ANTHROPIC_API_KEY = 'test-key';

        // subtle: axios throws
        axiosMock.default.post.mockRejectedValue(new Error('API Down'));

        const analysis = await service.analyzeResearchPatterns('user-1');

        // Should return extracted themes
        expect(analysis.themes).toContain('docker');
        expect(analysis.summary).toContain('Pattern analysis failed');
    });
});
