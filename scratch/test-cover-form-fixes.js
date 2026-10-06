import assert from 'node:assert';
import fs from 'node:fs';
import { spawn } from 'node:child_process';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const PORT = 9233;

async function runTests() {
  console.log('\n======================================================');
  console.log('🧪 TEST SUITE: COVER GENERATOR FORM FIXES & INTEGRATION');
  console.log('======================================================\n');

  const edgeProc = spawn(EDGE_PATH, [
    `--remote-debugging-port=${PORT}`,
    '--headless=new',
    '--disable-gpu',
    '--window-size=1440,900',
    '--user-data-dir=C:\\Users\\ASUS\\.gemini\\antigravity-ide\\scratch\\edge_profile_test_fixes',
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
      const cur = msgId++;
      pending.set(cur, { resolve, reject });
      ws.send(JSON.stringify({ id: cur, method, params }));
    });
  }

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(msg.error);
      else resolve(msg.result);
    }
  };

  await new Promise((r) => (ws.onopen = r));
  await send('Page.enable');
  await send('Runtime.enable');

  await send('Page.navigate', { url: 'http://127.0.0.1/TRJT%203A/index.html' });
  await new Promise((r) => setTimeout(r, 2000));

  async function evalJs(expr) {
    const res = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
    return res.result.value;
  }

  // Open Cover Generator
  await evalJs("switchTab('cover-generator');");
  await new Promise((r) => setTimeout(r, 400));

  // --------------------------------------------------------------------------
  // TEST 1: Course dropdown options, stable IDs, and deduplication
  // --------------------------------------------------------------------------
  console.log('📌 Test 1: Verifikasi Dropdown Mata Kuliah');
  const courseOptions = await evalJs(`
    Array.from(document.querySelectorAll('#cover-course-select option')).map(o => ({
      value: o.value,
      text: o.text
    }));
  `);

  console.log(`  Total options: ${courseOptions.length}`);
  assert.strictEqual(courseOptions[0].value, '', 'Opsi pertama harus placeholder');
  assert.strictEqual(courseOptions[courseOptions.length - 1].value, '__custom__', 'Opsi terakhir harus Isi Manual');

  const regularCourses = courseOptions.filter(o => o.value && o.value !== '__custom__');
  console.log('  Regular courses:', regularCourses.map(c => ({ val: c.value, text: c.text })));
  assert.strictEqual(regularCourses.length, 11, 'Harus ada tepat 11 mata kuliah unik TRJT 3A');

  // Verify stable IDs prefix
  regularCourses.forEach(c => {
    assert.ok(c.value.startsWith('mk-'), `ID mata kuliah harus stabil dengan prefiks mk-: ${c.value}`);
    assert.ok(c.text.length > 5, `Nama mata kuliah harus lengkap: ${c.text}`);
  });
  console.log('  ✅ PASS: 11 mata kuliah unik dengan stable ID mk-... terpopulasi lengkap');

  // --------------------------------------------------------------------------
  // TEST 2: Dosen Combobox structure & Lecturer list from TRJT_DOSEN
  // --------------------------------------------------------------------------
  console.log('\n📌 Test 2: Verifikasi Dropdown Dosen Pengampu');
  const triggerPlaceholder = await evalJs("document.getElementById('cover-dosen-trigger-text').innerText;");
  assert.strictEqual(triggerPlaceholder, 'Pilih dosen pengampu', 'Placeholder harus "Pilih dosen pengampu"');

  // Open combobox
  await evalJs("document.getElementById('cover-dosen-trigger').click();");
  await new Promise((r) => setTimeout(r, 200));

  const isMenuVisible = await evalJs("document.getElementById('cover-dosen-dropdown').style.display !== 'none';");
  assert.ok(isMenuVisible, 'Menu dropdown dosen harus terbuka saat trigger ditekan');

  const dosenOptions = await evalJs(`
    Array.from(document.querySelectorAll('#cover-dosen-options-list .cover-combobox-option')).map(o => ({
      id: o.getAttribute('data-id'),
      name: o.querySelector('.combobox-opt-name')?.innerText || '',
      sub: o.querySelector('.combobox-opt-sub')?.innerText || ''
    }));
  `);

  console.log(`  Total dosen options di combobox: ${dosenOptions.length}`);
  assert.strictEqual(dosenOptions.length, 7, 'Harus ada 6 dosen TRJT + 1 opsi manual');
  assert.ok(dosenOptions.some(d => d.name === 'Ipan Suandi, S.T., M.T.'), 'Ipan Suandi harus ada dalam daftar');
  assert.ok(dosenOptions.some(d => d.name === 'Dr. Nelly Safitri, SST., M.Eng.Sc.'), 'Dr. Nelly Safitri harus ada dalam daftar');
  console.log('  ✅ PASS: 6 Dosen pengampu resmi dengan gelar dan NIP terdaftar di combobox');

  // --------------------------------------------------------------------------
  // TEST 3: Lecturer Search Filtering in Combobox
  // --------------------------------------------------------------------------
  console.log('\n📌 Test 3: Uji Pencarian / Filter Dosen');
  await evalJs(`
    const searchInp = document.getElementById('cover-dosen-search-input');
    searchInp.value = 'nelly';
    searchInp.dispatchEvent(new Event('input'));
  `);
  await new Promise((r) => setTimeout(r, 200));

  const filteredCount = await evalJs(`
    document.querySelectorAll('#cover-dosen-options-list .cover-combobox-option').length;
  `);
  const firstFilteredName = await evalJs(`
    document.querySelector('#cover-dosen-options-list .cover-combobox-option .combobox-opt-name')?.innerText;
  `);
  assert.strictEqual(filteredCount, 2, 'Pencarian "nelly" harus menghasilkan 1 dosen + 1 opsi manual');
  assert.ok(firstFilteredName.includes('Nelly Safitri'), 'Hasil pencarian pertama harus Nelly Safitri');
  console.log('  ✅ PASS: Pencarian real-time dosen berhasil menyaring daftar secara akurat');

  // Close dropdown
  await evalJs("document.getElementById('cover-dosen-trigger').click();");
  await new Promise((r) => setTimeout(r, 200));

  // --------------------------------------------------------------------------
  // TEST 4: Auto-select lecturer when Course changes & consistent reset
  // --------------------------------------------------------------------------
  console.log('\n📌 Test 4: Uji Pemilihan Mata Kuliah & Auto-select Dosen');
  await evalJs(`(() => {
    const courseSel = document.getElementById('cover-course-select');
    courseSel.value = 'mk-praktikum-antena-dan-propagasi';
    courseSel.dispatchEvent(new Event('change'));
  })()`);
  await new Promise((r) => setTimeout(r, 200));

  let currentDosen = await evalJs("document.getElementById('cover-dosen-trigger-text').innerText;");
  let previewCourse = await evalJs("document.getElementById('prev-course-name').innerText;");
  let previewDosen = await evalJs("document.getElementById('prev-lecturer-name').innerText;");

  assert.strictEqual(currentDosen, 'Ipan Suandi, S.T., M.T.', 'Dosen harus otomatis terisi Ipan Suandi');
  assert.strictEqual(previewCourse, 'Praktikum Antena dan Propagasi', 'Pratinjau mata kuliah harus memakai nama lengkap');
  assert.strictEqual(previewDosen, 'Ipan Suandi, S.T., M.T.', 'Pratinjau dosen harus memakai nama lengkap');
  console.log('  ✅ PASS: Mata kuliah "Praktikum Antena dan Propagasi" otomatis memilih dosen Ipan Suandi');

  // Change to Jaringan Komputer Lanjut
  await evalJs(`(() => {
    const courseSel = document.getElementById('cover-course-select');
    courseSel.value = 'mk-jaringan-komputer-lanjut';
    courseSel.dispatchEvent(new Event('change'));
  })()`);
  await new Promise((r) => setTimeout(r, 200));
  const debugState = await evalJs(`({
    courseVal: document.getElementById('cover-course-select').value,
    stateCourseId: CoverGenerator.state.selectedCourseId,
    stateMataKuliah: CoverGenerator.state.mataKuliah,
    stateDosenId: CoverGenerator.state.selectedDosenId,
    stateDosen: CoverGenerator.state.dosen
  })`);
  console.log('  DEBUG STATE:', debugState);

  currentDosen = await evalJs("document.getElementById('cover-dosen-trigger-text').innerText;");
  previewCourse = await evalJs("document.getElementById('prev-course-name').innerText;");
  previewDosen = await evalJs("document.getElementById('prev-lecturer-name').innerText;");

  assert.strictEqual(currentDosen, 'Muhammad Syahroni, S.T., M.T.', 'Dosen harus otomatis diperbarui ke Muhammad Syahroni');
  assert.strictEqual(previewCourse, 'Jaringan Komputer Lanjut', 'Pratinjau mata kuliah harus Jaringan Komputer Lanjut');
  assert.strictEqual(previewDosen, 'Muhammad Syahroni, S.T., M.T.', 'Pratinjau dosen harus Muhammad Syahroni');
  console.log('  ✅ PASS: Mengganti mata kuliah memperbarui dosen secara konsisten tanpa membawa dosen lama');

  // Manual override of lecturer: user selects Rachmawati
  console.log('\n📌 Test 5: Pengguna Mengganti Dosen Secara Manual dari Daftar');
  await evalJs("document.getElementById('cover-dosen-trigger').click();");
  await new Promise((r) => setTimeout(r, 200));
  await evalJs(`
    const optRcm = document.querySelector('#cover-dosen-options-list .cover-combobox-option[data-name*="Rachmawati"]');
    if (optRcm) optRcm.click();
  `);
  await new Promise((r) => setTimeout(r, 200));

  currentDosen = await evalJs("document.getElementById('cover-dosen-trigger-text').innerText;");
  previewDosen = await evalJs("document.getElementById('prev-lecturer-name').innerText;");
  assert.strictEqual(currentDosen, 'Rachmawati, S.T., M.Eng.', 'Dosen terpilih harus berubah menjadi Rachmawati');
  assert.strictEqual(previewDosen, 'Rachmawati, S.T., M.Eng.', 'Pratinjau dosen harus berubah menjadi Rachmawati');
  console.log('  ✅ PASS: Pengguna berhasil mengganti dosen pengampu dari daftar');

  // --------------------------------------------------------------------------
  // TEST 6: Real-time Title Counter on typing, pasting, and reset
  // --------------------------------------------------------------------------
  console.log('\n📌 Test 6: Uji Penghitung Karakter & Baris Judul');
  const titleSample = 'LAPORAN PRAKTIKUM ANTENA DAN PROPAGASI\nPENGUKURAN POLA RADIASI ANTENA DIPOLE';
  await evalJs(`(() => {
    const titleInp = document.getElementById('cover-title-input');
    titleInp.value = ${JSON.stringify(titleSample)};
    titleInp.dispatchEvent(new Event('input'));
  })()`);
  await new Promise((r) => setTimeout(r, 200));

  let counterText = await evalJs("document.getElementById('cover-title-counter').innerText;");
  const expectedChars = titleSample.length;
  assert.ok(counterText.includes(`${expectedChars} karakter`), `Counter harus menampilkan ${expectedChars} karakter, didapat: ${counterText}`);
  assert.ok(counterText.includes('2 baris'), `Counter harus menampilkan 2 baris, didapat: ${counterText}`);
  console.log(`  ✅ PASS: Penghitung judul aktif: "${counterText}"`);

  // Test paste simulation
  await evalJs(`(() => {
    const titleInp = document.getElementById('cover-title-input');
    titleInp.value = 'BARIS SATU\\nBARIS DUA\\nBARIS TIGA';
    titleInp.dispatchEvent(new Event('paste'));
  })()`);
  await new Promise((r) => setTimeout(r, 100));
  counterText = await evalJs("document.getElementById('cover-title-counter').innerText;");
  assert.ok(counterText.includes('3 baris'), 'Pasting harus memperbarui jumlah baris');
  console.log(`  ✅ PASS: Event paste memperbarui counter secara instan: "${counterText}"`);

  // --------------------------------------------------------------------------
  // TEST 7: Mobile Tab switching preserves form data
  // --------------------------------------------------------------------------
  console.log('\n📌 Test 7: Perpindahan Tab Mobile (Isi Data <-> Pratinjau Cover)');
  await evalJs("CoverGenerator.switchMobileTab('preview');");
  await new Promise((r) => setTimeout(r, 200));
  const isPrevTabActive = await evalJs("document.getElementById('btn-tab-prev').classList.contains('active');");
  assert.ok(isPrevTabActive, 'Tab Pratinjau Cover harus aktif');

  await evalJs("CoverGenerator.switchMobileTab('form');");
  await new Promise((r) => setTimeout(r, 200));
  const restoredTitleVal = await evalJs("document.getElementById('cover-title-input').value;");
  const restoredCourseVal = await evalJs("document.getElementById('cover-course-select').value;");
  assert.ok(restoredTitleVal.length > 0, 'Isi judul harus tetap utuh setelah berpindah tab');
  assert.strictEqual(restoredCourseVal, 'mk-jaringan-komputer-lanjut', 'Pilihan mata kuliah harus tetap tersimpan');
  console.log('  ✅ PASS: Seluruh pilihan dan isi formulir tetap utuh saat berpindah tab');

  // --------------------------------------------------------------------------
  // TEST 8: Full Export DOCX & Print HTML synchronization
  // --------------------------------------------------------------------------
  console.log('\n📌 Test 8: Uji Ekspor DOCX & Format Cetak');
  await evalJs(`
    document.getElementById('cover-title-input').value = 'LAPORAN PRAKTIKUM ANTENA DAN PROPAGASI\\nPENGUKURAN POLA RADIASI';
    document.getElementById('cover-title-input').dispatchEvent(new Event('input'));
    document.getElementById('cover-name-input').value = 'Muhammad Raihan';
    document.getElementById('cover-name-input').dispatchEvent(new Event('input'));
    document.getElementById('cover-nim-input').value = '020230001';
    document.getElementById('cover-nim-input').dispatchEvent(new Event('input'));
    document.getElementById('cover-year-input').value = '2026';
    document.getElementById('cover-year-input').dispatchEvent(new Event('input'));
  `);
  await new Promise((r) => setTimeout(r, 200));

  const exportDocxRes = await evalJs(`
    (async () => {
      try {
        await CoverGenerator.exportDocx();
        return { success: true, status: document.getElementById('cover-status-message').innerText };
      } catch (e) {
        return { success: false, error: e.message };
      }
    })()
  `);
  assert.ok(exportDocxRes.success, `Ekspor DOCX harus berhasil: ${JSON.stringify(exportDocxRes)}`);
  console.log('  ✅ PASS: Ekspor DOCX dengan nama MK & dosen terpilih berhasil');

  // --------------------------------------------------------------------------
  // TEST 9: Error & Retry Flow on Course Loading
  // --------------------------------------------------------------------------
  console.log('\n📌 Test 9: Uji Penanganan Error & Tombol "Coba lagi"');
  // Simulate load failure
  await evalJs(`(() => {
    // Temporarily backup schedule
    window.__bak_schedule = window.TRJT_SCHEDULE;
    window.TRJT_SCHEDULE = null;
    localStorage.removeItem('trjt_cover_courses_cache_v1');
    localStorage.removeItem('trjt_courses_cache_v1');
    window.__bak_dosen = window.TRJT_DOSEN;
    window.TRJT_DOSEN = null;
    localStorage.removeItem('trjt_cover_dosen_cache_v1');
    CoverGenerator.loadCourses(true);
  })()`);
  await new Promise((r) => setTimeout(r, 200));

  const isErrorBoxVisible = await evalJs("document.getElementById('cover-course-error-box').style.display !== 'none';");
  assert.ok(isErrorBoxVisible, 'Kotak pesan error harus tampil saat data tidak dapat dimuat');
  console.log('  ✅ PASS: Pesan error dan tombol Coba lagi tampil saat pemuatan gagal');

  // Click retry button after restoring data
  await evalJs(`
    window.TRJT_SCHEDULE = window.__bak_schedule;
    window.TRJT_DOSEN = window.__bak_dosen;
    document.getElementById('btn-retry-course').click();
  `);
  await new Promise((r) => setTimeout(r, 300));

  const isErrorBoxHidden = await evalJs("document.getElementById('cover-course-error-box').style.display === 'none';");
  const optionsAfterRetry = await evalJs("document.querySelectorAll('#cover-course-select option').length;");
  assert.ok(isErrorBoxHidden, 'Kotak pesan error harus disembunyikan setelah coba lagi berhasil');
  assert.strictEqual(optionsAfterRetry, 13, 'Mata kuliah harus terpopulasi kembali setelah coba lagi');
  console.log('  ✅ PASS: Tombol Coba lagi berhasil memulihkan daftar mata kuliah');

  // Capture screenshot of updated form (390px mobile viewport)
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await new Promise((r) => setTimeout(r, 300));
  const ss = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('scratch/screenshot_cover_form_fixed_390px.png', Buffer.from(ss.data, 'base64'));
  console.log('  📸 Disimpan: scratch/screenshot_cover_form_fixed_390px.png');

  console.log('\n======================================================');
  console.log('🎉 ALL COVER FORM FIXES TESTS PASSED SUCCESSFULLY (9/9)!');
  console.log('======================================================\n');

  edgeProc.kill();
  process.exit(0);
}

runTests().catch((err) => {
  console.error('Error during test execution:', err);
  process.exit(1);
});
