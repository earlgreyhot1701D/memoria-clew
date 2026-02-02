
import { db } from '../services/firestoreService.js';
import { pino } from 'pino';

const logger = pino();

async function audit() {
    console.log('--- STARTING AUDIT ---');
    try {
        const snapshot = await db.collection('archive').get();
        const counts: Record<string, number> = {};

        console.log(`Found ${snapshot.size} total items in archive.`);

        snapshot.forEach(doc => {
            const data = doc.data();
            const uid = data.userId || 'UNDEFINED';
            counts[uid] = (counts[uid] || 0) + 1;
        });

        console.log('--- ITEMS BY USER ID ---');
        console.table(counts);

    } catch (error) {
        console.error('Audit failed:', error);
    }
    process.exit(0);
}

audit();
