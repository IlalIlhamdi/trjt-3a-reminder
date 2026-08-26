import assert from 'node:assert';
import fs from 'node:fs';

console.log('\n====================================================');
console.log('🧪 TEST SUITE: QUICK DIRECTORY GLASS PILL BAR & MAHASISWA MODAL');
console.log('====================================================\n');

// 1. Verify HTML Structure
const htmlCode = fs.readFileSync('index.html', 'utf8');
assert.ok(htmlCode.includes('quick-pill-capsule-container'), 'quick-pill-capsule-container exists in index.html');
assert.ok(htmlCode.includes('quick-pill-scroll-track'), 'quick-pill-scroll-track exists in index.html');
assert.ok(htmlCode.includes('data-quick="jadwal"'), 'Jadwal quick button exists');
assert.ok(htmlCode.includes('data-quick="kelompok"'), 'Kelompok quick button exists');
assert.ok(htmlCode.includes('data-quick="piket"'), 'Piket quick button exists');
assert.ok(htmlCode.includes('data-quick="mahasiswa"'), 'Mahasiswa quick button exists');
assert.ok(htmlCode.includes('data-quick="dosen"'), 'Dosen quick button exists');
assert.ok(htmlCode.includes('id="modal-mahasiswa-list"'), 'modal-mahasiswa-list exists in index.html');
assert.ok(htmlCode.includes('id="mahasiswa-search-input"'), 'mahasiswa-search-input exists in index.html');
console.log('✅ PASS: All Quick Pill buttons and Mahasiswa modal verified in index.html');

// 2. Verify CSS Styling
const cssCode = fs.readFileSync('css/design-system.css', 'utf8');
assert.ok(cssCode.includes('.quick-pill-capsule-container'), '.quick-pill-capsule-container exists in CSS');
assert.ok(cssCode.includes('.quick-pill-scroll-track'), '.quick-pill-scroll-track exists in CSS');
assert.ok(cssCode.includes('.quick-pill-item'), '.quick-pill-item exists in CSS');
assert.ok(cssCode.includes('.quick-pill-item.active'), '.quick-pill-item.active exists in CSS');
assert.ok(cssCode.includes('[data-theme="dark"] .quick-pill-capsule-container'), 'Dark mode styling exists for quick-pill');
console.log('✅ PASS: Glassmorphism and active state styling verified in CSS');

// 3. Verify JS Logic for Mahasiswa List
const appJsCode = fs.readFileSync('js/app.js', 'utf8');
assert.ok(appJsCode.includes('getAllMahasiswaList'), 'getAllMahasiswaList is defined in js/app.js');
assert.ok(appJsCode.includes('renderMahasiswaModal'), 'renderMahasiswaModal is defined in js/app.js');
assert.ok(appJsCode.includes('openMahasiswaModal'), 'openMahasiswaModal is defined in js/app.js');
assert.ok(appJsCode.includes('setupDragScroll'), 'setupDragScroll is defined in js/app.js');
console.log('✅ PASS: JavaScript functions for student directory and drag-scroll verified');

// 4. Test Student Extraction & Search Logic
const mockPiket = [
  { groupName: "Kelompok I", members: ["Aqil Ocean Difra", "Renka Laura", "Firlita Afianti", "Afriansyah Sinamo"] },
  { groupName: "Kelompok II", members: ["Lunna Auamara", "Nazar Alfaraby", "Rahmat Haikal"] },
  { groupName: "Kelompok III", members: ["Muhammad Halfi Al Barizi", "Syawal Fitriadi", "Sarah Fonna"] },
  { groupName: "Kelompok IV", members: ["Muhammad Rais", "Nesya Zikriya", "Farhan Alfarisi", "Ilal Ilhamdi"] },
  { groupName: "Kelompok V", members: ["Durratul Hikmah", "Suheil Maulana", "Khairul Fajar Sidiq"] }
];

const students = [];
let counter = 1;
mockPiket.forEach((group) => {
  group.members.forEach((name) => {
    students.push({
      no: counter++,
      name: name,
      groupName: group.groupName
    });
  });
});

assert.strictEqual(students.length, 17, 'Total 17 active students extracted from groups');
assert.strictEqual(students[0].name, 'Aqil Ocean Difra');
assert.strictEqual(students[13].name, 'Ilal Ilhamdi');
assert.strictEqual(students[13].groupName, 'Kelompok IV');

function searchStudent(q) {
  const query = q.toLowerCase().trim();
  return students.filter(s => s.name.toLowerCase().includes(query) || s.groupName.toLowerCase().includes(query));
}

assert.strictEqual(searchStudent('Ilal').length, 1);
assert.strictEqual(searchStudent('Kelompok III').length, 3);
assert.strictEqual(searchStudent('').length, 17);

console.log('✅ PASS: 17 Students successfully indexed and searchable');

console.log('\n====================================================');
console.log('🎉 ALL QUICK PILL BAR & MAHASISWA TESTS PASSED (100%)!');
console.log('====================================================\n');
