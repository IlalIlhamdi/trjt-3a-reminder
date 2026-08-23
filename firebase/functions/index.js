/**
 * TRJT 3A Reminder — Firebase Cloud Functions
 * Server-Side H-10 Cron Scheduler Engine
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

const db = admin.firestore();

// 1. Cron Job: Runs every minute in Asia/Jakarta timezone
exports.checkH10ClassReminder = functions.pubsub
  .schedule('* * * * *')
  .timeZone('Asia/Jakarta')
  .onRun(async (context) => {
    // Current Jakarta Time
    const now = new Date();
    const jakartaFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Jakarta',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    const parts = jakartaFormatter.formatToParts(now);
    const partMap = {};
    parts.forEach(p => { partMap[p.type] = p.value; });

    const currentYear = partMap.year;
    const currentMonth = partMap.month;
    const currentDay = partMap.day;
    const currentHour = parseInt(partMap.hour, 10);
    const currentMinute = parseInt(partMap.minute, 10);
    const currentTotalMinutes = currentHour * 60 + currentMinute;
    
    // Jakarta Date String: YYYY-MM-DD
    const todayDateStr = `${currentYear}-${currentMonth}-${currentDay}`;
    
    // Day of week: 0=Sun, 1=Mon, ..., 5=Fri, 6=Sat
    const localDayIndex = new Date(`${todayDateStr}T12:00:00+07:00`).getDay();

    console.log(`[H-10 Scheduler] Checking Jakarta Time: ${currentHour}:${currentMinute}, Day: ${localDayIndex}, Date: ${todayDateStr}`);

    if (localDayIndex < 1 || localDayIndex > 5) {
      console.log('[H-10 Scheduler] Weekend — No academic classes scheduled.');
      return null;
    }

    try {
      // Query today's active classes for TRJT 3A
      const scheduleSnapshot = await db.collection('schedules')
        .where('classId', '==', 'trjt-3a')
        .where('dayOfWeek', '==', localDayIndex)
        .where('active', '==', true)
        .get();

      if (scheduleSnapshot.empty) {
        return null;
      }

      for (const doc of scheduleSnapshot.docs) {
        const schedule = doc.data();
        const [startH, startM] = schedule.startTime.split(':').map(Number);
        const classStartMinutes = startH * 60 + startM;

        // Calculate time difference
        const minutesUntilClass = classStartMinutes - currentTotalMinutes;

        // Check if exactly 10 minutes before class (or in window 9..10)
        if (minutesUntilClass === 10 || minutesUntilClass === 9) {
          const deduplicationKey = `${doc.id}_${todayDateStr}_reminder10`;

          // Check if already sent today
          const logRef = db.collection('notificationLogs').doc(deduplicationKey);
          const logDoc = await logRef.get();

          if (logDoc.exists) {
            console.log(`[H-10 Scheduler] Skip duplicate for: ${schedule.courseName}`);
            continue;
          }

          // Check if class is cancelled for today
          const overrideDoc = await db.collection('scheduleOverrides')
            .where('scheduleId', '==', doc.id)
            .where('date', '==', todayDateStr)
            .get();

          if (!overrideDoc.empty) {
            const overrideData = overrideDoc.docs[0].data();
            if (overrideData.cancelled) {
              console.log(`[H-10 Scheduler] Class cancelled: ${schedule.courseName}`);
              continue;
            }
          }

          // Send FCM Message to topic 'trjt-3a'
          const lecturer = schedule.lecturerName || 'Dosen pengampu';
          const payload = {
            notification: {
              title: '🔔 Kelas 10 Menit Lagi',
              body: `${schedule.courseName} · ${schedule.startTime.replace(':', '.')} · ${schedule.roomCode}`
            },
            data: {
              type: 'REMINDER_H10',
              scheduleId: doc.id,
              courseName: schedule.courseName,
              lecturer: lecturer,
              room: schedule.roomCode,
              startTime: schedule.startTime,
              target: 'schedule_detail'
            },
            topic: 'trjt-3a'
          };

          await admin.messaging().send(payload);

          // Record deduplication log
          await logRef.set({
            scheduleId: doc.id,
            courseName: schedule.courseName,
            sentAt: admin.firestore.FieldValue.serverTimestamp(),
            targetDate: todayDateStr,
            success: true
          });

          console.log(`✅ [H-10 Scheduler] Successfully pushed H-10 reminder for ${schedule.courseName}`);
        }
      }
    } catch (error) {
      console.error('[H-10 Scheduler Error]:', error);
    }

    return null;
  });
