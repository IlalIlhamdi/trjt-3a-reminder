# TRJT 3A Reminder

> Aplikasi pengingat jadwal kuliah, tugas, materi, dan informasi kelas terintegrasi untuk mahasiswa kelas **TRJT 3A (Teknologi Rekayasa Jaringan Telekomunikasi)** Jurusan Teknik Elektro, Politeknik Negeri Lhokseumawe (Semester 5, TA 2026/2027).

---

## 1. Gambaran Aplikasi

### Tujuan
**TRJT 3A Reminder** dirancang untuk membantu mahasiswa dan pengurus kelas (Komti) TRJT 3A mengelola aktivitas perkuliahan sehari-hari secara terpadu, mencegah keterlambatan masuk kelas melalui alarm/notifikasi H-10, serta mendistribusikan informasi perubahan jadwal, materi kuliah, dan batas pengumpulan tugas secara *real-time*.

### Pengguna Utama
1. **Mahasiswa TRJT 3A:** Mengakses jadwal kuliah harian & mingguan, pengingat kelas otomatis (audio & push notification), daftar tugas & deadline, modul materi kuliah, jadwal piket kelas, dan kelompok praktikum.
2. **Pengurus Kelas / Komti (Admin):** Memperbarui jadwal secara dinamis (*schedule override*, pembatalan kelas, perubahan ruangan/dosen), mengirim notifikasi siaran (*broadcast*), memantau log pengingat server, dan mengelola sinkronisasi folder Google Drive.

### Fitur Utama
- **Next Class Hero Card:** Menampilkan kelas berikutnya secara cerdas berdasarkan waktu Jakarta (WIB) dengan status berjalan, akan datang, countdown, dan tombol pintas ke jadwal.
- **Ringkasan Harian:** Metrik jumlah kelas hari ini, kelas yang telah selesai, dan kelas tersisa.
- **Jadwal Kuliah Mingguan & Harian:** Pemilih hari kapsul vertikal dan timeline kartu berdampingan dengan kolom jam kuliah, status kelas non-warna (`• BERLANGSUNG`, `• AKAN DATANG`, `• SELESAI`), serta aksi cepat per mata kuliah.
- **Pengingat Kelas H-10:** Alarm audio di browser, getar, serta push notifikasi otomatis 10 menit sebelum kelas dimulai (dikelola oleh browser dan server scheduler).
- **Tugas & Deadline Kuliah:** Pencatatan tugas individu/kelompok, filter berdasarkan status dan mata kuliah, pilihan cepat batas pengumpulan (*Besok*, *3 Hari*, *1 Minggu*), dan penyimpanan sinkron via Firestore.
- **Materi Perkuliahan & Integrasi Google Drive:** Akses modul dan bahan ajar per mata kuliah yang tersinkronisasi ke Google Drive Admin.
- **Jadwal Piket & Kelompok Praktikum:** Rotasi mingguan 5 kelompok piket (16 mahasiswa aktif) dan pembagian kelompok praktikum per mata kuliah.
- **Direktori Dosen:** Informasi 6 dosen pengampu, NIP, gelar, dan mata kuliah yang diampu dilengkapi fitur pencarian instan.
- **Mode Tampilan:** Dukungan tema Terang (*Light*), Gelap (*Dark*), dan Otomatis (*System*).

### Komponen Sistem
Aplikasi terdiri dari 4 subsistem utama:
1. **Web / PWA Mahasiswa (`index.html`):** Antarmuka utama mahasiswa tanpa instalasi, mendukung mode offline via Service Worker, responsif dari layar ponsel (360px) hingga desktop (1280px+).
2. **Panel Admin & Komti (`admin/index.html`):** Portal pengurus kelas untuk login Firebase Auth, override jadwal, broadcast notifikasi, dan monitoring scheduler.
3. **Backend & Serverless API:**
   - **Firebase Cloud Functions (`firebase/functions/`):** Cron scheduler PubSub H-10 menit, manajemen folder Google Drive OAuth, dan callable functions.
   - **Vercel Serverless Functions (`api/`):** Endpoint broadcast notifikasi dan cron endpoint cadangan.
