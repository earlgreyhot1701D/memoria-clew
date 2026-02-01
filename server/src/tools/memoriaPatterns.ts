import { Tool } from '@leanmcp/core';
import { analyzeResearchPatterns, PatternAnalysis } from '../services/patternAnalysisService.js';

interface MemoriaPatternsParams {
    userId: string;
}

export class MemoriaPatternsService {
    @Tool({
        description: 'Analyze research patterns from Memoria Clew archive and get learning recommendations'
    })
    async memoria_patterns(params: MemoriaPatternsParams): Promise<PatternAnalysis> {
        return analyzeResearchPatterns(params.userId);
    }
}

/**
 * Shared handler for testing and API access
 */
export const patternsHandler = async (params: MemoriaPatternsParams): Promise<PatternAnalysis> => {
    return analyzeResearchPatterns(params.userId);
};

export const MemoriaPatternsToolInstance = new MemoriaPatternsService();
export default MemoriaPatternsToolInstance;
