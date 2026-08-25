/**
 * Vercel Serverless Function: Direct Push Notification to a Specific Device Token
 * Path: /api/send-direct
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
  const token = data.token;

  if (!token) {
    return res.status(400).json({
      success: false,
      error: 'Device token is required.'
    });
  }

  const payload = {
    notification: {
      title: '🔔 Uji Notifikasi Berhasil',
      body: 'TRJT 3A Reminder siap mengingatkan jadwal kuliahmu.'
    },
    data: {
      type: 'TEST_NOTIFICATION',
      time: new Date().toISOString()
    },
    webpush: {
      headers: {
        Urgency: 'high'
      },
      notification: {
        title: '🔔 Uji Notifikasi Berhasil',
        body: 'TRJT 3A Reminder siap mengingatkan jadwal kuliahmu.',
        tag: 'trjt-test-notif',
        renotify: true,
        requireInteraction: true
      },
      fcmOptions: {
        link: './index.html'
      }
    },
    token: token
  };

  try {
    const messaging = getMessaging();
    const messageId = await messaging.send(payload);
    return res.status(200).json({
      success: true,
      messageId: messageId,
      message: 'Notifikasi berhasil dikirim ke perangkat.'
    });
  } catch (error) {
    console.error('[SendDirect Error]:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