4. **Aplikasi Native Android (`android/`):** Prototipe aplikasi native menggunakan Kotlin dan Jetpack Compose dengan arsitektur Material 3.

---

## 2. Teknologi yang Digunakan

| Lapisan | Teknologi | Keterangan |
|---|---|---|
| **Frontend Web** | Vanilla HTML5, CSS3, JavaScript (ES6+) | Tanpa framework frontend (tanpa React/Vue/Angular), ringan dan cepat |
| **Desain & Ikon** | CSS Variables, Glassmorphism, Google Fonts Inter, Lucide Icons | Menggunakan palet asli Putih–Biru TRJT 3A |
| **PWA & Offline** | Web Service Worker API, Web App Manifest | Caching aset dan background push notification |
| **Database & Auth** | Google Firebase Firestore & Firebase Authentication | Penyimpanan *real-time* tugas, materi, override jadwal, dan akun admin |
| **Push Notification**| Firebase Cloud Messaging (FCM) v1 & WebPush API | Pengiriman notifikasi ke browser mahasiswa dan perangkat Android |
| **Penyimpanan Berkas**| Google Drive API v3 | Penyimpanan berkas materi perkuliahan ke Google Drive Admin |
| **Serverless Runtime**| Node.js 18 (Firebase Functions) & Node.js (Vercel API) | Eksekusi cron pengingat dan OAuth handler |
| **Aplikasi Android** | Kotlin 1.9+, Jetpack Compose, Material 3, Android SDK 34 | Min SDK 26, Target SDK 34 |

---

## 3. Struktur Repository

Pohon folder direktori utama:

```text
C:\laragon\www\TRJT 3A\
├── admin/                         # Portal Admin & Komti (override jadwal & monitoring)
│   └── index.html                 # Halaman utama Admin Panel
├── android/                       # Source code native Android (Jetpack Compose)
│   ├── app/                       # Modul aplikasi Android
│   │   ├── build.gradle.kts       # Konfigurasi build Gradle
│   │   └── src/main/java/         # Kode sumber Kotlin (UI, ViewModel, Data)
│   └── build.gradle.kts           # Konfigurasi Gradle root
├── api/                           # Vercel Serverless Functions
│   ├── cron/                      # Endpoint cron pengingat kelas
│   ├── broadcast.js               # Handler broadcast notifikasi mahasiswa
│   ├── reminder-check.js          # Endpoint manual check pengingat
│   └── send-direct.js             # Endpoint direct FCM test
├── assets/                        # Aset gambar, audio alarm, dan ikon aplikasi
│   ├── audio/                     # Berkas suara alarm pengingat
│   └── icons/                     # Favicon, ikon PWA, dan badge status
├── css/                           # Stylesheet aplikasi web
│   ├── design-system.css          # Design system global, token CSS, modal & admin
│   └── student-ui.css             # Penataan UI khusus antarmuka mahasiswa
├── dev/                           # Halaman development & simulasi
│   └── simulation.html            # Sandbox simulasi jadwal & TimeProvider
├── docs/                          # Dokumentasi teknis komprehensif
│   ├── ARCHITECTURE.md            # Arsitektur sistem dan alur data
│   ├── FEATURE_MAP.md             # Peta fitur dan keterkaitan DOM/JS
│   ├── UI_GUIDELINES.md           # Pedoman antarmuka dan palet warna
│   ├── DEVELOPMENT.md             # Panduan pengembangan dan pengujian lokal
│   ├── UPGRADE_GUIDE.md           # Matriks dan alur peningkatan aplikasi
│   └── KNOWN_ISSUES.md            # Temuan masalah, analisis kode & rekomendasi
├── firebase/                      # Konfigurasi Firebase dan Cloud Functions
│   ├── functions/                 # Backend Node.js Cloud Functions
│   ├── firestore.rules            # Aturan keamanan database Firestore
│   ├── firestore.indexes.json     # Konfigurasi index database
│   └── seed-firestore.js          # Skrip seeder jadwal resmi ke Firestore
├── js/                            # Logika JavaScript aplikasi mahasiswa
│   ├── app.js                     # Controller utama, navigasi, dan renderer UI
│   ├── data.js                    # Sumber data lokal jadwal, dosen, piket & kelompok
│   ├── time-provider.js           # Penanganan waktu Jakarta (WIB) & simulasi
│   ├── firebase-config.js         # Inisialisasi Firebase Web SDK & FCM client
│   ├── assignment-service.js      # Layanan CRUD tugas & deadline perkuliahan
│   ├── material-service.js        # Layanan CRUD materi kuliah
│   └── drive-service.js           # Layanan integrasi Google Drive client
├── lib/                           # Modul pembantu backend
│   ├── firebase-admin-init.js     # Inisialisasi Firebase Admin SDK serverless
│   └── reminder-engine.js         # Logika evaluasi jadwal sisi server
├── scratch/                       # Skrip pengujian internal & artefak verifikasi
├── index.html                     # Halaman utama aplikasi mahasiswa (PWA)
├── sw.js                          # Service Worker utama PWA (caching aset)
├── firebase-messaging-sw.js       # Service Worker penerima background push FCM
├── firebase.json                  # Konfigurasi deployment Firebase CLI
├── vercel.json                    # Konfigurasi routing & header deployment Vercel
├── package.json                   # Konfigurasi paket Node root (ES Module)
├── CHANGELOG.md                   # Catatan riwayat perubahan proyek
└── AGENTS.md                      # Pedoman untuk AI coding agent
```

