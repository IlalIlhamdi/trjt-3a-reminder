# Panduan Pengembangan (Development Guide) TRJT 3A Reminder

Panduan ini berisi instruksi praktis untuk pengembang dan agen coding dalam menjalankan, menguji, dan memelihara aplikasi **TRJT 3A Reminder** di lingkungan lokal.

---

## 1. Persiapan Lingkungan

Persyaratan sistem minimum:
- **Sistem Operasi:** Windows 10/11, macOS, atau Linux
- **Web Server Lokal:** [Laragon](https://laragon.org/) (disarankan untuk Windows) dengan Apache aktif, atau Python 3.8+, atau Node.js 18+
- **Node.js:** Versi 18 LTS atau 20+ (diperlukan untuk menjalankan skrip pengujian di folder `scratch/` dan Firebase Functions)
- **Peramban Web:** Google Chrome atau Microsoft Edge modern (mendukung Service Worker & WebPush)
- **IDE:** Antigravity IDE, VS Code, atau WebStorm

---

## 2. Menjalankan Aplikasi Secara Lokal

### Opsi A: Menggunakan Laragon (Direkomendasikan)
1. Letakkan folder proyek di `C:\laragon\www\TRJT 3A`.
2. Buka Laragon dan klik **Start All**.
3. Buka peramban di URL:
   - Mahasiswa: `http://localhost/TRJT%203A/index.html`
   - Admin: `http://localhost/TRJT%203A/admin/index.html`
   - Simulasi: `http://localhost/TRJT%203A/dev/simulation.html`

### Opsi B: Menggunakan Python HTTP Server
Jika Laragon tidak digunakan, jalankan dari terminal di folder proyek:
```bash
python -m http.server 8085
```
Akses di `http://localhost:8085/`.

### Opsi C: Menggunakan npx serve
```bash
npx serve . -p 8085
```

---

## 3. Panduan Berkas yang Perlu Diedit Sesuai Kebutuhan

| Kebutuhan Perubahan | Berkas Utama | Berkas Pendukung | Hal yang Perlu Diperhatikan |
|---|---|---|---|
| **Pembaruan Tampilan Mahasiswa** | `css/student-ui.css` | `index.html`, `assets/images/campus-inspired-banner.png`, `js/app.js` bila interaksi berubah | Ikuti kontrak tema di `UI_GUIDELINES.md`; jangan gunakan ungu atau mengubah panel admin |
| **Logika Jadwal & Tab Mahasiswa** | `js/app.js` | `js/data.js` | Jangan ubah ID kontainer DOM; hindari reset DOM di dalam `tick()` |
| **Fitur Tugas Kuliah** | `js/assignment-service.js` | `index.html`, `js/app.js` | Pertahankan struktur dokumen Firestore `courseAssignments` |
| **Fitur Materi Perkuliahan** | `js/material-service.js` | `js/drive-service.js` | Memerlukan sinkronisasi folder Google Drive |
| **Panel Admin & Komti** | `admin/index.html` | `css/design-system.css` | Memerlukan akun admin Firebase Auth |
| **Cron Pengingat Server** | `firebase/functions/index.js` | `firebase/functions/reminder-engine.js` | Deploy via `firebase deploy --only functions` |
| **Endpoint Vercel** | `api/broadcast.js`, `api/cron/*` | `lib/reminder-engine.js` | Periksa kecocokan jadwal dengan `js/data.js` |

---

## 4. Klasifikasi & Eksekusi Skrip Pengujian

Untuk pembaruan tema lewat Antigravity, baca [UI_GUIDELINES.md](UI_GUIDELINES.md) dan [FEATURE_MAP.md](FEATURE_MAP.md) sebelum mengedit. Gunakan tampilan Web/PWA yang sudah ada sebagai acuan: header navy, banner kampus yang memuat **satu** renderer kelas berikutnya, delapan menu 4×2, dan dock lima tab dengan Jadwal terangkat. Setelah mengedit, bandingkan tema terang dan gelap pada lebar 360, 390, 430, 768, dan 1280px; coba seluruh pintasan dan tab. Hindari perubahan ID renderer atau `.nav-item[data-tab]` hanya demi tampilan.

Direktori `scratch/` berisi berbagai skrip pengujian berbasis Node.js. **JANGAN menjalankan skrip pengujian secara sembarangan.** Gunakan klasifikasi berikut:

### Kategori 1: Pengujian Lokal & Logika Murni (100% Aman Dijalankan Kapan Saja)
Skrip ini menggunakan data mock lokal dan assertion memori. Tidak menulis ke database dan tidak mengirim jaringan luar.

```bash
# Uji roster 5 kelompok piket dan rotasi minggu
node scratch/test-piket-feature.js

# Uji direktori 6 dosen pengampu dan pencarian
node scratch/test-dosen-feature.js

# Uji kalkulasi deadline dan CRUD tugas
node scratch/test-assignment-feature.js

# Uji kelompok praktikum per mata kuliah
node scratch/test-practical-groups.js

# Uji komprehensif window H-10 dan toleransi waktu
node scratch/test-h10-engine-comprehensive.js
```

### Kategori 2: Pengujian Analisis Statis DOM & CSS
Skrip ini memverifikasi integritas file HTML dan CSS secara statis:

```bash
node scratch/test-modal-add-task-ui.js
node scratch/test-theme-switcher.js
node scratch/test-dom-buttons.js
```

### Kategori 3: Pengujian Headless Browser Multi-Viewport (CDP)
Skrip ini mengontrol Microsoft Edge / Chrome secara headless via Chrome DevTools Protocol untuk memvalidasi zero-overflow dan menangkap screenshot:

```bash
node scratch/test-all-viewports.js
node scratch/test-modals.js
```

### Kategori 4: Skrip dengan Jaringan Nyata / Kredensial (⚠️ HATI-HATI)
> [!CAUTION]
> Skrip di bawah ini terhubung ke backend Firebase produksi atau Google Drive:
> - **`scratch/send-fcm-test.js`:** **JANGAN DIJALANKAN DI DEVELOPMENT BIASA!** Skrip ini membaca database Firestore dan mengirimkan notifikasi push nyata ke ponsel mahasiswa TRJT 3A.
> - **`scratch/inspect-devices.js`:** Membaca daftar token perangkat nyata.
> - **`firebase/seed-firestore.js`:** Menimpa seluruh koleksi jadwal di Firestore dengan data baru.

---

## 5. Memahami Cache & Service Worker

Aplikasi menggunakan dua Service Worker yang mencache aset statis:
- [sw.js](../sw.js) dan [firebase-messaging-sw.js](../firebase-messaging-sw.js) &mdash; keduanya memakai `CACHE_NAME` yang sama, saat ini `trjt3a-reminder-v8.0`, serta daftar `ASSETS`.

### Langkah Mengatasi Masalah Tampilan Tidak Berubah (Cache Stale):
1. **Hard Refresh:** Tekan `Ctrl + F5` atau `Ctrl + Shift + R` pada browser.
2. **Clear Cache di DevTools:**
   - Tekan `F12` &rarr; Buka tab **Application** (atau **Penyimpanan**).
   - Klik menu **Service Workers** &rarr; Centang opsi **Update on reload** atau klik **Unregister**.
   - Buka menu **Storage** &rarr; Klik **Clear site data**.
3. **Versi Cache (Cache Bumping):**
   - Jika Anda mengubah CSS, JS, atau aset visual untuk rilis, naikkan `CACHE_NAME` di **kedua** service worker, perbarui query `?v=...` CSS/JS di `index.html`, dan pastikan aset baru ada di daftar `ASSETS` keduanya.

---

## 6. Menguji Mode Gelap (Dark Mode)

Untuk menguji tampilan tema secara cepat:
1. Melalui UI: Buka tab **Pengaturan** &rarr; Klik **Tema** &rarr; Pilih **Gelap**.
2. Melalui Console DevTools:
   ```javascript
   document.documentElement.setAttribute('data-theme', 'dark');
   document.body.setAttribute('data-theme', 'dark');
   // Untuk kembali ke terang:
   document.documentElement.setAttribute('data-theme', 'light');
   document.body.setAttribute('data-theme', 'light');
   ```

---

## 7. Masalah Umum & Cara Penanganan

1. **Horizontal Scrollbar Muncul di Layar Ponsel:**
   - *Penyebab:* Ada elemen dengan lebar tetap (`width: ...px`) yang melebihi lebar layar sempit (360px).
   - *Solusi:* Gunakan `max-width: 100%`, `box-sizing: border-box`, atau `overflow-x: hidden` pada container induk.
2. **Input Form Kehilangan Fokus Saat Mengetik:**
   - *Penyebab:* Fungsi `tick()` merender ulang seluruh DOM form setiap detik via `innerHTML`.
   - *Solusi:* Pisahkan perenderan form dari perenderan jam atau kartu hero, dan pastikan form modal tidak dirender ulang secara berkala.
3. **Tombol Modal Tidak Bisa Diklik:**
   - *Penyebab:* Modal overlay lain yang tertutup masih memiliki `z-index` tinggi atau menutupi layar tanpa `display: none`.
   - *Solusi:* Pastikan modal memiliki `.modal-backdrop` (`display: none`) dan hanya aktif saat memiliki kelas `.is-open` (`display: flex`).
