import { Tool } from '@leanmcp/core';
import { recallWithContext } from '../services/recallEngine.js';

interface MemoriaRecallParams {
    userId: string;
    projectTags: string[];
    projectDescription?: string;
    query?: string;
}

export class MemoriaRecallService {
    @Tool({
        description: 'Surface relevant research from Memoria Clew archive based on current project context'
    })
    async memoria_recall(params: MemoriaRecallParams) {
        return recallHandler(params);
    }
}

/**
 * Shared handler logic, also used for testing and direct API access if needed.
 */
export const recallHandler = async (params: any) => {
    const result = await recallWithContext(
        params.userId,
        params.projectTags,
        params.projectDescription,
        params.query
    );

    return {
        success: true,
        matches: result.matches,
        explanation: result.explanation
    };
};

export const memoriaRecallTool = new MemoriaRecallService();
export default memoriaRecallTool;
