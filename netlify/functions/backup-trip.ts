type NetlifyEvent = {
  headers?: Record<string, string>;
  queryStringParameters?: { token?: string };
};
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

// Erwartet, dass die Service-Account-JSON als Base64 in ENV hinterlegt ist
const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64 || '';
const projectId = process.env.VITE_FIREBASE_PROJECT_ID || '';

if (!serviceAccountBase64) {
  throw new Error('FIREBASE_SERVICE_ACCOUNT_BASE64 fehlt');
}

const serviceAccount = JSON.parse(Buffer.from(serviceAccountBase64, 'base64').toString('utf-8'));

// Firebase Admin initialisieren (Singleton)
try {
  initializeApp({ credential: cert(serviceAccount), storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET });
} catch (e) {
  /* bereits initialisiert */ }

const db = getFirestore();
const bucket = getStorage().bucket();

const TRIP_ID = 'andalusien-2025';
const BACKUP_PATH = `backups/trips/${TRIP_ID}`;
const MAX_VERSIONS = 48; // 48 stündliche Backups = 2 Tage

export const handler = async (event: NetlifyEvent) => {
  try {
    // Optionaler Token-Schutz
    const expectedToken = process.env.BACKUP_TOKEN;
    if (expectedToken) {
      const headerToken = event.headers?.['x-backup-token'] || event.headers?.['X-Backup-Token'];
      const queryToken = event.queryStringParameters?.token;
      if (headerToken !== expectedToken && queryToken !== expectedToken) {
        return { statusCode: 401, body: 'Unauthorized' };
      }
    }
    // Trip laden
    const tripSnap = await db.collection('trips').doc(TRIP_ID).get();
    if (!tripSnap.exists) {
      return { statusCode: 404, body: 'Trip nicht gefunden' };
    }

    // Backup-Datei schreiben
    const timestamp = new Date().toISOString();
    const file = bucket.file(`${BACKUP_PATH}/${timestamp}.json`);
    await file.save(JSON.stringify(tripSnap.data(), null, 2), { contentType: 'application/json' });

    // Alte Backups bereinigen
    const [files] = await bucket.getFiles({ prefix: BACKUP_PATH });
    const sorted = files.sort((a, b) => (a.name > b.name ? -1 : 1)); // neueste zuerst
    const toDelete = sorted.slice(MAX_VERSIONS);
    await Promise.all(toDelete.map(f => f.delete().catch(() => {})));

    return { statusCode: 200, body: 'Backup erfolgreich' };
  } catch (error) {
    console.error('Backup-Fehler:', error);
    return { statusCode: 500, body: 'Backup-Fehler' };
  }
};

// Netlify Schedule
export const config = {
  schedule: '@hourly',
};
