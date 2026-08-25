/**
 * Vercel Serverless Function: Manual Reminder Check & Dry Run Endpoint
 * Path: /api/reminder-check
 */

import { runH10ReminderCheck } from './lib/reminder-engine.js';

export default async function handler(req, res) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const isDryRun = req.query.dryRun === 'true' || req.body?.dryRun === true;

  try {
    const report = await runH10ReminderCheck({
      dryRun: isDryRun
    });

    return res.status(200).json({
      success: true,
      source: 'vercel-serverless-endpoint',
      dryRun: isDryRun,
      report
    });
  } catch (err) {
    console.error('[ReminderCheck Error]:', err);
    return res.status(500).json({
      success: false,
      error: 'Error checking reminders: ' + err.message
    });
  }
}
