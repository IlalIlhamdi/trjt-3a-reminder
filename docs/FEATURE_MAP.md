# Peta Fitur (Feature Map) TRJT 3A Reminder

Dokumen ini berfungsi sebagai peta navigasi teknis bagi pengembang untuk menemukan lokasi kode, elemen DOM, fungsi perender, event handler, dan sumber data untuk setiap fitur dalam aplikasi.

---

## 1. Klasifikasi Perilaku Fitur

### Halaman mandiri Doorprize BISFEST
- **Berkas:** `doorprize/index.html` (CSS dan JavaScript inline), `doorprize/logo-himabis.png`.
- **DOM:** `#formRegistrasi`, `#formBox`, `#loading`, `#error`, `#hasil`, `#nomorUndian`, `#salin`, `#copyStatus`.
- **Handler:** submit form memanggil `google.script.run.simpanData(data)` jika tersedia; `setBusy` dan `showError` mengatur status; hasil ditampilkan setelah server mengembalikan nomor.
- **Integrasi:** Google Apps Script/Sheets dikonfigurasi sendiri oleh pengguna. Halaman bukan bagian renderer atau cache PWA mahasiswa.

Setiap fitur dalam sistem diklasifikasikan ke dalam tipe aksi berikut:
- 🎨 **UI Display Only:** Hanya memanipulasi tampilan DOM tanpa penyimpanan data.
- 💾 **Local Preference:** Menyimpan pengaturan di `localStorage` peramban klien.
- 🌐 **Database Write:** Menulis data secara *real-time* ke Google Cloud Firestore.
- 🔔 **Notification Trigger:** Menghasilkan peringatan audio lokal, getar, atau WebPush FCM.

---

## 2. Matriks Fitur Lengkap

