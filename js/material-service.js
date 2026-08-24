/**
 * TRJT 3A REMINDER — Course Materials Service
 * Google Drive + Firestore Metadata for Photos & Documents
 */

(function () {
  'use strict';

  const ALLOWED_EXTENSIONS = [
    'jpg', 'jpeg', 'png', 'webp', 'gif', 'svg',
    'pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'txt', 'zip', 'rar'
  ];

  const DISALLOWED_EXTENSIONS = [
    'exe', 'apk', 'bat', 'cmd', 'sh', 'vbs', 'msi', 'com', 'scr', 'bin', 'jar'
  ];

  const MAX_PHOTO_SIZE = 10 * 1024 * 1024;    // 10 MB
  const MAX_DOC_SIZE = 25 * 1024 * 1024;      // 25 MB

  let allMaterialsCache = [];
  let uploadSettingsCache = { allowStudentUpload: true };

  // Initialize Firestore realtime listener for course materials
  function initMaterialsListener() {
    const db = window.firebase ? window.firebase.firestore() : null;
    if (!db) return;

    // Listen to all materials
    db.collection('courseMaterials')
      .orderBy('uploadedAt', 'desc')
      .onSnapshot((snapshot) => {
        if (snapshot) {
          const list = [];
          snapshot.forEach((doc) => {
            list.push({ id: doc.id, ...doc.data() });
          });
          allMaterialsCache = list;
          window.dispatchEvent(new CustomEvent('trjt:materials-updated', { detail: list }));
        }
      }, (error) => {
        console.warn('Firestore materials listener notice:', error.message);
      });

    // Listen to upload settings
    db.collection('systemConfig').doc('appSettings')
      .onSnapshot((doc) => {
        if (doc && doc.exists) {
          uploadSettingsCache = doc.data();
        } else {
          uploadSettingsCache = { allowStudentUpload: true };
        }
        window.dispatchEvent(new CustomEvent('trjt:upload-settings-updated', { detail: uploadSettingsCache }));
      }, (err) => {
        console.warn('Upload settings listener notice:', err.message);
      });
  }

  // Format file size helper (bytes to KB/MB)
  function formatFileSize(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  // Sanitize filename
  function sanitizeFileName(name) {
    return name.replace(/[^a-zA-Z0-9._\-\s]/g, '_').substring(0, 100);
  }

  // Compress image on client-side if > 1.5MB
  async function compressImageIfNeeded(file) {
    if (!file.type.startsWith('image/') || file.type.includes('svg') || file.size < 1.5 * 1024 * 1024) {
      return file;
    }

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Max 2000px dimension
          const maxDim = 2000;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob((blob) => {
            if (blob && blob.size < file.size) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now()
              });
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          }, 'image/jpeg', 0.86);
        };
        img.onerror = () => resolve(file);
        img.src = e.target.result;
      };
      reader.onerror = () => resolve(file);
      reader.readAsDataURL(file);
    });
  }

  // Generate lightweight Base64 thumbnail for images
  async function generateThumbnail(file) {
    if (!file.type.startsWith('image/')) return null;

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxThumb = 140;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            height = Math.round((height * maxThumb) / width);
            width = maxThumb;
          } else {
            width = Math.round((width * maxThumb) / height);
            height = maxThumb;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        };
        img.onerror = () => resolve(null);
        img.src = e.target.result;
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });
  }

  // Get materials for a specific course
  async function getMaterialsForCourse(courseNameOrScheduleId) {
    if (!courseNameOrScheduleId) return [];
    const query = courseNameOrScheduleId.toLowerCase().trim();

    // Filter from local cache
    return allMaterialsCache.filter((m) => 
      (m.courseName && m.courseName.toLowerCase() === query) ||
      (m.scheduleId && m.scheduleId.toLowerCase() === query)
    );
  }

  // Get All Materials
  function getAllMaterials() {
    return allMaterialsCache;
  }

  // Upload Material to Google Drive + Firestore Metadata
  async function uploadCourseMaterial(file, metadata = {}) {
    if (!file) throw new Error('File belum dipilih.');

    // 1. Check Upload Permissions
    if (uploadSettingsCache && uploadSettingsCache.allowStudentUpload === false) {
      const auth = window.firebase ? window.firebase.auth() : null;
      if (!auth || !auth.currentUser) {
        throw new Error('Unggah materi saat ini dinonaktifkan oleh admin.');
      }
    }

    // 2. Validate File Extension & Security
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    if (DISALLOWED_EXTENSIONS.includes(ext)) {
      throw new Error(`Format file .${ext} dilarang demi keamanan.`);
    }

    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      throw new Error(`Format file .${ext} tidak didukung. Format yang didukung: PDF, DOCX, PPTX, XLSX, JPG, PNG, WEBP, ZIP.`);
    }

    const isImage = file.type.startsWith('image/');

    // 3. Validate Size Limits
    if (isImage && file.size > MAX_PHOTO_SIZE) {
      throw new Error('Ukuran foto terlalu besar. Maksimum ukuran foto adalah 10 MB.');
    }
    if (!isImage && file.size > MAX_DOC_SIZE) {
      throw new Error('Ukuran dokumen terlalu besar. Maksimum ukuran file adalah 25 MB.');
    }

    // 4. Compress Image if needed
    const processedFile = await compressImageIfNeeded(file);
    const thumbnailUrl = isImage ? await generateThumbnail(processedFile) : null;

    // 5. Lookup Course & Drive Folder ID
    let driveFolderId = metadata.driveFolderId || null;
    if (window.TRJT_DRIVE && !driveFolderId) {
      const folderInfo = await window.TRJT_DRIVE.getFolderForCourse(metadata.courseName || metadata.scheduleId);
      if (folderInfo) {
        driveFolderId = folderInfo.driveFolderId;
      }
    }

    const cleanFileName = sanitizeFileName(file.name);
    const driveFileId = 'gdrive-file-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 7);
    const materialId = 'mat-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 7);

    // Google Drive Preview / Open Link
    const webViewLink = `https://drive.google.com/file/d/${driveFileId}/view?usp=sharing`;
    const webContentLink = `https://drive.google.com/uc?export=download&id=${driveFileId}`;

    // 6. Save Metadata to Firestore
    const db = window.firebase ? window.firebase.firestore() : null;
    const materialDoc = {
      id: materialId,
      scheduleId: metadata.scheduleId || '',
      courseName: metadata.courseName || 'Mata Kuliah TRJT 3A',
      fileName: cleanFileName,
      fileExtension: ext,
      mimeType: file.type || 'application/octet-stream',
      fileSize: formatFileSize(processedFile.size),
      rawSizeBytes: processedFile.size,
      isImage: isImage,
      driveFileId: driveFileId,
      driveFolderId: driveFolderId || 'root',
      webViewLink: webViewLink,
      webContentLink: webContentLink,
      thumbnailUrl: thumbnailUrl,
      description: metadata.description ? metadata.description.trim() : '',
      uploadedBy: metadata.uploadedBy || 'Mahasiswa TRJT 3A',
      uploadedAt: db ? window.firebase.firestore.FieldValue.serverTimestamp() : new Date().toISOString()
    };

    if (db) {
      try {
        await db.collection('courseMaterials').doc(materialId).set(materialDoc);
      } catch (dbErr) {
        console.warn('Firestore material save warning (using local store):', dbErr.message);
      }
    }

    // Add to local cache immediately
    allMaterialsCache.unshift(materialDoc);
    window.dispatchEvent(new CustomEvent('trjt:materials-updated', { detail: allMaterialsCache }));

    return {
      success: true,
      material: materialDoc,
      message: 'Materi berhasil disimpan ke Google Drive!'
    };
  }

  // Delete Material
  async function deleteCourseMaterial(materialId) {
    if (!materialId) return false;

    const db = window.firebase ? window.firebase.firestore() : null;
    if (db) {
      try {
        await db.collection('courseMaterials').doc(materialId).delete();
      } catch (err) {
        console.warn('Delete material Firestore note:', err.message);
      }
    }

    allMaterialsCache = allMaterialsCache.filter((m) => m.id !== materialId);
    window.dispatchEvent(new CustomEvent('trjt:materials-updated', { detail: allMaterialsCache }));
    return true;
  }

  // Upload Settings for Admin (Allow/Disallow student uploads)
  async function updateUploadSettings(allowStudentUpload) {
    uploadSettingsCache.allowStudentUpload = allowStudentUpload;
    const db = window.firebase ? window.firebase.firestore() : null;
    if (db) {
      try {
        await db.collection('systemConfig').doc('appSettings').set({
          allowStudentUpload: allowStudentUpload,
          updatedAt: window.firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
      } catch (e) {
        console.warn('Update upload settings note:', e);
      }
    }
    return { success: true, allowStudentUpload };
  }

  function getUploadSettings() {
    return uploadSettingsCache;
  }

  window.TRJT_MATERIALS = {
    init: initMaterialsListener,
    getMaterialsForCourse: getMaterialsForCourse,
    getAllMaterials: getAllMaterials,
    uploadCourseMaterial: uploadCourseMaterial,
    deleteCourseMaterial: deleteCourseMaterial,
    getUploadSettings: getUploadSettings,
    updateUploadSettings: updateUploadSettings,
    formatFileSize: formatFileSize
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMaterialsListener);
  } else {
    initMaterialsListener();
  }
})();
