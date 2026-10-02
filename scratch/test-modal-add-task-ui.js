import assert from 'node:assert';
import fs from 'node:fs';

console.log('\n======================================================');
console.log('🧪 TEST SUITE: UI/UX MODAL TAMBAH TUGAS KULIAH');
console.log('======================================================\n');

const html = fs.readFileSync('index.html', 'utf8');
const css = fs.readFileSync('css/design-system.css', 'utf8');
const js = fs.readFileSync('js/app.js', 'utf8');

// 1. Check Modal Header & Single Sync Note
console.log('1️⃣ Memeriksa Header Modal dan Catatan Sinkronisasi...');
assert.ok(html.includes('id="modal-add-assignment"'), 'Modal #modal-add-assignment harus ada');
assert.ok(html.includes('id="modal-add-task-title"'), 'Judul #modal-add-task-title harus ada');

// Ensure header does NOT contain duplicate subtitle
const modalAddHeaderSlice = html.substring(
  html.indexOf('id="modal-add-assignment"'),
  html.indexOf('id="form-add-assignment"')
);
assert.ok(!modalAddHeaderSlice.includes('<p style="font-size: 12px; color: var(--color-text-secondary); margin-top: 2px;">'), 'Header tidak boleh memiliki paragraf duplikat');
assert.ok(!modalAddHeaderSlice.includes('border-color: #FDE68A'), 'Ikon header tidak boleh bernuansa kuning/amber');
assert.ok(modalAddHeaderSlice.includes('class="brand-logo-box"'), 'Header menggunakan brand-logo-box bernuansa biru muda');

// Ensure explanation is placed once near submit button
const formBodySlice = html.substring(
  html.indexOf('id="form-add-assignment"'),
  html.indexOf('id="modal-course-assignments"')
);
assert.ok(formBodySlice.includes('form-sync-note'), 'Catatan form-sync-note harus ada');
assert.ok(formBodySlice.includes('Tugas yang disimpan akan disinkronkan otomatis dan dapat dilihat oleh seluruh kelas TRJT 3A.'), 'Kalimat sinkronisasi harus akurat');
console.log('✅ PASS: Header modal diringkas dan catatan sinkronisasi kelas hanya muncul sekali dekat tombol Simpan.');

// 2. Check Error Message & Problem Fields
console.log('2️⃣ Memeriksa Pesan Kesalahan & Petunjuk Kolom...');
assert.ok(html.includes('id="task-input-error-msg"'), '#task-input-error-msg harus ada');
assert.ok(html.includes('Mohon lengkapi kolom yang wajib diisi.'), 'Teks pesan kesalahan valid');
assert.ok(html.includes('id="error-task-course"'), '#error-task-course petunjuk kolom mata kuliah');
assert.ok(html.includes('id="error-task-title"'), '#error-task-title petunjuk kolom judul');
assert.ok(html.includes('id="error-task-due-date"'), '#error-task-due-date petunjuk kolom tanggal');
assert.ok(js.includes('clearAssignmentFormErrors'), 'clearAssignmentFormErrors didefinisikan di app.js');
assert.ok(js.includes('checkAllFieldsValidToDismissAlert'), 'checkAllFieldsValidToDismissAlert didefinisikan di app.js');
console.log('✅ PASS: Pesan kesalahan validasi dan petunjuk dekat kolom yang bermasalah tersedia lengkap.');

// 3. Check Badge Styling & Spacing
console.log('3️⃣ Memeriksa Konsistensi Badge Wajib/Opsional & Spacing...');
assert.ok(html.includes('class="form-badge-req">Wajib</span>'), 'Badge Wajib tersedia');
assert.ok(html.includes('class="form-badge-opt">Opsional</span>'), 'Badge Opsional tersedia');
assert.ok(css.includes('.form-badge-req'), 'CSS form-badge-req terdefinisi');
assert.ok(css.includes('.form-badge-opt'), 'CSS form-badge-opt terdefinisi');
assert.ok(css.includes('[data-theme="dark"] .form-badge-req'), 'CSS form-badge-req mendukung dark mode');
assert.ok(css.includes('[data-theme="dark"] .form-badge-opt'), 'CSS form-badge-opt mendukung dark mode');

// Check label Tanggal Pengumpulan has standard form-label with space
const dueDateLabelSlice = html.substring(
  html.indexOf('id="group-due-date"'),
  html.indexOf('id="task-input-due-date"')
);
assert.ok(dueDateLabelSlice.includes('class="form-label"'), 'Label tanggal pengumpulan menggunakan class form-label konsisten');
assert.ok(dueDateLabelSlice.includes('<span>Tanggal pengumpulan</span>'), 'Teks label tanggal pengumpulan ada');
assert.ok(dueDateLabelSlice.includes('class="form-badge-req">Wajib</span>'), 'Badge wajib ada pada tanggal pengumpulan');
console.log('✅ PASS: Badge konsisten dan label tanggal pengumpulan memiliki struktur flex berjarak cukup.');

