
import { db } from '../services/firestoreService.js';
import { pino } from 'pino';

const logger = pino();
const TARGET_USER_ID = '4BiajxQDtbXGJTjnUX1kBuRhD1n2';

async function migrate() {
    console.log(`--- MIGRATING TO: ${TARGET_USER_ID} ---`);
    const snapshot = await db.collection('archive').get();
    let updated = 0;

    const batch = db.batch();
    let batchCount = 0;

    snapshot.docs.forEach(doc => {
        const data = doc.data();
        // If userId is undefined OR equal to localhost IP
        if (!data.userId || data.userId === '::1') {
            const ref = db.collection('archive').doc(doc.id);
            batch.update(ref, { userId: TARGET_USER_ID });
            updated++;
            batchCount++;
        }
    });

    if (updated > 0) {
        await batch.commit(); // Note: Firestore batch limit is 500, we have ~100 so this is safe.
        console.log(`Successfully migrated ${updated} items.`);
    } else {
        console.log('No items needed migration.');
    }
    process.exit(0);
}

migrate();
