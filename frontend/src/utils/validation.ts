import { z } from 'zod';

export const ValidUrlSchema = z.string().url();

export const ValidSnippetSchema = z.string().min(10, 'Snippet must be at least 10 characters');

export const validateCaptureInput = (input: string) => {
    const isUrl = ValidUrlSchema.safeParse(input).success;
    const isSnippet = ValidSnippetSchema.safeParse(input).success;

    if (!isUrl && !isSnippet) {
        return { success: false, error: 'Input must be a valid URL or a snippet > 10 chars' };
    }
    return { success: true, type: isUrl ? 'url' : 'snippet' };
};
