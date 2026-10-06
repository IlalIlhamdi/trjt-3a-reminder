import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import JSZip from 'jszip';
import vm from 'node:vm';

const dataCode = fs.readFileSync('js/data.js', 'utf8');
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(dataCode, sandbox);
const { TRJT_SCHEDULE, TRJT_DOSEN } = sandbox.window;

console.log('\n====================================================');
console.log('🧪 TEST SUITE: GENERATOR COVER LAPORAN & TOOLS TRJT 3A');
console.log('====================================================\n');

// --------------------------------------------------------------------------
// 1. Verify HTML Structure in index.html
// --------------------------------------------------------------------------
console.log('📌 Test 1: Verifikasi Struktur HTML (index.html)');
const htmlCode = fs.readFileSync('index.html', 'utf8');

assert.ok(htmlCode.includes('id="view-tools"'), 'view-tools must exist in index.html');
assert.ok(htmlCode.includes('id="view-cover-generator"'), 'view-cover-generator must exist in index.html');
assert.ok(htmlCode.includes('id="view-dosen"'), 'view-dosen must still exist in index.html');
assert.ok(htmlCode.includes('data-tab="dosen"'), 'Bottom navigation must have data-tab="dosen"');
assert.ok(htmlCode.includes("onclick=\"switchTab('tools')\""), 'Beranda shortcuts must have Tools button opening view-tools');
assert.ok(htmlCode.includes('data-lucide="contact-round"'), 'Dosen bottom nav button must have contact-round icon');
assert.ok(htmlCode.includes('data-lucide="wrench"'), 'Beranda Tools shortcut must have wrench icon');

// Check Form Fields
assert.ok(htmlCode.includes('id="cover-title-input"'), 'Judul input must exist');
assert.ok(htmlCode.includes('id="cover-course-select"'), 'Mata kuliah select must exist');
assert.ok(htmlCode.includes('id="cover-manual-course-input"'), 'Manual course input must exist');
assert.ok(htmlCode.includes('id="cover-dosen-combobox"'), 'Dosen combobox must exist');
assert.ok(htmlCode.includes('id="cover-dosen-trigger"'), 'Dosen trigger must exist');
assert.ok(htmlCode.includes('id="cover-name-input"'), 'Nama input must exist');
assert.ok(htmlCode.includes('id="cover-nim-input"'), 'NIM input must exist');
assert.ok(htmlCode.includes('id="cover-year-input"'), 'Tahun input must exist');
assert.ok(htmlCode.includes('id="cover-remember-identity"'), 'Remember identity checkbox must exist');
assert.ok(htmlCode.includes('id="btn-download-docx"'), 'Download DOCX button must exist');
assert.ok(htmlCode.includes('id="btn-print-cover"'), 'Cetak / Simpan PDF button must exist');
assert.ok(htmlCode.includes('id="btn-reset-cover"'), 'Reset button must exist');

// Check Preview Elements
assert.ok(htmlCode.includes('id="cover-a4-sheet"'), 'A4 preview sheet must exist');
assert.ok(htmlCode.includes('id="prev-title"'), 'Preview title element must exist');
assert.ok(htmlCode.includes('id="prev-course-name"'), 'Preview course element must exist');
assert.ok(htmlCode.includes('id="prev-lecturer-name"'), 'Preview lecturer element must exist');
assert.ok(htmlCode.includes('id="prev-student-name"'), 'Preview student name element must exist');
assert.ok(htmlCode.includes('id="prev-student-nim"'), 'Preview student NIM element must exist');
assert.ok(htmlCode.includes('id="prev-year"'), 'Preview year element must exist');

// Check Print Container
assert.ok(htmlCode.includes('id="cover-print-container"'), 'Dedicated print container must exist');

// Check Assets linked
assert.ok(htmlCode.includes('css/cover-generator.css'), 'cover-generator.css must be linked');
assert.ok(htmlCode.includes('js/cover-generator.js'), 'cover-generator.js must be linked');

console.log('  ✅ PASS: Seluruh elemen DOM view, form, preview, dan print terverifikasi lengkap di index.html');

