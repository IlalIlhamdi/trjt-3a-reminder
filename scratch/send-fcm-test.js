import { getMessaging, getFirestoreDb } from '../lib/firebase-admin-init.js';

async function testSend() {
  const messaging = getMessaging();
  const db = getFirestoreDb();

  console.log('Sending direct FCM test to iPhone tokens with WebPush Urgency HIGH...');
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
          title: '🔔 Uji Notifikasi Langsung ke HP',
          body: 'Notifikasi push TRJT 3A berhasil masuk ke iPhone Anda!'
        },
        data: {
          type: 'REMINDER_H10',
          time: new Date().toISOString()
        },
        webpush: {
          headers: {
            Urgency: 'high'
          },
          notification: {
            title: '🔔 Uji Notifikasi Langsung ke HP',
            body: 'Notifikasi push TRJT 3A berhasil masuk ke iPhone Anda!',
            tag: 'trjt-urgent-test',
            renotify: true,
            requireInteraction: true
          },
          fcmOptions: {
            link: './index.html'
          }
        }
      });
      console.log(`✅ SUCCESS for ${item.platform}: messageId = ${response}`);
    } catch (err) {
      console.error(`❌ FAILED for ${item.platform}:`, err.message);
    }
  }
}

testSend();
