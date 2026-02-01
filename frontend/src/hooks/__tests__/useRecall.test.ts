import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useRecall } from '../useRecall';

// Use a dedicated mock function variable
const mockFetch = vi.fn();

describe('useRecall', () => {
    const originalFetch = global.fetch;

    beforeEach(() => {
        global.fetch = mockFetch;
        mockFetch.mockClear();
    });

    afterEach(() => {
        global.fetch = originalFetch;
    });

    it('returns initial empty state', () => {
        const { result } = renderHook(() => useRecall());

        expect(result.current.matches).toEqual([]);
        expect(result.current.explanation).toBe('');
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBeNull();
    });

    it('recalls with tags and description', async () => {
        const mockResponse = {
            matches: [
                {
                    archiveItemId: '1',
                    title: 'Test',
                    summary: 'Test summary',
                    matchReason: 'Tag match',
                    relevanceScore: 0.9,
                    tags: ['react']
                }
            ],
            explanation: 'Found 1 match'
        };

        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockResponse
        });

        const { result } = renderHook(() => useRecall());

        await act(async () => {
            await result.current.recall(['react'], 'Building app', 'hooks');
        });

        await waitFor(() => {
            expect(result.current.matches).toHaveLength(1);
            expect(result.current.explanation).toBe('Found 1 match');
        });
    });

    it('handles errors gracefully', async () => {
        mockFetch.mockRejectedValueOnce(new Error('Network error'));

        const { result } = renderHook(() => useRecall());

        await act(async () => {
            await result.current.recall(['react']);
        });

        expect(result.current.error).toBeDefined();
        expect(result.current.matches).toEqual([]);
    });
});