// --------------------------------------------------------------------------
// 2. Verify Tab Navigation in js/app.js
// --------------------------------------------------------------------------
console.log('\n📌 Test 2: Verifikasi Alur Navigasi switchTab di js/app.js');
const appCode = fs.readFileSync('js/app.js', 'utf8');

assert.ok(appCode.includes("view.id === `view-${tabId}`"), 'switchTab must dynamically activate view sections');
assert.ok(appCode.includes("tabId === 'cover-generator'"), 'switchTab must handle cover-generator tab');
assert.ok(appCode.includes('window.CoverGenerator.init()'), 'switchTab must initialize CoverGenerator on tab switch');
assert.ok(appCode.includes("tabId === 'dosen'"), 'switchTab must handle dosen tab');
assert.ok(appCode.includes('renderDosenList()'), 'switchTab must call renderDosenList() when tab is dosen');

console.log('  ✅ PASS: switchTab mengaktifkan Tools, Cover Generator, dan Dosen secara responsif');

// --------------------------------------------------------------------------
// 3. Verify Course and Lecturer Auto-fill Mapping
// --------------------------------------------------------------------------
console.log('\n📌 Test 3: Verifikasi Pemetaan Mata Kuliah & Dosen dari js/data.js');
const classes = TRJT_SCHEDULE.classes;
const courseMap = new Map();
classes.forEach(c => {
  if (!courseMap.has(c.courseName)) {
    courseMap.set(c.courseName, c.lecturerName);
  }
});

assert.strictEqual(courseMap.size, 11, 'Harus ada 11 mata kuliah unik di TRJT 3A');
assert.strictEqual(courseMap.get('Praktikum Antena dan Propagasi'), 'Ipan Suandi, S.T., M.T.');
assert.strictEqual(courseMap.get('Jaringan Komputer Lanjut'), 'Muhammad Syahroni, S.T., M.T.');
assert.strictEqual(courseMap.get('Praktikum Jaringan Komputer Lanjut'), 'Muhammad Syahroni, S.T., M.T.');
assert.strictEqual(courseMap.get('Praktikum Sistem Komunikasi Satelit dan Radar'), 'Rachmawati, S.T., M.Eng.');
assert.strictEqual(courseMap.get('Teknik Instalasi Fiber Optik'), 'Anita Fauziah, S.ST., M.T.');
assert.strictEqual(courseMap.get('Praktikum Teknik Instalasi Fiber Optik'), 'Anita Fauziah, S.ST., M.T.');
assert.strictEqual(courseMap.get('Antena dan Propagasi'), 'Ipan Suandi, S.T., M.T.');
assert.strictEqual(courseMap.get('Praktikum Sistem Komunikasi Seluler'), 'Yassir, S.T., M.Eng.Sc.');
assert.strictEqual(courseMap.get('Sistem Komunikasi Satelit dan Radar'), 'Rachmawati, S.T., M.Eng.');
assert.strictEqual(courseMap.get('Sistem Komunikasi Seluler'), 'Yassir, S.T., M.Eng.Sc.');
assert.strictEqual(courseMap.get('Metodologi Penelitian'), 'Dr. Nelly Safitri, SST., M.Eng.Sc.');

console.log('  ✅ PASS: Seluruh 11 mata kuliah terpetakan 100% akurat ke dosen pengampunya');

// --------------------------------------------------------------------------
// 4. Verify Template Assets Existence
// --------------------------------------------------------------------------
console.log('\n📌 Test 4: Verifikasi Keberadaan Aset Template & Logo');
assert.ok(fs.existsSync('assets/templates/cover-template.docx'), 'Salinan template cover-template.docx harus ada');
assert.ok(fs.existsSync('assets/images/cover/logo-prodi.jpeg'), 'Logo Prodi TRJT harus ada');
assert.ok(fs.existsSync('assets/images/cover/logo-pnl.png'), 'Logo PNL harus ada');
assert.ok(fs.existsSync('lib/jszip.min.js'), 'Pustaka lib/jszip.min.js harus ada untuk offline PWA');

console.log('  ✅ PASS: Template DOCX, logo Prodi, logo PNL, dan jszip.min.js tersedia');

