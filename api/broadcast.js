/**
 * Vercel Serverless Function: Broadcast Push Notification to All Students
 * Path: /api/broadcast
 */

import { getFirebaseAdmin, getFirestoreDb, getMessaging } from '../lib/firebase-admin-init.js';

export default async function handler(req, res) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const data = req.body || req.query || {};
  const courseName = data.courseName || 'Jaringan Komputer Lanjut';
  const lecturer = data.lecturer || 'Muhammad Syahroni, S.T., M.T.';
  const room = data.room || 'R16';
  const startTime = data.startTime || '10:20';
  const scheduleId = data.scheduleId || 'demo-broadcast';

  const notificationTitle = `🔔 Uji Notifikasi: ${courseName}`;
  const notificationBody = `Kuliah ${courseName} · Jam ${startTime.replace(':', '.')} · Ruang ${room}`;

  try {
    const adminInstance = getFirebaseAdmin();
    const db = getFirestoreDb();
    const messaging = getMessaging();

    if (!db || !messaging) {
      return res.status(500).json({
        success: false,
        error: 'Firebase Admin not initialized properly on server.'
      });
    }

    // Query active registered devices
    const devicesSnapshot = await db.collection('devices')
      .where('classId', '==', 'trjt-3a')
      .where('active', '==', true)
      .where('reminderEnabled', '==', true)
      .get();

    const targetDevices = [];
    devicesSnapshot.forEach(doc => {
      const d = doc.data();
      if (d.token && typeof d.token === 'string' && d.token.trim() !== '') {
        if (!d.token.startsWith('web-local-') && !d.token.startsWith('dev_') && !d.token.startsWith('ios-dev-')) {
          targetDevices.push({
            docId: doc.id,
            token: d.token,
            platform: d.platform || 'Unknown'
          });
        }
      }
    });

    if (targetDevices.length === 0) {
      return res.status(200).json({
        success: true,
        recipientCount: 0,
        targetDevices: 0,
        message: 'Tidak ada perangkat mahasiswa aktif dengan token FCM terdaftar.'
      });
    }

    const tokens = targetDevices.map(d => d.token);
    const multicastPayload = {
      notification: {
        title: notificationTitle,
        body: notificationBody
      },
      data: {
        type: 'REMINDER_H10',
        scheduleId: scheduleId,
        courseName: courseName,
        lecturer: lecturer,
        room: room,
        startTime: startTime,
        targetUrl: './index.html'
      },
      tokens: tokens
    };

    const response = await messaging.sendEachForMulticast(multicastPayload);
    const successCount = response.successCount;
    const failureCount = response.failureCount;
    const invalidDocIds = [];

    if (response.failureCount > 0) {
      response.responses.forEach((resp, idx) => {
        if (!resp.success && resp.error) {
          const errorCode = resp.error.code;
          if (
            errorCode === 'messaging/registration-token-not-registered' ||
            errorCode === 'messaging/invalid-registration-token' ||
            errorCode === 'messaging/invalid-argument'
          ) {
            invalidDocIds.push(targetDevices[idx].docId);
          }
        }
      });
    }

    // Clean invalid tokens in background
    if (invalidDocIds.length > 0) {
      try {
        const batch = db.batch();
        invalidDocIds.forEach(id => batch.update(db.collection('devices').doc(id), { active: false }));
        await batch.commit();
      } catch (e) {}
    }

    // Save log to Firestore
    await db.collection('notificationLogs').add({
      type: 'admin_broadcast_test',
      courseName,
      lecturer,
      room,
      startTime,
      sentAt: adminInstance.firestore.FieldValue.serverTimestamp(),
      recipientCount: successCount,
      failureCount: failureCount,
      success: true,
      source: 'vercel-serverless-broadcast'
    });

    return res.status(200).json({
      success: true,
      recipientCount: successCount,
      failureCount: failureCount,
      targetDevices: targetDevices.length,
      message: `Notifikasi berhasil disiarkan ke ${successCount} perangkat mahasiswa.`
    });
  } catch (err) {
    console.error('[Vercel Broadcast Error]:', err);
    return res.status(500).json({
      success: false,
      error: 'Gagal mengirim push FCM: ' + err.message
    });
  }
}
