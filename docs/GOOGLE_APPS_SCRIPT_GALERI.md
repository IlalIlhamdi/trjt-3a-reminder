# Panduan Setup Google Apps Script Backend Galeri TRJT 3A

Dokumen ini berisi panduan bagi teman Anda (pemilik akun Google dan folder Drive) untuk mengaktifkan API backend penghubung antara aplikasi TRJT 3A dan folder Google Drive dokumentasi kelas.

---

## Informasi Folder Tujuan
- **Link Folder Google Drive:** [https://drive.google.com/drive/folders/1612E_PgMWjnuAJ9WXDZHdPj5bbP32Ps-](https://drive.google.com/drive/folders/1612E_PgMWjnuAJ9WXDZHdPj5bbP32Ps-)
- **Folder ID:** `1612E_PgMWjnuAJ9WXDZHdPj5bbP32Ps-`

---

## Langkah Deployment Web App (Hanya 2 Menit)

1. **Buka Google Apps Script:**
   Buka peramban dengan akun Google pemilik folder, lalu kunjungi [https://script.google.com/](https://script.google.com/).

2. **Buat Project Baru:**
   - Klik tombol **+ New Project** (atau **Project Baru** di kiri atas).
   - Ubah judul project di kiri atas dari `Untitled project` menjadi `TRJT 3A Galeri Backend`.

3. **Salin Kode Skrip:**
   - Buka berkas skrip [google-apps-script/GaleriDriveBackend.gs](file:///c:/laragon/www/TRJT%203A/google-apps-script/GaleriDriveBackend.gs).
   - Hapus semua isi default di editor Google Apps Script (`function myFunction() {...}`).
   - Tempel (*paste*) seluruh isi berkas tersebut.

4. **Simpan Skrip:**
   - Tekan `Ctrl + S` atau klik ikon Disket (Save).

5. **Deploy sebagai Web App:**
   - Di pojok kanan atas, klik tombol biru **Deploy** -> pilih **New deployment**.
   - Klik ikon gerigi di sebelah kiri *Select type*, lalu pilih **Web app**.
   - Konfigurasi form deployment:
     - **Description:** `TRJT 3A Galeri v1.0`
     - **Execute as:** `Me (email_anda@gmail.com)` *(Sangat penting: ini membuat skrip berjalan atas izin akun teman Anda tanpa meminta user lain login).*
     - **Who has access:** `Anyone` / `Siapa saja` *(Memungkinkan aplikasi TRJT 3A mengirim dan membaca foto).*
   - Klik tombol **Deploy**.

6. **Beri Izin Akses (Authorize Access):**
   - Pop-up Google akan muncul meminta izin akses Drive.
   - Klik **Authorize access**.
   - Pilih akun Google Anda.
   - Jika muncul peringatan *"Google hasn't verified this app"*, klik **Advanced** (Lanjutan) di kiri bawah -> klik **Go to TRJT 3A Galeri Backend (unsafe)**.
   - Klik **Allow** / **Izinkan**.

7. **Salin Web App URL:**
   - Setelah selesai, salin URL yang berakhiran `/exec` (misalnya: `https://script.google.com/macros/s/AKfycb.../exec`).

8. **Terapkan ke Aplikasi TRJT 3A:**
   - Masukkan URL tersebut ke aplikasi TRJT 3A melalui menu **Pengaturan** -> **URL Galeri Google Drive**, atau perbarui nilai `DEFAULT_GALLERY_API_URL` di [js/gallery-service.js](file:///c:/laragon/www/TRJT%203A/js/gallery-service.js).

---

## Keamanan & Proteksi
- Skrip dilengkapi `APP_SECRET_TOKEN` (`TRJT3A_GALERI_SECRET_2026`).
- Endpoint gambar memverifikasi bahwa file yang diakses benar-benar berada di dalam folder ID `1612E_PgMWjnuAJ9WXDZHdPj5bbP32Ps-`, sehingga tidak ada akses ke folder pribadi lain.
- Nama file otomatis dibakukan menjadi `TRJT3A_YYYYMMDD_HHMMSS_xxxx.jpg`.
