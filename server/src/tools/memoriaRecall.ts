import { Tool } from '../lib/leanmcp.js';
import pino from 'pino';

const logger = pino();

export interface RecallInput {
    newItemTags: string[];
    currentContext: string[];
    archive: any[];
}

export interface RecallOutput {
    matched_items: Array<{
        title: string;
        source: string;
        confidence: number;
        reason: string;
    }>;
    reasoning: string;
}

@Tool("Recall relevant items from archive")
export class MemoriaRecallTool {
    async run(input: RecallInput): Promise<RecallOutput> {
        logger.info({ input }, 'Recall requested');

        const { newItemTags, currentContext, archive } = input;

        const matched = archive.filter((item) =>
            item.tags.some((tag: string) => newItemTags.includes(tag))
        );

        const reasoning = matched.length > 0
            ? `Found ${matched.length} items matching tags: ${newItemTags.join(', ')}`
            : 'No matching items in archive';

        logger.info({ reasoning, count: matched.length }, 'Recall complete');

        return {
            matched_items: matched.map((item) => ({
                title: item.title,
                source: item.source,
                confidence: 0.9,
                reason: `Tag match: ${newItemTags.join(', ')}`,
            })),
            reasoning,
        };
    }
}

export const memoriaRecall = new MemoriaRecallTool().run;
