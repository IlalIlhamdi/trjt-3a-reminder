/**
 * =============================================================================
 * TRJT 3A — GOOGLE APPS SCRIPT BACKEND GALERI GOOGLE DRIVE
 * =============================================================================
 * Folder ID: 1612E_PgMWjnuAJ9WXDZHdPj5bbP32Ps-
 * Web App URL: https://script.google.com/macros/s/AKfycbyHFr2mR2wrQZJoRhr5DhBBkJ04fNiQ5OpEj9Tc1WnWZrDyv_c1bEWNmEWwzDIEJwWfMA/exec
 *
 * PANDUAN UPDATE DI SCRIPT.GOOGLE.COM:
 * 1. Salin seluruh isi file ini.
 * 2. Buka project script teman Anda di https://script.google.com/
 * 3. Hapus seluruh isi editor yang lama, lalu paste seluruh kode ini.
 * 4. Klik ikon Save (Ctrl+S).
 * 5. Klik tombol "Deploy" (kanan atas) -> pilih "Manage deployments" (Kelola deployment).
 * 6. Klik ikon Pensil (Edit) di sebelah deployment aktif.
 * 7. Pada dropdown "Version", pilih "New version" (Versi baru).
 * 8. Klik tombol "Deploy".
 * -> URL Web App tetap sama persis dan fitur Upload Foto langsung aktif!
 * =============================================================================
 */

const FOLDER_ID = "1612E_PgMWjnuAJ9WXDZHdPj5bbP32Ps-";

/**
 * Handle HTTP GET Requests — Mengambil daftar foto dari Google Drive
 */
function doGet() {
  try {
    const folder = DriveApp.getFolderById(FOLDER_ID);
    const files = folder.getFiles();
    const images = [];

    while (files.hasNext()) {
      const file = files.next();
      const mimeType = file.getMimeType();

      if (mimeType.startsWith("image/")) {
        images.push({
          id: file.getId(),
          name: file.getName(),
          mimeType: mimeType,
          caption: file.getDescription() || "",
          url: "https://drive.google.com/uc?export=view&id=" + file.getId(),
          thumbnail: "https://drive.google.com/thumbnail?id=" + file.getId() + "&sz=w1000",
          created: file.getDateCreated().toISOString(),
          updated: file.getLastUpdated().toISOString()
        });
      }
    }

    // Urutkan foto terbaru di paling atas
    images.sort((a, b) => {
      return new Date(b.created) - new Date(a.created);
    });

    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        total: images.length,
        images: images
      }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.message
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Handle HTTP POST Requests — Upload foto baru langsung ke Google Drive
 */
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      throw new Error("Payload data tidak ditemukan.");
    }

    const data = JSON.parse(e.postData.contents);

    if (data.action === 'delete') {
      const fileId = data.id || data.fileId;
      if (!fileId) throw new Error('ID foto tidak ditemukan.');
      const file = DriveApp.getFileById(fileId);
      file.setTrashed(true);
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        id: fileId,
        message: 'Foto berhasil dipindahkan ke tempat sampah Google Drive.'
      })).setMimeType(ContentService.MimeType.JSON);
    }

    if (!data.base64) {
      throw new Error("Data gambar base64 tidak ditemukan.");
    }

    const folder = DriveApp.getFolderById(FOLDER_ID);

    // Decode base64
    const decoded = Utilities.base64Decode(data.base64);

    // Format penamaan file terstandar: TRJT3A_YYYYMMDD_HHMMSS_xxxx.jpg
    const now = new Date();
    const pad = (n) => (n < 10 ? '0' : '') + n;
    const timeStamp = '' + now.getFullYear() + pad(now.getMonth() + 1) + pad(now.getDate()) + '_' +
                      pad(now.getHours()) + pad(now.getMinutes()) + pad(now.getSeconds());
    const randSuffix = Math.floor(1000 + Math.random() * 9000).toString(16).toUpperCase();
    const standardFileName = 'TRJT3A_' + timeStamp + '_' + randSuffix + '.jpg';

    // Buat blob file gambar
    const mime = data.mimeType || 'image/jpeg';
    const blob = Utilities.newBlob(decoded, mime, standardFileName);

    // Simpan file ke folder Google Drive
    const file = folder.createFile(blob);

    // Simpan keterangan/caption jika diisi user
    if (data.caption && data.caption.trim()) {
      file.setDescription(data.caption.trim());
    }

    // Berikan izin view agar thumbnail & foto bisa tampil langsung di aplikasi
    try {
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (shareErr) {
      // Folder sudah publik / mewarisi izin, abaikan jika setSharing gagal
    }

    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        id: file.getId(),
        name: file.getName(),
        mimeType: mime,
        caption: data.caption || "",
        url: "https://drive.google.com/uc?export=view&id=" + file.getId(),
        thumbnail: "https://drive.google.com/thumbnail?id=" + file.getId() + "&sz=w1000",
        created: file.getDateCreated().toISOString(),
        message: "Foto berhasil diupload ke Google Drive."
      }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.message
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Jalankan fungsi ini SEKALI di script.google.com untuk memberikan izin upload (DriveApp.Folder.createFile)
 * 1. Di dropdown fungsi (sebelah tombol 'Debug'), pilih 'testAuth'
 * 2. Klik tombol 'Run' (Jalankan)
 * 3. Klik 'Review permissions' -> Pilih Akun Google -> 'Advanced' -> 'Go to ... (unsafe)' -> 'Allow'
 */
function testAuth() {
  const folder = DriveApp.getFolderById(FOLDER_ID);
  const testBlob = Utilities.newBlob('test auth', 'text/plain', 'test_auth.txt');
  const file = folder.createFile(testBlob);
  file.setTrashed(true);
  Logger.log('Izin upload Google Drive berhasil diaktifkan!');
}
