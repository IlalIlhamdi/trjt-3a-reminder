# Pedoman Desain & Antarmuka (UI Guidelines) TRJT 3A Reminder

Dokumen ini memuat standar desain resmi, token warna, tata letak, hierarki tipografi, serta aturan CSS untuk antarmuka **TRJT 3A Reminder**. Seluruh kontributor dan agen coding wajib mematuhi panduan ini saat melakukan pembaruan tampilan.

**Acuan tema untuk pembaruan di Antigravity:** Pertahankan tampilan Web/PWA yang saat ini ada di `index.html` dan `css/student-ui.css`. Foto referensi pengguna hanya menjadi inspirasi susunan menu; identitas aplikasi tetap putih–biru TRJT 3A. Jangan mengembalikan desain dock kapsul lama atau mengganti menu menjadi fitur yang tidak tersedia.

---

## 1. Keputusan Desain yang Telah Ditetapkan

1. **Wajib Mempertahankan Palet Asli Putih–Biru TRJT 3A:**
   - Aplikasi menggunakan identitas warna resmi kampus: biru royal, navy, biru lembut, dan latar putih kebiruan.
   - **Dilarang keras memasukkan warna ungu (`#5842ce`, `#4630b8`, `#654cdb`, `#7c3aed`, dll.)!** Seluruh perubahan warna ungu yang sempat masuk pada draf awal telah dibersihkan dan tidak boleh diperkenalkan kembali.
2. **Adopsi Karakter Visual Modern:**
   - **Bentuk Kartu:** Sudut membulat proporsional (radius 18–24px) dengan bayangan lembut (*soft blur elevation*) tanpa batas kasar (*no harsh borders*).
   - **Pemilih Hari Kapsul:** Tombol hari berbentuk kapsul vertikal dengan nama hari dan nomor tanggal.
   - **Timeline Berdampingan:** Kolom jam kuliah (misal `07.30`) berada di sebelah kiri kartu mata kuliah.
   - **Kartu Jadwal Terkini:** Hari aktif memakai gradasi biru–navy; tiap kartu menempatkan waktu dalam panel biru pucat, status dan ruang di atas judul, lalu dosen dalam bidang biru lembut. Kelas selesai tetap memiliki judul kontras penuh; garis dan badge hijau sudah cukup menandai statusnya. Pada tema gelap, panel waktu dan dosen mengikuti permukaan gelap.
   - **Status Non-Color Dependent:** Setiap status kelas menyertakan teks eksplisit (`• BERLANGSUNG`, `• AKAN DATANG`, `• SELESAI`), tidak hanya mengandalkan warna semata.
   - **Beranda Menu Kampus:** Header navy memuat identitas TRJT 3A, diikuti sapaan, banner ilustrasi kampus yang menampilkan informasi kelas berikutnya secara dinamis, dan delapan pintasan dalam grid 4×2. Setiap pintasan memakai ubin ikon putih dengan garis navy serta label di bawahnya. Jangan menambahkan kartu kelas berikutnya kedua di bawah pintasan.
   - **Dock Navigasi Bawah:** Bilah putih menempel di tepi bawah layar dengan lima tab. Jadwal berada di tengah sebagai tombol bulat biru yang terangkat; tab aktif lain ditandai teks dan ikon biru. Tema gelap memakai permukaan gelap dengan kontras teks yang setara.
   - **Bukan Bingkai Ponsel:** Aplikasi web dibuat responsif murni di peramban, tidak membungkus halaman di dalam bingkai ponsel tiruan (*device frame mockup*).
3. **Tipografi & Ikon:**
   - Menggunakan jenis huruf **Inter** dari Google Fonts.
   - Menggunakan pustaka ikon **Lucide Icons** dengan ketebalan garis (*stroke width*) 2px dan ukuran seragam.

---

## 2. Palet Token Warna Resmi

### A. Tema Terang (Light Mode — Standar)

