import { CaptureItemSchema, RecallQuerySchema } from './validation.js';

describe('Backend Validation Schemas', () => {
    it('validates correct capture item', () => {
        const valid = { url: 'https://test.com' };
        expect(CaptureItemSchema.safeParse(valid).success).toBe(true);
    });

    it('requires either url or snippet', () => {
        const invalid = {};
        expect(CaptureItemSchema.safeParse(invalid).success).toBe(false);
    });

    it('validates recall query', () => {
        const valid = { newItemTags: ['react'], currentContext: ['typescript'] };
        expect(RecallQuerySchema.safeParse(valid).success).toBe(true);
    });
});
