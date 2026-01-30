import { z } from 'zod';

export const CaptureItemSchema = z.object({
    url: z.string().url().optional(),
    snippet: z.string().min(10).max(5000).optional(),
}).refine(
    (data) => data.url || data.snippet,
    { message: 'Either URL or snippet required' }
);

export const RecallQuerySchema = z.object({
    newItemTags: z.array(z.string()).min(1),
    currentContext: z.array(z.string()).min(1),
});

export const ArchiveItemSchema = z.object({
    title: z.string(),
    summary: z.string(),
    tags: z.array(z.string()),
    source: z.string(),
    timestamp: z.number(),
    confidence: z.number().min(0).max(1),
});

export type CaptureItem = z.infer<typeof CaptureItemSchema>;
export type RecallQuery = z.infer<typeof RecallQuerySchema>;
export type ArchiveItem = z.infer<typeof ArchiveItemSchema>;
