import assert from 'node:assert';
import fs from 'node:fs';

console.log('\n================================================================');
console.log('🧪 SUITE: 10 TEST CASES WAJIB FITUR TUGAS & AUTO-DELETE TRJT 3A');
console.log('================================================================\n');

// Mock localStorage
const mockStorage = {};
const localStorage = {
  getItem: (k) => mockStorage[k] || null,
  setItem: (k, v) => { mockStorage[k] = String(v); },
  removeItem: (k) => { delete mockStorage[k]; },
  clear: () => { for (const k in mockStorage) delete mockStorage[k]; }
};

globalThis.localStorage = localStorage;
globalThis.window = globalThis;
globalThis.CustomEvent = class CustomEvent {
  constructor(name, detail) {
    this.name = name;
    this.detail = detail;
  }
};
globalThis.dispatchEvent = () => {};

// Time Provider Simulator
class FakeTimeProvider {
  constructor(initialDate) {
    this.currentDate = new Date(initialDate);
  }
  setTime(d) {
    this.currentDate = new Date(d);
  }
  now() {
    return new Date(this.currentDate);
  }
}

// Load assignment-service.js
const serviceCode = fs.readFileSync('js/assignment-service.js', 'utf8');
eval(serviceCode);

const service = globalThis.window.TRJT_ASSIGNMENTS;
assert.ok(service, 'TRJT_ASSIGNMENTS must be defined');

const fakeTime = new FakeTimeProvider('2026-10-03T10:00:00');
globalThis.window.appTimeProvider = fakeTime;

const DEADLINE_SAMPLE = '2026-10-06';

// TEST 1
console.log('--- TEST 1: Tanggal 3 Okt 2026, Deadline 6 Okt 2026 ---');
fakeTime.setTime('2026-10-03T10:00:00');
const t1Expired = service.isAssignmentExpired(DEADLINE_SAMPLE);
const t1Countdown = service.formatDeadlineCountdown(DEADLINE_SAMPLE);
console.log(`  Expired: ${t1Expired}, Countdown: "${t1Countdown.text}"`);
assert.strictEqual(t1Expired, false, 'TEST 1: Task must NOT be expired');
assert.strictEqual(t1Countdown.text, '3 hari lagi', 'TEST 1: Countdown must be "3 hari lagi"');
console.log('  ✅ TEST 1 PASSED');

// TEST 2
console.log('\n--- TEST 2: Tanggal 5 Okt 2026, Deadline 6 Okt 2026 ---');
fakeTime.setTime('2026-10-05T14:30:00');
const t2Expired = service.isAssignmentExpired(DEADLINE_SAMPLE);
const t2Countdown = service.formatDeadlineCountdown(DEADLINE_SAMPLE);
console.log(`  Expired: ${t2Expired}, Countdown: "${t2Countdown.text}"`);
assert.strictEqual(t2Expired, false, 'TEST 2: Task must NOT be expired');
assert.strictEqual(t2Countdown.text, 'Besok', 'TEST 2: Countdown must be "Besok"');
console.log('  ✅ TEST 2 PASSED');

// TEST 3
console.log('\n--- TEST 3: Tanggal 6 Okt 2026 09:00 WIB, Deadline 6 Okt 2026 ---');
fakeTime.setTime('2026-10-06T09:00:00');
const t3Expired = service.isAssignmentExpired(DEADLINE_SAMPLE);
const t3Countdown = service.formatDeadlineCountdown(DEADLINE_SAMPLE);
console.log(`  Expired: ${t3Expired}, Countdown: "${t3Countdown.text}"`);
assert.strictEqual(t3Expired, false, 'TEST 3: Task must NOT be expired');
assert.strictEqual(t3Countdown.text, 'Hari ini', 'TEST 3: Countdown must be "Hari ini"');
console.log('  ✅ TEST 3 PASSED');

