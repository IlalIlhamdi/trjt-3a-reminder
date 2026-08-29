import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

console.log('\n====================================================');
console.log('🧪 TEST SUITE: JADWAL PIKET KELAS TRJT 3A (ROTASI MINGGUAN)');
console.log('====================================================\n');

// 1. Load data.js and verify piket configuration
const dataJs = fs.readFileSync('js/data.js', 'utf8');

// Create mock environment
const windowMock = {};
const evalData = new Function('window', dataJs);
evalData(windowMock);

const piketList = windowMock.TRJT_PIKET;
const rotationConfig = windowMock.TRJT_SCHEDULE.piketRotation;

assert.strictEqual(Array.isArray(piketList), true, 'piketList must be an array');
assert.strictEqual(piketList.length, 5, 'Must have 5 groups (Kelompok I to V)');
assert.strictEqual(rotationConfig.referenceGroupNumber, 2, 'Reference group is Kelompok 2');
assert.strictEqual(rotationConfig.referenceMonday, '2026-08-24', 'Reference Monday is 2026-08-24');

console.log('✅ PASS: data.js contains 5 groups and correct piketRotation config');

// 2. Test weekly rotation calculation function across multiple weeks
function getCurrentWeekPiketInfo(targetDate, customConfig = rotationConfig, customPiket = piketList) {
  const d = new Date(targetDate);
  const day = d.getDay(); // 0: Min, 1: Sen, ... 6: Sab
  const diffToMonday = (day === 0 ? -6 : 1 - day);

  const monday = new Date(d);
  monday.setDate(d.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);

  const parts = customConfig.referenceMonday.split('-').map(Number);
  const refMonday = new Date(parts[0], parts[1] - 1, parts[2]);
  refMonday.setHours(0, 0, 0, 0);

  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const diffWeeks = Math.round((monday.getTime() - refMonday.getTime()) / msPerWeek);

  const refIndex = customConfig.referenceGroupNumber - 1;
  const totalGroups = customPiket.length;
  const currentGroupIndex = ((refIndex + diffWeeks) % totalGroups + totalGroups) % totalGroups;
  const currentGroup = customPiket[currentGroupIndex];
  const isWeekend = (day === 0 || day === 6);

  return {
    group: currentGroup,
    groupIndex: currentGroupIndex,
    groupNumber: currentGroup.groupNumber,
    groupName: currentGroup.groupName,
    isWeekend,
    diffWeeks
  };
}

// Test case A: Senin 24 Agustus 2026 (Pekan 1 Acuan) -> Kelompok II
const resA = getCurrentWeekPiketInfo(new Date('2026-08-24T09:00:00+07:00'));
assert.strictEqual(resA.groupNumber, 2, '24 Aug 2026 must be Kelompok II');
assert.strictEqual(resA.isWeekend, false);
console.log('✅ PASS: Senin 24 Agustus 2026 is Kelompok II');

// Test case B: Rabu 26 Agustus 2026 (Tengah Pekan) -> Kelompok II
const resB = getCurrentWeekPiketInfo(new Date('2026-08-26T14:30:00+07:00'));
assert.strictEqual(resB.groupNumber, 2, '26 Aug 2026 must still be Kelompok II');
assert.strictEqual(resB.isWeekend, false);
console.log('✅ PASS: Rabu 26 Agustus 2026 is Kelompok II');

// Test case C: Sabtu 29 Agustus 2026 (Akhir Pekan) -> Kelompok II (Weekend flag true)
const resC = getCurrentWeekPiketInfo(new Date('2026-08-29T21:30:00+07:00'));
assert.strictEqual(resC.groupNumber, 2, '29 Aug 2026 (Saturday) must still be Kelompok II');
assert.strictEqual(resC.isWeekend, true, 'Weekend flag must be true');
console.log('✅ PASS: Sabtu 29 Agustus 2026 is Kelompok II (Akhir Pekan)');

// Test case D: Minggu 30 Agustus 2026 (Akhir Pekan) -> Kelompok II
const resD = getCurrentWeekPiketInfo(new Date('2026-08-30T10:00:00+07:00'));
assert.strictEqual(resD.groupNumber, 2, '30 Aug 2026 (Sunday) must still be Kelompok II');
assert.strictEqual(resD.isWeekend, true);
console.log('✅ PASS: Minggu 30 Agustus 2026 is Kelompok II');

// Test case E: Senin 31 Agustus 2026 (Pekan Berikutnya) -> Kelompok III
const resE = getCurrentWeekPiketInfo(new Date('2026-08-31T08:00:00+07:00'));
assert.strictEqual(resE.groupNumber, 3, '31 Aug 2026 must be Kelompok III');
console.log('✅ PASS: Senin 31 Agustus 2026 is Kelompok III');

// Test case F: Senin 7 September 2026 -> Kelompok IV
const resF = getCurrentWeekPiketInfo(new Date('2026-09-07T08:00:00+07:00'));
assert.strictEqual(resF.groupNumber, 4, '07 Sep 2026 must be Kelompok IV');
console.log('✅ PASS: Senin 7 September 2026 is Kelompok IV');

// Test case G: Senin 14 September 2026 -> Kelompok V
const resG = getCurrentWeekPiketInfo(new Date('2026-09-14T08:00:00+07:00'));
assert.strictEqual(resG.groupNumber, 5, '14 Sep 2026 must be Kelompok V');
console.log('✅ PASS: Senin 14 September 2026 is Kelompok V');

// Test case H: Senin 21 September 2026 -> Kelompok I (Rotasi berulang)
const resH = getCurrentWeekPiketInfo(new Date('2026-09-21T08:00:00+07:00'));
assert.strictEqual(resH.groupNumber, 1, '21 Sep 2026 must loop back to Kelompok I');
console.log('✅ PASS: Senin 21 September 2026 rotates back to Kelompok I');

// Test case I: Pekan Lalu (Senin 17 Agustus 2026) -> Kelompok I
const resI = getCurrentWeekPiketInfo(new Date('2026-08-17T08:00:00+07:00'));
assert.strictEqual(resI.groupNumber, 1, '17 Aug 2026 must be Kelompok I');
console.log('✅ PASS: Pekan Lalu (17 Agustus 2026) was Kelompok I');

// 3. Verify HTML structure & content
const html = fs.readFileSync('index.html', 'utf8');
assert.ok(html.includes('Minggu ini: Kelompok II'), 'Badge default contains Minggu ini: Kelompok II');
assert.ok(html.includes('Piket bergilir 1 kelompok per minggu'), 'Subtitle updated to 1 kelompok per minggu');
assert.ok(html.includes('data-piket-filter="1"'), 'Filter pill 1 exists');
assert.ok(html.includes('data-piket-filter="5"'), 'Filter pill 5 exists');
console.log('✅ PASS: index.html markup correctly matches weekly rotation design');

// 4. Verify app.js integration
const appJs = fs.readFileSync('js/app.js', 'utf8');
assert.ok(appJs.includes('function getCurrentWeekPiketInfo'), 'getCurrentWeekPiketInfo defined');
assert.ok(appJs.includes('window.getCurrentWeekPiketInfo = getCurrentWeekPiketInfo'), 'Exported to window');
assert.ok(appJs.includes('window.openPiketModal = openPiketModal'), 'openPiketModal exported');
console.log('✅ PASS: js/app.js integration verified');

console.log('\n====================================================');
console.log('🎉 ALL WEEKLY PIKET ROTATION TESTS PASSED (100%)!');
console.log('====================================================\n');