### 1. Kartu Kelas Berikutnya (Next Class Hero Card)
- **Tujuan:** Menampilkan kelas aktif berikutnya secara cerdas sesuai jam saat ini (WIB), menampilkan ruang, dosen, dan countdown waktu.
- **Tipe Aksi:** 🎨 UI Display Only
- **Halaman / Modal:** Beranda (`#view-beranda`)
- **Container / ID DOM:** `.campus-cover > #hero-card-container` (`<figcaption>` di atas ilustrasi kampus); hanya ada satu renderer kelas berikutnya di Beranda.
- **Fungsi Renderer:** `renderHeroCard()` di [js/app.js](file:///c:/laragon/www/TRJT%203A/js/app.js)
- **Event Handler:** `tick()` memperbarui countdown dan progres setiap detik, tetapi mengganti markup kartu hanya ketika kelas/status/data berubah; akses jadwal lengkap melalui bilah navigasi Jadwal.
- **Service yang Digunakan:** `TimeProvider`
- **Sumber Data:** `getEffectiveSchedule()` menggabungkan `js/data.js` & Firestore `scheduleOverrides`
- **Cara Memeriksa:** Buka beranda pada hari kerja, atau gunakan [dev/simulation.html](file:///c:/laragon/www/TRJT%203A/dev/simulation.html) untuk menyimulasikan berbagai jam kuliah.

---

### 2. Ringkasan Harian (Daily Summary Stats)
- **Tujuan:** Menampilkan 3 kartu ringkasan jumlah kelas hari ini, kelas yang telah selesai, dan kelas tersisa.
- **Tipe Aksi:** 🎨 UI Display Only
- **Halaman / Modal:** Beranda (`#view-beranda`)
- **Container / ID DOM:** `#dashboard-summary` berisi tiga `.summary-item`.
- **Fungsi Renderer:** `renderHeader()` di [js/app.js](../js/app.js) memperbarui angka ringkasan saat jumlah/status kelas berubah.
- **Event Handler:** Otomatis diperbarui oleh siklus `tick()` setiap detik
- **Service yang Digunakan:** `TimeProvider`
- **Sumber Data:** Kalkulasi dinamis dari jadwal efektif hari ini
- **Cara Memeriksa:** Periksa angka statistik di kartu ringkasan beranda pada jam kuliah aktif.

---

### 3. Akses Cepat (Quick Access Buttons)
- **Tujuan:** Delapan pintasan utama menuju jadwal, tugas, materi, piket, kelompok, dosen, notifikasi, dan pengaturan.
- **Tipe Aksi:** 🎨 UI Action Buttons (berpindah tab atau membuka modal)
- **Halaman / Modal:** Beranda (`#view-beranda`)
- **Container / ID DOM:** `.home-shortcuts` berisi delapan tombol `.class-shortcut` dalam grid 4×2. Di atasnya, `.campus-cover` menampilkan ilustrasi `assets/images/campus-inspired-banner.png` bersama informasi kelas berikutnya dinamis di `#hero-card-container`; kelas `home-active` pada `<body>` menampilkan latar header navy saat Beranda aktif.
- **Aksi tombol:**
  - **Jadwal** &rarr; klik `.nav-item[data-tab="jadwal"]`.
  - **Tugas** &rarr; `openAllAssignmentsModal()` (`#modal-all-assignments`).
  - **Materi** &rarr; `openCourseMaterialsModal()` (`#modal-course-materials`).
  - **Piket** &rarr; `openPiketModal()` (`#modal-piket-schedule`).
  - **Kelompok** &rarr; `openCourseGroupsModal()` (`#modal-course-groups`).
  - **Dosen** &rarr; klik `.nav-item[data-tab="dosen"]`.
  - **Notifikasi** &rarr; klik `.nav-item[data-tab="notifikasi"]`.
  - **Pengaturan** &rarr; klik `.nav-item[data-tab="pengaturan"]`.
- **Fungsi Renderer:** Menu dan gambar banner adalah markup statis di `index.html`; teks kelas pada banner diisi `renderHeroCard()` dari [js/app.js](../js/app.js), sedangkan tab dan modal memakai renderer terkait.
- **Event Handler:** `onclick` pada pintasan memanggil fungsi modal atau meneruskan klik ke navigasi bawah; `setupEvents()` menangani `.nav-item[data-tab]`, sedangkan `switchTab()` mengubah tab aktif dan kelas `home-active`.
- **Service yang Digunakan:** Bergantung pada tujuan pintasan, terutama `assignmentService` untuk tugas dan `materialService` untuk materi.
- **Cara Memeriksa:** Klik kedelapan pintasan pada Beranda dan pastikan tab atau modal tujuan terbuka; periksa grid 4×2 dan banner pada layar ponsel, desktop, serta tema gelap.
- **Kontrak visual untuk Antigravity:** Urutan menu tetap Jadwal, Tugas, Materi, Piket, Kelompok, Dosen, Notifikasi, Pengaturan. Pertahankan header navy, ubin ikon putih bergaris navy, label di bawah ikon, dan aset banner lokal. Rincian token, breakpoint, serta dock bawah ada di [UI_GUIDELINES.md](UI_GUIDELINES.md).

---

### 4. Jadwal Kuliah Hari Ini & Widget Tugas di Beranda
- **Tujuan:** Menampilkan daftar timeline ringkas kelas hari ini berdampingan dengan daftar tugas mendesak.
- **Tipe Aksi:** 🎨 UI Display Only
- **Halaman / Modal:** Beranda (`#view-beranda`)
- **Container / ID DOM:** `#today-timeline-container`, `#home-upcoming-tasks-container`
- **Fungsi Renderer:** `renderTodayTimeline()`, `renderUpcomingTasksWidget()` di [js/app.js](file:///c:/laragon/www/TRJT%203A/js/app.js)
- **Event Handler:** Tombol "Semua jadwal" memicu `switchTab('jadwal')`; tombol "Tambah" memicu `openAddAssignmentModal()`.
- **Service yang Digunakan:** `assignmentService`
- **Sumber Data:** `getEffectiveSchedule()` dan `assignmentService.getUpcomingTasks()`
- **Cara Memeriksa:** Buka Beranda pada resolusi ponsel (vertikal) dan desktop 1280px (tata letak dua kolom).

---

### 5. Jadwal Mingguan & Kapsul Pemilih Hari
- **Tujuan:** Menampilkan jadwal lengkap Senin–Jumat dengan format kapsul vertikal dan timeline waktu di sebelah kiri kartu kelas.
- **Tipe Aksi:** 🎨 UI Display Only
- **Halaman / Modal:** Tab Jadwal (`#view-jadwal`)
- **Container / ID DOM:** `#weekly-day-selector.day-selector-capsule`, `.day-btn-item[data-day]`, `#weekly-cards-container`, `#btn-open-piket-modal`
- **Fungsi Renderer:** `renderWeeklySchedule()`, `selectScheduleDay(dayId)` di [js/app.js](file:///c:/laragon/www/TRJT%203A/js/app.js)
- **Event Handler:** Tombol `.day-btn-item[data-day]` memicu pergantian hari; kartu `.schedule-glass-card` membuka detail/tugas mata kuliah melalui klik atau tombol Enter/Spasi; tombol `#btn-open-piket-modal` membuka daftar piket.
- **Service yang Digunakan:** *None*
- **Sumber Data:** `WEEKLY_SCHEDULE` di [js/data.js](file:///c:/laragon/www/TRJT%203A/js/data.js) digabungkan dengan override Firestore
- **Cara Memeriksa:** Klik tab "Jadwal", ganti hari *Senin–Jumat*, buka kartu kelas dan piket, lalu ulangi dengan keyboard. Periksa 360/390/430/768/1280px dan tema gelap tanpa teks terpotong atau overflow.

---

### 6. Tugas & Deadline Kuliah
- **Tujuan:** Pencatatan tugas baru, penandaan selesai, filter status (Semua, Aktif, Selesai), dan sinkronisasi real-time kelas.
- **Tipe Aksi:** 🌐 Database Write & 💾 Local Preference
- **Halaman / Modal:** `#modal-add-assignment`, `#modal-all-assignments`, `#modal-course-assignments`
- **Container / ID DOM:**
  - Form: `#form-add-assignment`
  - Input: `#task-input-course`, `#task-input-title`, `#task-input-due-date`, `#task-input-desc`
  - Tombol Quick Date: `.quick-date-btn[data-days="1|3|7"]`
  - List Container: `#all-tasks-list-container`, `#course-tasks-list-container`
- **Fungsi Renderer:** `renderAllAssignmentsList()`, `renderCourseAssignmentsList()` di [js/app.js](file:///c:/laragon/www/TRJT%203A/js/app.js)
- **Event Handler:** `handleSaveAssignment(e)`, `toggleAssignmentTask(id)`, `deleteAssignmentTask(id)`
- **Service yang Digunakan:** `assignmentService` di [js/assignment-service.js](file:///c:/laragon/www/TRJT%203A/js/assignment-service.js)
- **Sumber Data:** Koleksi Firestore `courseAssignments` dengan fallback cache `trjt_assignments_cache`
- **Cara Memeriksa:** Buka form "Tambah Tugas", isi mata kuliah, judul, dan pilih batas waktu. Simpan dan periksa apakah muncul di daftar.

---

### 7. Materi Perkuliahan & Google Drive
- **Tujuan:** Menampilkan daftar materi/modul per mata kuliah dan menyediakan tombol unduh serta tautan folder Google Drive.
- **Tipe Aksi:** 🎨 UI Display Only (Mahasiswa) / 🌐 Database Write (Admin upload)
- **Halaman / Modal:** `#modal-course-materials`, `#modal-upload-material`
- **Container / ID DOM:** `#mat-modal-materials-list`, `#btn-open-drive-folder`, `#form-upload-material`
- **Fungsi Renderer:** `renderCourseMaterials()` di [js/material-service.js](file:///c:/laragon/www/TRJT%203A/js/material-service.js)
- **Event Handler:** `openCourseMaterialsModal(courseName)`, `openUploadMaterialModal()`
- **Service yang Digunakan:** `materialService`, `driveService`
- **Sumber Data:** Koleksi Firestore `courseMaterials`, dokumen `systemConfig/googleDrive`
- **Cara Memeriksa:** Klik tombol "Materi" pada salah satu kartu kelas di tab Jadwal.

---

### 8. Jadwal Piket Kelas (Rotasi Mingguan)
- **Tujuan:** Menghitung dan menampilkan kelompok piket yang bertugas minggu ini serta daftar 16 mahasiswa dalam 5 kelompok.
- **Tipe Aksi:** 🎨 UI Display Only
- **Halaman / Modal:** `#modal-piket-schedule`
- **Container / ID DOM:** `#current-week-piket-info`, `#piket-groups-container`
- **Fungsi Renderer:** `renderPiketModal()`, `renderPiketBadge()` di [js/app.js](file:///c:/laragon/www/TRJT%203A/js/app.js)
- **Event Handler:** Filter tombol tab kelompok piket di dalam modal
- **Service yang Digunakan:** *None*
- **Sumber Data:** `CLASS_DUTY_ROSTER` di [js/data.js](file:///c:/laragon/www/TRJT%203A/js/data.js) berdasarkan tanggal acuan semester
- **Cara Memeriksa:** Klik kartu "Piket kelas" di Beranda; jalankan `node scratch/test-piket-feature.js`.

---

### 9. Kelompok Praktikum & Mahasiswa
- **Tujuan:** Menampilkan anggota kelompok praktikum untuk setiap mata kuliah praktikum lab.
- **Tipe Aksi:** 🎨 UI Display Only
- **Halaman / Modal:** `#modal-mahasiswa-list`
- **Container / ID DOM:** `#mahasiswa-search-input`, `#mahasiswa-list-container`
- **Fungsi Renderer:** `renderMahasiswaModal()`, `renderCourseGroups()` di [js/app.js](file:///c:/laragon/www/TRJT%203A/js/app.js)
- **Event Handler:** Input pencarian nama mahasiswa atau kelompok
- **Service yang Digunakan:** *None*
- **Sumber Data:** `PRACTICAL_GROUPS` di [js/data.js](file:///c:/laragon/www/TRJT%203A/js/data.js)
- **Cara Memeriksa:** Klik kartu "Kelompok" di Beranda atau tombol "Kelompok" pada kartu kelas praktikum.

---

### 10. Direktori Dosen Pengampu
- **Tujuan:** Menampilkan profil 6 dosen pengampu, NIP berformat resmi, dan daftar mata kuliah yang diampu dilengkapi pencarian real-time.
- **Tipe Aksi:** 🎨 UI Display Only
- **Halaman / Modal:** Tab Dosen (`#view-dosen`)
- **Container / ID DOM:** `#dosen-search-input`, `#dosen-cards-container`
- **Fungsi Renderer:** `renderDosenList()` di [js/app.js](../js/app.js)
- **Event Handler:** Input listener `#dosen-search-input` untuk pencarian nama, NIP, atau mata kuliah
- **Service yang Digunakan:** *None*
- **Sumber Data:** `LECTURERS` di [js/data.js](file:///c:/laragon/www/TRJT%203A/js/data.js)
- **Cara Memeriksa:** Klik tab "Dosen" di navigasi bawah; jalankan `node scratch/test-dosen-feature.js`.

---

### 11. Pengaturan & Switch Tema
- **Tujuan:** Mengelola preferensi alarm suara, getar, izin notifikasi sistem, dan memilih tema aplikasi (Terang, Gelap, Sistem).
- **Tipe Aksi:** 💾 Local Preference & 🔔 Notification Trigger
- **Halaman / Modal:** Tab Pengaturan (`#view-pengaturan`), `#modal-theme-selector`
- **Container / ID DOM:** `#setting-alarm-toggle`, `#setting-vibrate-toggle`, `#setting-theme-val`, `#btn-test-notification`
- **Fungsi Renderer:** `renderSettingsUI()` di [js/app.js](file:///c:/laragon/www/TRJT%203A/js/app.js)
- **Event Handler:** Toggle switch listeners, tombol uji notifikasi, tombol pilihan tema
- **Service yang Digunakan:** `firebaseMessaging` via `js/firebase-config.js`
- **Sumber Data:** `localStorage` (`trjt_theme`, `trjt_alarm_enabled`, `trjt_vibrate_enabled`)
- **Cara Memeriksa:** Buka tab "Pengaturan", ubah switch atau pilih tema gelap.

---

### 12. Panel Admin & Komti
- **Tujuan:** Portal pengurus kelas untuk mengubah jadwal secara dinamis (*override*), membatalkan kelas, mengirim broadcast notifikasi darurat, dan memantau status scheduler H-10.
- **Tipe Aksi:** 🌐 Database Write & 🔔 Notification Trigger
- **Halaman / Modal:** [admin/index.html](file:///c:/laragon/www/TRJT%203A/admin/index.html)
- **Container / ID DOM:**
  - Login: `#form-login`, `#login-email`, `#login-password`
  - Dashboard: `#view-dashboard`, `#table-schedules-body`
  - Form Override: `#form-override-modal`
  - Broadcast: `#btn-broadcast-modal`, `#form-broadcast`
  - Scheduler Diagnostics: `#btn-trigger-reminder-check`, `#scheduler-heartbeat-status`
- **Fungsi Renderer:** Script internal di `admin/index.html`
- **Event Handler:** Form submit login Firebase Auth, trigger manual Cloud Functions
- **Service yang Digunakan:** Firebase Auth, Firestore, Cloud Functions
- **Sumber Data:** Koleksi `schedules`, `scheduleOverrides`, `devices`, `notificationsLog`
- **Cara Memeriksa:** Buka `http://localhost/TRJT%203A/admin/index.html` di browser.
