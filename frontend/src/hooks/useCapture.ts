import { useState } from 'react';
import axios from 'axios';
import { ArchiveItem } from '../types/memoria';

const mcpServerUrl = import.meta.env.VITE_MCP_SERVER_URL || 'http://localhost:3000';

export function useCapture() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const captureUrl = async (input: string) => {
        try {
            setLoading(true);
            // We use 'current-user' as header or similar later, but for now
            // backend uses default if strictly MVP. However, let's pass it if we had it.
            // For now, simpler:
            const response = await axios.post(`${mcpServerUrl}/api/capture`, {
                url: input // Using 'url' as the body key based on backend plan
            });
            setError(null);
            return response.data.data;
        } catch (err: any) {
            console.error('Capture failed:', err);
            setError(err.response?.data?.error || err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const getArchive = async () => {
        try {
            const response = await axios.get(`${mcpServerUrl}/api/archive`);
            return response.data.data as ArchiveItem[];
        } catch (err: any) {
            console.debug('No archive yet or fetch failed');
            return [];
        }
    };

    return { captureUrl, getArchive, loading, error };
}
