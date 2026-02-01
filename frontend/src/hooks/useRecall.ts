import { useState, useCallback } from 'react';

export interface RecallMatch {
    archiveItemId: string;
    title: string;
    summary: string;
    url?: string;
    matchReason: string;
    relevanceScore: number;
    tags: string[];
}

export function useRecall() {
    const [matches, setMatches] = useState<RecallMatch[]>([]);
    const [explanation, setExplanation] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const recall = useCallback(async (
        tags: string[],
        description?: string,
        query?: string
    ) => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/recall', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tags, description, query })
            });

            if (!response.ok) throw new Error('Recall failed');

            const data = await response.json();
            setMatches(data.matches || []);
            setExplanation(data.explanation || '');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
            setMatches([]);
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        matches,
        explanation,
        loading,
        error,
        recall,
        clearRecall: () => {
            setMatches([]);
            setExplanation('');
        }
    };
}
