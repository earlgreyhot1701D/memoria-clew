import { describe, it, expect } from 'vitest';
import { validateCaptureInput } from '../../utils/validation';

describe('Validation Utils', () => {
    it('validates a correct URL', () => {
        const result = validateCaptureInput('https://google.com');
        expect(result.success).toBe(true);
        expect(result.type).toBe('url');
    });

    it('validates a snippet', () => {
        const result = validateCaptureInput('This is a long enough snippet for testing.');
        expect(result.success).toBe(true);
        expect(result.type).toBe('snippet');
    });

    it('rejects short snippets', () => {
        const result = validateCaptureInput('short');
        expect(result.success).toBe(false);
    });
});
