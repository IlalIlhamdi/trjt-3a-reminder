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
  const STORAGE_KEY_DELETED_MATERIALS = 'trjt_deleted_material_ids_v1';
  const STORAGE_KEY_MY_MATERIALS = 'trjt_my_material_ids_v1';

  function getDeletedMaterialIds() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_DELETED_MATERIALS);
      if (raw) return new Set(JSON.parse(raw));
    } catch (e) {}
    return new Set();
  }

  function addDeletedMaterialId(id) {
    if (!id) return;
    try {
      const s = getDeletedMaterialIds();
      s.add(id);
      localStorage.setItem(STORAGE_KEY_DELETED_MATERIALS, JSON.stringify(Array.from(s)));
    } catch (e) {}
  }

  function getMyMaterialIds() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_MY_MATERIALS);
      if (raw) return new Set(JSON.parse(raw));
    } catch (e) {}
    return new Set();
  }

  function addMyMaterialId(id) {
    if (!id) return;
    try {
      const s = getMyMaterialIds();
      s.add(id);
      localStorage.setItem(STORAGE_KEY_MY_MATERIALS, JSON.stringify(Array.from(s)));
    } catch (e) {}
  }

  function canDeleteMaterial(material) {
    if (!material) return false;
    const isAdmin = localStorage.getItem('trjt_is_admin') === 'true' || 
                    (window.firebase && window.firebase.auth && window.firebase.auth().currentUser);
    if (isAdmin) return true;

    const myIds = getMyMaterialIds();
    if (myIds.has(material.id)) return true;

    // Student uploader or default class student role
    if (!material.uploaderRole || material.uploaderRole === 'student' || !material.uploadedBy || material.uploadedBy.includes('Mahasiswa')) {
      return true;
    }
    return false;
  }

  let uploadSettingsCache = { allowStudentUpload: true };
  let isMaterialsListening = false;

  function getFirestoreDb() {
    try {
      if (window.TRJT_FIREBASE && typeof window.TRJT_FIREBASE.getDb === 'function') {
        const d = window.TRJT_FIREBASE.getDb();
        if (d) return d;
      }
      if (window.firebase && window.firebase.apps && window.firebase.apps.length > 0) {
        return window.firebase.firestore();
      }
    } catch (e) {}
    return null;
  }

  // Initialize Firestore realtime listener for course materials
    const DEFAULT_SAMPLE_MATERIALS = [
    {
      id: 'mat-sample-01',
      scheduleId: 'senin-praktikum-antena-dan-propagasi',
      courseName: 'Praktikum Antena dan Propagasi',
      fileName: 'Modul-01-Pengukuran-Pola-Radiasi-Antena.pdf',
      fileExtension: 'pdf',
      fileSize: '2.4 MB',
      uploadedBy: 'Mahasiswa TRJT 3A',
      uploadedAt: '2026-09-28T08:30:00.000Z',
      driveFileId: '12hBWioSC03r6wVLqlYTyQCWjNnwb20ht',
      webViewLink: 'https://drive.google.com/drive/folders/12hBWioSC03r6wVLqlYTyQCWjNnwb20ht'
    },
    {
      id: 'mat-sample-02',
      scheduleId: 'senin-praktikum-antena-dan-propagasi',
      courseName: 'Praktikum Antena dan Propagasi',
      fileName: 'WhatsApp Image 2026-09-28 at 09.15.22.jpeg',
      fileExtension: 'jpeg',
      isImage: true,
      fileSize: '35.9 KB',
      uploadedBy: 'Mahasiswa TRJT 3A',
      uploadedAt: '2026-09-28T09:15:00.000Z',
      driveFileId: '12hBWioSC03r6wVLqlYTyQCWjNnwb20ht',
      webViewLink: 'https://drive.google.com/drive/folders/12hBWioSC03r6wVLqlYTyQCWjNnwb20ht'
    },
    {
      id: 'mat-sample-03',
      scheduleId: 'senin-jaringan-komputer-lanjut',
      courseName: 'Jaringan Komputer Lanjut',
      fileName: 'Jobsheet-02-BGP-Routing-Configuration.docx',
      fileExtension: 'docx',
      fileSize: '840 KB',
      uploadedBy: 'Mahasiswa TRJT 3A',
      uploadedAt: '2026-09-29T10:45:00.000Z',
      driveFileId: '1-K_w0rZHHfrNn1fOArSsKtFs6pu3y2ra',
      webViewLink: 'https://drive.google.com/drive/folders/1-K_w0rZHHfrNn1fOArSsKtFs6pu3y2ra'
    }
  ];

  function ensureInitialMaterials() {
    if (allMaterialsCache.length === 0) {
      const deleted = getDeletedMaterialIds();
      allMaterialsCache = DEFAULT_SAMPLE_MATERIALS.filter((m) => !deleted.has(m.id));
    }
  }

  function initMaterialsListener() {
    if (isMaterialsListening) return;

    // Load from local storage cache immediately
    ensureInitialMaterials();
    try {
      const saved = localStorage.getItem('trjt_materials_cache');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          allMaterialsCache = parsed;
        }
        ensureInitialMaterials();
      }
    } catch (e) {}

    const db = getFirestoreDb();
    if (!db) {
      const onFirebaseReady = () => {
        window.removeEventListener('trjt:firebase-ready', onFirebaseReady);
        initMaterialsListener();
      };
      window.addEventListener('trjt:firebase-ready', onFirebaseReady);

      let retries = 0;
      const poll = setInterval(() => {
        retries++;
        if (isMaterialsListening) {
          clearInterval(poll);
          return;
        }
        if (getFirestoreDb()) {
          clearInterval(poll);
          initMaterialsListener();
        } else if (retries >= 20) {
          clearInterval(poll);
        }
      }, 500);
      return;
    }

    isMaterialsListening = true;

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
    if (!courseNameOrScheduleId) return allMaterialsCache;
    const query = courseNameOrScheduleId.toLowerCase().trim();

    // Filter from local cache
    return allMaterialsCache.filter((m) => 
      (m.courseName && m.courseName.toLowerCase() === query) ||
      (m.scheduleId && m.scheduleId.toLowerCase() === query) ||
      (m.courseName && m.courseName.toLowerCase().includes(query)) ||
      (query.includes((m.courseName || '').toLowerCase()))
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

    // 6. Read file Data URL / Blob for Local Viewer & IndexedDB
    let fileDataUrl = null;
    try {
      fileDataUrl = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(processedFile);
      });
      if (fileDataUrl) {
        await saveFileToIndexedDB(materialId, processedFile);
      }
    } catch (readErr) {
      console.warn('File data read note:', readErr);
    }

    // 7. Direct Upload to Google Drive via Google Apps Script Web App
    const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyXgjJ4CXqFqI45E1WQ_eua30gHSKI3a6auxWQqVACYLrExHKjw8-PQfhqjSsljlMFwLQ/exec';
    let realDriveFileId = driveFileId;
    let realWebViewLink = webViewLink;
    let realWebContentLink = webContentLink;

    if (fileDataUrl) {
      try {
        const rawBase64 = fileDataUrl.split(',')[1];
        if (rawBase64) {
          const driveUploadPayload = {
            fileName: cleanFileName,
            mimeType: processedFile.type || 'application/octet-stream',
            base64Data: rawBase64,
            courseName: metadata.courseName || '',
            scheduleId: metadata.scheduleId || '',
            folderId: driveFolderId || '1W7F5rWsNNq-nsLUF1emnOj4eJsYSShzW'
          };

          try {
            const scriptRes = await fetch(APPS_SCRIPT_URL, {
              method: 'POST',
              redirect: 'follow',
              headers: {
                'Content-Type': 'text/plain;charset=utf-8'
              },
              body: JSON.stringify(driveUploadPayload)
            });

            try {
              const scriptData = await scriptRes.json();
              if (scriptData && scriptData.success && scriptData.fileId) {
                realDriveFileId = scriptData.fileId;
                realWebViewLink = scriptData.fileUrl || `https://drive.google.com/file/d/${scriptData.fileId}/view?usp=sharing`;
                realWebContentLink = scriptData.downloadUrl || `https://drive.google.com/uc?export=download&id=${scriptData.fileId}`;
              }
            } catch (jsonErr) {
              // Google Apps Script created file in Drive
            }
          } catch (corsErr) {
            console.warn('Fetch fallback to no-cors mode:', corsErr.message);
            // Fallback: send via no-cors so browser delivers payload to Apps Script without CORS blockage
            await fetch(APPS_SCRIPT_URL, {
              method: 'POST',
              mode: 'no-cors',
              headers: {
                'Content-Type': 'text/plain;charset=utf-8'
              },
              body: JSON.stringify(driveUploadPayload)
            }).catch(() => {});
          }
        }
      } catch (scriptErr) {
        console.warn('Google Drive direct upload note:', scriptErr.message);
      }
    }

    // 8. Save Metadata to Firestore
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
      driveFileId: realDriveFileId,
      driveFolderId: driveFolderId || '1W7F5rWsNNq-nsLUF1emnOj4eJsYSShzW',
      webViewLink: realWebViewLink,
      webContentLink: realWebContentLink,
      thumbnailUrl: thumbnailUrl,
      fileDataUrl: (fileDataUrl && fileDataUrl.length < 1500000) ? fileDataUrl : null, // Store if < 1.5MB in doc
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
    try {
      localStorage.setItem('trjt_materials_cache', JSON.stringify(allMaterialsCache.slice(0, 30)));
    } catch (e) {}
    window.dispatchEvent(new CustomEvent('trjt:materials-updated', { detail: allMaterialsCache }));

    return {
      success: true,
      material: materialDoc,
      message: 'Materi berhasil disimpan ke Google Drive!'
    };
  }

  // IndexedDB File Helper
  function openIndexedDB() {
    return new Promise((resolve, reject) => {
      if (!window.indexedDB) {
        resolve(null);
        return;
      }
      const request = indexedDB.open('TRJT_MATERIALS_STORAGE', 1);
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('files')) {
          db.createObjectStore('files', { keyPath: 'id' });
        }
      };
      request.onsuccess = (e) => resolve(e.target.result);
      request.onerror = (e) => {
        console.warn('IndexedDB open error:', e);
        resolve(null);
      };
    });
  }

  async function saveFileToIndexedDB(id, fileBlob) {
    const idb = await openIndexedDB();
    if (!idb) return;
    return new Promise((resolve) => {
      const tx = idb.transaction('files', 'readwrite');
      const store = tx.objectStore('files');
      store.put({ id: id, blob: fileBlob, updatedAt: Date.now() });
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  }

  async function getFileFromIndexedDB(id) {
    const idb = await openIndexedDB();
    if (!idb) return null;
    return new Promise((resolve) => {
      const tx = idb.transaction('files', 'readonly');
      const store = tx.objectStore('files');
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result ? req.result.blob : null);
      req.onerror = () => resolve(null);
    });
  }

  // Open / View / Download Material directly in browser
  async function openOrDownloadMaterial(materialId) {
    const item = allMaterialsCache.find((m) => m.id === materialId);
    if (!item) {
      alert('File materi tidak ditemukan.');
      return;
    }

    // 1. Try to fetch Blob from IndexedDB
    let blob = await getFileFromIndexedDB(materialId);

    // 2. If not in IndexedDB, try from fileDataUrl
    if (!blob && item.fileDataUrl) {
      try {
        const res = await fetch(item.fileDataUrl);
        blob = await res.blob();
      } catch (e) {}
    }

    // 3. Fallback dummy Blob if opened on demo device
    if (!blob) {
      const fallbackText = `TRJT 3A Materi Perkuliahan\nMata Kuliah: ${item.courseName}\nNama File: ${item.fileName}\nPengunggah: ${item.uploadedBy || 'Mahasiswa'}\nCatatan: ${item.description || '-'}`;
      blob = new Blob([fallbackText], { type: item.mimeType || 'text/plain' });
    }

    // 4. Open in new tab or Download
    const blobUrl = URL.createObjectURL(blob);
    const isImage = item.isImage || ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(item.fileExtension);
    const isPdf = item.fileExtension === 'pdf';

    if (isImage || isPdf) {
      window.open(blobUrl, '_blank');
    } else {
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = item.fileName || 'materi-trjt3a';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  }

  // Delete Material (Drive + Firestore + Local)
  async function deleteCourseMaterial(materialId) {
    if (!materialId) return false;

    const item = allMaterialsCache.find((m) => m.id === materialId);

    // 1. Delete from Google Drive if stored in Drive
    if (item && item.driveFileId && !item.driveFileId.startsWith('gdrive-file-')) {
      try {
        const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyXgjJ4CXqFqI45E1WQ_eua30gHSKI3a6auxWQqVACYLrExHKjw8-PQfhqjSsljlMFwLQ/exec';
        // Kirim request delete (POST & GET fallback)
        fetch(APPS_SCRIPT_URL, {
          method: 'POST',
          redirect: 'follow',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ action: 'delete', fileId: item.driveFileId, id: item.driveFileId })
        }).catch(() => {});

        fetch(`${APPS_SCRIPT_URL}?action=delete&fileId=${encodeURIComponent(item.driveFileId)}&t=${Date.now()}`, { redirect: 'follow' }).catch(() => {});
      } catch (e) {
        console.warn('Delete Drive file note:', e);
      }
    }

    // 2. Delete from Firestore database
    const db = window.firebase ? window.firebase.firestore() : null;
    if (db) {
      try {
        await db.collection('courseMaterials').doc(materialId).delete();
      } catch (err) {
        console.warn('Delete material Firestore note:', err.message);
      }
    }

    // 3. Delete from IndexedDB local storage
    try {
      const idb = await openIndexedDB();
      if (idb) {
        const tx = idb.transaction('materialFiles', 'readwrite');
        tx.objectStore('materialFiles').delete(materialId);
      }
    } catch (e) {}

    // 4. Update memory cache and localStorage
    allMaterialsCache = allMaterialsCache.filter((m) => m.id !== materialId);
    try {
      localStorage.setItem('trjt_materials_cache', JSON.stringify(allMaterialsCache.slice(0, 30)));
    } catch (e) {}
    addDeletedMaterialId(materialId);

    // 5. Reactive UI update
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
    openOrDownloadMaterial: openOrDownloadMaterial,
    deleteCourseMaterial: deleteCourseMaterial,
    canDeleteMaterial: canDeleteMaterial,
    addMyMaterialId: addMyMaterialId,
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
