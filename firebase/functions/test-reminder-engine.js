/**
 * TRJT 3A REMINDER — Comprehensive Reminder Engine Automated Test Suite
 * Tests all 8 edge cases, time calculations, tolerance window, duplicate skipping,
 * cancellations, overrides, and Jakarta timezone matching.
 */

const {
  getJakartaNow,
  parseTimeToMinutes,
  formatMinutesToTime,
  shouldSendReminder,
  runClassReminderCheck
} = require('./reminder-engine');

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

// Mock Firestore Implementation for In-Memory Unit Testing
function createMockFirestore(initialData = {}) {
  const store = {
    schedules: new Map(initialData.schedules || []),
    scheduleOverrides: new Map(initialData.scheduleOverrides || []),
    devices: new Map(initialData.devices || []),
    notificationLogs: new Map(initialData.notificationLogs || []),
    systemStatus: new Map()
  };

  const createCollectionRef = (collectionName) => {
    return {
      doc: (docId) => ({
        get: async () => ({
          exists: store[collectionName]?.has(docId),
          data: () => store[collectionName]?.get(docId)
        }),
        set: async (data, options = {}) => {
          if (!store[collectionName]) store[collectionName] = new Map();
          if (options.merge && store[collectionName].has(docId)) {
            const existing = store[collectionName].get(docId);
            store[collectionName].set(docId, { ...existing, ...data });
          } else {
            store[collectionName].set(docId, data);
          }
        }
      }),
      where: function(field, op, value) {
        const filters = [{ field, op, value }];
        const chain = {
          where: (f, o, v) => {
            filters.push({ field: f, op: o, value: v });
            return chain;
          },
          get: async () => {
            const map = store[collectionName] || new Map();
            const docs = [];
            for (const [id, data] of map.entries()) {
              let match = true;
              for (const filter of filters) {
                if (filter.op === '==' && data[filter.field] !== filter.value) {
                  match = false;
                  break;
                }
              }
              if (match) {
                docs.push({
                  id,
                  data: () => data
                });
              }
            }
            return {
              empty: docs.length === 0,
              docs,
              forEach: (fn) => docs.forEach(fn)
            };
          }
        };
        return chain;
      }
    };
  };

  return {
    collection: (name) => createCollectionRef(name),
    runTransaction: async (updateFn) => {
      const transaction = {
        get: async (docRef) => docRef.get(),
        set: async (docRef, data, opts) => docRef.set(data, opts)
      };
      return await updateFn(transaction);
    },
    batch: () => ({
      update: (docRef, data) => docRef.set(data, { merge: true }),
      commit: async () => {}
    }),
    _store: store
  };
}