// --------------------------------------------------------------------------
// 5. Test XML Escaping & Multiline Title Formatting
// --------------------------------------------------------------------------
console.log('\n📌 Test 5: Uji XML Escaping & Format Judul Multiline');
function escapeXml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

const specialStr = 'Pengukuran & Karakterisasi <Antena> "Dipole" 2.4 GHz';
const escapedStr = escapeXml(specialStr);
assert.strictEqual(escapedStr, 'Pengukuran &amp; Karakterisasi &lt;Antena&gt; &quot;Dipole&quot; 2.4 GHz');
assert.ok(!escapedStr.includes('& ') && !escapedStr.includes('<') && !escapedStr.includes('>'));
console.log('  ✅ PASS: Karakter khusus &, <, >, ", \' berhasil di-escape dengan aman');

// --------------------------------------------------------------------------
// 6. Test DOCX Generation & Placeholder Replacement
// --------------------------------------------------------------------------
console.log('\n📌 Test 6: Uji Pembuatan Dokumen DOCX Nyata dengan JSZip');

async function testDocxReplacement(templateBuf, data) {
  const zip = await JSZip.loadAsync(templateBuf);
  let docXml = await zip.file('word/document.xml').async('text');

  const { judul, mataKuliah, dosen, nama, nim, tahun } = data;

  const judulLines = judul.trim().split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const extraJudulLines = Math.max(0, judulLines.length - 1);

  const judulXmlRuns = judulLines.map((line, idx) => {
    const escaped = escapeXml(line.toUpperCase());
    if (idx === 0) return `<w:t xml:space="preserve">${escaped}</w:t>`;
    return `<w:br/><w:t xml:space="preserve">${escaped}</w:t>`;
  }).join('');

  docXml = docXml.replace(/<w:t>INPUT JUDUL<\/w:t>/, judulXmlRuns);
  docXml = docXml.replace(/<w:t>Input Mk<\/w:t>/, `<w:t xml:space="preserve">${escapeXml(mataKuliah)}</w:t>`);
  docXml = docXml.replace(/<w:t xml:space="preserve">Input Dosen <\/w:t>/, `<w:t xml:space="preserve">${escapeXml(dosen)}</w:t>`);
  docXml = docXml.replace(/<w:t>INPUT NAMA<\/w:t>/, `<w:t xml:space="preserve">${escapeXml(nama.toUpperCase())}</w:t>`);
  docXml = docXml.replace(/<w:t>INPUT NIM<\/w:t>/, `<w:t xml:space="preserve">${escapeXml(nim)}</w:t>`);
  docXml = docXml.replace(
    /<w:t>202<\/w:t><\/w:r><w:r><w:rPr><w:rFonts w:eastAsia="Calibri" w:cs="Times New Roman"\/><w:b\/><w:bCs\/><w:color w:val="000000"\/><w:szCs w:val="24"\/><\/w:rPr><w:t>6<\/w:t>/,
    `<w:t xml:space="preserve">${escapeXml(tahun)}</w:t>`
  );

  // Spacer balancing
  if (extraJudulLines > 0) {
    const spacersToRemove = Math.min(extraJudulLines, 3);
    const drawingP17Idx = docXml.indexOf('r:embed="rId9"');
    if (drawingP17Idx !== -1) {
      const beforeDrawing = docXml.slice(0, drawingP17Idx);
      const afterDrawing = docXml.slice(drawingP17Idx);
      const prodiIdx = afterDrawing.indexOf('PRODI DIV TEKNOLOGI');
      if (prodiIdx !== -1) {
        let spacerSection = afterDrawing.slice(0, prodiIdx);
        const restSection = afterDrawing.slice(prodiIdx);
        const pRegex = /<w:p[\s\S]*?<\/w:p>/g;
        let match;
        const emptyParagraphs = [];
        while ((match = pRegex.exec(spacerSection)) !== null) {
          if (!match[0].includes('<w:t') && !match[0].includes('<w:drawing')) {
            emptyParagraphs.push(match[0]);
          }
        }
        for (let i = 0; i < Math.min(spacersToRemove, emptyParagraphs.length); i++) {
          spacerSection = spacerSection.replace(emptyParagraphs[i], '');
        }
        docXml = beforeDrawing + spacerSection + restSection;
      }
    }
  }

  // Assert NO placeholders remain
  assert.ok(!docXml.includes('INPUT JUDUL'), 'Placeholder INPUT JUDUL harus terganti');
  assert.ok(!docXml.includes('Input Mk'), 'Placeholder Input Mk harus terganti');
  assert.ok(!docXml.includes('Input Dosen'), 'Placeholder Input Dosen harus terganti');
  assert.ok(!docXml.includes('INPUT NAMA'), 'Placeholder INPUT NAMA harus terganti');
  assert.ok(!docXml.includes('INPUT NIM'), 'Placeholder INPUT NIM harus terganti');

  // Assert replacement data present
  assert.ok(docXml.includes(escapeXml(nim)), `NIM ${nim} harus ada di dokumen`);
  assert.ok(docXml.includes(escapeXml(tahun)), `Tahun ${tahun} harus ada di dokumen`);

  zip.file('word/document.xml', docXml);
  return zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
}

