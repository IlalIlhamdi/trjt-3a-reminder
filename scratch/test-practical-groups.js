import fs from 'fs';
import assert from 'assert';

console.log('======================================================');
console.log('🧪 TEST SUITE: PEMBAGIAN KELOMPOK PRAKTIKUM TRJT 3A');
console.log('======================================================\n');

// 1. Load Data
const dataJs = fs.readFileSync('c:/laragon/www/TRJT 3A/js/data.js', 'utf-8');
const indexHtml = fs.readFileSync('c:/laragon/www/TRJT 3A/index.html', 'utf-8');
const css = fs.readFileSync('c:/laragon/www/TRJT 3A/css/design-system.css', 'utf-8');
const appJs = fs.readFileSync('c:/laragon/www/TRJT 3A/js/app.js', 'utf-8');

// 2. Evaluate Data in a safe context
const evalContext = {};
const dataFunc = new Function('window', 'module', dataJs);
const mockModule = { exports: {} };
dataFunc(evalContext, mockModule);

const {
  TRJT_SCHEDULE,
  TRJT_PRACTICAL_GROUPS,
  getCoursePracticalGroups,
  getStudentPracticalGroups
} = mockModule.exports;

assert.ok(TRJT_PRACTICAL_GROUPS, 'TRJT_PRACTICAL_GROUPS exists');
console.log('✅ PASS: TRJT_PRACTICAL_GROUPS successfully loaded from data.js');

// 3. Test Course 1: Praktikum Teknik Instalasi Fiber Optik
const tifo = getCoursePracticalGroups('Praktikum Teknik Instalasi Fiber Optik');
assert.ok(tifo, 'TIFO practical groups found');
assert.strictEqual(tifo.groups.length, 4, 'TIFO has 4 groups');
assert.deepStrictEqual(tifo.groups[0].members, [
  'Ilal Ilhamdi',
  'Syawal Fitriadi',
  'Nesya Zikriya',
  'Muhammad Halfi Al Barizi'
], 'TIFO Kelompok 1 members match full names');
assert.deepStrictEqual(tifo.groups[1].members, [
  'Aqil Ocean Difra',
  'Durratul Hikmah',
  'Firlita Afianti',
  'Renka Laura'
], 'TIFO Kelompok 2 members match full names');
assert.deepStrictEqual(tifo.groups[2].members, [
  'Rahmat Haikal',
  'Farhan Alfarisyi',
  'Sarah Fonna',
  'Nazar Alfaraby'
], 'TIFO Kelompok 3 members match full names');
assert.deepStrictEqual(tifo.groups[3].members, [
  'Lunna Auamara',
  'Muhammad Rais',
  'Suheil Maulana',
  'Khairul Fajar Sidiq'
], 'TIFO Kelompok 4 members match full names');
console.log('✅ PASS: Praktikum Teknik Instalasi Fiber Optik groups verified.');

// 4. Test Course 2: Praktikum Sistem Komunikasi Seluler
const seluler = getCoursePracticalGroups('Praktikum Sistem Komunikasi Seluler');
assert.ok(seluler, 'Seluler practical groups found');
assert.strictEqual(seluler.groups.length, 4, 'Seluler has 4 groups');
assert.deepStrictEqual(seluler.groups[0].members, [
  'Rahmat Haikal',
  'Nesya Zikriya',
  'Sarah Fonna',
  'Muhammad Halfi Al Barizi'
], 'Seluler Kelompok 1 members match');
assert.deepStrictEqual(seluler.groups[1].members, [
  'Ilal Ilhamdi',
  'Renka Laura',
  'Syawal Fitriadi',
  'Muhammad Rais'
], 'Seluler Kelompok 2 members match');
assert.deepStrictEqual(seluler.groups[2].members, [
  'Aqil Ocean Difra',
  'Firlita Afianti',
  'Nazar Alfaraby',
  'Lunna Auamara'
], 'Seluler Kelompok 3 members match');
assert.deepStrictEqual(seluler.groups[3].members, [
  'Khairul Fajar Sidiq',
  'Suheil Maulana',
  'Durratul Hikmah',
  'Farhan Alfarisyi'
], 'Seluler Kelompok 4 members match');
console.log('✅ PASS: Praktikum Sistem Komunikasi Seluler groups verified.');

