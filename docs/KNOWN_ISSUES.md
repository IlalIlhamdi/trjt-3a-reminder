# Temuan Masalah & Analisis Kode (Known Issues) TRJT 3A Reminder

Dokumen ini mencatat temuan nyata dari hasil analisis kode dan pengujian pada sistem **TRJT 3A Reminder**. Setiap temuan disertai bukti baris kode, dampak, prioritas, dan rekomendasi penanganan.

---

## 1. Masalah Terkonfirmasi Melalui Pengujian (*Confirmed Issues*)

### 1.1 Konflik Grid Hero Desktop (Riwayat, Sudah Teratasi)
- **Dampak historis:** Saat kartu hero dan ringkasan sama-sama berada di `.home-overview`, aturan ID pada `css/design-system.css` dapat memaksa hero melebar dan mendorong ringkasan ke bawah.
- **Kondisi sekarang:** Satu `#hero-card-container` berada di dalam banner `.campus-cover`; `.home-overview` hanya memuat ringkasan harian selebar kontainer. Konflik grid lama tidak lagi memengaruhi hero.
- **Pemeriksaan regresi:** Jika susunan Beranda diubah lagi, pastikan tidak muncul hero duplikat serta ringkasan tetap rapi pada 768px dan 1280px.
- **Status Verifikasi:** **Teratasi** melalui pemindahan renderer ke banner dan pemeriksaan layar desktop.

---

