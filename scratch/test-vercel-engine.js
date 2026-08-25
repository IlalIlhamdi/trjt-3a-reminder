import { runH10ReminderCheck } from '../api/lib/reminder-engine.js';

async function main() {
  console.log('Testing Vercel Reminder Engine with Service Account credentials...');
  try {
    const report = await runH10ReminderCheck({ dryRun: true });
    console.log('✅ Vercel Engine Executed Successfully!');
    console.log('Report summary:', {
      jakarta_now: report.jakarta_now,
      day: report.day,
      devices_count: report.devices_count,
      reminder_candidates: report.reminder_candidates
    });
  } catch (err) {
    console.error('❌ Error executing Vercel engine:', err);
  }
}

main();