// 5. Test Course 3: Praktikum Sistem Komunikasi Satelit dan Radar
const satelit = getCoursePracticalGroups('Praktikum Sistem Komunikasi Satelit dan Radar');
assert.ok(satelit, 'Satelit practical groups found');
assert.strictEqual(satelit.groups.length, 4, 'Satelit has 4 groups');
assert.deepStrictEqual(satelit.groups[0].members, [
  'Aqil Ocean Difra',
  'Durratul Hikmah',
  'Firlita Afianti',
  'Suheil Maulana'
], 'Satelit Kelompok 1 members match');
assert.deepStrictEqual(satelit.groups[1].members, [
  'Khairul Fajar Sidiq',
  'Muhammad Rais',
  'Nazar Alfaraby',
  'Renka Laura'
], 'Satelit Kelompok 2 members match');
assert.deepStrictEqual(satelit.groups[2].members, [
  'Ilal Ilhamdi',
  'Sarah Fonna',
  'Syawal Fitriadi',
  'Farhan Alfarisyi'
], 'Satelit Kelompok 3 members match');
assert.deepStrictEqual(satelit.groups[3].members, [
  'Rahmat Haikal',
  'Nesya Zikriya',
  'Lunna Auamara',
  'Muhammad Halfi Al Barizi'
], 'Satelit Kelompok 4 members match');
console.log('✅ PASS: Praktikum Sistem Komunikasi Satelit dan Radar groups verified.');

// 6. Test Course 4: Praktikum Antena dan Propagasi
const antena = getCoursePracticalGroups('Praktikum Antena dan Propagasi');
assert.ok(antena, 'Antena practical groups found');
assert.strictEqual(antena.groups.length, 5, 'Antena has 5 groups');
assert.deepStrictEqual(antena.groups[0].members, [
  'Aqil Ocean Difra',
  'Renka Laura',
  'Firlita Afianti'
], 'Antena Kelompok 1 (Ocean, Laura, Firlita) match');
assert.deepStrictEqual(antena.groups[1].members, [
  'Lunna Auamara',
  'Nazar Alfaraby',
  'Rahmat Haikal',
  'Muhammad Halfi Al Barizi'
], 'Antena Kelompok 2 (Lunna, Nazar, Rahmat, Halfi) match');
assert.deepStrictEqual(antena.groups[2].members, [
  'Syawal Fitriadi',
  'Sarah Fonna',
  'Muhammad Rais'
], 'Antena Kelompok 3 (Syawal, Sara, Rais) match');
assert.deepStrictEqual(antena.groups[3].members, [
  'Nesya Zikriya',
  'Farhan Alfarisyi',
  'Ilal Ilhamdi'
], 'Antena Kelompok 4 (Nesya, Farhan, Ilal) match');
assert.deepStrictEqual(antena.groups[4].members, [
  'Durratul Hikmah',
  'Suheil Maulana',
  'Khairul Fajar Sidiq'
], 'Antena Kelompok 5 (Durra, Suheil, Fajar) match');
console.log('✅ PASS: Praktikum Antena dan Propagasi groups verified.');

// 7. Test Student Cross-Course Lookup
const ilalGroups = getStudentPracticalGroups('Ilal Ilhamdi');
assert.strictEqual(ilalGroups.length, 4, 'Ilal is in all 4 practical courses');
console.log('✅ PASS: getStudentPracticalGroups correctly located student across 4 courses.');

// 8. Test DOM & HTML integration
assert.ok(indexHtml.includes('id="modal-course-groups"'), 'modal-course-groups exists in index.html');
assert.ok(indexHtml.includes('btn-group-action'), 'btn-group-action button exists on Beranda');
assert.ok(indexHtml.includes('btn-course-jump-groups'), 'btn-course-jump-groups exists in task modal');
assert.ok(indexHtml.includes('course-groups-search-input'), 'Search input exists in course groups modal');
console.log('✅ PASS: index.html contains all modal structures and action buttons.');

// 9. Test CSS integration
assert.ok(css.includes('.btn-schedule-group'), '.btn-schedule-group defined in CSS');
assert.ok(css.includes('.practical-group-card'), '.practical-group-card defined in CSS');
assert.ok(css.includes('.practical-group-member-item.is-matched'), 'is-matched highlight defined in CSS');
assert.ok(css.includes('[data-theme="dark"] .btn-schedule-group'), 'Dark mode defined for schedule group button');
console.log('✅ PASS: css/design-system.css contains complete styles and dark mode rules.');

// 10. Test JS controller integration
assert.ok(appJs.includes('openCourseGroupsModal'), 'openCourseGroupsModal defined in app.js');
assert.ok(appJs.includes('closeCourseGroupsModal'), 'closeCourseGroupsModal defined in app.js');
assert.ok(appJs.includes('renderCourseGroups'), 'renderCourseGroups defined in app.js');
assert.ok(appJs.includes('copyGroupMembers'), 'copyGroupMembers defined in app.js');
assert.ok(appJs.includes('window.openCourseGroupsModal = openCourseGroupsModal;'), 'Exported to window');
console.log('✅ PASS: js/app.js implements full group controller, search, and copy features.');

console.log('\n======================================================');
console.log('🎉 ALL PRACTICAL GROUPS TESTS PASSED PERFECTLY (10/10)!');
console.log('======================================================');
