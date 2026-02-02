import { pino } from 'pino';
import { ArchiveItem } from './captureService.js';

const logger = pino();

// Cache for archive items to avoid excessive Firestore reads
const archiveCache = new Map<string, {
    items: ArchiveItem[];
    expiry: number;
}>();

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getArchiveWithCache(userId: string): Promise<ArchiveItem[]> {
    const now = Date.now();
    const cached = archiveCache.get(userId);

    if (cached && cached.expiry > now) {
        logger.debug({ userId }, 'Recall: Using cached archive');
        return cached.items;
    }

    const { getArchive } = await import('./captureService.js');
    const items = await getArchive(userId, 100);

    archiveCache.set(userId, {
        items,
        expiry: now + CACHE_TTL
    });

    return items;
}

export function invalidateCache(userId: string) {
    if (archiveCache.has(userId)) {
        logger.info({ userId }, 'Invalidating recall cache');
        archiveCache.delete(userId);
    }
}

export interface RecallMatch {
    archiveItemId: string;
    title: string;
    summary: string;
    url?: string;
    source: 'url' | 'manual' | 'hn' | 'github' | 'extension';
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
    // FIX: Case-insensitive comparison
    const lowerContextTags = (Array.isArray(contextTags) ? contextTags : []).map(t => t.toLowerCase());

    const itemTags = archiveItem.tags || [];

    switch (matchType) {
        case 'tag':
            const matchingTags = itemTags.filter(t => lowerContextTags.includes(t.toLowerCase()));
            return `Matches ${matchingTags.length} tags: ${matchingTags.slice(0, 3).join(', ').toUpperCase()}`;
        case 'keyword':
            return `Contains keyword '${details}' in summary`;
        case 'tool':
            return `References detected tool: ${details}`;
        case 'hybrid':
        default:
            const matches = itemTags.filter(t => lowerContextTags.includes(t.toLowerCase()));
            return matches.length > 0
                ? `Matches tags: ${matches.join(', ')}`
                : 'Relevance inferred from context overlap';
    }
}

/**
 * Match archive items against current context
 */
export async function matchArchiveToContext(
    userId: string, // TODO: Reserved for future user-specific filtering/ranking logic
    currentContextTags: string[],
    archiveItems: ArchiveItem[],
    query?: string,
    currentProjectDescription?: string
): Promise<RecallMatch[]> {
    const matches: RecallMatch[] = [];
    const lowerContextTags = (Array.isArray(currentContextTags) ? currentContextTags : []).map(t => t.toLowerCase());
    const lowerQuery = query?.toLowerCase() || '';
    const lowerDesc = currentProjectDescription?.toLowerCase() || '';

    // FIX: Single pass loop (removed accidental nested loop)
    for (const item of archiveItems) {
        let score = 0;
        let reasons: string[] = [];
        let matchType: 'tag' | 'keyword' | 'tool' | 'hybrid' = 'hybrid';

        const itemTags = (item.tags || []).map(t => t.toLowerCase());
        const itemTools = (item.detectedTools || []).map(t => t.toLowerCase());
        const itemContent = ((item.summary || '') + (item.title || '')).toLowerCase();

        // 1. Tag Overlap (High Weight)
        // Safety check for context tags
        const safeContextTags = Array.isArray(lowerContextTags) ? lowerContextTags : [];
        const intersectingTags = itemTags.filter(tag => safeContextTags.includes(tag));
        if (intersectingTags.length > 0) {
            // Jaccard-ish score: intersection / union
            const union = new Set([...itemTags, ...safeContextTags]).size;
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
        if (lowerDesc) {
            const descWords = lowerDesc.split(' ').filter(w => w.length > 4); // Filter small words
            const foundWords = descWords.filter(w => itemContent.includes(w));
            if (foundWords.length > 0) {
                score += 0.1 * Math.min(foundWords.length, 3); // Max 0.3 bonus
                matchType = 'hybrid';
            }
        }

        // 4. Tool Match (High Signal)
        const toolMatches = itemTools.filter(t => safeContextTags.includes(t));
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

        // Strict threshold for "Recall" mode matches
        if (score > 0.1) {
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
    } // End of SINGLE O(n) loop

    // Sort matches by relevance
    matches.sort((a, b) => b.relevanceScore - a.relevanceScore);

    // Fallback / Intelligence Stream Surfacing:
    // If we have fewer than 5 matches, pad with recent interesting items.
    if (matches.length < 5) {
        const existingIds = new Set(matches.map(m => m.archiveItemId));
        // Sort archive by recency
        const recentItems = [...archiveItems].sort((a, b) => b.timestamp - a.timestamp);

        for (const item of recentItems) {
            if (matches.length >= 5) break;
            if (existingIds.has(item.id)) continue;

            matches.push({
                archiveItemId: item.id,
                title: item.title,
                summary: item.summary,
                url: item.url,
                source: item.source,
                tags: item.tags || [],
                matchReason: "Surfaced from recent archive stream", // Distinct reason
                relevanceScore: 0.05, // Low score for differentiation
                sourceUrl: item.url
            });
        }
    }

    return matches.slice(0, 50);
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

    // Allow injecting fetcher for testing, else use cached fetcher
    let items: ArchiveItem[] = [];
    if (archiveFetcher) {
        items = await archiveFetcher(userId);
    } else {
        items = await getArchiveWithCache(userId);
    }

    logger.info({
        tags: currentProjectTags,
        query,
        archiveCount: items.length
    }, 'Recall with Context started');

    // Sanitize and validate query
    const safeQuery = query?.trim();
    if (safeQuery && safeQuery.length > 100) {
        logger.warn({ queryLength: safeQuery.length }, 'Query too long, trimming');
    }
    const finalQuery = safeQuery?.substring(0, 100);

    const matches = await matchArchiveToContext(
        userId,
        currentProjectTags,
        items,
        finalQuery,
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

