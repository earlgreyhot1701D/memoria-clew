import axios from 'axios';
import * as cheerio from 'cheerio';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { db } from './firestoreService.js';
import { logEvent } from './systemLogService.js';
import { pino } from 'pino';

const logger = pino();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export interface ArchiveItem {
    id: string;
    title: string;
    url?: string;
    content?: string;
    summary: string;
    tags: string[];
    source: 'url' | 'manual' | 'hn';
    timestamp: number;
    type: 'capture' | 'recall_result';
}

async function fetchUrlContent(url: string): Promise<{ title: string; content: string }> {
    try {
        const response = await axios.get(url, {
            timeout: 10000,
            headers: {
                'User-Agent': 'MemoriaClew/1.0 (ResearchTool)',
            },
        });

        const $ = cheerio.load(response.data);

        // Remove script, style, and interface elements
        $('script, style, nav, footer, header, noscript').remove();

        const title = $('title').text().trim() || url;

        // simple text extraction
        let text = '';
        $('h1, h2, h3, p, li').each((_, el) => {
            text += $(el).text().trim() + '\n';
        });

        // cleaner whitespace
        text = text.replace(/\s+/g, ' ').trim();

        return { title, content: text.slice(0, 3000) }; // Limit to 3000 chars for API
    } catch (err: any) {
        logger.warn({ url, error: err.message }, 'Failed to fetch URL content');
        throw new Error(`Failed to fetch URL: ${err.message}`);
    }
}

async function summarizeWithGemini(content: string, isUrl: boolean): Promise<{ summary: string; tags: string[] }> {
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        const prompt = `Analyze the following content (which may be a raw text snippet or extracted web page text) and:
1. Write a concise 1-2 sentence summary.
2. Extract 3-5 relevant technical or topic tags (lowercase).

Content:
${content}

Respond STRICTLY in JSON format:
{
  "summary": "...",
  "tags": ["tag1", "tag2", ...]
}`;

        const result = await model.generateContent(prompt);
        const text = result.response.text();

        const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();

        return JSON.parse(cleanText);
    } catch (err: any) {
        logger.error({ error: err.message }, 'Gemini summarization failed');
        // Fallback
        return {
            summary: isUrl ? 'Content captured (Summarization unavailable)' : content.slice(0, 100) + '...',
            tags: ['capture', 'manual'],
        };
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

    // Summarize
    let summaryData = { summary: content, tags: [] as string[] };
    try {
        summaryData = await summarizeWithGemini(content, !!isUrl);
        await logEvent(userId, 'capture', 'success', `SUMMARY_CREATED (model: gemini-2.5-flash)`);
        await logEvent(userId, 'capture', 'success', `TAGS_EXTRACTED: ${JSON.stringify(summaryData.tags)}`);
    } catch (err) {
        // Fallback handled
    }

    const item: Omit<ArchiveItem, 'id'> = {
        title,
        ...(isUrl ? { url: input } : { content }),
        summary: summaryData.summary,
        tags: summaryData.tags,
        source,
        timestamp: Date.now(),
        type: 'capture',
        // userId: userId - add if we want to filter later, but for MVP keep it simple
    };

    // Use root collection 'archive' to match frontend useFirestore('archive')
    const ref = await db.collection('archive').add(item);

    await logEvent(userId, 'capture', 'success', `Stored item: ${title}`);

    return { id: ref.id, ...item };
}

export async function getArchive(userId: string, limit: number = 50): Promise<ArchiveItem[]> {
    // For MVP, if we move to root, we just get them all. 
    const ref = db.collection('archive');
    const snapshot = await ref.orderBy('timestamp', 'desc').limit(limit).get();

    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    } as ArchiveItem));
}
