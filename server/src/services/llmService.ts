import axios from 'axios';
import { pino } from 'pino';

const logger = pino();

interface SummaryResult {
    summary: string;
    tags: string[];
    detectedTools: string[];
    title?: string;
}

export async function summarizeContent(content: string, isUrl: boolean): Promise<SummaryResult> {
    // Priority 1: Claude (Anthropic)
    if (process.env.ANTHROPIC_API_KEY) {
        console.log('Using LLM Provider: Anthropic (Claude)');
        logger.info('Using LLM Provider: Anthropic (Claude)');
        return summarizeWithClaude(content, isUrl);
    }

    // Priority 2: Gemini (Google)
    if (process.env.GEMINI_API_KEY) {
        console.log('Using LLM Provider: Google (Gemini)');
        logger.info('Using LLM Provider: Google (Gemini)');
        return summarizeWithGemini(content, isUrl);
    }

    console.log('No LLM API keys found.');
    logger.warn('No LLM API keys found. Falling back to manual capture.');
    return createFallback(content, isUrl, 'No API Configured');
}

async function summarizeWithClaude(content: string, isUrl: boolean): Promise<SummaryResult> {
    try {
        const apiKey = process.env.ANTHROPIC_API_KEY;
        const prompt = `You are an expert technical analyst. Extract structured data from the content below.

STRICT REQUIREMENTS:
1. **title**: Generate a concise (3-6 words) descriptive title. This is REQUIRED.
2. **software_tools**: List ALL software tools, libraries, or frameworks mentioned. Return [].
3. **topics**: Extract 3-5 high-level CONCEPT tags only.
4. **summary**: 1-2 sentence technical summary.

Content:
${content.slice(0, 10000)}

Respond STRICTLY in JSON matching this structure:
{
  "title": "...",
  "summary": "...",
  "software_tools": [],
  "topics": []
}`;

        const response = await axios.post('https://api.anthropic.com/v1/messages', {
            model: "claude-3-haiku-20240307",
            max_tokens: 1024,
            messages: [{ role: "user", content: prompt }]
        }, {
            headers: {
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
                'content-type': 'application/json'
            }
        });

        const text = response.data.content[0].text;
        logger.info({ rawClaude: text }, 'Claude Response');

        const parsed = parseJSON(text);
        return {
            title: parsed.title,
            summary: parsed.summary || 'No summary available.',
            tags: parsed.topics || [],
            detectedTools: parsed.software_tools || [],
        };
    } catch (err: any) {
        const errorMsg = err.response?.data?.error?.message || err.message;
        logger.error({ error: errorMsg }, 'Claude summarization failed');
        return createFallback(content, isUrl, `Claude Error: ${errorMsg}`);
    }
}

async function summarizeWithGemini(content: string, isUrl: boolean): Promise<SummaryResult> {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        // Using verified working model and endpoint from debugging session
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`;

        const prompt = `You are an expert technical analyst. Extract structured data from the content below.

STRICT REQUIREMENTS:
1. **title**: Generate a concise (3-6 words) descriptive title. This is REQUIRED.
2. **software_tools**: List ALL software tools, libraries, or frameworks mentioned. Return [].
3. **topics**: Extract 3-5 high-level CONCEPT tags only.
4. **summary**: 1-2 sentence technical summary.

Content:
${content.slice(0, 10000)}

Respond STRICTLY in JSON matching this structure:
{
  "title": "...",
  "summary": "...",
  "software_tools": [],
  "topics": []
}`;

        const response = await axios.post(url, {
            contents: [{ parts: [{ text: prompt }] }]
        });

        const text = response.data.candidates[0].content.parts[0].text;
        logger.info({ rawGemini: text }, 'Gemini Response');

        const parsed = parseJSON(text);
        return {
            title: parsed.title,
            summary: parsed.summary || 'No summary available.',
            tags: parsed.topics || [],
            detectedTools: parsed.software_tools || [],
        };
    } catch (err: any) {
        const errorMsg = err.response?.data?.error?.message || err.message;
        logger.error({ error: errorMsg }, 'Gemini summarization failed');
        return createFallback(content, isUrl, `Gemini Error: ${errorMsg}`);
    }
}

function parseJSON(text: string): any {
    try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) return JSON.parse(jsonMatch[0]);
        return JSON.parse(text);
    } catch (e) {
        // Simple cleanup fallback
        const clean = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(clean);
    }
}

function createFallback(content: string, isUrl: boolean, reason: string): SummaryResult {
    return {
        summary: isUrl ? `Content captured (${reason})` : content.slice(0, 100) + '...',
        tags: ['capture', 'manual'],
        detectedTools: [],
    };
}
