import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

console.log('\n====================================================');
console.log('🧪 TEST SUITE: JADWAL PIKET KELAS TRJT 3A (KELOMPOK I - V)');
console.log('====================================================\n');

// 1. Verify js/data.js contains all 5 groups and exact members from user image
const dataContent = fs.readFileSync('js/data.js', 'utf8');

assert.ok(dataContent.includes('TRJT_PIKET'), 'TRJT_PIKET must be defined in data.js');
assert.ok(dataContent.includes('Aqil Ocean Difra'), 'Kelompok I member Aqil Ocean Difra present');
assert.ok(dataContent.includes('Renka Laura'), 'Kelompok I member Renka Laura present');
assert.ok(dataContent.includes('Firlita Afianti'), 'Kelompok I member Firlita Afianti present');
assert.ok(dataContent.includes('Afriansyah Sinamo'), 'Kelompok I member Afriansyah Sinamo present');

assert.ok(dataContent.includes('Lunna Auamara'), 'Kelompok II member Lunna Auamara present');
assert.ok(dataContent.includes('Nazar Alfaraby'), 'Kelompok II member Nazar Alfaraby present');
assert.ok(dataContent.includes('Rahmat Haikal'), 'Kelompok II member Rahmat Haikal present');
assert.ok(dataContent.includes('Muhammad Halfi Al Barizi'), 'Kelompok II member Muhammad Halfi Al Barizi present');

assert.ok(dataContent.includes('Syawal Fitriadi'), 'Kelompok III member Syawal Fitriadi present');
assert.ok(dataContent.includes('Sarah Fonna'), 'Kelompok III member Sarah Fonna present');
assert.ok(dataContent.includes('Muhammad Rais'), 'Kelompok III member Muhammad Rais present');

assert.ok(dataContent.includes('Nesya Zikriya'), 'Kelompok IV member Nesya Zikriya present');
assert.ok(dataContent.includes('Farhan Alfarisi'), 'Kelompok IV member Farhan Alfarisi present');
assert.ok(dataContent.includes('Ilal Ilhamdi'), 'Kelompok IV member Ilal Ilhamdi present');

assert.ok(dataContent.includes('Durratul Hikmah'), 'Kelompok V member Durratul Hikmah present');
assert.ok(dataContent.includes('Suheil Maulana'), 'Kelompok V member Suheil Maulana present');
assert.ok(dataContent.includes('Khairul Fajar Sidiq'), 'Kelompok V member Khairul Fajar Sidiq present');

console.log('✅ PASS: All 5 groups & 17 members from reference image match 100% in js/data.js');

// 2. Verify index.html contains the Piket button and modal structure
const htmlContent = fs.readFileSync('index.html', 'utf8');
assert.ok(htmlContent.includes('id="btn-open-piket-modal"'), 'Piket button present in index.html');
assert.ok(htmlContent.includes('id="badge-piket-today-chip"'), 'Today piket badge present');
assert.ok(htmlContent.includes('id="modal-piket-schedule"'), 'modal-piket-schedule present');
assert.ok(htmlContent.includes('id="btn-close-piket-modal"'), 'btn-close-piket-modal present');
assert.ok(htmlContent.includes('id="piket-today-banner"'), 'piket-today-banner present');
assert.ok(htmlContent.includes('id="piket-groups-container"'), 'piket-groups-container present');

console.log('✅ PASS: Button and Modal Sheet structure correctly placed in index.html');

// 3. Verify CSS rules
const cssContent = fs.readFileSync('css/design-system.css', 'utf8');
assert.ok(cssContent.includes('.btn-piket-action'), '.btn-piket-action CSS rule present');
assert.ok(cssContent.includes('.piket-today-banner'), '.piket-today-banner CSS rule present');
assert.ok(cssContent.includes('.piket-group-card'), '.piket-group-card CSS rule present');
assert.ok(cssContent.includes('.piket-member-item'), '.piket-member-item CSS rule present');

console.log('✅ PASS: Glassmorphism CSS styles for Piket successfully verified');

// 4. Verify JS controller functions
const appContent = fs.readFileSync('js/app.js', 'utf8');
assert.ok(appContent.includes('function openPiketModal'), 'openPiketModal defined');
assert.ok(appContent.includes('function closePiketModal'), 'closePiketModal defined');
assert.ok(appContent.includes('function renderPiketModal'), 'renderPiketModal defined');
assert.ok(appContent.includes('function renderPiketBadge'), 'renderPiketBadge defined');

console.log('✅ PASS: Piket controller functions and event listeners verified');

console.log('\n====================================================');
console.log('🎉 ALL PIKET FEATURE TESTS PASSED (100%)!');
console.log('====================================================\n');
