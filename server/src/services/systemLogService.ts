import { db } from './firestoreService.js';
import { pino } from 'pino';

const logger = pino();

export interface SystemLogEntry {
    id: string;
    action: 'capture' | 'recall' | 'sync' | 'error' | 'scan';
    status: 'success' | 'failure';
    details: string;
    timestamp: number;
}

export async function logEvent(
    userId: string,
    action: SystemLogEntry['action'],
    status: SystemLogEntry['status'],
    details: string
): Promise<void> {
    try {
        const entry: Omit<SystemLogEntry, 'id'> = {
            action,
            status,
            details,
            timestamp: Date.now(),
        };

        if (userId === 'current-user') {
            // For MVP
        }

        const ref = db.collection('logs');
        await ref.add(entry);

        logger.info({ userId, action, status, details }, 'System log entry created');
    } catch (err: any) {
        logger.error({ error: err.message }, 'Failed to create system log entry');
    }
}

export async function getLogs(userId: string, limit: number = 50): Promise<SystemLogEntry[]> {
    try {
        const ref = db.collection('logs');
        const snapshot = await ref.orderBy('timestamp', 'desc').limit(limit).get();

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as SystemLogEntry));
    } catch (err: any) {
        logger.error({ error: err.message }, 'Failed to fetch system logs');
        return [];
    }
}
