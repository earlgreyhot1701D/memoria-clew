import 'dotenv/config';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Process env is loaded by --env-file in the command execution, but strictly 
// to mirror firestoreService we use:

const credentialConfig = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
};

if (!getApps().length) {
    initializeApp({
        credential: cert(credentialConfig)
    });
}

function getApps() {
    // Hack to check if initialized, though admin.apps is standard
    try {
        return require('firebase-admin/app').getApps();
    } catch {
        return [];
    }
}

const db = getFirestore();

async function debugArchive() {
    console.log('--- DEBUGGING ARCHIVE COLLECTION ---');
    try {
        const snapshot = await db.collection('archive').get();
        console.log(`Total documents found: ${snapshot.size}`);

        if (snapshot.empty) {
            console.log('Collection is EMPTY.');
            return;
        }

        const countsByUserId = {};

        snapshot.forEach(doc => {
            const data = doc.data();
            const userId = data.userId || 'undefined';
            countsByUserId[userId] = (countsByUserId[userId] || 0) + 1;
        });

        console.log('Counts by UserId:');
        console.table(countsByUserId);

        console.log('\nSample Document (First one):');
        const firstDoc = snapshot.docs[0];
        console.log(JSON.stringify({ id: firstDoc.id, ...firstDoc.data() }, null, 2));

    } catch (err) {
        console.error('Error reading archive:', err);
    }
}

debugArchive();
