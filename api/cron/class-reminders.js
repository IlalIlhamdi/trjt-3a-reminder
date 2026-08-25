/**
 * Vercel Serverless Function: H-10 Class Reminder Cron Endpoint
 * Invoked every 1 minute by Vercel Cron or external schedulers (cron-job.org / Cloud Scheduler)
 * Path: /api/cron/class-reminders
 */

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

  // Target Cloud Function HTTP Endpoint
  const cloudFunctionUrl = process.env.REMINDER_FUNCTION_URL || 
    'https://us-central1-trjt-3a-reminder.cloudfunctions.net/cronClassRemindersHttp';

  try {
    const fetchUrl = new URL(cloudFunctionUrl);
    fetchUrl.searchParams.set('secret', expectedSecret);
    if (isDryRun) {
      fetchUrl.searchParams.set('dryRun', 'true');
    }

    const response = await fetch(fetchUrl.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-cron-secret': expectedSecret,
        'x-vercel-cron': '1'
      }
    });

    const data = await response.json();
    return res.status(response.status).json({
      success: response.ok,
      source: 'vercel-cron-proxy',
      backendStatus: response.status,
      data
    });
  } catch (err) {
    console.error('[VercelCronProxy Error]:', err);
    return res.status(502).json({
      success: false,
      error: 'Failed to reach Firebase Reminder Cloud Function: ' + err.message
    });
  }
}