---

## 4. Cara Menjalankan

### A. Web Mahasiswa & Admin (Lingkungan Laragon)
Aplikasi web tidak memerlukan proses *compilation* atau *bundling*.

1. Pastikan folder proyek berada di direktori web server Laragon:
   ```text
   C:\laragon\www\TRJT 3A
   ```
2. Buka aplikasi **Laragon** dan klik tombol **Start All** (memulai Apache).
3. Buka peramban (browser) dan akses URL:
   - **Aplikasi Mahasiswa:** [http://localhost/TRJT%203A/](http://localhost/TRJT%203A/) atau [http://localhost/TRJT%203A/index.html](http://localhost/TRJT%203A/index.html)
   - **Panel Admin:** [http://localhost/TRJT%203A/admin/](http://localhost/TRJT%203A/admin/)
   - **Sandbox Simulasi:** [http://localhost/TRJT%203A/dev/simulation.html](http://localhost/TRJT%203A/dev/simulation.html)

*Catatan:* Jika menggunakan web server lokal alternatif tanpa Laragon, jalankan:
```bash
# Menggunakan Python
python -m http.server 8085

# Atau menggunakan npx serve
npx serve . -p 8085
```
Akses melalui `http://localhost:8085/`.

### B. Firebase Cloud Functions
Direktori backend Cloud Functions berada pada `firebase/functions`.

```bash
# Berpindah ke direktori functions
cd firebase/functions

# Pasang dependensi
npm install

# Menjalankan emulator functions lokal
npm run serve

# Melakukan deploy ke Firebase (memerlukan Firebase CLI login)
npm run deploy
```

### C. Endpoint Vercel Serverless
Untuk menguji endpoint `/api/*` secara lokal menggunakan Vercel CLI:

```bash
# Pastikan dependensi root terpasang
npm install

# Jalankan server development Vercel
npx vercel dev
```

### D. Aplikasi Android
Buka direktori `android/` menggunakan **Android Studio** (Hedgehog / Iguana / Ladybug atau lebih baru) dengan JDK 17, atau kompilasi via terminal:

```bash
cd android
.\gradlew.bat assembleDebug
```
Berkas APK debug akan dihasilkan di `android/app/build/outputs/apk/debug/app-debug.apk`.

---

## 5. Konfigurasi Environment Variable

Berikut adalah daftar variabel lingkungan yang dibaca oleh sistem:

| Variabel | Digunakan Oleh | Fungsi | Status |
|---|---|---|---|
| `FIREBASE_SERVICE_ACCOUNT` | `lib/firebase-admin-init.js` | Kredensial Service Account Firebase Admin (format string JSON atau Base64) | Wajib pada Vercel prod |
| `FIREBASE_PROJECT_ID` | `lib/firebase-admin-init.js` | ID Project Firebase (default: `trjt-3a-reminder`) | Opsional |
| `FIREBASE_CLIENT_EMAIL` | `lib/firebase-admin-init.js` | Email akun service account (jika tidak menggunakan JSON utuh) | Opsional |
| `FIREBASE_PRIVATE_KEY` | `lib/firebase-admin-init.js` | Private key service account (jika tidak menggunakan JSON utuh) | Opsional |
| `CRON_SECRET` | `api/cron/*`, `api/broadcast.js` | Kunci rahasia untuk memvalidasi pemicu cron eksternal / Vercel Cron | Sangat Disarankan |
| `ADMIN_SECRET` | `api/broadcast.js`, `api/send-direct.js`| Kunci autentikasi alternatif untuk endpoint siaran darurat | Opsional |
| `GOOGLE_CLIENT_ID` | `firebase/functions/index.js` | OAuth Client ID Google Drive Admin | Wajib untuk fitur Drive |
| `GOOGLE_CLIENT_SECRET` | `firebase/functions/index.js` | OAuth Client Secret Google Drive Admin | Wajib untuk fitur Drive |
| `GOOGLE_REDIRECT_URI` | `firebase/functions/index.js` | URI redirect callback OAuth Google Drive | Wajib untuk fitur Drive |

> [!CAUTION]
> **Keamanan Kredensial:** Jangan pernah menyimpan berkas `serviceAccountKey.json`, token OAuth, atau nilai variabel privat ke dalam git repository. Berkas tersebut sudah dimasukkan ke dalam `.gitignore`.

---

## 6. Pengujian dan Dokumentasi Lanjutan

Repository ini dilengkapi serangkaian skrip pengujian berbasis Node.js yang tersimpan di direktori `scratch/`.

```bash
# Menguji fitur jadwal piket kelas
node scratch/test-piket-feature.js

# Menguji direktori dosen dan pencarian
node scratch/test-dosen-feature.js

# Menguji fitur tugas & kalkulasi deadline
node scratch/test-assignment-feature.js

# Menguji logika komprehensif engine H-10
node scratch/test-h10-engine-comprehensive.js
```

Untuk pengujian browser multi-viewport (360px – 1280px), pengujian dilakukan menggunakan skrip headless browser [scratch/test-all-viewports.js](file:///c:/laragon/www/TRJT%203A/scratch/test-all-viewports.js).

### Dokumentasi Lanjutan
Untuk rincian arsitektur teknis dan panduan pengembangan, silakan pelajari dokumen pendukung berikut:
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — Arsitektur sistem lengkap, siklus hidup halaman, dan alur data.
- [docs/FEATURE_MAP.md](docs/FEATURE_MAP.md) — Peta fitur, selector DOM, renderer, dan sumber data.
- [docs/UI_GUIDELINES.md](docs/UI_GUIDELINES.md) — Pedoman antarmuka, token warna asli putih-biru, dan CSS specificity.
- [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) — Alur kerja harian, pengujian aman, dan pemecahan masalah.
- [docs/UPGRADE_GUIDE.md](docs/UPGRADE_GUIDE.md) — Panduan langkah demi langkah untuk pembaruan fitur berikutnya.
- [docs/KNOWN_ISSUES.md](docs/KNOWN_ISSUES.md) — Analisis temuan kode, perbedaan data, dan rekomendasi perbaikan.
- [CHANGELOG.md](CHANGELOG.md) — Riwayat perubahan kode dan dokumentasi.
- [AGENTS.md](AGENTS.md) — Pedoman khusus untuk AI coding assistant.