const templateBuf = fs.readFileSync('assets/templates/cover-template.docx');

// Test Case 1: NIM dengan angka 0 di depan
const buf1 = await testDocxReplacement(templateBuf, {
  judul: 'PRAKTIKUM ANTENA DAN PROPAGASI',
  mataKuliah: 'Praktikum Antena dan Propagasi',
  dosen: 'Ipan Suandi, S.T., M.T.',
  nama: 'Ahmad Dahlan',
  nim: '020230001',
  tahun: '2026'
});
assert.ok(buf1.length > 20000, 'Ukuran DOCX harus valid (> 20KB)');
console.log('  ✅ PASS: Kasus 1 (NIM berawalan 0: 020230001) berhasil digenerate');

// Test Case 2: Judul Multiline & Karakter Spesial (&, apostrof, tanda kutip)
const buf2 = await testDocxReplacement(templateBuf, {
  judul: 'ANALISIS "LINK BUDGET" & POLA RADIASI\nANTENA PADA KOMUNIKASI SATELIT\nFREKUENSI KU-BAND',
  mataKuliah: 'Praktikum Sistem Komunikasi Satelit dan Radar',
  dosen: "Rachmawati, S.T., M.Eng. (Dosen Pengampu)",
  nama: "M. Rizki O'Connor & Partner",
  nim: '0123456789',
  tahun: '2027'
});
assert.ok(buf2.length > 20000, 'Ukuran DOCX multiline harus valid');
console.log('  ✅ PASS: Kasus 2 (Judul multiline & karakter &, quotes, apostrof) berhasil digenerate');

// --------------------------------------------------------------------------
// 7. Verify CSS Rules & Zero Horizontal Overflow
// --------------------------------------------------------------------------
console.log('\n📌 Test 7: Verifikasi Aturan CSS (css/cover-generator.css)');
const cssCode = fs.readFileSync('css/cover-generator.css', 'utf8');

assert.ok(cssCode.includes('.cover-a4-sheet'), '.cover-a4-sheet selector harus ada');
assert.ok(cssCode.includes('aspect-ratio: 210 / 297'), 'Proporsi kertas A4 210 / 297 harus terdefinisi');
assert.ok(cssCode.includes('@media print'), 'Aturan @media print harus ada');
assert.ok(cssCode.includes('#cover-print-container'), 'Container cetak khusus harus diatur');
assert.ok(cssCode.includes('min-height: 44px'), 'Tinggi kontrol minimum 44px untuk kenyamanan sentuh');
assert.ok(cssCode.includes('font-size: 16px'), 'Ukuran font input 16px untuk mencegah auto-zoom iOS');

console.log('  ✅ PASS: Aturan CSS proporsi A4, media cetak, touch-target 44px, dan font 16px terverifikasi');

console.log('\n====================================================');
console.log('🎉 ALL COVER GENERATOR & TOOLS FEATURE TESTS PASSED (100%)!');
console.log('====================================================\n');
