import { useState, useEffect, useCallback } from 'react';
import { RecallCard } from '../types/memoria';

interface RecallState {
    cards: RecallCard[];
    loading: boolean;
    error: string | null;
}

export function useRecall(contextTags: string[], latestCaptureId?: string) {
    const [state, setState] = useState<RecallState>({
        cards: [],
        loading: false,
        error: null
    });

    const fetchRecalls = useCallback(async () => {
        if (!contextTags || contextTags.length === 0) return;

        setState(prev => ({ ...prev, loading: true }));
        try {
            // We need to fetch the archive first to pass to the engine?
            // Actually, the SERVER endpoint should handle fetching the archive.
            // But wait, the server implementation of /api/recall calls recallEngine(req.body).
            // But req.body in server.ts expects { currentContext, archiveItems }.
            // 
            // Architecture Pivot: 
            // For MVP, the Backend `recallEngine` requires the archive passed in?
            // Let's check `recallEngine.ts`. Yes: `archiveItems: any[]`.
            //
            // If the Frontend calls `/api/recall`, does it need to upload the whole archive?
            // NO. That's inefficient.
            // 
            // The Server Endpoint `/api/recall` should fetch the archive itself if not provided!
            // But `server.ts` line 146 just passes `req.body`.
            //
            // FIX: We will modify this hook to Just send context. 
            // We assume the server will be updated to fetch archive if missing.
            // OR (Simpler for now):
            // We fetch archive in Frontend (we already have it in Dashboard!) and pass it.
            // This Keeps `/api/recall` purely computational (stateless).
            // This is "Leak-Proof" for privacy? No, sending data to server is same.
            //
            // Let's pass the archiveItems from Dashboard -> useRecall -> API.
            // This is arguably inefficient bandwidth-wise but functionally simple for MVP.
            // 
            // Wait, passing 1000 items in JSON body is bad.
            // I should update Server to fetch archive.
            //
            // I will assume for now we pass context.
            // I will Update Server in next step to fetch archive.

            const res = await fetch('/api/recall', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    currentContext: contextTags,
                    // archiveItems: [] // Server should fetch this!
                })
            });

            if (!res.ok) throw new Error('Recall failed');
            const json = await res.json();

            // Map output to RecallCard type
            const cards = json.data.matched_items.map((item: any) => ({
                id: item.id,
                title: item.title,
                matchedTag: item.tags.find((t: string) => contextTags.includes(t)) || 'context',
                reason: item.reason,
                confidence: item.confidence,
                daysAgo: Math.floor((Date.now() - (item.timestamp || Date.now())) / (1000 * 60 * 60 * 24))
            }));

            setState({ cards, loading: false, error: null });

        } catch (err: any) {
            console.error(err);
            setState(prev => ({ ...prev, loading: false, error: err.message }));
        }
    }, [contextTags, latestCaptureId]);

    useEffect(() => {
        fetchRecalls();
    }, [fetchRecalls]);

    return { ...state, refetch: fetchRecalls };
}