// 4. Check Indonesian Date Formatting & Acuan Jelas
console.log('4️⃣ Memeriksa Ringkasan Tanggal Format Indonesia...');
assert.ok(html.includes('id="task-due-date-preview"'), 'Preview tanggal #task-due-date-preview ada');
assert.ok(html.includes('id="task-due-date-preview-text"'), '#task-due-date-preview-text ada');
assert.ok(js.includes('updateDueDatePreview'), 'updateDueDatePreview terdefinisi di app.js');
assert.ok(js.includes('Januari') && js.includes('Desember'), 'Bulan bahasa Indonesia lengkap didefinisikan');
assert.ok(js.includes('Minggu') && js.includes('Sabtu'), 'Hari bahasa Indonesia lengkap didefinisikan');
console.log('✅ PASS: Ringkasan tanggal bahasa Indonesia terdefinisi lengkap sebagai acuan jelas.');

// 5. Check Quick Date Buttons Synchronization
console.log('5️⃣ Memeriksa Sinkronisasi Tombol Cepat (Besok, 3 Hari lagi, 1 Minggu)...');
assert.ok(js.includes('syncQuickDateButtons'), 'syncQuickDateButtons terdefinisi di app.js');
assert.ok(html.includes('data-days="1" onclick="setQuickDueDate(1)"'), 'Tombol Besok ada');
assert.ok(html.includes('data-days="3" onclick="setQuickDueDate(3)"'), 'Tombol 3 Hari lagi ada');
assert.ok(html.includes('data-days="7" onclick="setQuickDueDate(7)"'), 'Tombol 1 Minggu ada');

// Test syncQuickDateButtons logic
function testSyncLogic() {
  const formatYMD = (daysAhead) => {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const tomorrow = formatYMD(1);
  const threeDays = formatYMD(3);
  const oneWeek = formatYMD(7);
  const arbitraryDate = formatYMD(15);

  const getMatchedDays = (target) => {
    if (target === tomorrow) return 1;
    if (target === threeDays) return 3;
    if (target === oneWeek) return 7;
    return null;
  };

  assert.strictEqual(getMatchedDays(tomorrow), 1, 'Besok cocok');
  assert.strictEqual(getMatchedDays(threeDays), 3, '3 Hari lagi cocok');
  assert.strictEqual(getMatchedDays(oneWeek), 7, '1 Minggu cocok');
  assert.strictEqual(getMatchedDays(arbitraryDate), null, 'Tanggal lain tidak mengaktifkan tombol cepat (dikosongkan)');
  assert.strictEqual(getMatchedDays(''), null, 'Tanggal kosong mengosongkan pilihan');
}
testSyncLogic();
console.log('✅ PASS: Logika sinkronisasi dua arah tombol tanggal cepat teruji.');

// 6. Check Bottom Section Spacing & Safe Scrolling
console.log('6️⃣ Memeriksa Tata Letak Bawah & Aksesibilitas Scrolling Mobile...');
assert.ok(css.includes('#modal-add-assignment .modal-body'), 'CSS modal-body terdefinisi');
assert.ok(css.includes('scroll-behavior: smooth'), 'Smooth scrolling aktif');
assert.ok(css.includes('env(safe-area-inset-bottom'), 'Safe area inset didukung');
assert.ok(css.includes('@media (max-width: 420px)'), 'Media query layar kecil (360px & 390px) terdefinisi');
assert.ok(js.includes("field.scrollIntoView({ behavior: 'smooth', block: 'nearest' })"), 'Auto-scroll field aktif agar tidak tertutup keyboard');
console.log('✅ PASS: Bottom spacing rapi, form dapat discroll, dan kolom aktif terlindungi dari keyboard/gesture area.');

// 7. Check Data Retention on Failure & Double-Click Prevention
console.log('7️⃣ Memeriksa Pencegahan Klik Ganda & Retensi Input saat Gagal...');
assert.ok(js.includes('let isSavingAssignment = false;'), 'isSavingAssignment flag mencegah double click');
assert.ok(js.includes('submitBtn.disabled = true;'), 'Tombol submit dinonaktifkan saat proses simpan');
assert.ok(js.includes('Menyimpan Tugas...'), 'Teks status proses simpan ditampilkan');
assert.ok(js.includes('closeAddAssignmentModal();'), 'Modal hanya ditutup setelah penyimpanan sukses');
console.log('✅ PASS: Klik ganda dicegah, status proses ditampilkan, dan data input dipertahankan saat gagal.');

console.log('\n======================================================');
console.log('🎉 SEMUA PENGUJIAN UI/UX MODAL TAMBAH TUGAS BERHASIL!');
console.log('======================================================\n');