| Token CSS | Kode Heksadesimal | Peruntukan / Penggunaan |
|---|---|---|
| `--color-primary-blue` | `#2F80ED` | Warna aksen utama, tombol aktif, badge hari terpilih, indikator navigasi |
| `--color-primary-blue-hover` | `#1E6DEB` | Status hover tombol utama, gradien awal kartu hero |
| `--color-primary-blue-dark` | `#0F3D91` | Teks judul kartu hero, gradien akhir kartu hero, tombol putih pada hero |
| `--color-primary-navy` | `#0F2942` | Judul halaman, nama mata kuliah, teks heading utama |
| `--color-app-bg` | `#F4F8FE` | Latar belakang aplikasi / halaman |
| `--color-surface` | `#FFFFFF` | Latar belakang kartu, form input, dan bottom sheet modal |
| `--color-surface-glass` | `rgba(255, 255, 255, 0.92)`| Permukaan kaca pada kartu dan panel sekunder; header Beranda memakai navy dan dock memakai putih solid |
| `--color-soft-blue` | `#DCEEFF` | Latar badge waktu, ikon box, dan batas kartu lembut |
| `--color-soft-blue-extra` | `#EBF4FE` | Aksen latar belakang alternatif dan baris tabel |
| `--color-text-secondary` | `#52667A` | Deskripsi sub-judul, nama dosen, ruangan, metadata kelas |
| `--color-text-muted` | `#8C9BAE` | Label tanggal kecil, placeholder form input, hint text |

### B. Warna Semantik (Status)

| Status | Warna Utama | Warna Latar / Tint | Penggunaan |
|---|---|---|---|
| **Berhasil / Selesai** | `#059669` (Emerald 600) | `rgba(5, 150, 105, 0.12)` | Kelas selesai, tugas selesai, server online |
| **Peringatan / H-10** | `#D97706` (Amber 600) | `rgba(217, 119, 6, 0.12)` | Kelas mendekat (H-10), tugas mendesak |
| **Error / Batal** | `#DC2626` (Red 600) | `rgba(220, 38, 38, 0.12)` | Kelas dibatalkan, form error, keterlambatan |

### C. Tema Gelap (Dark Mode — `[data-theme="dark"]`)

| Elemen | Token / Heksadesimal | Keterangan |
|---|---|---|
| Latar Belakang Aplikasi | `#090E17` | Latar gelap pekat bertingkat |
| Permukaan Kartu | `#131D2D` | Kartu konten dan modal sheet |
| Permukaan Elemen Aktif | `#1C2A3F` | Form input, panel kontrol, dan kontainer sekundair |
| Teks Utama | `#F1F5F9` | Teks judul putih berpenetrasi tinggi |
| Teks Sekunder | `#94A3B8` | Teks deskripsi dan metadata kelas |
| Biru Utama Dark | `#3B82F6` | Biru terang kontras tinggi untuk dark mode |
| Teks Kartu Hero | `#DCEEFF` / `#EBF4FE` | **Wajib statis** agar kontras tetap tinggi di atas gradien biru |

---

## 3. Struktur CSS & Resolusi Specificity

Urutan pemuatan gaya di `index.html`:
```html
<link rel="stylesheet" href="./css/design-system.css">
<style>/* gaya awal/critical di dalam index.html */</style>
<link rel="stylesheet" href="./css/student-ui.css">
```
Kode HTML sebenarnya menambahkan query versi `?v=...` pada tautan CSS. Karena gaya inline berada di tengah, pertahankan override khusus mahasiswa di `css/student-ui.css` dengan scope `.student-app`; jangan mengubah `css/design-system.css` untuk satu komponen mahasiswa tanpa memeriksa dampaknya ke panel admin.

### Konflik Specificity Penting yang Telah Diselesaikan
1. **Banner Dinamis & Ringkasan Desktop:**
   - `#hero-card-container` kini berada di `<figcaption>` dalam `.campus-cover`, bukan di grid `.home-overview`. Aturan lama `#view-beranda #hero-card-container { grid-column: 1 / -1; }` pada `css/design-system.css` tidak lagi menentukan tata letak banner.
   - `.home-overview` hanya berisi `.home-insights` selebar kontainer pada desktop. Pertahankan scope `.student-app` saat mengubah tampilannya agar panel admin tidak ikut berubah.
2. **Kontras Teks Kartu Hero pada Dark Mode:**
   - Informasi kelas berikutnya berada di atas ilustrasi banner dengan gradien navy gelap pada bagian bawah, baik pada tema terang maupun gelap.
   - Warna teks sekunder di dalam hero tidak boleh menggunakan variabel dinamis `--color-soft-blue` (karena variabel tersebut menggelap pada dark mode), melainkan tetap `#DCEEFF` dan `#EBF4FE` agar terbaca di atas ilustrasi.

---

## 4. Breakpoint & Skala Responsif

Aplikasi mendukung 5 titik henti (*breakpoints*) utama:

