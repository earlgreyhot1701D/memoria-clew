import { z } from 'zod';

export const ContextSchema = z.object({
    id: z.string(),
    repoName: z.string(),
    description: z.string(),
    tags: z.array(z.string()),
});
export type Context = z.infer<typeof ContextSchema>;

export const ArchiveItemSchema = z.object({
    id: z.string(),
    title: z.string(),
    summary: z.string(),
    tags: z.array(z.string()),
    type: z.enum(['tool', 'article', 'docs']),
    source: z.string(),
    timestamp: z.number(),
    confidence: z.number().min(0).max(1),
    url: z.string().optional(),
});
export type ArchiveItem = z.infer<typeof ArchiveItemSchema>;

export const RecallCardSchema = z.object({
    id: z.string(),
    title: z.string(),
    matchedTag: z.string(),
    reason: z.string(),
    confidence: z.number(),
    daysAgo: z.number(),
});
export type RecallCard = z.infer<typeof RecallCardSchema>;

export const LogEntrySchema = z.object({
    timestamp: z.string(),
    action: z.string(),
    details: z.string().optional(),
    status: z.enum(['success', 'error', 'info']).optional(),
});
export type LogEntry = z.infer<typeof LogEntrySchema>;
