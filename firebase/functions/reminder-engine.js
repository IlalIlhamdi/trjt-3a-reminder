/**
 * TRJT 3A REMINDER — Centralized Server-Side Reminder Engine
 * Timezone: Asia/Jakarta (WIB, UTC+7)
 * Handles schedule matching, tolerance window (H-10), overrides, cancellation,
 * idempotency/concurrency locking, device multicast, token cleanup, & heartbeat.
 */

let admin;
try {
  admin = require('firebase-admin');
} catch (e) {
  admin = {
    firestore: {
      FieldValue: {
        serverTimestamp: () => new Date().toISOString()
      }
    }
  };
}

// -----------------------------------------------------------------------------
// 1. Timezone & Time Conversion Helpers (Asia/Jakarta)
// -----------------------------------------------------------------------------

/**
 * Returns localized Jakarta time components
 * @param {Date} [date] Optional date object (defaults to current server time)
 * @returns {{ dateObj: Date, year: string, month: string, day: string, hour: number, minute: number, second: number, dayOfWeek: number, dateStr: string, timeStr: string, totalMinutes: number }}
 */
function getJakartaNow(date = new Date()) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  const parts = formatter.formatToParts(date);
  const map = {};
  parts.forEach(p => { map[p.type] = p.value; });

  const year = map.year;
  const month = map.month;
  const day = map.day;
  const hour = parseInt(map.hour, 10);
  const minute = parseInt(map.minute, 10);
  const second = parseInt(map.second, 10);
  const totalMinutes = hour * 60 + minute;
  const dateStr = `${year}-${month}-${day}`;
  const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

  // Local day of week in Jakarta: 0 = Sunday, 1 = Monday, ..., 5 = Friday, 6 = Saturday
  const weekdayFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Jakarta',
    weekday: 'short'
  });
  const weekdayShort = weekdayFormatter.format(date).toLowerCase();
  const dayMap = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };
  const dayOfWeek = dayMap[weekdayShort] !== undefined ? dayMap[weekdayShort] : 0;

  return {
    dateObj: date,
    year,
    month,
    day,
    hour,
    minute,
    second,
    dayOfWeek,
    dateStr,
    timeStr,
    totalMinutes
  };
}

/**
 * Normalizes time string to total minutes since 00:00.
 * Supports both "10:20" and "10.20".
 * @param {string} timeStr E.g. "07:30", "07.30", "10:20", "12.50"
 * @returns {number} Minutes since 00:00 (e.g. 620 for 10:20)
 */
function parseTimeToMinutes(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return 0;
  const clean = timeStr.trim().replace('.', ':');
  const [h, m] = clean.split(':').map(val => parseInt(val, 10) || 0);
  return h * 60 + m;
}

/**
 * Converts total minutes back to "HH:mm" or "HH.mm"
 * @param {number} minutes Total minutes (0..1439)
 * @param {string} [separator] ':' or '.'
 * @returns {string} E.g. "10:20" or "10.20"
 */
