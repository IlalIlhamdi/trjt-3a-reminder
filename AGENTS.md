# Pedoman Agen Coding (AGENTS.md) — TRJT 3A Reminder

Instruksi ini ditujukan untuk setiap AI Coding Agent yang bekerja pada repositori **TRJT 3A Reminder** (`C:\laragon\www\TRJT 3A`).

---

## 1. Konteks Proyek & Aturan Inti

1. **Teknologi:**
   - Aplikasi menggunakan Vanilla HTML, CSS, dan JavaScript tanpa framework frontend (tanpa React/Vue/Next/Vite).
   - Backend menggunakan Google Firebase (Firestore, Auth, Functions v10 compat) dan integrasi Google Drive API.
   - Jangan melakukan migrasi framework frontend atau mengganti arsitektur dasar kecuali ada instruksi eksplisit dari pengguna.
2. **Kewajiban Menjaga Identitas Warna Asli (STRICT):**
   - **Wajib gunakan warna asli putih–biru TRJT 3A:** Biru Utama `#2F80ED`, Biru Tua `#0F3D91`, Navy `#0F2942`, Latar `#F4F8FE`, Biru Lembut `#DCEEFF`.
   - **DILARANG KERAS MEMPERKENALKAN WARNA UNGU!** Jangan mengambil warna ungu dari referensi desain atau memperkenalkan aksen ungu baru.
   - Untuk perubahan UI melalui Antigravity atau agen lain, ikuti kontrak tema terkini di [docs/UI_GUIDELINES.md](docs/UI_GUIDELINES.md): header navy, banner kampus berisi satu kartu kelas berikutnya dinamis, delapan menu 4×2, dan dock putih dengan Jadwal biru terangkat. Foto referensi tidak menggantikan identitas putih–biru atau fitur asli aplikasi.
3. **Pertahankan Pekerjaan & Perubahan Lokal yang Ada:**
   - Jangan melakukan `git reset --hard` atau menimpa seluruh berkas tanpa analisis teliti.
   - Jaga fitur yang sudah berfungsi (H-10 reminder, modal sheet, filter tugas, dan tema gelap).

---

## 2. Berkas Penting yang Wajib Diketahui

| Komponen | Berkas Utama | Catatan Kritis |
|---|---|---|
| **Struktur Web Mahasiswa** | [index.html](file:///c:/laragon/www/TRJT%203A/index.html) | Berisi 5 seksi view dan 7 modal sheet; jangan ubah ID elemen target renderer |
| **Styling Mahasiswa** | [css/student-ui.css](file:///c:/laragon/www/TRJT%203A/css/student-ui.css) | Tempat styling utama mahasiswa dengan scope `.student-app` |
| **Design System Global** | [css/design-system.css](file:///c:/laragon/www/TRJT%203A/css/design-system.css) | Digunakan bersama oleh halaman web mahasiswa dan panel admin |
| **Controller Utama** | [js/app.js](file:///c:/laragon/www/TRJT%203A/js/app.js) | Mengatur `init()`, `switchTab()`, `renderHeroCard()`, dan `tick()` |
| **Sumber Data Roster** | [js/data.js](file:///c:/laragon/www/TRJT%203A/js/data.js) | Roster 11 mata kuliah resmi, 6 dosen pengampu, dan 5 kelompok piket |
| **Waktu & Zona Waktu** | [js/time-provider.js](file:///c:/laragon/www/TRJT%203A/js/time-provider.js) | Penanganan waktu Asia/Jakarta (WIB) & simulasi dev |
| **Layanan Tugas & Materi** | [js/assignment-service.js](file:///c:/laragon/www/TRJT%203A/js/assignment-service.js), [js/material-service.js](file:///c:/laragon/www/TRJT%203A/js/material-service.js) | Sinkronisasi real-time Firestore |
| **Panel Admin** | [admin/index.html](file:///c:/laragon/www/TRJT%203A/admin/index.html) | Portal Komti/Admin; jangan ubah styling admin saat mengedit mahasiswa |

---

## 3. Titik Kait DOM & Logika Bisnis yang Tidak Boleh Rusak

1. **ID Kontainer Renderer:**
   - `#hero-card-container` &mdash; kartu kelas berikutnya.
   - `#today-timeline-container` &mdash; timeline agenda hari ini.
   - `#weekly-cards-container` &mdash; kartu jadwal mingguan.
   - `#home-upcoming-tasks-container` &mdash; widget tugas di beranda.
2. **Atribut Interaksi:**
   - Navigasi bawah menggunakan `.nav-item[data-tab="..."]`.
   - Pemilih hari menggunakan `.day-btn-item[data-day="..."]`.
3. **Loop Timer `tick()` (1 detik):**
   - Fungsi `tick()` berjalan setiap 1,000 ms. **Dilarang me-render ulang seluruh formulir atau kartu aktif** jika data tidak berubah, karena akan menyebabkan input form kehilangan fokus dan peramban berkedip.
4. **Pencegahan Pengiriman Notifikasi Nyata saat Testing:**
   - **JANGAN PERNAH** menjalankan `scratch/send-fcm-test.js` dalam alur kerja rutin, karena skrip tersebut mengirim push notifikasi nyata ke ponsel mahasiswa TRJT 3A.

---

## 4. Cara Menjalankan Pemeriksaan yang Tersedia

Gunakan skrip pengujian berbasis Node.js yang aman di direktori `scratch/`:

```bash
# 1. Uji logika piket
node scratch/test-piket-feature.js

# 2. Uji direktori dosen
node scratch/test-dosen-feature.js

# 3. Uji tugas kuliah & deadline
node scratch/test-assignment-feature.js

# 4. Uji logika toleransi H-10
node scratch/test-h10-engine-comprehensive.js
```

Untuk pengujian tampilan peramban (zero-overflow dan multi-viewport):
```bash
node scratch/test-all-viewports.js
```

---

## 5. Dokumen Wajib Dibaca Sebelum Melakukan Perubahan

Sebelum membuat atau mengubah kode, baca dokumen rujukan berikut:
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) &mdash; Memahami alur data, inisialisasi, dan keterkaitan komponen.
- [docs/FEATURE_MAP.md](docs/FEATURE_MAP.md) &mdash; Mengetahui file, fungsi perender, dan selector untuk setiap fitur.
- [docs/UI_GUIDELINES.md](docs/UI_GUIDELINES.md) &mdash; Panduan token warna, tata letak, breakpoint, dan CSS specificity.
- [docs/UPGRADE_GUIDE.md](docs/UPGRADE_GUIDE.md) &mdash; Matriks dampak perubahan dan 9 langkah kerja standar.
- [docs/KNOWN_ISSUES.md](docs/KNOWN_ISSUES.md) &mdash; Temuan masalah nyata yang perlu diwaspadai.

---

## 6. Kewajiban Dokumentasi Pasca-Perubahan

Setiap kali Anda menambahkan fitur, memperbaiki bug, atau mengubah antarmuka:
1. Perbarui [CHANGELOG.md](CHANGELOG.md) di bagian `[Unreleased]`.
2. Perbarui [docs/FEATURE_MAP.md](docs/FEATURE_MAP.md) jika ada penambahan ID DOM atau fungsi renderer baru.
3. Sinkronkan string versi pada [sw.js](file:///c:/laragon/www/TRJT%203A/sw.js) dan [firebase-messaging-sw.js](file:///c:/laragon/www/TRJT%203A/firebase-messaging-sw.js) jika aset CSS/JS dimodifikasi.
