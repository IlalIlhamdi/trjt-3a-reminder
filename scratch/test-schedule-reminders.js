import { runH10ReminderCheck, OFFICIAL_SCHEDULES, parseTimeToMinutes } from '../lib/reminder-engine.js';
import { getMessaging, getFirestoreDb } from '../lib/firebase-admin-init.js';

async function testH10System() {
  console.log('====================================================');
  console.log('⏰ EVALUASI SISTEM PENGINGAT OTOMATIS H-10 KELAS');
  console.log('====================================================\n');

  // 1. Cek Realtime Saat Ini
  console.log('--- 1. Pemeriksaan Waktu Nyata Saat Ini ---');
  const realReport = await runH10ReminderCheck({ dryRun: true });
  console.log('Waktu Server Jakarta:', realReport.jakarta_now);
  console.log('Perangkat Terdaftar Aktif:', realReport.devices_count);
  console.log('Kuliah Hari Ini yang Selesai:', realReport.effective_schedules.length);
  if (realReport.next_candidate) {
    console.log('Kuliah Selanjutnya:', realReport.next_candidate);
  } else {
    console.log('Status Jadwal Hari Ini: Seluruh jadwal perkuliahan hari ini sudah selesai.');
  }

  // 2. Simulasi H-10 untuk Besok (Rabu 07.20 WIB -> 10 Menit Sebelum Kelas 07.30)
  console.log('\n--- 2. Simulasi H-10: Rabu Pukul 07.20 WIB (Pra-Kuliah 07.30) ---');
  const simulatedTimeRabu = {
    dateStr: '2026-08-26',
    timeStr: '07:20',
    dayOfWeek: 3, // Rabu
    totalMinutes: parseTimeToMinutes('07:20')
  };

  const simReport = await runH10ReminderCheck({
    simulatedJakartaTime: simulatedTimeRabu,
    dryRun: true
  });

  console.log('Target Mata Kuliah:', simReport.reminder_candidates);
  console.log('Jumlah HP Mahasiswa yang akan menerima:', simReport.devices_count);

  // 3. Mengirimkan Notifikasi Demo Format H-10 Persis Seperti yang Diterima Mahasiswa
  console.log('\n--- 3. Mengirim Contoh Notifikasi H-10 Resmi ke HP Anda ---');
  const messaging = getMessaging();
  const db = getFirestoreDb();

  const snap = await db.collection('devices')
    .where('classId', '==', 'trjt-3a')
    .where('active', '==', true)
    .where('reminderEnabled', '==', true)
    .get();

  let sent = 0;
  for (const doc of snap.docs) {
    const d = doc.data();
    if (d.token && d.token.includes(':APA91b')) {
      console.log(`Mengirim format H-10 ke ${d.platform}...`);
      const res = await messaging.send({
        token: d.token,
        notification: {
          title: '🔔 Kelas 10 Menit Lagi',
          body: 'Sistem Komunikasi Optik · 07.30 · Ruang R18 (Ir. Yuliana Tri Asri, S.T., M.Eng.)'
        },
        data: {
          type: 'REMINDER_H10',
          scheduleId: 'rabu-sistem-komunikasi-optik',
          courseName: 'Sistem Komunikasi Optik',
          lecturer: 'Ir. Yuliana Tri Asri, S.T., M.Eng.',
          room: 'R18',
          startTime: '07:30',
          targetUrl: './index.html'
        },
        webpush: {
          headers: {
            Urgency: 'high'
          },
          notification: {
            title: '🔔 Kelas 10 Menit Lagi',
            body: 'Sistem Komunikasi Optik · 07.30 · Ruang R18 (Ir. Yuliana Tri Asri, S.T., M.Eng.)',
            tag: 'rabu-sistem-komunikasi-optik-h10',
            renotify: true,
            requireInteraction: true
          },
          fcmOptions: {
            link: './index.html'
          }
        }
      });
      console.log(`✅ SUKSES terkirim ke ${d.platform}: ${res}`);
      sent++;
    }
  }
  console.log(`\n🎉 Selesai! ${sent} notifikasi contoh H-10 telah dikirimkan.`);
}

testH10System();
