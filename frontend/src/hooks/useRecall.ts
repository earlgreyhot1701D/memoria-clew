import { useState, useCallback } from 'react';

export interface RecallMatch {
    archiveItemId: string;
    title: string;
    summary: string;
    url?: string;
    source: 'url' | 'manual' | 'hn' | 'github';
    tags: string[];
    matchReason: string;
    relevanceScore: number;
    sourceUrl?: string; // Original URL if valid
}

export function useRecall() {
    const [matches, setMatches] = useState<RecallMatch[]>([]);
    const [explanation, setExplanation] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [abortController, setAbortController] = useState<AbortController | null>(null);

    const recall = useCallback(async (
        tags: string[],
        description?: string,
        query?: string,
        userId?: string
    ) => {
        setLoading(true);
        setError(null);

        // Cancel previous request if still pending
        abortController?.abort();

        // Create new controller for this request
        const controller = new AbortController();
        setAbortController(controller);

        try {
            const headers: Record<string, string> = { 'Content-Type': 'application/json' };
            if (userId) headers['x-user-id'] = userId;

            const response = await fetch('/api/recall', {
                method: 'POST',
                headers,
                body: JSON.stringify({ tags, description, query }),
                signal: controller.signal
            });

            if (!response.ok) throw new Error('Recall failed');

            const responseData = await response.json();
            const { matches: newMatches, explanation: newExplanation } = responseData.data || {};
            setMatches(newMatches || []);
            setExplanation(newExplanation || '');
        } catch (err) {
            // Don't update state if request was aborted
            if (err instanceof DOMException && err.name === 'AbortError') {
                return;
            }
            setError(err instanceof Error ? err.message : 'Unknown error');
            setMatches([]);
        } finally {
            // Only set loading false if this is the active controller
            if (controller.signal.aborted) return;
            setLoading(false);
        }
    }, [abortController]);

    return {
        matches,
        explanation,
        loading,
        error,
        recall,
        clearRecall: () => {
            setMatches([]);
            setExplanation('');
            setError(null); // Fix: Reset error state
        }
    };
}
