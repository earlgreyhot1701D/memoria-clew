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
    detectedTools?: string[];
    source: 'url' | 'manual' | 'hn';
    timestamp: number;
    type: 'capture' | 'recall_result' | 'doc' | 'docs';
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

async function summarizeWithGemini(content: string, isUrl: boolean): Promise<{ summary: string; tags: string[]; detectedTools: string[] }> {
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        const prompt = `You are an expert technical analyst. Extract structured data from the content below.

STRICT REQUIREMENTS:
1. **software_tools**: List ALL software, libraries, frameworks, APIs, or specific tools mentioned.
   - Return clean names (e.g. "React" not "React.js", "PostgreSQL" not "Postgres").
   - If NONE are found, return [].
2. **topics**: Extract 3-5 high-level CONCEPT tags only.
   - Do NOT repeat valid tools here. Use broad terms like "database", "devops", "frontend".
3. **summary**: 1-2 sentence technical summary.

Content:
${content}

Example Output:
{
  "summary": "Overview of using React with Firebase.",
  "software_tools": ["React", "Firebase"],
  "topics": ["frontend", "backend-as-a-service"]
}

Respond STRICTLY in JSON.`;

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        // Debug log
        logger.info({ rawGemini: text }, 'Gemini Response');

        const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanText);

        return {
            summary: parsed.summary || 'No summary available.',
            tags: parsed.topics || [],
            detectedTools: parsed.software_tools || [],
        };
    } catch (err: any) {
        logger.error({ error: err.message }, 'Gemini summarization failed');
        // Fallback
        return {
            summary: isUrl ? 'Content captured (Summarization unavailable)' : content.slice(0, 100) + '...',
            tags: ['capture', 'manual'],
            detectedTools: [],
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
    let summaryData = { summary: content, tags: [] as string[], detectedTools: [] as string[] };
    try {
        await logEvent(userId, 'capture', 'success', `SENDING_TO_GEMINI: ${content.substring(0, 50)}...`);
        summaryData = await summarizeWithGemini(content, !!isUrl);
        await logEvent(userId, 'capture', 'success', `SUMMARY_CREATED (model: gemini-2.5-flash)`);
        await logEvent(userId, 'capture', 'success', `TAGS_EXTRACTED: ${JSON.stringify(summaryData.tags)}`);

        if (summaryData.detectedTools && summaryData.detectedTools.length > 0) {
            await logEvent(userId, 'capture', 'success', `TOOLS_DETECTED: ${JSON.stringify(summaryData.detectedTools)}`);
        }
    } catch (err) {
        // Fallback handled
    }

    const item: Omit<ArchiveItem, 'id'> = {
        title,
        ...(isUrl ? { url: input } : { content }),
        summary: summaryData.summary,
        tags: summaryData.tags,
        detectedTools: summaryData.detectedTools,
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
        ...doc.data() as Omit<ArchiveItem, 'id'>
    }));
}

