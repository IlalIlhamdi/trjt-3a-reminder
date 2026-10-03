/**
 * Vercel Serverless Function: Auto-Delete Expired Assignments
 * Invoked periodically by Vercel Cron or external scheduler
 * Path: /api/cron/cleanup-tasks
 */

import { getAdminFirestore } from '../../lib/firebase-admin-init.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-cron-secret, x-vercel-cron');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const expectedSecret = process.env.CRON_SECRET || null;
  const authHeader = req.headers.authorization || '';
  const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : '';
  const providedSecret = req.query.secret || req.headers['x-cron-secret'] || bearerToken;
  const isVercelCron = req.headers['x-vercel-cron'] === '1';

  if (!isVercelCron && expectedSecret && providedSecret !== expectedSecret) {
    return res.status(401).json({ success: false, error: 'Unauthorized: Invalid CRON_SECRET.' });
  }

  try {
    const db = getAdminFirestore();
    if (!db) {
      return res.status(500).json({ success: false, error: 'Firebase Admin not initialized' });
    }

    // Current Jakarta time
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Jakarta',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: false
    });
    const parts = formatter.formatToParts(now);
    const map = {};
    parts.forEach(p => { map[p.type] = p.value; });

    const currentJakartaTime = new Date(
      parseInt(map.year, 10),
      parseInt(map.month, 10) - 1,
      parseInt(map.day, 10),
      parseInt(map.hour, 10),
      parseInt(map.minute, 10),
      parseInt(map.second, 10)
    );

    const snapshot = await db.collection('courseAssignments').get();
    if (snapshot.empty) {
      return res.status(200).json({ success: true, pruned: 0, total: 0 });
    }

    const batch = db.batch();
    let expiredCount = 0;

    snapshot.forEach((doc) => {
      const data = doc.data();
      const dueDate = data.dueDate;
      if (!dueDate) return;

      let dYear, dMonth, dDay;
      if (typeof dueDate === 'string' && dueDate.includes('-')) {
        const p = dueDate.split('T')[0].split('-');
        dYear = parseInt(p[0], 10);
        dMonth = parseInt(p[1], 10) - 1;
        dDay = parseInt(p[2], 10);
      } else if (dueDate && typeof dueDate.toDate === 'function') {
        const dt = dueDate.toDate();
        dYear = dt.getFullYear();
        dMonth = dt.getMonth();
        dDay = dt.getDate();
      }

      if (dYear !== undefined && dMonth !== undefined && dDay !== undefined) {
        const deadlineEndOfDay = new Date(dYear, dMonth, dDay, 23, 59, 59, 999);
        if (currentJakartaTime.getTime() > deadlineEndOfDay.getTime()) {
          batch.delete(doc.ref);
          expiredCount++;
        }
      }
    });

    if (expiredCount > 0) {
      await batch.commit();
    }

    return res.status(200).json({
      success: true,
      source: 'vercel-cron-cleanup',
      pruned: expiredCount,
      total: snapshot.size
    });
  } catch (err) {
    console.error('[Cron Cleanup Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
