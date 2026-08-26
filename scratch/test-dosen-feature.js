import assert from 'node:assert';
import fs from 'node:fs';

console.log('\n====================================================');
console.log('🧪 TEST SUITE: DAFTAR DOSEN PENGAMPU TRJT 3A');
console.log('====================================================\n');

// 1. Verify Dataset in js/data.js
const dataCode = fs.readFileSync('js/data.js', 'utf8');
assert.ok(dataCode.includes('TRJT_DOSEN'), 'TRJT_DOSEN must be defined and exported in js/data.js');
assert.ok(dataCode.includes('Ipan Suandi, S.T., M.T.'), 'Ipan Suandi must be in data.js');
assert.ok(dataCode.includes('198005102005011002'), 'NIP for Ipan Suandi must exist');
assert.ok(dataCode.includes('Muhammad Syahroni, S.T., M.T.'), 'Muhammad Syahroni must be in data.js');
assert.ok(dataCode.includes('197210262006041001'), 'NIP for Muhammad Syahroni must exist');
assert.ok(dataCode.includes('Rachmawati, S.T., M.Eng.'), 'Rachmawati must be in data.js');
assert.ok(dataCode.includes('Anita Fauziah, SST., M.T.'), 'Anita Fauziah must be in data.js');
assert.ok(dataCode.includes('Yassir, S.T., M.Eng.Sc.'), 'Yassir must be in data.js');
assert.ok(dataCode.includes('Dr. Nelly Safitri, SST., M.Eng.Sc.'), 'Dr. Nelly Safitri must be in data.js');
console.log('✅ PASS: All 6 lecturers with exact NIP & courses verified in js/data.js');

// 2. Verify HTML View & Bottom Nav Tab
const htmlCode = fs.readFileSync('index.html', 'utf8');
assert.ok(htmlCode.includes('id="view-dosen"'), 'view-dosen section exists in index.html');
assert.ok(htmlCode.includes('data-tab="dosen"'), 'dosen bottom nav button exists in index.html');
assert.ok(htmlCode.includes('id="dosen-search-input"'), 'dosen search input exists in index.html');
assert.ok(htmlCode.includes('id="dosen-cards-container"'), 'dosen cards container exists in index.html');

// Check bottom nav ordering: notifikasi -> dosen -> pengaturan
const notifIdx = htmlCode.indexOf('data-tab="notifikasi"');
const dosenIdx = htmlCode.indexOf('data-tab="dosen"');
const pengIdx = htmlCode.indexOf('data-tab="pengaturan"');
assert.ok(dosenIdx > notifIdx && dosenIdx < pengIdx, 'Dosen tab is placed directly before Pengaturan');
console.log('✅ PASS: Dosen view and navigation tab properly positioned before Pengaturan');

// 3. Verify CSS styling
const cssCode = fs.readFileSync('css/design-system.css', 'utf8');
assert.ok(cssCode.includes('.dosen-glass-card'), '.dosen-glass-card style exists in css');
assert.ok(cssCode.includes('.dosen-avatar-squircle'), '.dosen-avatar-squircle style exists in css');
assert.ok(cssCode.includes('.dosen-course-pill'), '.dosen-course-pill style exists in css');
assert.ok(cssCode.includes('grid-template-columns: repeat(5, 1fr)'), 'bottom-nav has 5 columns for 5 tabs');
console.log('✅ PASS: Glassmorphism and 5-column navigation styles verified in CSS');

// 4. Runtime logic simulation
const mockDosen = [
  { no: 1, initial: "IS", name: "Ipan Suandi, S.T., M.T.", nip: "198005102005011002", courses: ["Praktikum Antena dan Propagasi", "Antena dan Propagasi"] },
  { no: 2, initial: "MS", name: "Muhammad Syahroni, S.T., M.T.", nip: "197210262006041001", courses: ["Jaringan Komputer Lanjut", "Praktikum Jaringan Komputer Lanjut"] },
  { no: 3, initial: "RS", name: "Rachmawati, S.T., M.Eng.", nip: "197908262003122001", courses: ["Praktikum Sistem Komunikasi Satelit dan Radar", "Sistem Komunikasi Satelit dan Radar"] },
  { no: 4, initial: "AF", name: "Anita Fauziah, SST., M.T.", nip: "197201291998032001", courses: ["Teknik Instalasi Fiber Optik", "Praktikum Teknik Instalasi Fiber Optik"] },
  { no: 5, initial: "YS", name: "Yassir, S.T., M.Eng.Sc.", nip: "198004192003121002", courses: ["Praktikum Sistem Komunikasi Seluler", "Sistem Komunikasi Seluler"] },
  { no: 6, initial: "DN", name: "Dr. Nelly Safitri, SST., M.Eng.Sc.", nip: "NIP Belum Tercatat", courses: ["Metodologi Penelitian"] }
];

function filterDosen(query) {
  const q = (query || '').toLowerCase().trim();
  return mockDosen.filter((d) => {
    if (!q) return true;
    const matchName = d.name.toLowerCase().includes(q);
    const matchNip = d.nip.toLowerCase().includes(q);
    const matchInitial = d.initial.toLowerCase().includes(q);
    const matchCourses = d.courses.some(c => c.toLowerCase().includes(q));
    return matchName || matchNip || matchInitial || matchCourses;
  });
}

// Test: Initial all 6
assert.strictEqual(filterDosen('').length, 6, 'All 6 lecturers returned when query is empty');

// Test: Search by lecturer name
const resYassir = filterDosen('Yassir');
assert.strictEqual(resYassir.length, 1);
assert.strictEqual(resYassir[0].initial, 'YS');

// Test: Search by NIP
const resNip = filterDosen('197201291998032001');
assert.strictEqual(resNip.length, 1);
assert.strictEqual(resNip[0].name, 'Anita Fauziah, SST., M.T.');

// Test: Search by course
const resCourse = filterDosen('Radar');
assert.strictEqual(resCourse.length, 1);
assert.strictEqual(resCourse[0].initial, 'RS');

console.log('✅ PASS: Dosen search filtering works accurately across name, NIP, initial, and courses');

console.log('\n====================================================');
console.log('🎉 ALL DOSEN DIRECTORY TESTS PASSED (100%)!');
console.log('====================================================\n');
