import { getMessaging, getFirestoreDb } from '../api/lib/firebase-admin-init.js';

async function testSend() {
  const messaging = getMessaging();
  const db = getFirestoreDb();

  console.log('Sending direct FCM test to iPhone tokens...');
  const tokens = [
    'f_ATOA79QENUwjxeWCmrSD:APA91bEq7Kx3c7H7iK3yP3B0xR8vC5n1s0e-X7wY9zT1u2v3w4x5y6z7a8b9c0d1e2f3g4h5i6j7k8l9m0n1o2p3q4r5s6t7u8v9w0x1y2z3a4b5c6d7e8f9g0h1i2', // placeholder or real from DB
  ];

  const snap = await db.collection('devices')
    .where('classId', '==', 'trjt-3a')
    .where('active', '==', true)
    .where('reminderEnabled', '==', true)
    .get();

  const realTokens = [];
  snap.forEach(doc => {
    const d = doc.data();
    if (d.token && d.token.includes(':APA91b')) {
      realTokens.push({ id: doc.id, platform: d.platform, token: d.token });
    }
  });

  console.log(`Found ${realTokens.length} real FCM tokens in Firestore.`);
  for (const item of realTokens) {
    console.log(`Sending to ${item.platform} (${item.id})...`);
    try {
      const response = await messaging.send({
        token: item.token,
        notification: {
          title: '🔔 Uji Notifikasi TRJT 3A',
          body: 'Notifikasi otomatis kelas berhasil terhubung ke HP Anda!'
        },
        data: {
          type: 'REMINDER_H10',
          time: new Date().toISOString()
        }
      });
      console.log(`✅ SUCCESS for ${item.platform}: messageId = ${response}`);
    } catch (err) {
      console.error(`❌ FAILED for ${item.platform}:`, err.message);
    }
  }
}

testSend();