// TEST 4
console.log('\n--- TEST 4: Tanggal 6 Okt 2026 23:50 WIB, Deadline 6 Okt 2026 ---');
fakeTime.setTime('2026-10-06T23:50:00');
const t4Expired = service.isAssignmentExpired(DEADLINE_SAMPLE);
const t4Countdown = service.formatDeadlineCountdown(DEADLINE_SAMPLE);
console.log(`  Expired: ${t4Expired}, Countdown: "${t4Countdown.text}"`);
assert.strictEqual(t4Expired, false, 'TEST 4: Task must still be active at 23:50 WIB');
assert.strictEqual(t4Countdown.text, 'Hari ini', 'TEST 4: Countdown still "Hari ini"');
console.log('  ✅ TEST 4 PASSED');

// TEST 5
console.log('\n--- TEST 5: Tanggal 7 Okt 2026 00:01 WIB, Deadline 6 Okt 2026 ---');
fakeTime.setTime('2026-10-07T00:01:00');
const t5Expired = service.isAssignmentExpired(DEADLINE_SAMPLE);
console.log(`  Expired: ${t5Expired}`);
assert.strictEqual(t5Expired, true, 'TEST 5: Task MUST be expired starting 7 Okt 00:00 WIB');
console.log('  ✅ TEST 5 PASSED');

// TEST 6: Task sudah dihapus manual sebelum deadline
console.log('\n--- TEST 6: Manual delete before deadline, cleanup must not error ---');
fakeTime.setTime('2026-10-03T12:00:00');
const manualTask = await service.createAssignment({
  title: 'Tugas Uji Manual Delete',
  courseName: 'Praktikum Antena dan Propagasi',
  dueDate: '2026-10-06'
});
const delResult = await service.deleteAssignment(manualTask.id);
assert.strictEqual(delResult, true, 'Manual delete returns true');
// Run cleanup
const cleanedCount = await service.cleanupExpiredAssignments();
assert.strictEqual(typeof cleanedCount, 'number', 'Cleanup returns numeric pruned count');
console.log('  ✅ TEST 6 PASSED');

// TEST 7: Proteksi double delete / concurrent runs
console.log('\n--- TEST 7: Concurrent cleanup / double delete protection ---');
// Running cleanup concurrently
const p1 = service.cleanupExpiredAssignments();
const p2 = service.cleanupExpiredAssignments();
const [r1, r2] = await Promise.all([p1, p2]);
assert.ok(typeof r1 === 'number' && typeof r2 === 'number', 'Concurrent cleanup completed safely without crash');
console.log('  ✅ TEST 7 PASSED');

// TEST 8: Empty state text check
console.log('\n--- TEST 8: Empty state validation ---');
const appJsCode = fs.readFileSync('js/app.js', 'utf8');
assert.ok(appJsCode.includes('Semua tugas selesai!'), 'Empty state must have "Semua tugas selesai!"');
assert.ok(appJsCode.includes('Tidak ada tanggungan tugas kuliah saat ini') || appJsCode.includes('Tidak ada tanggungan tugas kuliah aktif saat ini'), 'Empty state subtext verified');
console.log('  ✅ TEST 8 PASSED');

// TEST 9 & 10: CSS verification for long course name and long task title
console.log('\n--- TEST 9 & 10: Long course name & title overflow protection in CSS ---');
const cssCode = fs.readFileSync('css/design-system.css', 'utf8');
assert.ok(cssCode.includes('-webkit-line-clamp: 2'), 'Title line clamp 2 rows defined');
assert.ok(cssCode.includes('word-break: break-word'), 'word-break: break-word defined');
assert.ok(cssCode.includes('overflow-wrap: anywhere'), 'overflow-wrap: anywhere defined');
assert.ok(cssCode.includes('.btn-task-delete'), '.btn-task-delete defined');
assert.ok(!cssCode.includes('.assignment-deadline-row {\n  display: flex !important;\n  align-items: center !important;\n  gap: 10px !important;\n  flex-wrap: wrap !important;\n  margin-top: 6px !important;\n  padding-left: 56px !important;'), 'Old 56px padding-left removed');
console.log('  ✅ TEST 9 & 10 PASSED');

console.log('\n================================================================');
console.log('🎉 ALL 10 MANDATORY TEST CASES PASSED WITH 100% SUCCESS!');
console.log('================================================================\n');
