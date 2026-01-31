import { Tool } from '@leanmcp/core';
import { pino } from 'pino';
import { recallEngine, type RecallInput, type RecallOutput } from '../services/recallEngine.js';

const logger = pino();

export class MemoriaRecallTool {
    @Tool({
        description: 'Recall relevant items from archive based on current context',
        inputClass: class RecallInputSchema {
            // Note: LeanMCP infers schema from TS types or inputClass.
            // For now, we rely on args type matching RecallInput interface
            // or we could define a concrete class if validation is required by library.
            // Using loose typing for now as per user instruction pattern.
        }
    })
    async execute(input: RecallInput): Promise<RecallOutput> {
        logger.info({ input }, 'MCP: memoria_recall invoked');

        try {
            // Call shared engine
            const result = await recallEngine(input);
            logger.info({ result_count: result.matched_items.length }, 'MCP: recall complete');
            return result;
        } catch (err: any) {
            logger.error({ error: err.message }, 'MCP: recall failed');
            throw new Error(`Recall failed: ${err.message}`);
        }
    }
}

// Export factory or instance
export const memoriaRecallTool = new MemoriaRecallTool();
