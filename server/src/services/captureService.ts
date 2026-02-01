import axios from 'axios';
import * as cheerio from 'cheerio';
import { db } from './firestoreService.js';
import { logEvent } from './systemLogService.js';
import { pino } from 'pino';
import { summarizeContent } from './llmService.js';

const logger = pino();

export interface ArchiveItem {
    id: string; // Internal ID
    userId?: string; // Optional for generic archives (like seeded repos)
    title: string;
    url?: string;
    content?: string;
    summary: string;
    tags: string[];
    detectedTools: string[];
    source: 'manual' | 'extension' | 'url' | 'github' | 'hn'; // Added 'hn' to match RecallMatch
    timestamp: number;
    type: 'capture' | 'chat_log' | 'context';
    sourceUrl?: string; // Link to original source (URL or GitHub repo)
}

export async function getArchive(userId?: string, limit?: number): Promise<ArchiveItem[]> {
    let query: FirebaseFirestore.Query = db.collection('archive').orderBy('timestamp', 'desc');
    if (userId) {
        query = query.where('userId', '==', userId);
    }
    if (limit) {
        query = query.limit(limit);
    }
    const snapshot = await query.get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ArchiveItem));
}

// Fetch content from URL using axios + cheerio
async function fetchUrlContent(url: string): Promise<{ title: string, content: string }> {
    try {
        const { data } = await axios.get(url, {
            timeout: 10000,
            headers: { 'User-Agent': 'Memoria-Recall-Agent/1.0' }
        });
        const $ = cheerio.load(data);

        // Remove scripts, styles, etc.
        $('script, style, nav, footer, iframe, noscript').remove();

        const title = $('title').text().trim() || 'No Title';
        // Get text from body, collapse whitespace
        const content = $('body').text().replace(/\s+/g, ' ').trim().substring(0, 5000); // Limit to 5k chars

        return { title, content };
    } catch (err: any) {
        logger.error({ error: err.message }, 'URL Fetch failed');
        throw new Error(`Failed to fetch URL: ${err.message}`);
    }
}

export async function captureItem(userId: string, input: string): Promise<ArchiveItem> {
    const isUrl = /^(http|https):\/\/[^ "]+$/.test(input);

    let title = 'Manual Capture';
    let content = input;
    let source: ArchiveItem['source'] = 'manual';

    await logEvent(userId, 'capture', 'success', 'Capture started');

    if (isUrl) {
        source = 'url';
        try {
            await logEvent(userId, 'capture', 'success', `Fetching URL: ${input}`);
            const fetched = await fetchUrlContent(input);
            title = fetched.title;
            content = fetched.content;
            await logEvent(userId, 'capture', 'success', `EXTRACTING_CONTENT... (${content.length} chars)`);
        } catch (err: any) {
            await logEvent(userId, 'capture', 'failure', `URL Fetch failed: ${err.message}`);
            title = input;
            content = `Failed to fetch content from ${input}.`;
        }
    }

    // Summarize via Multi-LLM Service
    // Summarize via Multi-LLM Service
    let summaryData: {
        summary: string;
        tags: string[];
        detectedTools: string[];
        title?: string;
    } = {
        summary: content,
        tags: [],
        detectedTools: [],
        title: undefined
    };

    try {
        await logEvent(userId, 'capture', 'success', `SENDING_TO_LLM: ${content.substring(0, 50)}...`);
        summaryData = await summarizeContent(content, !!isUrl);
        await logEvent(userId, 'capture', 'success', `SUMMARY_CREATED`);
        await logEvent(userId, 'capture', 'success', `TAGS_EXTRACTED: ${JSON.stringify(summaryData.tags)}`);

        if (summaryData.detectedTools && summaryData.detectedTools.length > 0) {
            await logEvent(userId, 'capture', 'success', `TOOLS_DETECTED: ${JSON.stringify(summaryData.detectedTools)}`);
        }

        // Use generated title if manual capture and title exists
        if (!isUrl && summaryData.title) {
            title = summaryData.title;
        }
    } catch (err) {
        // Fallback handled inside llmService, but safe catch here too
    }

    const item: Omit<ArchiveItem, 'id'> = {
        userId,
        title,
        ...(isUrl ? { url: input } : { content }),
        summary: summaryData.summary,
        tags: summaryData.tags,
        detectedTools: summaryData.detectedTools,
        source,
        timestamp: Date.now(),
        type: 'capture',
        ...(isUrl ? { sourceUrl: input } : {})
    };

    // Use root collection 'archive' to match frontend useFirestore('archive')
    const ref = await db.collection('archive').add(item);
    await logEvent(userId, 'capture', 'success', `Stored item: ${title}`);

    return { id: ref.id, ...item };
}
