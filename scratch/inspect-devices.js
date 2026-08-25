import { getFirestoreDb } from '../lib/firebase-admin-init.js';

async function check() {
  const db = getFirestoreDb();
  console.log('Fetching all documents in `devices` collection from Firestore...');
  const snap = await db.collection('devices').get();
  console.log(`Total devices in Firestore: ${snap.size}`);
  
  snap.forEach(doc => {
    const d = doc.data();
    console.log({
      id: doc.id,
      platform: d.platform,
      classId: d.classId,
      active: d.active,
      reminderEnabled: d.reminderEnabled,
      tokenPrefix: d.token ? d.token.substring(0, 25) + '...' : 'NONE',
      tokenLength: d.token ? d.token.length : 0,
      lastSeen: d.lastSeen ? (d.lastSeen.toDate ? d.lastSeen.toDate().toISOString() : d.lastSeen) : 'N/A'
    });
  });
}

check();
