import { pino } from 'pino';
import { ArchiveItem } from './captureService.js';

const logger = pino();

export interface RecallMatch {
    archiveItemId: string;
    title: string;
    summary: string;
    url?: string;
    source: 'url' | 'manual' | 'hn';
    tags: string[];
    matchReason: string;
    relevanceScore: number;
    sourceUrl?: string; // Original URL if source is 'url'
}

/**
 * Generate human-readable reasoning for why an item matched
 */
export function generateReason(
    contextTags: string[],
    archiveItem: ArchiveItem,
    matchType: 'tag' | 'keyword' | 'tool' | 'hybrid',
    details?: string
): string {
    const itemTags = archiveItem.tags || [];

    switch (matchType) {
        case 'tag':
            const matchingTags = itemTags.filter(t => contextTags.includes(t));
            return `Matches ${matchingTags.length} tags: ${matchingTags.slice(0, 3).join(', ').toUpperCase()}`;
        case 'keyword':
            return `Contains keyword '${details}' in summary`;
        case 'tool':
            return `References detected tool: ${details}`;
        case 'hybrid':
        default:
            const matches = itemTags.filter(t => contextTags.includes(t));
            return matches.length > 0
                ? `Matches tags: ${matches.join(', ')}`
                : 'Relevance inferred from context overlap';
    }
}

/**
 * Match archive items against current context
 */
export async function matchArchiveToContext(
    userId: string,
    currentContextTags: string[],
    archiveItems: ArchiveItem[],
    query?: string,
    currentProjectDescription?: string
): Promise<RecallMatch[]> {
    const matches: RecallMatch[] = [];
    const lowerContextTags = currentContextTags.map(t => t.toLowerCase());
    const lowerQuery = query?.toLowerCase() || '';
    const lowerDesc = currentProjectDescription?.toLowerCase() || '';

    for (const item of archiveItems) {
        let score = 0;
        let reasons: string[] = [];
        let matchType: 'tag' | 'keyword' | 'tool' | 'hybrid' = 'hybrid';

        const itemTags = (item.tags || []).map(t => t.toLowerCase());
        const itemTools = (item.detectedTools || []).map(t => t.toLowerCase());
        const itemContent = ((item.summary || '') + (item.title || '')).toLowerCase();

        // 1. Tag Overlap (High Weight)
        const intersectingTags = itemTags.filter(tag => lowerContextTags.includes(tag));
        if (intersectingTags.length > 0) {
            // Jaccard-ish score: intersection / union
            const union = new Set([...itemTags, ...lowerContextTags]).size;
            score += (intersectingTags.length / union) * 0.6; // 60% weight
            reasons.push(`Tags: ${intersectingTags.slice(0, 2).join(', ')}`);
            matchType = 'tag';
        }

        // 2. Query/Keyword Match (Medium Weight)
        if (lowerQuery && itemContent.includes(lowerQuery)) {
            score += 0.3;
            reasons.push(`Query match: "${query}"`);
            matchType = 'keyword';
        }

        // 3. Description Keyword Match (Low Weight)
        // Simple check if description words appear in item
        if (lowerDesc) {
            const descWords = lowerDesc.split(' ').filter(w => w.length > 4); // Filter small words
            const foundWords = descWords.filter(w => itemContent.includes(w));
            if (foundWords.length > 0) {
                score += 0.1 * Math.min(foundWords.length, 3); // Max 0.3 bonus
                matchType = 'hybrid';
            }
        }

        // 4. Tool Match (High Signal)
        // If context tags are tools that appear in detectedTools
        const toolMatches = itemTools.filter(t => lowerContextTags.includes(t));
        if (toolMatches.length > 0) {
            score += 0.2;
            reasons.push(`Tool: ${toolMatches[0]}`);
            matchType = 'tool';
        }

        // 5. Recency Boost
        const daysAgo = (Date.now() - item.timestamp) / (1000 * 60 * 60 * 24);
        if (daysAgo < 7) {
            score += 0.1; // Recent boost
        }

        if (score > 0.1) { // Threshold
            matches.push({
                archiveItemId: item.id,
                title: item.title,
                summary: item.summary,
                url: item.url, // Original source URL
                source: item.source,
                tags: item.tags || [],
                matchReason: generateReason(currentContextTags, item, matchType, reasons.join(', ')),
                relevanceScore: Math.min(score, 1.0),
                sourceUrl: item.url
            });
        }
    }

    return matches.sort((a, b) => b.relevanceScore - a.relevanceScore).slice(0, 10);
}

/**
 * Main Entry Point: Recall with Context
 */
export async function recallWithContext(
    userId: string,
    currentProjectTags: string[],
    currentProjectDescription?: string,
    query?: string,
    archiveFetcher?: (userId: string) => Promise<ArchiveItem[]>
): Promise<{
    matches: RecallMatch[];
    explanation: string;
    timestamp: number;
}> {

    // Allow injecting fetcher for testing, else dynamic import to avoid circular dependency issues if any
    let items: ArchiveItem[] = [];
    if (archiveFetcher) {
        items = await archiveFetcher(userId);
    } else {
        // Dynamic import to break circular dependency if Archive uses Recall or vice versa, 
        // though strictly they shouldn't. safely importing here.
        const { getArchive } = await import('./captureService.js');
        items = await getArchive(userId, 100); // Fetch top 100 recent to scan
    }

    logger.info({
        tags: currentProjectTags,
        query,
        archiveCount: items.length
    }, 'Recall with Context started');

    const matches = await matchArchiveToContext(
        userId,
        currentProjectTags,
        items,
        query,
        currentProjectDescription
    );

    const explanation = matches.length > 0
        ? `Found ${matches.length} relevant items based on ${currentProjectTags.join(', ')} ${query ? `and query "${query}"` : ''}.`
        : 'No relevant items found in archive for this context.';

    return {
        matches,
        explanation,
        timestamp: Date.now()
    };
}

// Re-export old interface if needed for backwards compat, or remove if fully migrating
// For now, keeping the file clean.