### 1.2 Kontras Teks Kartu Hero pada Tema Gelap (*Dark Mode*)
- **Prioritas:** Sedang
- **Dampak:** Teks ruangan, dosen, dan status pengingat pada kartu hero menjadi redup dan sulit dibaca pada mode gelap.
- **Lokasi File:** [css/student-ui.css](file:///c:/laragon/www/TRJT%203A/css/student-ui.css)
- **Bukti Kode:**
  Informasi kelas berikutnya kini tampil di atas ilustrasi banner dengan gradien navy gelap. CSS lama pernah menggunakan variabel dinamis `--color-soft-blue` untuk teks, yang menggelap pada `[data-theme="dark"]` dan mengurangi keterbacaan.
- **Kondisi Pemicu:** Pengguna beralih ke Mode Gelap pada tab Pengaturan.
- **Saran Penanganan:** Kunci warna teks sekunder hero card secara statis ke warna terang `#DCEEFF` dan `#EBF4FE`.
- **Status Verifikasi:** **Terkonfirmasi & Teratasi** (diverifikasi pada pengujian dark mode CDP).

---

## 2. Masalah yang Jelas Terlihat dari Kode (*Code-Evident Issues*)

### 2.1 Ketidaksinkronan Jadwal pada `lib/reminder-engine.js` (Vercel Serverless)
- **Prioritas:** **Tinggi**
- **Dampak:** Jika pengingat otomatis dijalankan melalui Vercel Serverless (`/api/cron/class-reminders`), pengingat yang terkirim akan menggunakan jadwal lama/keliru (misal: *Sistem Komunikasi Bergerak* dan *Rekayasa Perangkat Lunak* yang bukan jadwal Semester 5 TRJT 3A).
- **Lokasi File:** [lib/reminder-engine.js](file:///c:/laragon/www/TRJT%203A/lib/reminder-engine.js) (baris 8–70)
- **Bukti Kode:**
  Di `lib/reminder-engine.js`:
  ```javascript
  export const OFFICIAL_SCHEDULES = [
    { courseName: "Praktikum Antena dan Propagasi", ... },
    { courseName: "Jaringan Komputer Lanjut", ... },
    { courseName: "Sistem Komunikasi Satelit", ... }, // Seharusnya bukan di hari Senin
    { courseName: "Sistem Komunikasi Bergerak", ... }  // Tidak ada di roster resmi
  ];
  ```
  Sementara sumber acuan resmi di [js/data.js](file:///c:/laragon/www/TRJT%203A/js/data.js) dan [firebase/seed-firestore.js](file:///c:/laragon/www/TRJT%203A/firebase/seed-firestore.js) menggunakan 11 mata kuliah resmi:
  - *Praktikum Antena dan Propagasi* & *Jaringan Komputer Lanjut* (Senin)
  - *Praktikum Jaringan Komputer Lanjut*, *Praktikum Siskomsat & Radar*, *Teknik Instalasi Fiber Optik* (Selasa)
  - *Praktikum TIFO*, *Antena dan Propagasi* (Rabu)
  - *Praktikum Siskomsel*, *Sistem Komunikasi Satelit dan Radar* (Kamis)
  - *Sistem Komunikasi Seluler*, *Metodologi Penelitian* (Jumat)
- **Kondisi Pemicu:** Pemicu cron dari Vercel Serverless Function `/api/cron/*`.
- **Saran Penanganan:** Mutakhirkan array `OFFICIAL_SCHEDULES` di `lib/reminder-engine.js` agar identik 100% dengan `js/data.js` atau ubah agar membaca langsung dari Firestore `schedules`.
- **Status Verifikasi:** **Jelas Terlihat dari Kode** (belum diuji pengiriman live Vercel Cron).

---

### 2.2 Pemuatan Sinkron Skrip CDN Firebase Menunda Inisialisasi Klien
- **Prioritas:** Sedang
- **Dampak:** Pada kondisi jaringan lambat atau offline sebelum service worker terpasang, parsing DOM berhenti menunggu 5 berkas compat SDK Firebase dari `gstatic.com`.
- **Lokasi File:** [index.html](file:///c:/laragon/www/TRJT%203A/index.html) (baris 1327–1332)
- **Bukti Kode:**
  `<script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js"></script>` dimuat tanpa atribut `defer` di akhir body sebelum skrip lokal aplikasi.
- **Kondisi Pemicu:** Koneksi internet lambat / latensi tinggi ke server Google.
- **Saran Penanganan:** Pertahankan Service Worker yang mencache aset lokal, atau pertimbangkan bundler ES module modern di masa mendatang jika migrasi arsitektur dilakukan.
- **Status Verifikasi:** **Jelas Terlihat dari Kode**.

---

### 2.3 Aplikasi Native Android Masih Berupa Prototipe UI Mandiri
- **Prioritas:** Rendah
- **Dampak:** Aplikasi Android yang ada di folder `android/` belum menerima pembaruan jadwal dari Firestore atau notifikasi FCM secara real-time.
- **Lokasi File:** [android/app/build.gradle.kts](file:///c:/laragon/www/TRJT%203A/android/app/build.gradle.kts)
- **Bukti Kode:**
  File `build.gradle.kts` hanya memiliki dependensi Jetpack Compose, Material 3, dan AndroidX Lifecycle. Belum ada dependensi `com.google.firebase:firebase-messaging` atau Firestore SDK. Data jadwal diambil murni dari berkas lokal `ScheduleSeedData.kt`.
- **Kondisi Pemicu:** Membuka aplikasi Android native.
- **Saran Penanganan:** Tambahkan Firebase Messaging Service dan Firebase Firestore Android SDK ke modul `android/app` jika ingin menyetarakan aplikasi Android native dengan Web/PWA.
- **Status Verifikasi:** **Jelas Terlihat dari Kode**.

---

## 3. Dugaan yang Memerlukan Verifikasi Lapangan (*Hypotheses*)

### 3.1 Risiko regresi tema Beranda saat pembaruan UI
- **Status:** Risiko yang perlu diperiksa setelah perubahan, bukan bug aktif yang telah terkonfirmasi.
- **Gejala yang perlu dicari:** banner hilang karena path/cache, menu delapan pintasan meluber pada lebar 360px, dock menutup konten, atau header navy tetap muncul setelah keluar dari Beranda.
- **Titik kait:** `assets/images/campus-inspired-banner.png`, `.campus-cover`, `.home-shortcuts`, `.bottom-nav`, `.nav-primary`, dan `body.home-active` yang diubah oleh `switchTab()`.
- **Pemeriksaan:** Buka 360/390/430/768/1280px dalam tema terang dan gelap; klik lima tab, delapan pintasan, lalu periksa tidak ada overflow. Saat aset berubah, sinkronkan `ASSETS` dan `CACHE_NAME` pada kedua service worker.

---

### 3.2 Durasi Ketersediaan Refresh Token Google Drive
- **Dugaan:** Refresh token Google Drive yang tersimpan di Firestore `systemConfig/googleDrive` dapat kedaluwarsa jika aplikasi OAuth berada dalam status *Testing* di Google Cloud Console (biasanya kedaluwarsa setelah 7 hari).
- **Lokasi Terkait:** [firebase/functions/index.js](file:///c:/laragon/www/TRJT%203A/firebase/functions/index.js) (`getFreshDriveAccessToken`)
- **Status:** **Memerlukan Verifikasi Lapangan** (tergantung status publikasi OAuth consent screen di konsol Google Cloud).

---

## 4. Rekomendasi Peningkatan Jangka Panjang (*Recommendations*)

1. **Konsolidasi Single Source of Truth:**
   Buat berkas JSON atau modul bersama untuk daftar 11 mata kuliah agar dapat diimpor langsung oleh `js/data.js`, `lib/reminder-engine.js`, dan seeder Firestore tanpa duplikasi manual.
2. **Pembersihan CSS Duplikat:**
   Rencanakan pembersihan bertahap terhadap aturan duplikat pada `css/design-system.css` setelah panel admin teruji penuh.
3. **Penyempurnaan Integrasi Android:**
   Hubungkan modul Kotlin Android ke FCM topic `trjt-3a-students` agar mahasiswa yang memasang APK Android mendapatkan notifikasi kelas otomatis yang sama dengan versi web.
