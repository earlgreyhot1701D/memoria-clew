import { useEffect, useState } from 'react';
import axios from 'axios';

export function useGitHubContext() {
    const [context, setContext] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const mcpServerUrl = import.meta.env.REACT_APP_MCP_SERVER_URL || 'http://localhost:3001';

    const syncContext = async () => {
        try {
            setLoading(true);
            const response = await axios.post(`${mcpServerUrl}/api/context/sync`);
            setContext(response.data.data);
            setError(null);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const getContext = async () => {
        try {
            const response = await axios.get(`${mcpServerUrl}/api/context`);
            setContext(response.data.data);
        } catch (err: any) {
            console.debug('No cached context yet');
        }
    };

    useEffect(() => {
        getContext();
    }, []);

    return { context, loading, error, syncContext };
}
