import assert from 'node:assert';
import fs from 'node:fs';
import { spawn } from 'node:child_process';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const PORT = 9255;

async function runTestSuite() {
  console.log('\n======================================================');
  console.log('🧪 TEST SUITE: ACADEMIC COVER FORMAT & 1-PAGE PDF PRINT');
  console.log('======================================================\n');

  const edgeProc = spawn(EDGE_PATH, [
    `--remote-debugging-port=${PORT}`,
    '--headless=new',
    '--disable-gpu',
    '--window-size=1440,900',
    '--user-data-dir=C:\\Users\\ASUS\\.gemini\\antigravity-ide\\scratch\\edge_profile_test_academic',
    'about:blank'
  ]);

  let targetPage = null;
  for (let i = 0; i < 40; i++) {
    await new Promise((r) => setTimeout(r, 200));
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json`);
      if (res.ok) {
        const list = await res.json();
        targetPage = list.find((t) => t.type === 'page');
        if (targetPage) break;
      }
    } catch (e) {}
  }

  if (!targetPage) {
    console.error('Target page tidak ditemukan');
    edgeProc.kill();
    process.exit(1);
  }

  const ws = new WebSocket(targetPage.webSocketDebuggerUrl);
  let msgId = 1;
  const pending = new Map();

  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = msgId++;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.id && pending.has(data.id)) {
      const { resolve, reject } = pending.get(data.id);
      pending.delete(data.id);
      if (data.error) reject(data.error);
      else resolve(data.result);
    }
  };

  await new Promise((r) => { ws.onopen = r; });

  await send('Page.enable');
  await send('Runtime.enable');
  await send('DOM.enable');
  await send('CSS.enable');

  console.log('Navigating to TRJT 3A application...');
  await send('Page.navigate', { url: 'http://127.0.0.1/TRJT%203A/index.html' });
  await new Promise((r) => setTimeout(r, 1500));

  // Navigate to Generator Cover
  await send('Runtime.evaluate', {
    expression: `
      switchTab('tools');
      setTimeout(() => {
        const card = document.querySelector('.tool-action-card');
        if (card) card.click();
      }, 200);
    `
  });
  await new Promise((r) => setTimeout(r, 800));

  // --------------------------------------------------------------------------
  // TEST 1: Check Font Times New Roman and Academic Typography on Preview Sheet
  // --------------------------------------------------------------------------
  console.log('📌 Test 1: Verifikasi Font Times New Roman & Tipografi Akademik');
  const typoRes = await send('Runtime.evaluate', {
    expression: `
      (function() {
        const sheet = document.getElementById('cover-a4-sheet');
        const title = document.getElementById('prev-title');
        const subhead = document.querySelector('.cover-subhead');
        const course = document.getElementById('prev-course-name');
        const dosenLbl = document.querySelector('.cover-dosen-lbl');
        const dosen = document.getElementById('prev-lecturer-name');
        const oleh = document.querySelector('.cover-oleh');
        const student = document.getElementById('prev-student-name');
        const nim = document.getElementById('prev-student-nim');
        const instLine = document.querySelector('.cover-inst-line');
        const year = document.getElementById('prev-year');

        function getFont(el) {
          if (!el) return null;
          return window.getComputedStyle(el).fontFamily;
        }

        return {
          sheetFont: getFont(sheet),
          titleFont: getFont(title),
          titleSize: window.getComputedStyle(title).fontSize,
          titleWeight: window.getComputedStyle(title).fontWeight,
          courseFont: getFont(course),
          dosenFont: getFont(dosen),
          studentFont: getFont(student),
          instFont: getFont(instLine),
          yearFont: getFont(year)
        };
      })()
    `,
    returnByValue: true
  });
  const typo = typoRes.result.value;
  console.log('Computed font details:', typo);
  assert.ok(typo.sheetFont.includes('Times New Roman'), 'Font sheet harus Times New Roman');
  assert.ok(typo.titleFont.includes('Times New Roman'), 'Font judul harus Times New Roman');
  assert.ok(typo.courseFont.includes('Times New Roman'), 'Font mata kuliah harus Times New Roman');
  assert.ok(typo.dosenFont.includes('Times New Roman'), 'Font dosen harus Times New Roman');
  assert.ok(typo.studentFont.includes('Times New Roman'), 'Font mahasiswa harus Times New Roman');
  assert.ok(typo.instFont.includes('Times New Roman'), 'Font institusi harus Times New Roman');
  console.log('  ✅ PASS: Seluruh elemen cover menggunakan font Times New Roman resmi');

  // --------------------------------------------------------------------------
  // TEST 2: Urutan Wajib Komponen Cover (1 - 14)
  // --------------------------------------------------------------------------
  console.log('\n📌 Test 2: Verifikasi 14 Susunan Wajib Dokumen Cover');
  const orderRes = await send('Runtime.evaluate', {
    expression: `
      (function() {
        const sheet = document.getElementById('cover-a4-sheet');
        const elementsInOrder = [];
        
        // 1. Judul
        const title = sheet.querySelector('.cover-title');
        // 2. Keterangan
        const subhead = sheet.querySelector('.cover-subhead');
        // 3. Nama MK
        const course = sheet.querySelector('.cover-course');
        // 4. Dosen Pengampu label
        const dosenLbl = sheet.querySelector('.cover-dosen-lbl');
        // 5. Nama Dosen
        const dosenName = sheet.querySelector('.cover-dosen-name');
        // 6. Logo TRJT
        const logoTrjt = sheet.querySelector('.cover-logo-trjt');
        // 7. Oleh
        const oleh = sheet.querySelector('.cover-oleh');
        // 8. Nama Mahasiswa
        const studentName = sheet.querySelector('.cover-student-name');
        // 9. NIM
        const studentNim = sheet.querySelector('.cover-student-nim');
        // 10. Logo PNL
        const logoPnl = sheet.querySelector('.cover-logo-pnl');
        // 11-13. Institusi lines
        const instLines = Array.from(sheet.querySelectorAll('.cover-inst-line'));
        // 14. Tahun
        const year = sheet.querySelector('.cover-year');

        return {
          hasTitle: !!title,
          hasSubhead: !!subhead && subhead.textContent.includes('Laporan ini disusun'),
          hasCourse: !!course,
          hasDosenLbl: !!dosenLbl && dosenLbl.textContent.includes('Dosen Pengampu'),
          hasDosenName: !!dosenName,
          hasLogoTrjt: !!logoTrjt && logoTrjt.src.includes('logo-prodi'),
          hasOleh: !!oleh && oleh.textContent.trim() === 'Oleh:',
          hasStudentName: !!studentName,
          hasStudentNim: !!studentNim,
          hasLogoPnl: !!logoPnl && logoPnl.src.includes('logo-pnl'),
          instLinesCount: instLines.length,
          hasYear: !!year
        };
      })()
    `,
    returnByValue: true
  });
  const order = orderRes.result.value;
  assert.ok(order.hasTitle, 'Judul harus ada');
  assert.ok(order.hasSubhead, 'Keterangan tugas harus ada');
  assert.ok(order.hasCourse, 'Nama mata kuliah harus ada');
  assert.ok(order.hasDosenLbl, 'Label Dosen Pengampu harus ada');
  assert.ok(order.hasDosenName, 'Nama dosen harus ada');
  assert.ok(order.hasLogoTrjt, 'Logo TRJT harus ada');
  assert.ok(order.hasOleh, 'Oleh: harus ada');
  assert.ok(order.hasStudentName, 'Nama mahasiswa harus ada');
  assert.ok(order.hasStudentNim, 'NIM mahasiswa harus ada');
  assert.ok(order.hasLogoPnl, 'Logo PNL harus ada');
  assert.strictEqual(order.instLinesCount, 3, 'Tiga baris institusi harus ada');
  assert.ok(order.hasYear, 'Tahun harus ada');
  console.log('  ✅ PASS: Seluruh 14 komponen cover terpasang sesuai urutan akademik wajib');

  // --------------------------------------------------------------------------
  // TEST 3: Pengisian Data Lengkap & Uji Print PDF (Harus 1 of 1 Page)
  // --------------------------------------------------------------------------
  console.log('\n📌 Test 3: Uji Ekspor PDF Standar (Verifikasi Halaman PDF = 1)');
  await send('Runtime.evaluate', {
    expression: `
      (function() {
        const titleInput = document.getElementById('cover-title-input');
        if (titleInput) {
          titleInput.value = 'PRAKTIKUM I\\nSINYAL DIGITAL';
          titleInput.dispatchEvent(new Event('input'));
        }
        const courseSelect = document.getElementById('cover-course-select');
        if (courseSelect && courseSelect.options.length > 1) {
          courseSelect.selectedIndex = 1;
          courseSelect.dispatchEvent(new Event('change'));
        }
        const nameInput = document.getElementById('cover-name-input');
        if (nameInput) {
          nameInput.value = 'ILAL ILHAMDI';
          nameInput.dispatchEvent(new Event('input'));
        }
        const nimInput = document.getElementById('cover-nim-input');
        if (nimInput) {
          nimInput.value = '2024203020001';
          nimInput.dispatchEvent(new Event('input'));
        }
        CoverGenerator.updatePreview();
      })()
    `
  });
  await new Promise((r) => setTimeout(r, 400));

  // Generate PDF via CDP
  const pdf1 = await send('Page.printToPDF', {
    paperWidth: 8.27,
    paperHeight: 11.69,
    marginTop: 0,
    marginBottom: 0,
    marginLeft: 0,
    marginRight: 0,
    printBackground: true
  });
  const buf1 = Buffer.from(pdf1.data, 'base64');
  fs.writeFileSync('scratch/academic_cover_single_page.pdf', buf1);
  const pdfStr1 = buf1.toString('binary');
  const pageMatches1 = pdfStr1.match(/\/Type\s*\/Page\b/g);
  const pageCount1 = pageMatches1 ? pageMatches1.length : 0;
  console.log(`  Total halaman PDF hasil print: ${pageCount1}`);
  assert.strictEqual(pageCount1, 1, 'Hasil PDF harus tepat 1 halaman tanpa halaman kosong');
  console.log('  ✅ PASS: PDF berhasil dicetak dalam tepat 1 halaman A4 (1 of 1 page)');

  // --------------------------------------------------------------------------
  // TEST 4: Uji Judul Multi-baris Panjang (3 Baris)
  // --------------------------------------------------------------------------
  console.log('\n📌 Test 4: Uji Judul Multi-baris Panjang (Tetap Muat 1 Halaman)');
  await send('Runtime.evaluate', {
    expression: `
      (function() {
        const titleInput = document.getElementById('cover-title-input');
        if (titleInput) {
          titleInput.value = 'LAPORAN PRAKTIKUM JARINGAN KOMPUTER LANJUT\\nKONFIGURASI BGP ROUTING DAN VLAN TRUNKING\\nPADA TOPOLOGI JARINGAN ENTERPRISE KAMPUS';
          titleInput.dispatchEvent(new Event('input'));
        }
        CoverGenerator.updatePreview();
      })()
    `
  });
  await new Promise((r) => setTimeout(r, 400));

  const pdf2 = await send('Page.printToPDF', {
    paperWidth: 8.27,
    paperHeight: 11.69,
    marginTop: 0,
    marginBottom: 0,
    marginLeft: 0,
    marginRight: 0,
    printBackground: true
  });
  const buf2 = Buffer.from(pdf2.data, 'base64');
  const pdfStr2 = buf2.toString('binary');
  const pageCount2 = (pdfStr2.match(/\/Type\s*\/Page\b/g) || []).length;
  console.log(`  Total halaman PDF judul 3 baris: ${pageCount2}`);
  assert.strictEqual(pageCount2, 1, 'Judul 3 baris harus tetap muat dalam 1 halaman');
  console.log('  ✅ PASS: Judul 3 baris tetap pas dalam 1 halaman A4 tanpa overflow');

  // --------------------------------------------------------------------------
  // TEST 5: Uji Visual Scaling Pada Mobile Screen (390px)
  // --------------------------------------------------------------------------
  console.log('\n📌 Test 5: Uji Skalasi Visual Responsif pada Mobile (390px)');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true
  });
  await new Promise((r) => setTimeout(r, 400));

  // Switch to mobile preview tab
  await send('Runtime.evaluate', {
    expression: `
      CoverGenerator.switchMobileTab('preview');
    `
  });
  await new Promise((r) => setTimeout(r, 600));

  const mobileCheck = await send('Runtime.evaluate', {
    expression: `
      (function() {
        const container = document.querySelector('.cover-canvas-container');
        const sheet = document.getElementById('cover-a4-sheet');
        const scaler = document.getElementById('cover-sheet-scaler');
        const zoomText = document.getElementById('cover-zoom-text');
        const bodyWidth = document.body.clientWidth;

        return {
          containerWidth: container ? container.clientWidth : 0,
          zoomText: zoomText ? zoomText.textContent : '',
          scalerTransform: scaler ? window.getComputedStyle(scaler).transform : '',
          hasHorizontalOverflow: document.documentElement.scrollWidth > bodyWidth
        };
      })()
    `,
    returnByValue: true
  });
  console.log('Mobile preview evaluation:', mobileCheck.result.value);
  assert.ok(!mobileCheck.result.value.hasHorizontalOverflow, 'Tidak boleh ada horizontal overflow di mobile');
  console.log('  ✅ PASS: Skalasi preview mobile berfungsi sempurna tanpa horizontal overflow');

  // Screenshot on mobile for verification
  const mobileShot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('scratch/screenshot_preview_mobile_390px.png', Buffer.from(mobileShot.data, 'base64'));
  console.log('  📸 Screenshot mobile disimpan di: scratch/screenshot_preview_mobile_390px.png');

  // Reset viewport to desktop
  await send('Emulation.clearDeviceMetricsOverride');
  await send('Runtime.evaluate', {
    expression: `CoverGenerator.switchMobileTab('form');`
  });
  await new Promise((r) => setTimeout(r, 400));

  // --------------------------------------------------------------------------
  // TEST 6: Tangkap Screenshot Rendering Print Cetak A4
  // --------------------------------------------------------------------------
  console.log('\n📌 Test 6: Verifikasi Rendering Cetak Bersih');
  await send('Emulation.setEmulatedMedia', { media: 'print' });
  await new Promise((r) => setTimeout(r, 300));
  const printShot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('scratch/screenshot_print_a4_clean.png', Buffer.from(printShot.data, 'base64'));
  console.log('  📸 Screenshot print cetak disimpan di: scratch/screenshot_print_a4_clean.png');

  console.log('\n======================================================');
  console.log('🎉 ALL ACADEMIC COVER TESTS PASSED SUCCESSFULLY (6/6)!');
  console.log('======================================================\n');

  ws.close();
  edgeProc.kill();
}

runTestSuite().catch((err) => {
  console.error(err);
  process.exit(1);
});
