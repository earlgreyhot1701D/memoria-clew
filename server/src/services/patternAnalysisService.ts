import { pino } from 'pino';
import axios from 'axios';
import { ArchiveItem } from './captureService.js';
import { getArchive } from './captureService.js';

const logger = pino();

export interface PatternAnalysis {
    themes: string[];
    gaps: string[];
    recommendations: string[];
    summary: string;
}

/**
 * Analyze research patterns across all user's archive items.
 * Identifies themes, learning gaps, and recommendations.
 * NO SIDE EFFECTS - read-only operation.
 */
export async function analyzeResearchPatterns(userId: string): Promise<PatternAnalysis> {
    let items: ArchiveItem[] = [];
    try {
        // Fetch all archive items (non-destructive read)
        items = await getArchive(userId, 1000);

        if (items.length === 0) {
            logger.warn({ userId }, 'No archive items to analyze');
            return {
                themes: [],
                gaps: ['Start capturing research to get pattern analysis'],
                recommendations: ['Begin with a technology or problem area you want to learn'],
                summary: 'Archive is empty. Capture some research to unlock pattern analysis.'
            };
        }

        // Build rich context from items
        const itemSummary = items
            .map((item: ArchiveItem) => {
                const tags = (item.tags || []).join(', ');
                const tools = (item.detectedTools || []).join(', ');
                return `Title: ${item.title}\nTags: ${tags}\nTools: ${tools}\nSummary: ${item.summary}`;
            })
            .join('\n---\n');

        // Call LLM to reason about patterns
        const prompt = `You are an expert technical mentor analyzing someone's research history.

Here are their captured research items:

${itemSummary}

Analyze and respond ONLY in this JSON format:
{
  "themes": ["theme1", "theme2", "theme3"],
  "gaps": ["gap1", "gap2"],
  "recommendations": ["recommendation1", "recommendation2"],
  "summary": "1-2 sentence summary of their learning trajectory"
}

RULES:
- Themes: What are the 3-5 main areas they're researching?
- Gaps: What complementary skills/areas are they NOT researching?
- Recommendations: What should they learn NEXT based on patterns?
- Be specific. Reference actual technologies/patterns from their history.
- Do NOT hallucinate. Only use what's in the data.`;

        logger.debug({ userId, itemCount: items.length }, 'Analyzing patterns');

        const result = await callLLM(prompt);

        logger.info({ userId, themes: result.themes.length }, 'Pattern analysis complete');
        return result;

    } catch (err: any) {
        logger.error({ error: err.message, userId }, 'Pattern analysis failed');
        // Fallback
        return {
            themes: extractThemes(items),
            gaps: [],
            recommendations: [],
            summary: 'Pattern analysis failed, showing basic themes.'
        };
    }
}

/**
 * Internal LLM call to bypass strict summarization logic in llmService
 */
async function callLLM(prompt: string): Promise<PatternAnalysis> {
    // Priority 1: Claude
    if (process.env.ANTHROPIC_API_KEY) {
        try {
            const response = await axios.post('https://api.anthropic.com/v1/messages', {
                model: "claude-3-haiku-20240307",
                max_tokens: 1024,
                messages: [{ role: "user", content: prompt }]
            }, {
                headers: {
                    'x-api-key': process.env.ANTHROPIC_API_KEY,
                    'anthropic-version': '2023-06-01',
                    'content-type': 'application/json'
                }
            });
            const text = response.data.content[0].text;
            return parseJSON(text);
        } catch (e) {
            logger.error({ error: e }, 'Claude pattern analysis failed');
        }
    }

    // Priority 2: Gemini
    if (process.env.GEMINI_API_KEY) {
        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${process.env.GEMINI_API_KEY}`;
            const response = await axios.post(url, {
                contents: [{ parts: [{ text: prompt }] }]
            });
            const text = response.data.candidates[0].content.parts[0].text;
            return parseJSON(text);
        } catch (e) {
            logger.error({ error: e }, 'Gemini pattern analysis failed');
        }
    }

    throw new Error('No LLM available for pattern analysis');
}

function parseJSON(text: string): PatternAnalysis {
    try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        const jsonStr = jsonMatch ? jsonMatch[0] : text;
        const parsed = JSON.parse(jsonStr);
        return {
            themes: parsed.themes || [],
            gaps: parsed.gaps || [],
            recommendations: parsed.recommendations || [],
            summary: parsed.summary || ''
        };
    } catch (e) {
        return { themes: [], gaps: [], recommendations: [], summary: '' };
    }
}

/**
 * Fallback: Extract themes from archive items if LLM fails
 */
function extractThemes(items: ArchiveItem[]): string[] {
    const allTags = new Set<string>();
    items.forEach(item => {
        (item.tags || []).forEach(tag => allTags.add(tag));
        (item.detectedTools || []).forEach(tool => allTags.add(tool));
    });
    return Array.from(allTags).slice(0, 5);
}
