import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

let isInitialized = false;

export function getFirebaseAdmin() {
  if (admin.apps.length > 0) {
    return admin;
  }

  let credential = null;

  // 1. Try FIREBASE_SERVICE_ACCOUNT env var (JSON string or base64)
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      let raw = process.env.FIREBASE_SERVICE_ACCOUNT.trim();
      if (!raw.startsWith('{')) {
        raw = Buffer.from(raw, 'base64').toString('utf-8');
      }
      credential = admin.credential.cert(JSON.parse(raw));
    } catch (e) {
      console.warn('[firebase-admin-init] Failed parsing FIREBASE_SERVICE_ACCOUNT env:', e.message);
    }
  }

  // 2. Try individual env variables
  if (!credential && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    try {
      credential = admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID || 'trjt-3a-reminder',
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
      });
    } catch (e) {
      console.warn('[firebase-admin-init] Failed individual env cert:', e.message);
    }
  }

  // 3. Try local serviceAccountKey.json files
  if (!credential) {
    const candidatePaths = [
      path.join(process.cwd(), 'serviceAccountKey.json'),
      path.join(process.cwd(), 'firebase', 'serviceAccountKey.json'),
      path.join(process.cwd(), 'api', 'serviceAccountKey.json')
    ];

    for (const p of candidatePaths) {
      if (fs.existsSync(p)) {
        try {
          const content = fs.readFileSync(p, 'utf-8');
          credential = admin.credential.cert(JSON.parse(content));
          console.log('[firebase-admin-init] Loaded credentials from:', p);
          break;
        } catch (e) {
          console.warn('[firebase-admin-init] Error reading serviceAccount file:', e.message);
        }
      }
    }
  }

  // 4. Initialize Admin app
  const appOptions = {
    projectId: 'trjt-3a-reminder'
  };
  if (credential) {
    appOptions.credential = credential;
  }

  admin.initializeApp(appOptions);
  isInitialized = true;
  return admin;
}

export function getFirestoreDb() {
  const adm = getFirebaseAdmin();
  return adm.firestore();
}

export function getMessaging() {
  const adm = getFirebaseAdmin();
  return adm.messaging();
}