async function runAllTests() {
  console.log('\n======================================================');
  console.log('🚀 RUNNING TRJT 3A REMINDER ENGINE VERIFICATION SUITE');
  console.log('======================================================\n');

  // --- UNIT TEST 1: Time Parsing & Normalization ---
  console.log('Test Group 1: Time Parsing & Normalization');
  assert(parseTimeToMinutes('07:30') === 450, 'Parse 07:30 is 450 minutes');
  assert(parseTimeToMinutes('07.30') === 450, 'Parse dot format 07.30 is 450 minutes');
  assert(parseTimeToMinutes('10:20') === 620, 'Parse 10:20 is 620 minutes');
  assert(parseTimeToMinutes('10.20') === 620, 'Parse dot format 10.20 is 620 minutes');
  assert(parseTimeToMinutes('12.50') === 770, 'Parse 12.50 is 770 minutes');
  assert(formatMinutesToTime(620) === '10:20', 'Format 620 min is 10:20');
  assert(formatMinutesToTime(610) === '10:10', 'Format 610 min is 10:10');

  // --- UNIT TEST 2: Tolerance Window Logic ---
  console.log('\nTest Group 2: Tolerance Window (0 < t <= 10)');
  // Class at 10:20 (620)
  // At 10:09 (609) -> 11 min before
  assert(shouldSendReminder(609, 620, 10).shouldSend === false, '10:09 (11m before): Should NOT send');
  // At 10:10 (610) -> 10 min before
  assert(shouldSendReminder(610, 620, 10).shouldSend === true, '10:10 (10m before): Should SEND');
  assert(shouldSendReminder(610, 620, 10).minutesUntilClass === 10, '10:10: minutesUntilClass is 10');
  // At 10:11 (611) -> 9 min before (delayed scheduler)
  assert(shouldSendReminder(611, 620, 10).shouldSend === true, '10:11 (9m before, tolerance): Should SEND');
  assert(shouldSendReminder(611, 620, 10).minutesUntilClass === 9, '10:11: minutesUntilClass is 9');
  // At 10:19 (619) -> 1 min before
  assert(shouldSendReminder(619, 620, 10).shouldSend === true, '10:19 (1m before): Should SEND');
  // At 10:20 (620) -> 0 min (Class started)
  assert(shouldSendReminder(620, 620, 10).shouldSend === false, '10:20 (0m before, class started): Should NOT send H-10');
  // At 10:25 (625) -> -5 min (Class ongoing)
  assert(shouldSendReminder(625, 620, 10).shouldSend === false, '10:25 (ongoing): Should NOT send H-10');

  // --- TEST SCENARIO SIMULATION WITH FAKE TIME ---
  console.log('\nTest Group 3: Real Schedule Scenarios (Section 21 Requirements)');

  const mockSchedules = [
    ['senin-praktikum-antena-dan-propagasi', {
      classId: 'trjt-3a',
      dayOfWeek: 1,
      courseName: 'Praktikum Antena dan Propagasi',
      startTime: '07:30',
      endTime: '10:00',
      roomCode: 'L10',
      lecturerName: 'Ipan Suandi, S.T., M.T.',
      active: true
    }],
    ['senin-jaringan-komputer-lanjut', {
      classId: 'trjt-3a',
      dayOfWeek: 1,
      courseName: 'Jaringan Komputer Lanjut',
      startTime: '10:20',
      endTime: '12:00',
      roomCode: 'R16',
      lecturerName: 'Muhammad Syahroni, S.T., M.T.',
      active: true
    }]
  ];

  const mockDevices = [
    ['dev-1', { classId: 'trjt-3a', token: 'fcm-token-alpha-1234567890', active: true, reminderEnabled: true, platform: 'Android' }],
    ['dev-2', { classId: 'trjt-3a', token: 'fcm-token-beta-1234567890', active: true, reminderEnabled: true, platform: 'iOS' }],
    ['dev-3', { classId: 'trjt-3a', token: 'fcm-token-gamma-1234567890', active: false, reminderEnabled: true, platform: 'Android' }], // Inactive
    ['dev-4', { classId: 'trjt-3a', token: 'fcm-token-delta-1234567890', active: true, reminderEnabled: false, platform: 'Android' }] // Disabled
  ];

  // Test 1: Senin 07.19 -> Expected: Do NOT send
  const mockDb1 = createMockFirestore({ schedules: mockSchedules, devices: mockDevices });
  const fakeTime1 = new Date('2026-08-24T07:19:00+07:00'); // Senin 07:19 WIB
  const res1 = await runClassReminderCheck(mockDb1, { customTime: fakeTime1, dryRun: true });
  assert(res1.reminder_candidates.length === 0, 'Test 1: Senin 07.19 -> 0 candidates matching');

  // Test 2: Senin 07.20 -> Expected: SEND (Praktikum Antena starts 07.30)
  const mockDb2 = createMockFirestore({ schedules: mockSchedules, devices: mockDevices });
  const fakeTime2 = new Date('2026-08-24T07:20:00+07:00'); // Senin 07:20 WIB
  const res2 = await runClassReminderCheck(mockDb2, { customTime: fakeTime2, dryRun: true });
  assert(res2.reminder_candidates.length === 1, 'Test 2: Senin 07.20 -> Match found for Praktikum Antena');
  assert(res2.reminder_candidates[0].courseName === 'Praktikum Antena dan Propagasi', 'Test 2: Course is Praktikum Antena');
  assert(res2.reminder_candidates[0].minutesUntilClass === 10, 'Test 2: Exactly 10 minutes until class');

  // Test 3: Senin 07.21 with existing log -> Expected: SKIP duplicate
  const mockLogs3 = [
    ['senin-praktikum-antena-dan-propagasi_2026-08-24_reminder10', { status: 'sent', sentAt: new Date() }]
  ];
  const mockDb3 = createMockFirestore({ schedules: mockSchedules, devices: mockDevices, notificationLogs: mockLogs3 });
  const fakeTime3 = new Date('2026-08-24T07:21:00+07:00'); // Senin 07:21 WIB
  const res3 = await runClassReminderCheck(mockDb3, { customTime: fakeTime3, dryRun: false });
  assert(res3.duplicate_skipped === 1, 'Test 3: Senin 07.21 -> Duplicate correctly skipped');

  // Test 4: Senin 10.10 -> Expected: Match found for Jaringan Komputer Lanjut (starts 10.20)
  const mockDb4 = createMockFirestore({ schedules: mockSchedules, devices: mockDevices });
  const fakeTime4 = new Date('2026-08-24T10:10:00+07:00'); // Senin 10:10 WIB
  const res4 = await runClassReminderCheck(mockDb4, { customTime: fakeTime4, dryRun: true });
  assert(res4.reminder_candidates.length === 1, 'Test 4: Senin 10.10 -> Match found for Jaringan Komputer Lanjut');
  assert(res4.reminder_candidates[0].courseName === 'Jaringan Komputer Lanjut', 'Test 4: Course is Jaringan Komputer Lanjut');
  assert(res4.reminder_candidates[0].minutesUntilClass === 10, 'Test 4: Exactly 10 minutes until class');

  // Test 5: Senin 10.11 (Scheduler delay 1 min) -> Expected: SEND within tolerance window (9 min before)
  const mockDb5 = createMockFirestore({ schedules: mockSchedules, devices: mockDevices });
  const fakeTime5 = new Date('2026-08-24T10:11:00+07:00'); // Senin 10:11 WIB
  const res5 = await runClassReminderCheck(mockDb5, { customTime: fakeTime5, dryRun: true });
  assert(res5.reminder_candidates.length === 1, 'Test 5: Senin 10.11 -> Tolerates 1-min delay (9m before)');
  assert(res5.reminder_candidates[0].minutesUntilClass === 9, 'Test 5: minutesUntilClass is 9');

  // Test 6: Senin 10.20 -> Expected: Do NOT send H-10 after class starts
  const mockDb6 = createMockFirestore({ schedules: mockSchedules, devices: mockDevices });
  const fakeTime6 = new Date('2026-08-24T10:20:00+07:00'); // Senin 10:20 WIB
  const res6 = await runClassReminderCheck(mockDb6, { customTime: fakeTime6, dryRun: true });
  assert(res6.reminder_candidates.length === 0, 'Test 6: Senin 10.20 -> 0 candidates (Class started, no late H-10)');

  // Test 7: Schedule Override (Rescheduled from 10.20 to 13.30)
  const mockOverrides7 = [
    ['override-1', {
      scheduleId: 'senin-jaringan-komputer-lanjut',
      date: '2026-08-24',
      newStartTime: '13:30',
      newEndTime: '15:10',
      newRoomCode: 'R18'
    }]
  ];
  const mockDb7 = createMockFirestore({ schedules: mockSchedules, devices: mockDevices, scheduleOverrides: mockOverrides7 });
  // At 10:10 (normal time) -> Should NOT send
  const res7a = await runClassReminderCheck(mockDb7, { customTime: new Date('2026-08-24T10:10:00+07:00'), dryRun: true });
  assert(res7a.reminder_candidates.length === 0, 'Test 7a: 10:10 with 13:30 override -> Should NOT send at 10:10');
  // At 13:20 (new overridden H-10 time) -> Should SEND
  const res7b = await runClassReminderCheck(mockDb7, { customTime: new Date('2026-08-24T13:20:00+07:00'), dryRun: true });
  assert(res7b.reminder_candidates.length === 1, 'Test 7b: 13:20 -> Sends at overridden H-10 time');
  assert(res7b.reminder_candidates[0].effectiveRoomCode === 'R18', 'Test 7b: Overridden room R18 is used');

  // Test 8: Cancellation (cancelled = true)
  const mockOverrides8 = [
    ['override-cancel', {
      scheduleId: 'senin-jaringan-komputer-lanjut',
      date: '2026-08-24',
      cancelled: true
    }]
  ];
  const mockDb8 = createMockFirestore({ schedules: mockSchedules, devices: mockDevices, scheduleOverrides: mockOverrides8 });
  const res8 = await runClassReminderCheck(mockDb8, { customTime: new Date('2026-08-24T10:10:00+07:00'), dryRun: true });
  assert(res8.reminder_candidates.length === 0, 'Test 8: Cancelled class -> 0 candidates');
  assert(res8.cancelled_skipped === 1, 'Test 8: cancelled_skipped counter incremented');

  console.log('\n======================================================');
  console.log(`🎉 ALL TESTS COMPLETED: ${passedTests} / ${totalTests} PASSED!`);
  console.log('======================================================\n');
}

runAllTests().catch(err => {
  console.error('Fatal Test Suite Failure:', err);
  process.exit(1);
});
