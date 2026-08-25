/**
 * TRJT 3A REMINDER — Server-Side Reminder Engine (ES Module for Vercel Serverless)
 * Timezone: Asia/Jakarta (WIB, UTC+7)
 */

import { getFirebaseAdmin, getFirestoreDb, getMessaging } from './firebase-admin-init.js';

export const OFFICIAL_SCHEDULES = [
  // Senin (Day 1)
  {
    id: "senin-praktikum-antena-dan-propagasi",
    dayOfWeek: 1,
    courseName: "Praktikum Antena dan Propagasi",
    lecturerName: "Muhammad Syahroni, S.T., M.T.",
    roomCode: "Lab Telekomunikasi 1",
    startTime: "07:30",
    endTime: "10:00"
  },
  {
    id: "senin-jaringan-komputer-lanjut",
    dayOfWeek: 1,
    courseName: "Jaringan Komputer Lanjut",
    lecturerName: "Muhammad Syahroni, S.T., M.T.",
    roomCode: "R16",
    startTime: "10:20",
    endTime: "12:50"
  },
  {
    id: "senin-sistem-komunikasi-satelit",
    dayOfWeek: 1,
    courseName: "Sistem Komunikasi Satelit",
    lecturerName: "Ir. Rustam Asnawi, S.T., M.T., Ph.D.",
    roomCode: "R18",
    startTime: "13:30",
    endTime: "16:00"
  },

  // Selasa (Day 2)
  {
    id: "selasa-praktikum-jaringan-komputer-lanjut",
    dayOfWeek: 2,
    courseName: "Praktikum Jaringan Komputer Lanjut",
    lecturerName: "Muhammad Syahroni, S.T., M.T.",
    roomCode: "Lab Komputer 2",
    startTime: "07:30",
    endTime: "10:00"
  },
  {
    id: "selasa-sistem-komunikasi-bergerak",
    dayOfWeek: 2,
    courseName: "Sistem Komunikasi Bergerak",
    lecturerName: "Dr. Eng. Ir. Rina Pudjiastuti, M.T.",
    roomCode: "R16",
    startTime: "10:20",
    endTime: "12:50"
  },
  {
    id: "selasa-rekayasa-perangkat-lunak-telekomunikasi",
    dayOfWeek: 2,
    courseName: "Rekayasa Perangkat Lunak Telekomunikasi",
    lecturerName: "Bambang Sugeng, S.T., M.Eng.",
    roomCode: "R17",
    startTime: "13:30",
    endTime: "16:00"
  },

  // Rabu (Day 3)
  {
    id: "rabu-sistem-komunikasi-optik",
    dayOfWeek: 3,
    courseName: "Sistem Komunikasi Optik",
    lecturerName: "Ir. Yuliana Tri Asri, S.T., M.Eng.",
    roomCode: "R18",
    startTime: "07:30",
    endTime: "10:00"
  },
  {
    id: "rabu-metodologi-penelitian-dan-etika-profesi",
    dayOfWeek: 3,
    courseName: "Metodologi Penelitian dan Etika Profesi",
    lecturerName: "Dr. Ir. Hendra Jaya, S.T., M.T.",
    roomCode: "R16",
    startTime: "10:20",
    endTime: "12:00"
  },

  // Kamis (Day 4)
  {
    id: "kamis-praktikum-sistem-komunikasi-optik",
    dayOfWeek: 4,
    courseName: "Praktikum Sistem Komunikasi Optik",
    lecturerName: "Ir. Yuliana Tri Asri, S.T., M.Eng.",
    roomCode: "Lab Fiber Optik",
    startTime: "07:30",
    endTime: "10:00"
  },
  {
    id: "kamis-keamanan-jaringan-telekomunikasi",
    dayOfWeek: 4,
    courseName: "Keamanan Jaringan Telekomunikasi",
    lecturerName: "Muhammad Syahroni, S.T., M.T.",
    roomCode: "R17",
    startTime: "10:20",
    endTime: "12:50"
  },

  // Jumat (Day 5)
  {
    id: "jumat-manajemen-proyek-telekomunikasi",
    dayOfWeek: 5,
    courseName: "Manajemen Proyek Telekomunikasi",
    lecturerName: "Drs. Hendri, M.T.",
    roomCode: "R16",
    startTime: "08:00",
    endTime: "10:30"
  }
];

