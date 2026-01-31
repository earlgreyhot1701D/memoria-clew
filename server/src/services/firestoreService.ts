import 'dotenv/config';
import admin from 'firebase-admin';
import { pino } from 'pino';

const logger = pino();

// Initialize Firebase Admin SDK
admin.initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID,
    credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    }),
});

export const db = admin.firestore();

logger.info(
    { projectId: process.env.FIREBASE_PROJECT_ID },
    '✓ Firebase Admin initialized'
);