function formatMinutesToTime(minutes, separator = ':') {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}${separator}${String(m).padStart(2, '0')}`;
}

/**
 * Evaluates whether a class start time matches the H-10 reminder window.
 * Tolerance window: 0 < (classStartMinutes - currentMinutes) <= 10.
 * Once class has started (minutesUntilClass <= 0), it will NOT match.
 * @param {number} currentTotalMinutes Current Jakarta total minutes
 * @param {number} classStartMinutes Class start total minutes
 * @param {number} [reminderMinutes=10] Target reminder minutes
 * @returns {{ shouldSend: boolean, minutesUntilClass: number }}
 */
function shouldSendReminder(currentTotalMinutes, classStartMinutes, reminderMinutes = 10) {
  const minutesUntilClass = classStartMinutes - currentTotalMinutes;
  // Send when class is 1 to 10 minutes away
  const shouldSend = minutesUntilClass > 0 && minutesUntilClass <= reminderMinutes;
  return { shouldSend, minutesUntilClass };
}

// -----------------------------------------------------------------------------
// 2. Core Reminder Engine Process
// -----------------------------------------------------------------------------

/**
 * Main Reminder Execution Engine
 * @param {FirebaseFirestore.Firestore} db Firestore database instance
 * @param {object} [options] Options for execution
 * @param {boolean} [options.dryRun=false] When true, simulates check without sending FCM or writing logs
 * @param {Date} [options.customTime] Optional fake time for simulation testing
 * @returns {Promise<object>} Detailed execution summary report
 */
async function runClassReminderCheck(db, options = {}) {
  const dryRun = !!options.dryRun;
  const jakartaTime = getJakartaNow(options.customTime || new Date());
  const { dayOfWeek, dateStr, totalMinutes, timeStr } = jakartaTime;

  const executionLog = {
    scheduler_started: new Date().toISOString(),
    jakarta_now: `${dateStr} ${timeStr} WIB`,
    day: dayOfWeek,
    dryRun: dryRun,
    candidate_schedules: [],
    effective_schedules: [],
    reminder_candidates: [],
    devices_count: 0,
    send_success: 0,
    send_failed: 0,
    duplicate_skipped: 0,
    cancelled_skipped: 0,
    next_candidate: null
  };

  console.log(`[ReminderScheduler] Run started at Jakarta time: ${dateStr} ${timeStr} (Day: ${dayOfWeek}, DryRun: ${dryRun})`);

  // Academic days: Monday (1) to Friday (5)
  if (dayOfWeek < 1 || dayOfWeek > 5) {
    console.log(`[ReminderScheduler] Non-academic day (${dayOfWeek}). Skipping schedule check.`);
    if (!dryRun) {
      await updateSchedulerHeartbeat(db, {
        status: 'idle',
        jakartaTime: `${dateStr} ${timeStr} WIB`,
        message: 'Weekend (Libur) — Tidak ada jadwal kuliah aktif hari ini.',
        executionLog
      });
    }
    return executionLog;
  }

  try {
    // 1. Fetch active base schedules for today
    const scheduleSnapshot = await db.collection('schedules')
      .where('classId', '==', 'trjt-3a')
      .where('dayOfWeek', '==', dayOfWeek)
      .where('active', '==', true)
      .get();

    if (scheduleSnapshot.empty) {
      console.log(`[ReminderScheduler] No active schedules found for day ${dayOfWeek}.`);
      if (!dryRun) {
        await updateSchedulerHeartbeat(db, {
          status: 'active',
          jakartaTime: `${dateStr} ${timeStr} WIB`,
          message: 'Tidak ada jadwal kuliah aktif untuk hari ini.',
          executionLog
        });
      }
      return executionLog;
    }

    // 2. Fetch today's schedule overrides / cancellations
    const overridesSnapshot = await db.collection('scheduleOverrides')
      .where('date', '==', dateStr)
      .get();

    const overrideMap = new Map();
    overridesSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.scheduleId) {
        overrideMap.set(data.scheduleId, data);
      }
    });

    // 3. Load active registered devices
    const devicesSnapshot = await db.collection('devices')
      .where('classId', '==', 'trjt-3a')
      .where('active', '==', true)
      .where('reminderEnabled', '==', true)
      .get();

    const targetDevices = [];
    devicesSnapshot.forEach(doc => {
      const d = doc.data();
      if (d.token && typeof d.token === 'string' && d.token.trim() !== '') {
        // Exclude dummy non-FCM tokens
        if (!d.token.startsWith('web-local-') && !d.token.startsWith('dev_') && !d.token.startsWith('ios-dev-')) {
          targetDevices.push({
            docId: doc.id,
            token: d.token,
            platform: d.platform || 'Unknown'
          });
        }
      }
    });

    executionLog.devices_count = targetDevices.length;
    console.log(`[ReminderScheduler] Found ${targetDevices.length} active registered FCM devices.`);

    // 4. Process each schedule
    const allCandidatesForToday = [];

    for (const doc of scheduleSnapshot.docs) {
      const schedule = doc.data();
      const scheduleId = doc.id;
      executionLog.candidate_schedules.push({ id: scheduleId, courseName: schedule.courseName });

      // Determine effective schedule values (Base schedule -> Date override -> Effective)
      let effectiveStartTime = schedule.startTime;
      let effectiveEndTime = schedule.endTime;
      let effectiveRoomCode = schedule.roomCode || 'Ruang Kuliah';
      let effectiveLecturer = schedule.lecturerName || 'Dosen Pengampu';
      let isCancelled = false;

      const override = overrideMap.get(scheduleId);
      if (override) {
        if (override.cancelled === true) {
          isCancelled = true;
        }
        if (override.newStartTime) {
          effectiveStartTime = override.newStartTime;
        }
        if (override.newEndTime) {
          effectiveEndTime = override.newEndTime;
        }
        if (override.newRoomCode) {
          effectiveRoomCode = override.newRoomCode;
        }
        if (override.newLecturerName) {
          effectiveLecturer = override.newLecturerName;
        }
      }

      const classStartMinutes = parseTimeToMinutes(effectiveStartTime);
      const { shouldSend, minutesUntilClass } = shouldSendReminder(totalMinutes, classStartMinutes, 10);

      const candidateInfo = {
        scheduleId,
        courseName: schedule.courseName,
        baseStartTime: schedule.startTime,
        effectiveStartTime,
        effectiveRoomCode,
        effectiveLecturer,
        isCancelled,
        classStartMinutes,
        minutesUntilClass,
        shouldSend
      };

      allCandidatesForToday.push(candidateInfo);
      executionLog.effective_schedules.push(candidateInfo);

      // Handle Cancellation
      if (isCancelled) {
        if (shouldSend) {
          console.log(`[ReminderScheduler] Schedule [${schedule.courseName}] is cancelled for today. Skipping reminder.`);
          executionLog.cancelled_skipped++;
        }
        continue;
      }

      // Handle Non-matching Window
      if (!shouldSend) {
        continue;
      }

      // Match Found: Inside H-10 Tolerance Window!
      executionLog.reminder_candidates.push(candidateInfo);
      console.log(`[ReminderScheduler] Match found for [${schedule.courseName}]! Starts at ${effectiveStartTime} (${minutesUntilClass} min from now).`);

      const deduplicationKey = `${scheduleId}_${dateStr}_reminder10`;
      const logRef = db.collection('notificationLogs').doc(deduplicationKey);

      if (dryRun) {
        console.log(`[ReminderScheduler] [DRY RUN] Would send H-10 reminder for [${schedule.courseName}] to ${targetDevices.length} devices.`);
        candidateInfo.dryRunResult = {
          wouldSend: true,
          targetDevices: targetDevices.length,
          title: '🔔 Kelas 10 Menit Lagi',
          body: `${schedule.courseName} · ${effectiveStartTime.replace(':', '.')} · ${effectiveRoomCode}`
        };
        continue;
      }

      // 5. Anti-Duplicate & Concurrency Lock via Firestore Transaction
      let acquiredLock = false;
      try {
        await db.runTransaction(async (transaction) => {
          const logDoc = await transaction.get(logRef);
          if (logDoc.exists) {
            const data = logDoc.data();
            // If already sent or currently being processed within the last 120s
            if (data.status === 'sent') {
              return;
            }
            if (data.status === 'processing') {
              const lockedAt = data.lockedAt?.toDate ? data.lockedAt.toDate().getTime() : 0;
              if (Date.now() - lockedAt < 120000) {
                return; // Another instance is actively sending
              }
            }
          }

          // Acquire lock
          transaction.set(logRef, {
            scheduleId,
            courseName: schedule.courseName,
            status: 'processing',
            targetDate: dateStr,
            lockedAt: admin.firestore.FieldValue.serverTimestamp()
          }, { merge: true });
          acquiredLock = true;
        });
      } catch (txErr) {
        console.warn(`[ReminderScheduler] Lock transaction warning for [${scheduleId}]:`, txErr.message);
      }

      if (!acquiredLock) {
        console.log(`[ReminderScheduler] Duplicate skipped for [${deduplicationKey}] (already sent or locked).`);
        executionLog.duplicate_skipped++;
        continue;
      }

      // 6. Send Multicast Push Notification via FCM
      const notificationTitle = '🔔 Kelas 10 Menit Lagi';
      const notificationBody = `${schedule.courseName} · ${effectiveStartTime.replace(':', '.')} · ${effectiveRoomCode}`;
      const tokens = targetDevices.map(d => d.token);

      let sendSuccessCount = 0;
      let sendFailureCount = 0;
      const invalidTokenDocIds = [];

      if (tokens.length > 0) {
        try {
          const multicastPayload = {
            notification: {
              title: notificationTitle,
              body: notificationBody
            },
            data: {
              type: 'REMINDER_H10',
              scheduleId: scheduleId,
              courseName: schedule.courseName,
              lecturer: effectiveLecturer,
              room: effectiveRoomCode,
              startTime: effectiveStartTime,
              targetUrl: './index.html'
            },
            tokens: tokens
          };

          const response = await admin.messaging().sendEachForMulticast(multicastPayload);
          sendSuccessCount = response.successCount;
          sendFailureCount = response.failureCount;

          // 7. Clean up invalid / unregistered tokens
          if (response.failureCount > 0) {
            response.responses.forEach((resp, idx) => {
              if (!resp.success && resp.error) {
                const errorCode = resp.error.code;
                if (
                  errorCode === 'messaging/registration-token-not-registered' ||
                  errorCode === 'messaging/invalid-registration-token' ||
                  errorCode === 'messaging/invalid-argument'
                ) {
                  invalidTokenDocIds.push(targetDevices[idx].docId);
                }
              }
            });
          }

          console.log(`[ReminderScheduler] FCM Multicast complete: ${sendSuccessCount} succeeded, ${sendFailureCount} failed.`);
        } catch (fcmErr) {
          console.error(`[ReminderScheduler] FCM Send error for [${schedule.courseName}]:`, fcmErr);
          sendFailureCount = tokens.length;
        }
      }

      // Deactivate invalid tokens in Firestore
      if (invalidTokenDocIds.length > 0) {
        try {
          const batch = db.batch();
          invalidTokenDocIds.forEach(docId => {
            batch.update(db.collection('devices').doc(docId), {
              active: false,
              deactivatedReason: 'Token unregistered/invalid',
              deactivatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
          });
          await batch.commit();
          console.log(`[ReminderScheduler] Deactivated ${invalidTokenDocIds.length} stale/invalid device tokens.`);
        } catch (cleanErr) {
          console.warn('[ReminderScheduler] Stale token cleanup warning:', cleanErr.message);
        }
      }

      // 8. Update Notification Log status to 'sent'
      await logRef.set({
        scheduleId,
        courseName: schedule.courseName,
        startTime: effectiveStartTime,
        room: effectiveRoomCode,
        lecturer: effectiveLecturer,
        sentAt: admin.firestore.FieldValue.serverTimestamp(),
        targetDate: dateStr,
        recipientCount: sendSuccessCount,
        failureCount: sendFailureCount,
        status: 'sent',
        success: true
      });

      executionLog.send_success += sendSuccessCount;
      executionLog.send_failed += sendFailureCount;
    }

    // 9. Find next upcoming candidate for today/tomorrow
    const upcomingCandidates = allCandidatesForToday
      .filter(c => !c.isCancelled && c.classStartMinutes > totalMinutes)
      .sort((a, b) => a.classStartMinutes - b.classStartMinutes);

    if (upcomingCandidates.length > 0) {
      const next = upcomingCandidates[0];
      const reminderSendMinutes = Math.max(0, next.classStartMinutes - 10);
      executionLog.next_candidate = {
        courseName: next.courseName,
        startTime: next.effectiveStartTime,
        room: next.effectiveRoomCode,
        minutesUntilStart: next.classStartMinutes - totalMinutes,
        expectedReminderTime: formatMinutesToTime(reminderSendMinutes)
      };
    }

    // 10. Update Heartbeat in Firestore
    if (!dryRun) {
      await updateSchedulerHeartbeat(db, {
        status: 'active',
        jakartaTime: `${dateStr} ${timeStr} WIB`,
        executionLog
      });
    }

    return executionLog;
  } catch (err) {
    console.error('[ReminderScheduler] Fatal Engine Error:', err);
    if (!dryRun) {
      await updateSchedulerHeartbeat(db, {
        status: 'error',
        jakartaTime: `${dateStr} ${timeStr} WIB`,
        lastError: err.message,
        executionLog
      });
    }
    throw err;
  }
}

/**
 * Updates `systemStatus/reminderScheduler` doc for real-time monitoring
 */
async function updateSchedulerHeartbeat(db, data) {
  try {
    await db.collection('systemStatus').doc('reminderScheduler').set({
      lastRunAt: admin.firestore.FieldValue.serverTimestamp(),
      status: data.status || 'active',
      lastError: data.lastError || null,
      message: data.message || 'Scheduler berjalan normal',
      jakartaTime: data.jakartaTime || '',
      processedSchedules: (data.executionLog?.candidate_schedules || []).length,
      sentCount: data.executionLog?.send_success || 0,
      duplicateSkipped: data.executionLog?.duplicate_skipped || 0,
      cancelledSkipped: data.executionLog?.cancelled_skipped || 0,
      activeDevicesCount: data.executionLog?.devices_count || 0,
      nextCandidate: data.executionLog?.next_candidate || null,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
  } catch (e) {
    console.warn('[ReminderScheduler] Heartbeat write note:', e.message);
  }
}

module.exports = {
  getJakartaNow,
  parseTimeToMinutes,
  formatMinutesToTime,
  shouldSendReminder,
  runClassReminderCheck
};