export function getJakartaNow(date = new Date()) {
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

export function parseTimeToMinutes(timeStr) {
  if (typeof timeStr !== 'string') return 0;
  const normalized = timeStr.trim().replace('.', ':');
  const parts = normalized.split(':');
  const h = parseInt(parts[0], 10) || 0;
  const m = parseInt(parts[1], 10) || 0;
  return h * 60 + m;
}

export function formatMinutesToTime(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function shouldSendReminder(classStartMinutes, currentMinutes) {
  const timeUntilStart = classStartMinutes - currentMinutes;
  return timeUntilStart > 0 && timeUntilStart <= 10;
}

export async function runH10ReminderCheck({
  dbInstance = null,
  simulatedJakartaTime = null,
  dryRun = false
} = {}) {
  const adminInstance = getFirebaseAdmin();
  const db = dbInstance || (adminInstance ? adminInstance.firestore() : null);

  const jakartaNow = simulatedJakartaTime || getJakartaNow();
  const { dateStr, timeStr, dayOfWeek, totalMinutes } = jakartaNow;

  const report = {
    executed_at: new Date().toISOString(),
    jakarta_now: `${dateStr} ${timeStr} WIB`,
    date: dateStr,
    time: timeStr,
    day: dayOfWeek,
    total_minutes: totalMinutes,
    dry_run: dryRun,
    effective_schedules: [],
    reminder_candidates: [],
    devices_count: 0,
    send_success: 0,
    send_failed: 0,
    duplicate_skipped: 0,
    cancelled_skipped: 0,
    next_candidate: null
  };

  const todaySchedules = OFFICIAL_SCHEDULES.filter(s => s.dayOfWeek === dayOfWeek);

  const overridesMap = new Map();
  if (db) {
    try {
      const overridesSnap = await db.collection('scheduleOverrides')
        .where('date', '==', dateStr)
        .get();

      if (!overridesSnap.empty) {
        overridesSnap.forEach(doc => {
          const data = doc.data();
          if (data.scheduleId) {
            overridesMap.set(data.scheduleId, data);
          }
        });
      }
    } catch (err) {
      console.warn('[ReminderEngine] Override fetch warning:', err.message);
    }
  }

  const effectiveSchedules = todaySchedules.map(base => {
    const override = overridesMap.get(base.id);
    const isCancelled = override?.cancelled === true || override?.isCancelled === true;
    const effectiveStartTime = override?.newStartTime || base.startTime;
    const effectiveEndTime = override?.newEndTime || base.endTime;
    const effectiveRoomCode = override?.newRoomCode || base.roomCode;
    const effectiveLecturer = override?.newLecturerName || base.lecturerName;
    const startMinutes = parseTimeToMinutes(effectiveStartTime);
    const minutesUntilClass = startMinutes - totalMinutes;
    const shouldSend = !isCancelled && shouldSendReminder(startMinutes, totalMinutes);

    return {
      ...base,
      effectiveStartTime,
      effectiveEndTime,
      effectiveRoomCode,
      effectiveLecturer,
      startMinutes,
      minutesUntilClass,
      isCancelled,
      shouldSend,
      hasOverride: !!override
    };
  });

  report.effective_schedules = effectiveSchedules;

  const upcomingSchedules = effectiveSchedules
    .filter(s => !s.isCancelled && s.startMinutes > totalMinutes)
    .sort((a, b) => a.startMinutes - b.startMinutes);

  if (upcomingSchedules.length > 0) {
    const next = upcomingSchedules[0];
    report.next_candidate = {
      courseName: next.courseName,
      startTime: next.effectiveStartTime,
      roomCode: next.effectiveRoomCode,
      lecturer: next.effectiveLecturer,
      minutesUntilClass: next.minutesUntilClass,
      expectedReminderTime: formatMinutesToTime(Math.max(0, next.startMinutes - 10))
    };
  }

  const targetDevices = [];
  if (db) {
    try {
      const devicesSnap = await db.collection('devices')
        .where('classId', '==', 'trjt-3a')
        .where('active', '==', true)
        .where('reminderEnabled', '==', true)
        .get();

      if (!devicesSnap.empty) {
        devicesSnap.forEach(doc => {
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
      }
    } catch (e) {
      console.warn('[ReminderEngine] Error fetching devices:', e.message);
    }
  }

  report.devices_count = targetDevices.length;

  const candidatesToSend = effectiveSchedules.filter(s => s.shouldSend);
  report.reminder_candidates = candidatesToSend.map(c => ({
    id: c.id,
    courseName: c.courseName,
    startTime: c.effectiveStartTime,
    minutesUntilClass: c.minutesUntilClass
  }));

  for (const schedule of candidatesToSend) {
    const deduplicationKey = `${schedule.id}_${dateStr}_reminder10`;

    if (dryRun) {
      report.send_success += targetDevices.length;
      continue;
    }

    if (!db || targetDevices.length === 0) {
      continue;
    }

    const logRef = db.collection('notificationLogs').doc(deduplicationKey);
    let lockAcquired = false;

    try {
      await db.runTransaction(async (transaction) => {
        const logDoc = await transaction.get(logRef);
        if (logDoc.exists) {
          const data = logDoc.data();
          if (data.status === 'sent') {
            return;
          }
          if (data.status === 'processing' && data.lockedAt) {
            const lockedTime = data.lockedAt.toDate ? data.lockedAt.toDate().getTime() : new Date(data.lockedAt).getTime();
            if (Date.now() - lockedTime < 120000) {
              return;
            }
          }
        }

        transaction.set(logRef, {
          scheduleId: schedule.id,
          date: dateStr,
          type: 'h10_reminder',
          status: 'processing',
          lockedAt: adminInstance.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        lockAcquired = true;
      });
    } catch (lockErr) {
      console.warn(`[ReminderEngine] Transaction lock error for ${schedule.id}:`, lockErr.message);
      lockAcquired = false;
    }

    if (!lockAcquired) {
      report.duplicate_skipped++;
      continue;
    }

    const title = '🔔 Kelas 10 Menit Lagi';
    const body = `${schedule.courseName} · ${schedule.effectiveStartTime.replace(':', '.')} · Ruang ${schedule.effectiveRoomCode}`;

    const multicastPayload = {
      notification: { title, body },
      data: {
        type: 'REMINDER_H10',
        scheduleId: schedule.id,
        courseName: schedule.courseName,
        lecturer: schedule.effectiveLecturer,
        room: schedule.effectiveRoomCode,
        startTime: schedule.effectiveStartTime,
        targetUrl: './index.html'
      },
      tokens: targetDevices.map(d => d.token)
    };

    let pushSuccess = 0;
    let pushFailed = 0;
    const invalidDocIds = [];

    try {
      const messaging = getMessaging();
      if (messaging) {
        const fcmResponse = await messaging.sendEachForMulticast(multicastPayload);
        pushSuccess = fcmResponse.successCount;
        pushFailed = fcmResponse.failureCount;

        if (fcmResponse.failureCount > 0) {
          fcmResponse.responses.forEach((resp, idx) => {
            if (!resp.success && resp.error) {
              const code = resp.error.code;
              if (
                code === 'messaging/registration-token-not-registered' ||
                code === 'messaging/invalid-registration-token' ||
                code === 'messaging/invalid-argument'
              ) {
                invalidDocIds.push(targetDevices[idx].docId);
              }
            }
          });
        }
      }
    } catch (fcmErr) {
      console.error(`[ReminderEngine] Multicast error for ${schedule.id}:`, fcmErr);
    }

    if (invalidDocIds.length > 0) {
      try {
        const batch = db.batch();
        invalidDocIds.forEach(id => {
          batch.update(db.collection('devices').doc(id), { active: false });
        });
        await batch.commit();
      } catch (e) {}
    }

    try {
      await logRef.set({
        scheduleId: schedule.id,
        courseName: schedule.courseName,
        lecturer: schedule.effectiveLecturer,
        room: schedule.effectiveRoomCode,
        startTime: schedule.effectiveStartTime,
        date: dateStr,
        sentAt: adminInstance.firestore.FieldValue.serverTimestamp(),
        recipientsCount: pushSuccess,
        failureCount: pushFailed,
        status: 'sent'
      }, { merge: true });
    } catch (e) {}

    report.send_success += pushSuccess;
    report.send_failed += pushFailed;
  }

  if (db && !dryRun) {
    try {
      await db.collection('systemStatus').doc('reminderScheduler').set({
        status: 'ACTIVE',
        lastRun: adminInstance.firestore.FieldValue.serverTimestamp(),
        lastRunJakarta: `${dateStr} ${timeStr} WIB`,
        activeDevicesCount: targetDevices.length,
        nextExpectedClass: report.next_candidate?.courseName || 'Tidak Ada Kuliah Lagi Hari Ini',
        nextExpectedTime: report.next_candidate?.startTime || '-',
        nextExpectedReminder: report.next_candidate?.expectedReminderTime || '-',
        lastResult: {
          candidatesEvaluated: candidatesToSend.length,
          sendSuccess: report.send_success,
          sendFailed: report.send_failed,
          duplicatesSkipped: report.duplicate_skipped
        },
        source: 'vercel-serverless-scheduler'
      }, { merge: true });
    } catch (e) {}
  }

  return report;
}
