# Changelog

Semua perubahan penting pada proyek **TRJT 3A Reminder** dicatat dalam dokumen ini. Format pencatatan mengikuti panduan [Keep a Changelog](https://keepachangelog.com/id/1.0.0/).

---

## [Unreleased]

### Fixed
- **Perbaikan Format Akademik & Ekspor PDF 1 Halaman Generator Cover Laporan (v10.1):**
  - **Mengatasi Masalah Halaman Kosong pada PDF:** Mengeliminasi halaman kosong di awal dokumen cetak/PDF dengan menyembunyikan seluruh wrapper antarmuka aplikasi (`.app-viewport`, `.app-container`, `.main-content`, navigasi, header, tabs, buttons, modals) pada `@media print`, serta menjadikan `#cover-print-container` (`.cover-page`) sebagai satu-satunya elemen yang dirender dengan ukuran presisi A4 (`210mm x 297mm`, `page-break-before: avoid`, `page-break-after: avoid`). Print preview terverifikasi tepat **1 of 1 page**.
  - **Standarisasi Tipografi Akademik Times New Roman:** Mengubah seluruh teks cover menjadi murni `"Times New Roman", Times, serif` (menggantikan font sans-serif/Calibri), dengan ukuran judul 14 pt Bold UPPERCASE rata tengah, subjudul tugas 12 pt Bold, nama mata kuliah 12 pt Bold, label dosen 12 pt Bold, nama dosen 12 pt Normal, identitas mahasiswa "Oleh:" 12 pt Normal / Nama 12 pt Bold UPPERCASE / NIM 12 pt Normal, serta identitas institusi 12 pt Bold UPPERCASE dan tahun di baris terakhir.
  - **Proporsi & Susunan Wajib 14 Komponen:** Memastikan urutan resmi 14 elemen cover (Judul, Keterangan tugas, Nama MK, Label Dosen, Nama Dosen, Logo TRJT beresolusi tinggi, "Oleh:", Nama Mahasiswa, NIM Mahasiswa, Logo PNL 30–40 mm, Nama Prodi, Jurusan, Politeknik Negeri Lhokseumawe, Tahun) tersusun rapi dengan margin vertikal proporsional tanpa menggunakan tumpukan tag `<br>` kosong.
  - **Prinsip WYSIWYG & Skalasi Visual Responsif:** Menyelaraskan struktur HTML pratinjau (`#cover-a4-sheet`) dan cetak (`#cover-print-container`) secara identik 100%. Pada layar mobile dan desktop, pratinjau diskalakan secara visual (`setZoom`, auto-fit kalkulasi kontainer) tanpa mengubah dimensi fisik `mm` dan ukuran `pt` dokumen. Efek shadow halus hanya aktif pada pratinjau layar dan dihilangkan total pada hasil print/PDF (`box-shadow: none !important`).
  - **Pencegahan Elemen Web Modern:** Menghilangkan seluruh elemen bergaya web/kartu (card, gradient, rounded container, border dekoratif, glass effect) dari dokumen cover sehingga menghasilkan cetakan bersih seperti template dokumen resmi Microsoft Word.
  - **Verifikasi Pengujian Komprehensif:** Suite pengujian otomatis Edge CDP di `scratch/test-cover-academic-pdf.js` memvalidasi kelulusan 6/6 skenario (tipografi Times New Roman, 14 komponen lengkap, PDF 1 halaman standar, PDF 1 halaman judul 3 baris panjang, responsivitas mobile 390px bebas horizontal overflow, dan rendering cetak bersih).

### Added
- **Fitur Generator Cover Laporan Resmi & Navigasi Terpadu:**
  - Menetapkan tombol navigasi bawah kedua kembali ke **"Dosen"** lengkap dengan ikon Lucide `contact-round` dan label "Dosen", membuka halaman direktori dosen saat ditekan, serta mempertahankan indikator aktif (`active`, `#173F7A`, font-weight 800).
  - Mempertahankan tombol **"Tools"** pada menu utama Beranda (grid pintasan 4×2) dengan ikon `wrench` untuk mengakses fitur Generator Cover dan alat bantu akademik lainnya.
  - Menghapus kartu "Daftar Dosen Pengampu" dari tampilan Tools (`#view-tools`) agar halaman Tools fokus pada **Generator Cover Laporan** tanpa redundansi dengan tab navigasi Dosen.
  - Mengimplementasikan **Generator Cover Laporan** (`#view-cover-generator`) berbasis template resmi `COVER.docx` (A4 Portrait, margin kiri 4 cm, margin atas/kanan/bawah 3 cm, logo Prodi TRJT & PNL asli beresolusi tinggi).
  - Formulir reaktif lengkap: Judul Laporan (mendukung multi-baris & karakter spesial), Mata Kuliah (pilihan dari 11 mata kuliah resmi di `js/data.js` + opsi isi manual), Dosen Pengampu (otomatis terisi dari mata kuliah & tetap dapat diedit), Nama Mahasiswa, NIM Mahasiswa (tipe teks untuk menjamin angka nol di depan tetap tersimpan), dan Tahun (default tahun berjalan).
  - Fitur "Ingat nama dan NIM di perangkat ini" via `localStorage` (default tidak aktif) lengkap dengan tombol hapus identitas tersimpan.
  - Pratinjau interaktif proporsional A4 dengan pembaruan instan, kontrol perbesar/perkecil (`-`, `Fit`, `+`), dan tab segmented ponsel (`Isi Data` vs `Pratinjau Cover`) tanpa scroll horizontal.
  - Ekspor **Word (.docx)** asli menggunakan `lib/jszip.min.js` dengan penyeimbangan paragraf dinamis untuk menjamin cover pas 1 halaman pada panjang isian wajar serta penanganan nama file aman (`Cover_[MK]_[Nama].docx`).
  - Fitur **Cetak / Simpan PDF** melalui tampilan cetak khusus (`@media print` dan `#cover-print-container`) yang hanya mencetak lembar cover tanpa elemen navigasi atau antarmuka aplikasi.
  - Pengujian komprehensif di `scratch/test-cover-generator-feature.js`, verifikasi render halaman di Microsoft Word 16.0 (`scratch/verify_docx_with_word.ps1`), serta otomasi multi-viewport Edge CDP (360px, 390px, 768px, 1440px).
- **Integrasi Firestore Tugas Kuliah untuk WhatsApp Bot (Single Source of Truth):**
  - Mengaudit dan menyelaraskan koleksi Firestore `courseAssignments` sebagai satu-satunya sumber data (tanpa database kedua, tanpa `bot_tasks`).
  - Menstandarisasi skema dokumen tugas di Firestore dengan field lengkap yang bersih dari data UI: `id`, `title` (nama tugas), `courseId`, `courseName` (mata kuliah), `deadline` (format `YYYY-MM-DD` Asia/Jakarta WIB), `dueDate`, `assignmentType` (`"Kelompok"` / `"Individu"`), `type`, `submissionMethod` (`"Kumpul Fisik"`, `"Google Classroom"`, dsb.), `createdAt` (`serverTimestamp()`), dan `updatedAt` (`serverTimestamp()`).
  - Menambahkan metode `updateAssignment(assignmentId, updates)` dan `editAssignment` pada `window.TRJT_ASSIGNMENTS` di [js/assignment-service.js](file:///c:/laragon/www/TRJT%203A/js/assignment-service.js) yang langsung memperbarui dokumen Firestore serta cache lokal secara reaktif.
  - Menambahkan fungsi pembuka edit modal `openEditAssignmentModal(taskOrId)` di [js/app.js](file:///c:/laragon/www/TRJT%203A/js/app.js) dan `openAdminEditTaskModal(id)` di [admin/index.html](file:///c:/laragon/www/TRJT%203A/admin/index.html) tanpa mengubah desain kartu, tema, maupun struktur modal yang ada.
  - Memperbarui pengecekan batas waktu kedaluwarsa pada Cloud Function (`firebase/functions/index.js`) dan Vercel Cron (`api/cron/cleanup-tasks.js`) agar mengenali field `deadline || dueDate`.
  - Menyediakan suite pengujian integrasi otomatis di `scratch/test-whatsapp-bot-firestore-integration.js` yang memvalidasi siklus penuh create, edit, auto-expired, delete, dan simulasi query WhatsApp Bot via Firebase Admin SDK.
- **Menu Galeri Kelas & Integrasi Google Drive via Apps Script (v9.2):**
  - Mengubah tombol navigasi bawah tengah menjadi **Galeri** (menggantikan Jadwal) dengan mempertahankan gaya tombol apung lingkaran (*elevated floating circle* `.nav-item.nav-primary`, warna Navy `#173F7A`, ikon Lucide `images`, tanpa emoji).
  - Menghubungkan antarmuka galeri dengan folder Google Drive kelas (`Folder ID: 1612E_PgMWjnuAJ9WXDZHdPj5bbP32Ps-`) melalui backend mandiri Google Apps Script Web App (`google-apps-script/GaleriDriveBackend.gs`) yang dieksekusi dengan akun Google pemilik folder tanpa memerlukan login ataupun izin Editor dari mahasiswa.
  - Kompresi foto sisi klien menggunakan HTML5 Canvas (target dimensi terpanjang ~1920px, kualitas 0.82 JPEG) untuk efisiensi penyimpanan dan percepatan pengunggahan.
  - Validasi berkas ketat: hanya format gambar (JPG, PNG, WEBP), batasan ukuran maksimal 10 MB, dan penolakan berkas non-gambar dengan pemberitahuan ramah.
  - Modal pratinjau foto (*bottom sheet*) sebelum upload dilengkapi tampilan ukuran berkas dan input keterangan (*caption*) opsional.
  - *Fullscreen Lightbox Viewer* dengan latar belakang gelap `rgba(0,0,0,0.92)`, safe-area iPhone, tombol tutup berdaya kontras tinggi, navigasi keyboard panah/Escape, serta gestur usap layar (*swipe left/right*).
  - Tampilan *skeleton shimmer loading*, *empty state* informatif ("Belum ada foto"), dan penanganan kendala jaringan dengan tombol coba lagi.
  - Pengunggahan foto otomatis menyisipkan berkas di posisi teratas galeri tanpa mengharuskan muat ulang peramban secara manual.
  - Seluruh fungsi jadwal kuliah (kartu Jadwal Hari Ini di Beranda, kartu hero ringkasan perkuliahan, timeline kelas, dan data jadwal) dipertahankan secara utuh dan tetap dapat diakses melalui tombol pintasan jadwal di Beranda.
  - Panduan 2 menit deployment Google Apps Script disediakan di `docs/GOOGLE_APPS_SCRIPT_GALERI.md`.

### Added
- **Fitur Auto-Delete Tugas Setelah Deadline (v9.1):** Otomatisasi pembersihan tugas yang telah melewati tanggal deadline (setelah pukul 23:59:59 WIB pada hari tenggat) dengan integrasi multi-layer:
  - *Client-side fallback:* Helper `isAssignmentExpired()`, `getAssignmentDeadline()`, dan `cleanupExpiredAssignments()` yang aktif saat aplikasi dimuat, snapshot Firestore diperbarui, dan tab aktif kembali. Tugas expired otomatis disaring (*filter*) sebelum render sehingga tidak sempat berkedip di antarmuka mahasiswa.
  - *Server-side Cloud Scheduler:* Fungsi terjadwal `cleanupExpiredAssignmentsScheduled` di `firebase/functions/index.js` dengan timezone `Asia/Jakarta` yang berjalan setiap 1 jam untuk menghapus dokumen tugas kedaluwarsa langsung di Firestore tanpa mengharuskan pengguna membuka aplikasi.
  - *Endpoint Vercel Serverless Cron:* `/api/cron/cleanup-tasks` disiapkan sebagai opsi tambahan scheduler backend.
- **Shortcut Tugas Kuliah pada Menu Akses Cepat Beranda:** Menambahkan kartu pintasan "Tugas kuliah" ke `.home-shortcuts` berdampingan dengan Piket kelas, Kelompok, dan Materi kuliah, lengkap dengan label dinamis status tugas aktif/selesai dan grid adaptif (2 kolom pada mobile, 4 kolom pada tablet/desktop).
- **Web Doorprize BISFEST mandiri:** `doorprize/index.html` dengan palet HIMABIS oranye–hitam–putih, formulir responsif, status proses/gagal/berhasil, dan salin nomor. Hook Google Apps Script disiapkan untuk dikonfigurasi pengguna; backend tidak dibuat. CSS/JS inline pada halaman terpisah, tanpa perubahan aset PWA TRJT.
- **Dokumentasi Komprehensif Berbahasa Indonesia:**
  - `README.md`: Gambaran sistem, panduan menjalankan lokal (Laragon/Python), tabel teknologi, variabel lingkungan, dan tautan dokumen teknis.
  - `docs/ARCHITECTURE.md`: Arsitektur hybrid client-serverless, alur inisialisasi, siklus hidup data, alur override jadwal, tabel dependensi komponen, dan penanganan zona waktu WIB.
  - `docs/FEATURE_MAP.md`: Peta navigasi fitur lengkap (tujuan, selector DOM, renderer, event handler, service, sumber data, dan cara verifikasi).
  - `docs/UI_GUIDELINES.md`: Pedoman desain resmi, token warna putih–biru TRJT 3A, resolusi CSS specificity, skala breakpoint, dan aturan safe area navigasi.
  - `docs/DEVELOPMENT.md`: Panduan alur kerja harian pengembang, pengelompokan skrip pengujian aman vs berisiko, dan penanganan cache Service Worker.
  - `docs/UPGRADE_GUIDE.md`: Matriks dampak perubahan, alur kerja 9 langkah peningkatan, dan contoh kasus perbaikan kartu jadwal.
  - `docs/KNOWN_ISSUES.md`: Analisis temuan masalah nyata, ketidaksinkronan data `lib/reminder-engine.js`, dan rekomendasi teknis.
  - `AGENTS.md`: Pedoman ringkas untuk agen AI coding yang melanjutkan pengembangan repository.
- **Skrip Verifikasi Pengujian & Bukti Tampilan:**
  - `scratch/test-all-viewports.js`: Otomasi pengujian peramban multi-viewport (360px, 390px, 430px, 768px, 1280px) menggunakan Microsoft Edge CDP.
  - `scratch/test-modals.js`: Pengujian interaksi pembukaan modal bottom sheet (Tambah Tugas, Piket, Kelompok).

### Removed
- **Penghapusan Avatar/Profil Besar pada Card Tugas (v9.1):** Menghapus seluruh tombol/avatar/kotak besar 44x44px di sisi kiri card tugas mahasiswa, mengeliminasi margin/padding kiri 56px, dan menggeser seluruh isi informasi tugas rapat ke kiri untuk pemanfaatan ruang layar yang optimal.
- **Penghapusan Bagian Ringkasan Hari Ini di Beranda (v8.4):** Menghapus seksi *"Ringkasan hari ini"* (`.home-overview` / `#dashboard-summary`) yang memuat kartu metrik jumlah kelas selesai/tersisa, sehingga tata letak Beranda mengalir langsung dari menu pintasan ke agenda kelas hari ini dan daftar tugas kuliah dengan tampilan yang jauh lebih bersih, ringkas, dan fokus.
- **Penghapusan Baris Tombol Aksi di Kartu Jadwal:** Menghapus seluruh deretan tombol aksi (`btn-schedule-actions-row` yang berisi tombol Tugas, Materi, dan Kelompok) dari kartu jadwal mingguan (`renderWeeklySchedule`), sehingga kartu jadwal tampil bersih, luas, dan rapi sesuai desain kartu modern. Kartu tetap interaktif dan dapat diklik untuk membuka modal tugas/detail mata kuliah terkait.
- **Penyederhanaan Tampilan Beranda & Jadwal Mahasiswa:**
  - Menghapus badge/chip status di samping baris sapaan Beranda (seperti status "Semua kelas hari ini selesai", "Sedang berlangsung", dll.) baik pada Web PWA maupun Android agar area sapaan header tampil bersih, luas, dan rapi.
  - Menghapus teks subjudul/eyebrow `SATU KELAS, SEMUA TERATUR` di atas sapaan salam Beranda agar tata letak lebih bersih dan ringkas.
  - Menghapus tombol pintasan `Lihat jadwal ↗` dari kartu kelas berikutnya (*Hero Card*) karena navigasi ke jadwal perkuliahan sudah terfasilitasi langsung melalui bilah navigasi bawah (*bottom navigation bar*).
  - Menghapus badge statis `Pertemuan 3/16` dari header Jadwal Mingguan (`#view-jadwal .view-title-row`) untuk menyelaraskan keseragaman header bersih (*clean header*).
- **Penghapusan Tombol Lonceng Notifikasi di Header (v9.0):** Menghapus tombol lonceng notifikasi (`#btn-header-bell`) dari header atas aplikasi untuk mengeliminasi redundansi visual dan navigasi, mengingat fitur Notifikasi telah terintegrasi secara mudah melalui menu 8 pintasan di Beranda (`.home-shortcuts`) serta bilah navigasi bawah (`.bottom-nav`). Header kini tampil jauh lebih bersih, seimbang, dan elegan dengan fokus penuh pada identitas kampus TRJT 3A.

### Changed
- **Penyempurnaan Struktur & Estetika Card Tugas (v9.1):** Menata ulang hierarki card tugas menjadi 5 baris yang bersih, minimalis, dan sesuai dengan tema navy/putih/soft-blue TRJT 3A:
  - **ROW 1:** Judul tugas (14px bold `#172B4D`, wrap maksimal 2 baris) & Tombol delete manual (36x36px, rounded 10px, background `#FFF3F3`, icon `#E85B5B` di kanan atas).
  - **ROW 2:** Icon buku kecil Lucide `book-open` (14px `#173F7A`) + Nama mata kuliah (12px `#315F9A`).
  - **ROW 3:** Countdown dalam badge kecil soft-blue (11px semi-bold `#173F7A`, background `#EEF4FB`, border `#DCE7F3`, radius 8px) + Batas tanggal Indonesia (`Batas: Sel, 6 Okt 2026`, 11px `#718096`).
  - **ROW 4:** Divider tipis (`1px solid #E8EEF4`, margin 0 0 8px).
  - **ROW 5:** Metadata bawah bersih (`[users] Kelompok • [map-pin] Kumpul Fisik`, 11px `#718096`, icon `#8A98A8`).
- **Penyempurnaan Minimalis & Modern Card Jadwal Kuliah (v8.9):**
  - **Struktur 2 Kolom Bersih:** Menyederhanakan kartu jadwal (`.schedule-glass-card`) menjadi tata letak 2 kolom elegan:
    - **Kolom Kiri (Waktu):** Lebar tetap 56px tanpa kotak/card internal tebal (`background: transparent`, `border: none`). Jam mulai `07.30` (15px bold `#172B4D`), jam selesai `10.00` (11px `#8A98A8`), dan durasi `150 mnt` (10px semi-bold `#173F7A`, pill `#EEF4FB`, radius 6px).
    - **Kolom Kanan (Informasi):** Menggunakan `flex: 1` dengan urutan vertikal presisi:
      1. **Nama Mata Kuliah:** Elemen dominan teratas (13.5px–14px bold `#172B4D`, line-height 1.3).
      2. **Lokasi:** Tampil sebagai baris sekunder bersih dengan ikon pin `#55789C` dan teks `#718096` 11px tanpa badge latar belakang berat. Jarak dari judul mata kuliah tepat 4px.
      3. **Nama Dosen:** Baris horizontal sederhana `[icon user] Nama Dosen` dengan ikon `#173F7A` dan teks `#40556C` 11px font-weight 500, tanpa kotak biru besar, border, maupun shadow berlebih. Jarak dari baris lokasi tepat 9px (rentang 8–10px).
  - **Pembersihan Visual Bebas Clutter:** Menghilangkan badge status "SELESAI", garis aksen hijau samping, dan kotak avatar biru panjang.
  - **Desain Kartu Utama:** Latar putih `#FFFFFF`, border halus `#E5EBF2`, border-radius 16px, padding `14px 16px`, dan bayangan sangat tipis `0 3px 10px rgba(20, 49, 79, 0.04)`.
  - **Dukungan Dark Mode:** Kartu menggunakan latar `#131B2E`, border `#1E293B`, teks judul putih `#F1F5F9`, lokasi `#94A3B8`, dosen `#CBD5E1`, dan durasi soft blue pill `rgba(59, 130, 246, 0.18)`.
  - **Pengujian Responsif Lengkap:** Diuji bebas overflow pada viewport 320px, 360px, 375px, 390px, 414px, dan 430px dengan pembungkusan teks (*text-wrapping*) yang rapi dan tanpa horizontal scroll.
  - Menyinkronkan cache Service Worker dan aset stylesheet ke `v8.9` pada `index.html`, `sw.js`, dan `firebase-messaging-sw.js`.
- **Standardisasi Posisi Header & Spacing Vertikal Antar-Halaman (v8.8):**
  - **Zero Overlap & Sticky Header:** Memindahkan latar navy langsung ke `.app-header` dengan `position: sticky; top: 0; border-radius: 0 0 28px 28px;` pada semua halaman non-Beranda (`:not(.home-active)`), dan menonaktifkan pseudo-elemen `.app-container::before` (`display: none !important;`) sehingga header navy tetap berada dalam document flow normal tanpa menutupi konten halaman.
  - **Jarak Header ke Judul Halaman:** Menstandarkan jarak dari bawah header ke judul halaman tepat **18px** (dalam rentang target 16–20px) melalui `.main-content { padding-top: 18px !important; }`.
  - **Pencegahan Duplikasi Safe Area iPhone/PWA:** Menetapkan `padding-top: 0 !important;` pada `.app-container` mahasiswa agar `env(safe-area-inset-top)` hanya ditangani satu kali oleh `.app-header` (`calc(14px + var(--safe-area-top))`), menghilangkan penambahan safe-area ganda.
  - **Standardisasi Tipografi Judul & Subjudul:** Menyeragamkan seluruh judul halaman (Jadwal Mingguan, Dosen Pengampu, Notifikasi, Pengaturan) menjadi `font-size: 20px; font-weight: 700; color: #172B4D; margin: 0;` dan subjudul menjadi `font-size: 12px; font-weight: 500; color: #718096; margin-top: 4px;`.
  - **Penyelarasan Aksi Tandai Dibaca (Notifikasi):** Memastikan judul *"Notifikasi"* dan tombol *"Tandai dibaca"* sejajar rapi secara horizontal pada satu baris di bawah header, dengan subjudul *"Kotak masuk pengingat kelas"* tepat di bawahnya.
  - **Jarak Subjudul ke Konten (20–24px):**
    - Halaman Dosen: Jarak subjudul ke kotak pencarian (*search box*) tepat **20px** (target: 20–24px).
    - Halaman Notifikasi: Jarak subjudul ke filter pills (*Semua / Belum dibaca*) tepat **20px** (target: 20px).
    - Halaman Pengaturan: Jarak subjudul ke judul seksi *"Notifikasi & Alarm"* tepat **24px** (target: 24px).
    - Halaman Jadwal: Jarak subjudul ke pemilih hari (*day selector capsule*) tepat **20px** (target: 20–24px).
  - **Pemeliharaan Beranda:** Menjaga tata letak Beranda dengan jarak logo ke sapaan tepat **30px** dan sapaan ke banner berikutnya tepat **22px**.
  - Menyinkronkan versi Service Worker cache dan query string stylesheet ke `v8.8` pada `index.html`, `sw.js`, dan `firebase-messaging-sw.js`.
- **Penyederhanaan Minimalis Bagian Tugas & Deadline (v8.7):**
  - Menghapus pembungkus card putih besar, border, outline, dan box-shadow pada empty state *"Semua tugas selesai!"* sehingga menyatu langsung dan ringan dengan latar belakang halaman.
  - Mengubah layout empty state menjadi flex horizontal ringkas dengan tinggi ~48-52px (di bawah batas 60px), padding vertikal minimal, dan icon centang indikator 28px lingkaran lembut `#ECF8F3` berikon `#3BAA7A`.
  - Merapikan tipografi teks empty state: judul *"Semua tugas selesai!"* `#172B4D` 13px bold, deskripsi `#7B8794` 11.5px, dengan jarak vertikal 2px.
  - Memperbarui badge `0 Tugas` menjadi lebih subtle: latar `#EEF2F6`, teks `#657487`, border-radius 8px, tanpa border kuat, ukuran font 10px.
  - Menyelaraskan teks button *"Lihat semua"* menjadi text-button sederhana tanpa background/border berwarna primary navy `#173F7A` 11.5px font-weight 600.
  - Mengoptimalkan proporsi tombol `+ Tambah` menjadi tinggi 40px, padding horizontal 14px, radius 11px, latar `#173F7A`, dan shadow lembut `0 4px 10px rgba(23, 63, 122, 0.18)`.
  - Menyinkronkan versi Service Worker cache ke `v8.7` pada `index.html`, `sw.js`, dan `firebase-messaging-sw.js`.
- **Penyelarasan Palet Warna Tema Dewasa & Elegan (v8.6):**
  - Menggantikan warna biru terang/elektrik (`#2F80ED`) dengan **Primary Navy (`#173F7A`)** dan **Primary Dark (`#123568`)** pada seluruh aksi, link, button aktif, dan navigation.
  - Menetapkan teks biasa dan judul mata kuliah menjadi dark navy/hitam (`#172B4D`), teks pendukung/lokasi menjadi soft gray (`#718096`), dan border menjadi neutral gray (`#E3EAF2`).
  - Memperbarui tombol `+ Tambah` menjadi latar navy `#173F7A`, teks putih `#FFFFFF`, hover `#123568`, dan bayangan lembut `0 4px 12px rgba(23, 63, 122, 0.20)`.
  - Memperbarui badge `0 Tugas` menjadi netral abu-abu dengan latar `#EEF3F8`, teks `#526273`, dan border `1px solid #DCE5EE`.
  - Mengubah link aksi *"Semua jadwal →"* dan *"Lihat semua"* menjadi warna primary navy `#173F7A`.
  - Menyelaraskan bottom navigation: item non-aktif menggunakan icon `#7C8B9A` dan label `#526273`; item aktif menggunakan primary navy `#173F7A`.
  - Memperbarui tombol tengah melayang *Jadwal* dengan latar navy `#173F7A`, icon putih `#FFFFFF`, border `3px solid #FFFFFF`, dan shadow `0 5px 14px rgba(23, 63, 122, 0.22)` agar menyatu elegan dengan header.
  - Memperbarui kartu jadwal: jam mulai `#172B4D`, nama mata kuliah `#172B4D`, lokasi `#718096` beserta icon `#718096` (bukan biru), dan panah chevron navy `#173F7A`.
  - Memperbarui empty state tugas: judul *"Semua tugas selesai!"* berwarna `#172B4D`, deskripsi `#718096`, dan lingkaran centang sukses hijau lembut `#EEF8F4` / `#2FB67C`.
  - Menyinkronkan token `:root` CSS, inlined styles `index.html`, serta memperbarui Service Worker cache ke `v8.6` pada `sw.js` dan `firebase-messaging-sw.js`.
- **Kompaksi Jarak Spacing Header & Sapaan Beranda (v8.5):** Merapikan jarak vertikal antara area logo header dan baris salam sapaan (*greeting*) menjadi tepat 30px (dari sebelumnya 48px), padding horizontal header 20px, padding top 16px, margin-top greeting 30px, dan jarak ke kartu banner 22px tanpa ruang kosong berlebihan.
- **Penyederhanaan & Netralisasi Visual UI Beranda & Jadwal (v8.3):**
  - Mengadopsi sistem warna minimalis 80% putih/soft blue/gray, 15% primary blue, 5% semantik: menghilangkan badge visual status "SELESAI", titik hijau, dan garis aksen hijau di sisi kiri kartu jadwal tanpa mengubah logika/kalkulasi data JavaScript.
  - Menyelaraskan seluruh kartu jadwal mingguan (`.schedule-glass-card`) dengan latar putih `#FFFFFF`, border halus `#E5EDF5`, border-radius 18px, bayangan sangat tipis, jam mulai warna dark navy `#15314F`, chip lokasi `#F1F6FC` berikon pin biru di pojok kanan atas, panel dosen `#EEF5FD`, dan badge durasi `#EAF3FF`.
  - Menyamakan ketiga kartu ringkasan di Beranda (`.summary-item`) dengan latar putih bersih `#FFFFFF` dan border `#E1EAF4` yang konsisten, menghapus ikon centang hijau pada angka sisa kelas (`0 ✓` menjadi `0`), dan membedakan fokus hanya melalui warna tipografi angka (biru, hijau tua, oranye tua).
  - Menyelaraskan kalender pemilih hari (`.day-btn-item`) menjadi kartu putih bersih untuk tanggal non-aktif dan primary blue penuh untuk tanggal terpilih.
  - Memperlembut indikator lingkaran state kosong tugas (`.today-status-circle.finished`) menjadi `#EEF8F4` dengan ikon `#25A875` serta badge jadwal piket (`.piket-today-pill`) menjadi soft blue `#EEF5FD` dengan titik indikator biru `#2F80ED`.
  - Menyelaraskan token `:root` dan tema gelap, serta menyinkronkan versi cache Service Worker ke `v8.3` pada `index.html`, `sw.js`, dan `firebase-messaging-sw.js`.
- **Penyelarasan Presisi Desain Kartu Jadwal Detail (v8.2):**
  - Memperbarui gaya kartu `.schedule-glass-card` dengan radius 19px, latar putih bersih, border tipis soft gray/blue, padding 14px 16px, shadow sangat lembut, serta jarak antar kartu 11px.
  - Memperbaiki kolom waktu: jam mulai 15.5px bold navy (`font-weight: 700`), divider vertikal tipis, jam selesai 11.5px text-secondary, dan durasi perkuliahan dalam badge kapsul soft-blue beradius 8px dengan teks biru kontras.
  - Menyesuaikan badge status selesai menjadi kapsul hijau muda dengan titik indikator (`border-radius: 20px`, font 10px bold) dan badge lokasi berlatar abu/biru lembut dengan ikon pin lokasi tanpa overflow pada layar sempit.
  - Menyelaraskan panel dosen berlatar biru lembut dengan avatar sirkular berbingkai putih dan teks nama dosen yang rapi.
  - Menyelaraskan dukungan tema gelap dan menaikkan cache PWA ke `v8.2`.
- **Pembersihan Efek Glass & Pemadatan Banner Kampus di Beranda (v8.1):**
  - Memadatkan tinggi banner `.campus-cover` dari 365px–420px menjadi `clamp(215px, 26vw, 245px)` pada perangkat seluler dan `260px` pada tablet/desktop, menghilangkan ruang kosong kosong ~168px di atas teks jadwal sehingga seluruh menu pintasan 4×2 langsung terlihat tanpa perlu digulir.
  - Menghilangkan efek kotak background dan border kaca transparan (*frosted glass box*) pada label `KELAS BERIKUTNYA` (`.hero-tag-pill`), wadah ikon jam (`.hero-clock-circle`), dan badge pengingat (`.hero-reminder-badge`) sehingga teks dan ikon tampil bersih, menyatu alami di atas ilustrasi banner.
  - Merapikan posisi fokus gambar ornamen atap kampus (`object-position: center 30%`), menghaluskan gradien navy bawah untuk keterbacaan teks maksimal, dan menyinkronkan versi cache PWA ke `v8.1` pada `index.html`, `sw.js`, dan `firebase-messaging-sw.js`.
- **Banner kelas berikutnya di Beranda:** Teks slogan statis pada ilustrasi kampus diganti dengan satu kartu kelas berikutnya yang memakai renderer jadwal asli. Waktu, mata kuliah, ruang, dosen, status H-10, countdown, dan keadaan hari libur tetap dinamis tanpa kartu duplikat di bawah menu. Pembaruan tiap detik hanya mengubah countdown/progres saat kelas dan status tetap sama. Ringkasan harian menempati lebar penuh, mock browser pengujian dilengkapi elemen body, dan cache PWA diperbarui ke `v8.0`.
- **Tampilan Jadwal Mingguan:** Memperjelas hari aktif dengan gradasi biru–navy, memberi panel waktu lembut pada kartu kelas, menjaga judul kelas selesai tetap kontras, serta merapikan kartu piket. Tema gelap dan fokus keyboard disesuaikan; kartu kelas kini bisa dibuka dengan Enter/Spasi. Cache PWA dinaikkan ke `v7.9`.
- **2 Oktober 2026 — Panduan tema untuk pembaruan Antigravity:** Menyelaraskan enam dokumen `docs/` dan `AGENTS.md` dengan struktur Beranda putih–biru saat ini, pintasan 4×2, dock navigasi baru, pemeriksaan responsif/gelap, serta nama cache PWA `v7.8` yang berlaku.
- **2 Oktober 2026 — Tema menu kampus Beranda:** Header navy putih–biru, ilustrasi kampus pada banner, delapan pintasan dalam grid 4×2 dengan ikon pada ubin putih, serta dock navigasi bawah dengan tombol Jadwal biru yang terangkat. Tata letak responsif dan tema gelap disesuaikan; aset baru dan versi CSS/JS tersinkron pada cache PWA `v7.8`. Pemeriksaan navigasi Dosen diselaraskan dengan posisi tab yang baru.
- **Penyelarasan Desain Berdasarkan Referensi (UI Modern White-Blue):**
  - Mengadopsi tata letak kartu membulat (radius 18–24px) dengan bayangan lembut (*soft elevation*).
  - Mengubah kartu kelas berikutnya (*Hero Card*) menggunakan gradien biru royal premium (`linear-gradient(135deg, #1E6DEB 0%, #0F3D91 100%)`) dengan tombol kapsul putih kontras tinggi.
  - Mengubah pemilih hari menjadi bentuk kapsul vertikal dengan nama hari dan nomor tanggal.
  - Mengubah kartu jadwal mingguan menjadi format timeline dengan kolom waktu di sebelah kiri kartu kelas.
  - Menata bilah navigasi bawah (*Floating Pill Navigation*) melayang di atas konten dengan latar belakang efek kaca (*glassmorphism*).
- **Service Worker PWA:**
  - Menambahkan `./css/student-ui.css` ke dalam daftar cache `sw.js` dan `firebase-messaging-sw.js` untuk menjamin ketersediaan tampilan secara offline.

### Fixed
- **Perbaikan Kartu Jadwal Hari Ini di Beranda:**
  - Memperbaiki layout flex `.today-class-card` dan `.today-card-left` sehingga judul mata kuliah tidak lagi terhimpit/hilang dan tampil penuh (maksimal 2 baris).
  - Mengunci lebar kolom jam ke 58px dan memberi `min-width: 0` pada kolom konten agar teks ruangan/lokasi tidak membungkus per kata.
  - Memastikan badge `AKAN DATANG` tidak pecah 2 baris dengan `white-space: nowrap`.
  - Menyajikan status `BERLANGSUNG` pada kartu aktif sebagai teks putih bersih dengan titik indikator menyala (`#38BDF8`), tanpa pembungkus kartu/pill tambahan yang melebar.
  - Merapikan header widget "Tugas & deadline" menjadi satu baris terpadu dengan tombol "+ Tambah" minimal 44px dan link "Lihat semua".
  - Menghilangkan horizontal overflow pada viewport sempit (360px–390px).
- **Penyempurnaan & Beautifikasi Visual Kartu Jadwal (Halaman Jadwal):**
  - **Penyeimbangan Lebar Tombol Aksi (Zero Empty Gap):** Mengganti CSS Grid 3-kolom kaku dengan Flexbox adaptif (`display: flex; gap: 8px;` dengan anak `flex: 1 1 0;`) sehingga mata kuliah dengan 2 tombol aksi (seperti *Jaringan Komputer Lanjut* tanpa praktikum) otomatis membagi lebar 50%:50% secara proporsional dan simetris tanpa celah kosong 1/3 di sisi kanan.
  - **Perbaikan Ikon Materi Tak Terlihat:** Mengganti warna hardcoded putih `#FFFFFF` pada `.btn-schedule-mat i` di `design-system.css:1137` menjadi `currentColor`, menjamin ikon buku Lucide tampil tajam dalam warna biru utama `#2F80ED` pada mode terang dan `#93C5FD` pada mode gelap.
  - **Tombol Aksi Taktil & Berdimensi:** Menambahkan border biru halus (`1px solid rgba(191, 219, 254, 0.7)`), latar `var(--color-very-light-blue)`, bayangan lembut (`box-shadow: 0 1px 3px rgba(15, 61, 145, 0.04)`), dan efek angkat saat kursor diarahkan (*hover lift*).
  - **Penataan Panel Dosen yang Kokoh (*Grounded*):** Memberikan kontainer berlatar `var(--color-very-light-blue)` berbingkai lengkung 12px, lingkaran avatar dosen 26px dengan bayangan halus, serta pembungkusan teks 2 baris bersih (`-webkit-line-clamp: 2; white-space: normal !important;`) sehingga gelar akademik panjang (seperti *Muhammad Syahroni, S.T., M.T.*) terbaca utuh tanpa terpotong elipsis `...`.
  - **Micro-badge Durasi Perkuliahan:** Mengemas teks durasi waktu (`150 mnt` / `100 mnt`) menjadi lencana mikro berbentuk pil yang rapi dengan bingkai biru lembut dan latar transparan seimbang di mode terang maupun mode gelap.
  - **Pembersihan Aksen Garis Kiri Tombol Piket:** Menghilangkan aksen garis pseudo-element hijau yang tak disengaja pada `.student-app .btn-piket-action::before { display: none !important; }`.
  - **Sinkronisasi Cache PWA:** Menyetel versi cache ke `v7.6` pada `sw.js`, `firebase-messaging-sw.js`, dan link referensi CSS di `index.html`.
- **Penyelarasan Tampilan Kartu Jadwal Sesuai Pedoman UI & Eliminasi Glitch Scrollbar:**
  - Menata tombol aksi (Tugas / Materi / Kelompok) dalam CSS Grid 3 kolom (`repeat(3, minmax(0, 1fr))`) dengan gap 8px, tinggi min 44px, border 0, radius 14px, latar `var(--color-soft-blue)`, dan teks `var(--color-primary-blue)`.
  - Memperbaiki rendering ikon Lucide 16×16 stroke 2 (`clipboard-list`, `book-open`, `users`) dan menjamin pemanggilan `lucide.createIcons()` pasca-render.
  - Menambahkan fallback layout vertikal otomatis pada layar sempit (&le;420px) sehingga label tombol tidak pernah terpotong.
  - Mengurangi tumpukan kotak (*box-in-box*): panel dosen kini tanpa border dengan latar `var(--color-soft-blue-extra)`, tombol aksi terpisah bersih di baris tersendiri.
  - Menerapkan garis aksen kiri kartu sebagai pembeda status: hijau `#059669` untuk Selesai (opacity 0.88), biru `var(--color-primary-blue)` untuk Berlangsung, dan abu soft-slate `#CBD5E1` untuk Akan Datang.
  - Menambahkan indikator progress bar tipis (3.5px) di bagian bawah kartu yang sedang berlangsung, diperbarui reaktif di `tick()` lewat `style.width` tanpa re-render DOM berulang.
  - Menyempurnakan kolom waktu: jam mulai tebal navy, jam selesai muted, jarak vertikal lega, dan penambahan durasi perkuliahan (mis. `150 mnt`).
  - Menghilangkan elemen abu-abu vertikal di desktop dengan membersihkan style mock frame perangkat `#E6EFF8` serta mengganti scrollbar bawaan dengan scrollbar tipis transparan modern.
- **Penyelarasan Beranda – Ringkasan Hari Ini & Akses Cepat Sesuai UI Guidelines:**
  - Menerapkan sistem warna semantik konsisten pada 3 kartu statistik: biru (`var(--color-very-light-blue)` / `var(--color-primary-blue)`) untuk Kelas hari ini, hijau (`var(--color-success-bg)` / `var(--color-success-text)`) untuk Kelas selesai, dan amber lembut (`var(--color-warning-bg)` / `var(--color-warning-text)`) untuk Kelas tersisa.
  - Memperbarui tipografi kartu statistik: angka 28–32px bold (`font-weight: 700`) dan label 13px bold-medium.
  - Menambahkan ikon centang hijau kecil (`✓`) di samping angka pada kartu "Kelas tersisa" jika bernilai 0.
  - Menghindari re-render `innerHTML` setiap detik di `tick()` dengan signature check `dataset.sig` pada kontainer ringkasan harian.
  - Memposisikan kalimat *"Cek jadwal, siapkan materi, jalani hari dengan tenang."* sebagai subjudul bersih tepat di bawah judul *"Ringkasan hari ini"*.
  - Mengubah tombol grafik header ringkasan menjadi elemen tombol 44×44px dengan `aria-label="Lihat statistik"`.
  - Menyeragamkan tinggi kartu akses cepat (`grid-auto-rows: 1fr`), membatasi deskripsi maksimal 2 baris (`line-clamp: 2`), menyamakan warna kotak ikon (putih–biru konsisten), meningkatkan kontras panah pojok (&gt;3:1), serta menyamakan radius kartu ke 20px dengan bayangan lembut.
  - Sinkronisasi Service Worker cache ke `v7.5` pada `sw.js`, `firebase-messaging-sw.js`, dan `index.html`.
- **Penyempurnaan Dark Mode & Notifikasi Toast:**
  - Memindahkan notifikasi toast ke bagian bawah (di atas bottom nav, `bottom: calc(96px + var(--safe-area-bottom))` dengan `z-index: 95`) agar tidak menutupi sapaan header.
  - Mengatur durasi auto-dismiss toast menjadi 3 detik dengan tombol tutup 44px.
  - Memperbaiki padding atas header agar sapaan "Selamat pagi" tidak terpotong tepi layar.
  - Memastikan kontras chip dan teks kecil di dark mode memenuhi standar WCAG AA dengan token resmi.
- **Perbaikan Offset Ikon pada Input Pencarian Modal:**
  - Memperbaiki padding sisi kiri input pencarian pada Modal Materi (`#mat-search-input`) dan Modal Semua Tugas (`#all-tasks-search-input`) dengan `padding-left: 38px !important`, sehingga ikon kaca pembesar tidak lagi menumpuk (*overlapping*) di atas teks placeholder *Cari materi...*.
- **Pembersihan Total Warna Ungu (Restorasi Palet Asli Putih–Biru):**
  - Mengeliminasi seluruh token warna ungu (`#5842ce`, `#4630b8`, `#654cdb`, dll.) yang sempat masuk pada draf sebelumnya.
  - Mengembalikan seluruh tombol, badge, status aktif, dan aksen navigasi ke warna biru utama `#2F80ED`, navy `#0F2942`, serta warna semantik resmi.
- **Resolusi Specificity Layout Desktop Beranda:**
  - Mengatasi aturan `#view-beranda #hero-card-container { grid-column: 1 / -1; }` pada `design-system.css` dengan menerapkan scope `.student-app` pada `student-ui.css`, sehingga Kartu Hero dan Ringkasan Harian dapat bersisian secara proporsional pada desktop (&ge;768px).
- **Kontras Teks Hero Card pada Dark Mode:**
  - Mengunci warna teks sekunder hero card secara statis ke `#DCEEFF` dan `#EBF4FE` agar tetap kontras dan mudah dibaca pada mode gelap.
- **Pencegahan Teks Terpotong pada Ringkasan Harian:**
  - Memperbaiki fleksibilitas tinggi kartu ringkasan (`.summary-item`) agar seluruh label (*Kelas hari ini*, *Kelas selesai*, *Kelas tersisa*) terbaca utuh tanpa terpotong.
- **Penambahan Teks Status Eksplisit pada Kartu Jadwal:**
  - Menambahkan label teks `• BERLANGSUNG`, `• AKAN DATANG`, dan `• SELESAI` agar penyampaian status tidak hanya bergantung pada warna (ramah aksesibilitas).

---

## [4.3.0] - Versi Basis Proyek

### Catatan
- Versi basis awal yang tercatat di `package.json` sebelum penataan dokumentasi dan penyelarasan antarmuka terkini.
- Roster resmi 11 mata kuliah Semester 5 TRJT 3A TA 2026/2027 didefinisikan di `js/data.js`.
- Integrasi Firebase Firestore, Firebase Cloud Messaging, dan Google Drive API telah terpasang.