| Breakpoint | Lebar Layar | Perilaku Tata Letak |
|---|---|---|
| **Ponsel Sangat Sempit** | `360 px` | Konten utama 1 kolom, menu pintasan 4×2 dengan ukuran ikon ringkas, padding 12px, tanpa horizontal overflow |
| **Ponsel Standar** | `390 px` | Menu pintasan 4×2, padding 16px, dock lima tab dengan Jadwal terangkat |
| **Ponsel Besar** | `430 px` | Spacing proporsional, menu pintasan 4×2, grid kartu harian seimbang |
| **Tablet / Layar Sedang** | `768 px` | Transisi ke 2 kolom pada beranda, timeline melebar nyaman |
| **Desktop / Laptop** | `1280 px` | Lebar maksimum kontainer 1080px terpusat, tata letak dua kolom penuh |

---

## 5. Komponen Bersama & Standar Interaksi

Urutan Beranda yang harus dipertahankan: header navy dengan identitas dan sapaan; banner `.campus-cover` memakai `assets/images/campus-inspired-banner.png` (ilustrasi terinspirasi kampus, bukan foto resmi) dengan satu informasi kelas berikutnya dari `renderHeroCard()`; delapan pintasan `.home-shortcuts` berurutan **Jadwal, Tugas, Materi, Piket, Kelompok, Dosen, Notifikasi, Pengaturan**; lalu ringkasan harian, agenda, dan tugas. Nama kelas, waktu, ruang, dosen, pengingat, dan status kosong harus berasal dari data jadwal, bukan teks statis dari gambar contoh. Pintasan harus tetap 4 kolom × 2 baris pada ponsel.

Dock bawah berisi **Beranda, Dosen, Jadwal, Notifikasi, Pengaturan**. Jadwal adalah tombol utama bulat biru di tengah; tiap tombol tetap `.nav-item[data-tab]` dan mengarah ke tab asli. Warna aktif dan fokus harus terlihat pada tema terang maupun gelap.

1. **Target Sentuh Tombol (*Touch Targets*):**
   - Seluruh elemen yang dapat diklik memiliki ukuran minimal **44 × 44 px** untuk kenyamanan jempol di layar sentuh ponsel.
2. **Dock Navigasi Bawah (*Bottom Navigation*):**
   - `.bottom-nav` menempel di `bottom: 0`, memiliki `z-index: 90`, memperhitungkan *safe area*, dan menempatkan tombol Jadwal (`.nav-primary`) sebagai lingkaran biru yang terangkat di tengah.
   - `.main-content` menyisakan ruang bawah sekitar `110px` ditambah *safe area* (`120px` pada tablet/desktop) agar konten terbawah tidak tertutup dock.
3. **Modal & Bottom Sheet:**
   - Menggunakan kelas `.modal-backdrop` (`z-index: 100`) dan `.modal-backdrop.is-open` (`display: flex`).
   - Modal input prioritas (`#modal-add-assignment`, `#modal-upload-material`) memiliki `z-index: 150 !important` agar dapat menumpuk di atas modal daftar.
   - Area isi modal (`.modal-body`) memiliki `overflow-y: auto` dan `max-height: 85vh` agar formulir dapat digulir dengan bebas saat keyboard virtual ponsel muncul.
4. **Isolasi Pembaruan Timer `tick()`:**
   - Loop timer dieksekusi setiap detik untuk memperbarui teks jam header dan countdown.
   - **PENTING:** Perenderan ulang penuh kartu hero hanya dilakukan saat status mata kuliah berganti. Jangan pernah melakukan `innerHTML = ...` pada elemen input atau kontainer aktif setiap detik karena akan menghilangkan fokus keyboard pengguna.

---

## 6. Status UI Saat Ini vs Arah Peningkatan

| Komponen | Kondisi UI Saat Ini (Terverifikasi) | Rencana Peningkatan Mendatang |
|---|---|---|
| **Beranda** | Header navy, ilustrasi kampus dengan informasi kelas berikutnya dinamis, delapan pintasan 4×2, tiga kartu ringkasan, agenda, dan tugas | Penambahan animasi transisi antar status countdown kelas |
| **Jadwal** | Kapsul vertikal hari, timeline berdampingan kolom waktu, badge status berteks | Filter cepat jenis mata kuliah (Teori vs Praktikum Lab) |
| **Modal Tugas** | Bottom sheet 28px, pilihan cepat tanggal (1, 3, 7 hari), validasi inline | Dukungan lampiran dokumen langsung dari penyimpanan lokal |
| **Pengaturan** | Pengalih switch biru, modal pemilih tema, uji push notifikasi | Opsi pilihan nada dering alarm kustom |
