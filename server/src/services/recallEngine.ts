import { pino } from 'pino';
import { db } from './firestoreService.js';

const logger = pino();

export interface RecallInput {
    currentContext: string[];     // Tags from current project context
    archiveItems: any[];          // Items to search against
    newItemTags?: string[];       // Optional: tags of new item being captured
}

export interface RecallOutput {
    matched_items: Array<{
        id: string;
        title: string;
        source: string;
        tags: string[];
        confidence: number;
        reason: string;
    }>;
    reasoning: string;
    total_matches: number;
}

/**
 * Core recall algorithm - used by both REST and MCP
 */
export async function recallEngine(input: RecallInput): Promise<RecallOutput> {
    logger.info({
        context: input.currentContext,
        archiveSize: input.archiveItems?.length || 0
    }, 'Recall engine invoked');

    const { currentContext = [], archiveItems = [], newItemTags = [] } = input;

    try {
        // Step 1: Find tag intersections
        const matched = archiveItems.filter((item) => {
            const itemTags = item.tags || [];
            const hasTagMatch = itemTags.some((tag: string) =>
                [...currentContext, ...newItemTags].includes(tag)
            );
            return hasTagMatch;
        });

        // Step 2: Rank by confidence (# of matching tags)
        const ranked = matched
            .map((item) => {
                const matchingTags = (item.tags || []).filter((tag: string) =>
                    [...currentContext, ...newItemTags].includes(tag)
                );
                const confidence = Math.min(matchingTags.length / currentContext.length, 1.0);
                return {
                    ...item,
                    confidence,
                    reason: `Matched ${matchingTags.length} tag(s): ${matchingTags.join(', ')}`,
                };
            })
            .sort((a, b) => b.confidence - a.confidence)
            .slice(0, 10); // Top 10

        // Step 3: Build reasoning
        const reasoning = matched.length > 0
            ? `Found ${matched.length} items matching context: ${currentContext.join(', ')}`
            : 'No matching items in archive';

        logger.info({
            input_context: currentContext,
            total_matches: matched.length,
            top_results: ranked.length,
            reasoning,
        }, 'Recall engine complete');

        return {
            matched_items: ranked.map((item) => ({
                id: item.id || '',
                title: item.title || 'Untitled',
                source: item.source || 'unknown',
                tags: item.tags || [],
                confidence: item.confidence,
                reason: item.reason,
            })),
            reasoning,
            total_matches: matched.length,
        };
    } catch (err: any) {
        logger.error({ error: err.message }, 'Recall engine failed');
        throw err;
    }
}
