/**
 * Vercel Serverless Function: H-10 Class Reminder Cron Endpoint
 * Invoked every 1 minute by Vercel Cron or external schedulers (cron-job.org / Cloud Scheduler)
 * Path: /api/cron/class-reminders
 */

import { runH10ReminderCheck } from '../lib/reminder-engine.js';

export default async function handler(req, res) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-cron-secret, x-vercel-cron');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const expectedSecret = process.env.CRON_SECRET || 'trjt3a-cron-secure-key-2026';
  const authHeader = req.headers.authorization || '';
  const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : '';
  const providedSecret = req.query.secret || req.headers['x-cron-secret'] || bearerToken;
  const isVercelCron = req.headers['x-vercel-cron'] === '1';

  // Verify authorization
  const isAuthorized = isVercelCron || providedSecret === expectedSecret;
  if (!isAuthorized) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: Missing or invalid CRON_SECRET.'
    });
  }

  const isDryRun = req.query.dryRun === 'true';

  try {
    const report = await runH10ReminderCheck({
      dryRun: isDryRun
    });

    return res.status(200).json({
      success: true,
      source: 'vercel-serverless-cron',
      dryRun: isDryRun,
      report
    });
  } catch (err) {
    console.error('[VercelCron Error]:', err);
    return res.status(500).json({
      success: false,
      error: 'Error executing H-10 class reminder: ' + err.message
    });
  }
}
