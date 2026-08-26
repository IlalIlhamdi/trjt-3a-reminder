/**
 * Comprehensive Test Suite for TRJT 3A H-10 Automated Reminder Engine
 * Testing all 8 required scenarios from user requirements.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Setup Mock DOM & Browser Environment
function createMockEnvironment() {
  const localStorageStore = {};

  const localStorage = {
    getItem: (key) => (key in localStorageStore ? localStorageStore[key] : null),
    setItem: (key, val) => { localStorageStore[key] = String(val); },
    removeItem: (key) => { delete localStorageStore[key]; },
    clear: () => { Object.keys(localStorageStore).forEach(k => delete localStorageStore[k]); }
  };

  const notificationCalls = [];
  class MockNotification {
    constructor(title, options) {
      notificationCalls.push({ title, options, type: 'native' });
    }
    static permission = 'granted';
    static requestPermission = async () => 'granted';
  }

  const swNotificationCalls = [];
  const serviceWorkerRegistration = {
    showNotification: async (title, options) => {
      swNotificationCalls.push({ title, options, type: 'sw' });
    }
  };

  const navigator = {
    userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
    platform: 'Linux armv8l',
    serviceWorker: {
      ready: Promise.resolve(serviceWorkerRegistration),
      register: async () => serviceWorkerRegistration
    }
  };

  function createMockElement() {
    return {
      innerText: '',
      innerHTML: '',
      style: {},
      addEventListener: () => {},
      classList: { add: () => {}, remove: () => {} },
      appendChild: () => {},
      remove: () => {},
      querySelectorAll: () => [],
      querySelector: () => null,
      getAttribute: () => null
    };
  }

  const elementMap = {};

  const document = {
    readyState: 'complete',
    getElementById: (id) => {
      if (!elementMap[id]) elementMap[id] = createMockElement();
      return elementMap[id];
    },
    querySelectorAll: () => [],
    querySelector: () => null,
    addEventListener: () => {},
    createElement: () => createMockElement()
  };

  const window = {
    localStorage,
    Notification: MockNotification,
    navigator,
    document,
    addEventListener: () => {},
    dispatchEvent: () => {},
    scrollTo: () => {},
    setInterval: () => {},
    setTimeout: (fn) => fn(),
    lucide: { createIcons: () => {} }
  };

  return { window, localStorage, localStorageStore, MockNotification, notificationCalls, swNotificationCalls, document, navigator };
}

async function runTests() {
  console.log('====================================================');
  console.log('🧪 RUNNING COMPREHENSIVE H-10 AUTOMATED TESTS');
  console.log('====================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, message) {
    totalTests++;
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passedTests++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      throw new Error(`Test failed: ${message}`);
    }
  }

  // Load app.js and data.js and time-provider.js
  const appJsCode = fs.readFileSync(path.resolve(__dirname, '../js/app.js'), 'utf-8');
  const dataJsCode = fs.readFileSync(path.resolve(__dirname, '../js/data.js'), 'utf-8');
  const timeProviderJsCode = fs.readFileSync(path.resolve(__dirname, '../js/time-provider.js'), 'utf-8');

  function initAppInEnv(mockEnv, customTime) {
    const sandbox = {
      window: mockEnv.window,
      document: mockEnv.document,
      navigator: mockEnv.navigator,
      localStorage: mockEnv.localStorage,
      Notification: mockEnv.MockNotification,
      console: console
    };

    // Evaluate time-provider.js
    const runTimeProvider = new Function('window', 'document', 'navigator', 'localStorage', 'Notification', timeProviderJsCode);
    runTimeProvider(sandbox.window, sandbox.document, sandbox.navigator, sandbox.localStorage, sandbox.Notification);

    // Set custom time provider if provided
    if (customTime) {
      sandbox.window.appTimeProvider = new sandbox.window.FakeTimeProvider(customTime);
    }

    // Evaluate data.js
    const runData = new Function('window', 'document', 'navigator', 'localStorage', 'Notification', dataJsCode);
    runData(sandbox.window, sandbox.document, sandbox.navigator, sandbox.localStorage, sandbox.Notification);

    // Evaluate app.js
    const runApp = new Function('window', 'document', 'navigator', 'localStorage', 'Notification', appJsCode);
    runApp(sandbox.window, sandbox.document, sandbox.navigator, sandbox.localStorage, sandbox.Notification);

    return sandbox.window;
  }

  // =========================================================================
  // SCENARIO 1: Pukul 10.09.59 (Senin 24 Agustus 2026, 10:09:59)
  // Kelas 10:20 -> Sisa 10m 1s -> H-10 belum aktif -> Reminder belum dibuat.
  // =========================================================================
  console.log('📌 Test 1: Pukul 10.09.59 (H-10 belum aktif)');
  {
    const env = createMockEnvironment();
    const time10_09_59 = new Date(2026, 7, 24, 10, 9, 59); // Senin
    const win = initAppInEnv(env, time10_09_59);

    const scheduleData = win.evaluateScheduleState(win.appTimeProvider, win.TRJT_SCHEDULE);
    assert(scheduleData.isH10 === false, 'isH10 harus false pada 10.09.59');
    assert(scheduleData.nextUpcomingClass?.startTime === '10:20', 'nextUpcomingClass adalah kelas 10:20');

    await win.processH10Reminder(scheduleData);

    assert(env.swNotificationCalls.length === 0, 'Service worker notification TIDAK boleh dipanggil');
    assert(env.notificationCalls.length === 0, 'Native notification TIDAK boleh dipanggil');
    assert(!env.localStorage.getItem('trjt_h10_fired_v1'), 'LocalStorage trjt_h10_fired_v1 belum ada');
  }

  // =========================================================================
  // SCENARIO 2: Pukul 10.10.00 (Senin 24 Agustus 2026, 10:10:00)
  // Kelas 10:20 -> Tepat H-10 (600s) -> Reminder dibuat tepat 1 kali.
  // Catatan masuk ke Notifikasi. Notifikasi sistem Service Worker dipanggil.
  // =========================================================================
  console.log('\n📌 Test 2: Pukul 10.10.00 (Tepat H-10)');
  {
    const env = createMockEnvironment();
    const time10_10_00 = new Date(2026, 7, 24, 10, 10, 0); // Senin
    const win = initAppInEnv(env, time10_10_00);

    const scheduleData = win.evaluateScheduleState(win.appTimeProvider, win.TRJT_SCHEDULE);
    assert(scheduleData.isH10 === true, 'isH10 harus true pada 10.10.00');
    assert(scheduleData.countdownMs === 600000, 'countdownMs tepat 600000 ms (10 menit)');

    await win.processH10Reminder(scheduleData);

    assert(env.swNotificationCalls.length === 1, 'Service worker showNotification dipanggil tepat 1 kali');
    assert(env.swNotificationCalls[0].title.includes('Jaringan Komputer Lanjut'), 'Judul notifikasi memuat nama mata kuliah');
    assert(env.swNotificationCalls[0].options.tag === '2026-08-24|senin-jaringan-komputer-lanjut|10:20', 'Tag notifikasi sesuai format stabil YYYY-MM-DD|id|startTime');

    const firedList = JSON.parse(env.localStorage.getItem('trjt_h10_fired_v1'));
    assert(firedList.length === 1, 'LocalStorage trjt_h10_fired_v1 menyimpan 1 record');
    assert(firedList[0].key === '2026-08-24|senin-jaringan-komputer-lanjut|10:20', 'Kunci tersimpan sesuai');
  }

  // =========================================================================
  // SCENARIO 3: Pukul 10.10.01 sampai 10.19.59 (Tick berjalan setiap detik)
  // Tidak ada reminder duplikat.
  // =========================================================================
  console.log('\n📌 Test 3: Pukul 10.10.01 sampai 10.19.59 (Pencegahan duplikasi per detik)');
  {
    const env = createMockEnvironment();
    const time10_10_00 = new Date(2026, 7, 24, 10, 10, 0);
    const win = initAppInEnv(env, time10_10_00);

    // Pertama kali pada 10:10:00
    let sched = win.evaluateScheduleState(win.appTimeProvider, win.TRJT_SCHEDULE);
    await win.processH10Reminder(sched);
    assert(env.swNotificationCalls.length === 1, 'Panggilan pertama pada 10.10.00 berhasil');

    // Simulasikan 60 tick berturut-turut (10.10.01 sampai 10.11.00)
    for (let s = 1; s <= 60; s++) {
      win.appTimeProvider.setTime(new Date(2026, 7, 24, 10, 10, s));
      sched = win.evaluateScheduleState(win.appTimeProvider, win.TRJT_SCHEDULE);
      await win.processH10Reminder(sched);
    }

    assert(env.swNotificationCalls.length === 1, 'Setelah 60 tick, Service Worker tetap hanya dipanggil 1 kali (tidak ada duplikat)');
  }

  // =========================================================================
  // SCENARIO 4: Reload halaman pukul 10.15
  // Reminder tidak dibuat ulang karena riwayat tersimpan di localStorage.
  // =========================================================================
  console.log('\n📌 Test 4: Reload halaman pada pukul 10.15 (Persistence)');
  {
    const env = createMockEnvironment();
    // Simulasikan keadaan bahwa reminder sudah ditembakkan pada 10.10
    env.localStorage.setItem('trjt_h10_fired_v1', JSON.stringify([
      { key: '2026-08-24|senin-jaringan-komputer-lanjut|10:20', timestamp: Date.now() }
    ]));

    const time10_15_00 = new Date(2026, 7, 24, 10, 15, 0);
    const win = initAppInEnv(env, time10_15_00);

    const sched = win.evaluateScheduleState(win.appTimeProvider, win.TRJT_SCHEDULE);
    assert(sched.isH10 === true, 'isH10 tetap true pada rentang H-10');
    await win.processH10Reminder(sched);

    assert(env.swNotificationCalls.length === 0, 'Service Worker TIDAK dipanggil ulang setelah reload');
  }

  // =========================================================================
  // SCENARIO 5: Hari berikutnya untuk kelas yang sama (misal minggu depan Senin 31 Ags 2026)
  // Reminder dapat berjalan kembali karena tanggal berbeda.
  // =========================================================================
  console.log('\n📌 Test 5: Hari berikutnya untuk kelas yang sama (Next date)');
  {
    const env = createMockEnvironment();
    // Riwayat minggu lalu
    env.localStorage.setItem('trjt_h10_fired_v1', JSON.stringify([
      { key: '2026-08-24|senin-jaringan-komputer-lanjut|10:20', timestamp: Date.now() - 7 * 24 * 3600 * 1000 }
    ]));

    // Senin berikutnya (31 Agustus 2026 pukul 10.10.00)
    const timeNextWeek = new Date(2026, 7, 31, 10, 10, 0);
    const win = initAppInEnv(env, timeNextWeek);

    const sched = win.evaluateScheduleState(win.appTimeProvider, win.TRJT_SCHEDULE);
    await win.processH10Reminder(sched);

    assert(env.swNotificationCalls.length === 1, 'Reminder berhasil ditembakkan kembali pada tanggal berikutnya');
    assert(env.swNotificationCalls[0].options.tag === '2026-08-31|senin-jaringan-komputer-lanjut|10:20', 'Tag baru menggunakan tanggal 2026-08-31');
  }

  // =========================================================================
  // SCENARIO 6: Sakelar H-10 mati (h10Alert === false)
  // Tidak ada reminder internal maupun sistem.
  // =========================================================================
  console.log('\n📌 Test 6: Sakelar H-10 mati (h10Alert = false)');
  {
    const env = createMockEnvironment();
    env.localStorage.setItem('trjt_h10_enabled', 'false');

    const time10_10_00 = new Date(2026, 7, 24, 10, 10, 0);
    const win = initAppInEnv(env, time10_10_00);

    const sched = win.evaluateScheduleState(win.appTimeProvider, win.TRJT_SCHEDULE);
    await win.processH10Reminder(sched);

    assert(env.swNotificationCalls.length === 0, 'Tidak ada notifikasi sistem saat sakelar mati');
    assert(!env.localStorage.getItem('trjt_h10_fired_v1'), 'Tidak ada riwayat disimpan saat sakelar mati');
  }

  // =========================================================================
  // SCENARIO 7: Izin notifikasi ditolak (Notification.permission = 'denied')
  // Reminder internal tetap dibuat satu kali di tab notifikasi, tidak error.
  // =========================================================================
  console.log('\n📌 Test 7: Izin notifikasi ditolak (Notification.permission = denied)');
  {
    const env = createMockEnvironment();
    env.MockNotification.permission = 'denied';

    const time10_10_00 = new Date(2026, 7, 24, 10, 10, 0);
    const win = initAppInEnv(env, time10_10_00);

    const sched = win.evaluateScheduleState(win.appTimeProvider, win.TRJT_SCHEDULE);
    await win.processH10Reminder(sched);

    assert(env.swNotificationCalls.length === 0, 'Notifikasi sistem tidak dipanggil');
    const storedNotifs = JSON.parse(env.localStorage.getItem('trjt_notifications_v3') || '[]');
    assert(storedNotifs.some(n => n.subject === 'Jaringan Komputer Lanjut'), 'Catatan pengingat internal tetap tersimpan di Notifikasi');
  }

  // =========================================================================
  // SCENARIO 8: Dua kelas berbeda pada hari yang sama (Senin 07.20 dan 10.10)
  // Masing-masing memperoleh satu reminder berdasarkan ID dan jam mulai.
  // =========================================================================
  console.log('\n📌 Test 8: Dua kelas berbeda di hari yang sama');
  {
    const env = createMockEnvironment();
    const win = initAppInEnv(env, new Date(2026, 7, 24, 7, 20, 0)); // 07.20 (H-10 kelas 07.30)

    // Kelas 1 (Praktikum Antena 07.30)
    let sched1 = win.evaluateScheduleState(win.appTimeProvider, win.TRJT_SCHEDULE);
    assert(sched1.nextUpcomingClass?.startTime === '07:30', 'Kelas 1 adalah 07.30');
    await win.processH10Reminder(sched1);
    assert(env.swNotificationCalls.length === 1, 'Reminder kelas 1 berhasil');
    assert(env.swNotificationCalls[0].options.tag.includes('senin-praktikum-antena-dan-propagasi'), 'Tag kelas 1 sesuai');

    // Maju ke 10.10 (H-10 kelas 10.20)
    win.appTimeProvider.setTime(new Date(2026, 7, 24, 10, 10, 0));
    let sched2 = win.evaluateScheduleState(win.appTimeProvider, win.TRJT_SCHEDULE);
    assert(sched2.nextUpcomingClass?.startTime === '10:20', 'Kelas 2 adalah 10.20');
    await win.processH10Reminder(sched2);

    assert(env.swNotificationCalls.length === 2, 'Kedua kelas masing-masing mendapat reminder');
    assert(env.swNotificationCalls[1].options.tag.includes('senin-jaringan-komputer-lanjut'), 'Tag kelas 2 sesuai');

    const firedList = JSON.parse(env.localStorage.getItem('trjt_h10_fired_v1'));
    assert(firedList.length === 2, 'Riwayat menyimpan kedua kelas secara terpisah');
  }

  console.log('\n====================================================');
  console.log(`🎉 ALL ${passedTests}/${totalTests} TESTS PASSED SUCCESSFULLY!`);
  console.log('====================================================');
}

runTests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
