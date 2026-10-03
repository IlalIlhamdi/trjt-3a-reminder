/**
 * =============================================================================
 * TRJT 3A — GOOGLE APPS SCRIPT BACKEND GALERI GOOGLE DRIVE
 * =============================================================================
 * Folder ID: 1612E_PgMWjnuAJ9WXDZHdPj5bbP32Ps-
 * Web App URL: https://script.google.com/macros/s/AKfycbyHFr2mR2wrQZJoRhr5DhBBkJ04fNiQ5OpEj9Tc1WnWZrDyv_c1bEWNmEWwzDIEJwWfMA/exec
 *
 * PANDUAN UPDATE DI SCRIPT.GOOGLE.COM:
 * 1. Salin seluruh isi file ini.
 * 2. Buka project script di https://script.google.com/
 * 3. Hapus seluruh isi editor lama, lalu paste seluruh kode ini.
 * 4. Klik ikon Save (Ctrl+S).
 * 5. Klik "Deploy" -> "Manage deployments" (Kelola penerapan).
 * 6. Klik ikon Pensil (Edit) pada deployment aktif.
 * 7. Pada dropdown "Version", pilih "New version" (Versi baru).
 * 8. Klik tombol "Deploy".
 * =============================================================================
 */

const FOLDER_ID = "1612E_PgMWjnuAJ9WXDZHdPj5bbP32Ps-";

/**
 * Handle HTTP GET Requests:
 * 1. Ambil daftar foto dari Google Drive (default)
 * 2. Hapus foto via GET parameter ?action=delete&id=... (fallback)
 */
function doGet(e) {
  try {
    // -------------------------------------------------------------
    // FITUR HAPUS FOTO VIA GET (Fallback jika POST terkendala)
    // -------------------------------------------------------------
    if (e && e.parameter && (e.parameter.action === 'delete' || e.parameter.delete)) {
      const fileId = e.parameter.id || e.parameter.fileId;
      if (!fileId) throw new Error("ID foto tidak ditemukan.");
      const file = DriveApp.getFileById(fileId);
      file.setTrashed(true);
      return ContentService
        .createTextOutput(JSON.stringify({
          success: true,
          id: fileId,
          message: "Foto berhasil dipindahkan ke tempat sampah Google Drive."
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // -------------------------------------------------------------
    // DAFTAR FOTO DI GOOGLE DRIVE (Default)
    // -------------------------------------------------------------
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
 * Handle HTTP POST Requests:
 * 1. Hapus foto dari Google Drive (action: 'delete')
 * 2. Upload foto baru ke Google Drive (action: 'upload' atau base64)
 */
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      throw new Error("Payload data tidak ditemukan.");
    }

    const data = JSON.parse(e.postData.contents);

    // -------------------------------------------------------------
    // 1. FITUR HAPUS FOTO DARI GOOGLE DRIVE
    // -------------------------------------------------------------
    if (data.action === 'delete') {
      const fileId = data.id || data.fileId;
      if (!fileId) throw new Error("ID foto tidak ditemukan.");
      const file = DriveApp.getFileById(fileId);
      // Pindahkan ke tempat sampah Google Drive
      file.setTrashed(true);
      return ContentService
        .createTextOutput(JSON.stringify({
          success: true,
          id: fileId,
          message: "Foto berhasil dipindahkan ke tempat sampah Google Drive."
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // -------------------------------------------------------------
    // 2. FITUR UPLOAD FOTO KE GOOGLE DRIVE
    // -------------------------------------------------------------
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

    // Penanganan izin sharing yang aman
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
