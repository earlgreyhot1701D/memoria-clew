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
        // Step 2: Rank by confidence (Weighted Scoring)
        // Weights: Tag Match (60%), Recency (30%), Source (10%)
        const ranked = matched
            .map((item) => {
                const itemTags = item.tags || [];
                const matchingTags = itemTags.filter((tag: string) =>
                    [...currentContext, ...newItemTags].includes(tag)
                );

                // 1. Tag Score (0.0 - 1.0)
                // If item matches all context tags, score is 1. If 1/2, score 0.5.
                // We normalize by the *input context size* to penalize "loose" matches? 
                // No, Jaccard is better: Intersection / Union.
                const uniqueItemTags = new Set(itemTags);
                const uniqueContextTags = new Set([...currentContext, ...newItemTags]);
                const union = new Set([...uniqueItemTags, ...uniqueContextTags]);
                const jaccardScore = matchingTags.length / union.size;

                // 2. Recency Score (0.0 - 1.0)
                // Decay over 30 days. 
                const daysAgo = (Date.now() - item.timestamp) / (1000 * 60 * 60 * 24);
                const recencyScore = Math.max(0, 1 - (daysAgo / 30));

                // 3. Source Score (0.0 - 1.0)
                // Manual captures are high signal.
                const sourceScore = item.source === 'manual' ? 1.0 : 0.5;

                // Composite Score
                const weightedScore = (jaccardScore * 0.6) + (recencyScore * 0.3) + (sourceScore * 0.1);

                return {
                    ...item,
                    confidence: weightedScore,
                    rawScore: { jaccardScore, recencyScore, sourceScore }, // Debug
                    reason: `Matched ${matchingTags.length} tag(s): ${matchingTags.join(', ')}`,
                };
            })
            .sort((a, b) => b.confidence - a.confidence)
            .slice(0, 5); // Top 5 strict

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
