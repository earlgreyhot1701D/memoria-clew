import { Tool } from '@leanmcp/core';
import { recallWithContext } from '../services/recallEngine.js';

export const memoriaRecallTool = new Tool({
    name: 'memoria_recall',
    description: 'Surface relevant research from Memoria Clew archive based on current project context',

    parameters: {
        userId: {
            type: 'string',
            description: 'User ID',
            required: true
        },
        projectTags: {
            type: 'array',
            description: 'Tags for current project (e.g., ["react", "typescript"])',
            required: true
        },
        projectDescription: {
            type: 'string',
            description: 'Brief description of what user is working on',
            required: false
        },
        query: {
            type: 'string',
            description: 'Specific question or search query',
            required: false
        }
    },

    handler: async (params: any) => {
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
    }
});

export default memoriaRecallTool;
