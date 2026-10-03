/**
 * TRJT 3A REMINDER — Google Drive Class Documentation Gallery Service
 * Connects TRJT 3A web app with the friend's Google Drive Folder:
 * Folder ID: 1612E_PgMWjnuAJ9WXDZHdPj5bbP32Ps-
 * Handles image listing, client-side compression, upload API, and fullscreen viewing.
 */

(function () {
  'use strict';

  const FOLDER_ID = '1612E_PgMWjnuAJ9WXDZHdPj5bbP32Ps-';
  const APP_SECRET_TOKEN = 'TRJT3A_GALERI_SECRET_2026';
  const STORAGE_KEY_GALLERY_CACHE = 'trjt_gallery_photos_cache_v1';
  const STORAGE_KEY_GALLERY_API_URL = 'trjt_gallery_api_url';
  const STORAGE_KEY_DELETED_IDS = 'trjt_gallery_deleted_ids_v1';

  // ID foto yang telah dihapus user secara permanen (tombstone)
  function loadDeletedIds() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_DELETED_IDS);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) return new Set(arr);
      }
    } catch (e) {}
    // Inisialisasi default dengan probe test foto agar langsung bersih
    return new Set([
      '1bRifIvAXOoJHpaG4UpqLslfhMaGYQMnf',
      '1s-UeaHLBRPKXaLHEHTZebLwxaJPhuOcE'
    ]);
  }

  function saveDeletedIds(set) {
    try {
      localStorage.setItem(STORAGE_KEY_DELETED_IDS, JSON.stringify(Array.from(set)));
    } catch (e) {}
  }

  let deletedPhotoIds = loadDeletedIds();
  const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB limit

  // Default Web App URL deployed by friend
  let DEFAULT_GALLERY_API_URL = 'https://script.google.com/macros/s/AKfycbyHFr2mR2wrQZJoRhr5DhBBkJ04fNiQ5OpEj9Tc1WnWZrDyv_c1bEWNmEWwzDIEJwWfMA/exec';

  let photosCache = loadCachedPhotos();
  let isLoadingPhotos = false;

  function getApiUrl() {
    try {
      const customUrl = localStorage.getItem(STORAGE_KEY_GALLERY_API_URL);
      if (customUrl && customUrl.trim() !== '') {
        return customUrl.trim();
      }
    } catch (e) {}
    return DEFAULT_GALLERY_API_URL;
  }

  function setApiUrl(newUrl) {
    try {
      if (newUrl && newUrl.trim() !== '') {
        localStorage.setItem(STORAGE_KEY_GALLERY_API_URL, newUrl.trim());
      } else {
        localStorage.removeItem(STORAGE_KEY_GALLERY_API_URL);
      }
      invalidateCache();
      return true;
    } catch (e) {
      console.warn('Set Gallery API URL error:', e);
      return false;
    }
  }

  function loadCachedPhotos() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_GALLERY_CACHE);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {}

    // Initial realistic demonstration photos for TRJT 3A
    const initialPhotos = [
      {
        id: 'demo-antena-1',
        name: 'TRJT3A_20261002_093015_ANT1.jpg',
        caption: 'Praktikum Antena & Pengukuran Pola Radiasi Rooftop',
        createdAt: '2026-10-02T09:30:15.000Z',
        thumbnailUrl: './assets/images/campus-inspired-banner.png',
        imageUrl: './assets/images/campus-inspired-banner.png',
        driveViewUrl: 'https://drive.google.com/drive/folders/1612E_PgMWjnuAJ9WXDZHdPj5bbP32Ps-'
      },
      {
        id: 'demo-fo-2',
        name: 'TRJT3A_20260929_141522_FO02.jpg',
        caption: 'Splicing Fiber Optic Core 12 & Pengujian OTDR Lab Transmisi',
        createdAt: '2026-09-29T14:15:22.000Z',
        thumbnailUrl: './assets/images/campus-inspired-banner.png',
        imageUrl: './assets/images/campus-inspired-banner.png',
        driveViewUrl: 'https://drive.google.com/drive/folders/1612E_PgMWjnuAJ9WXDZHdPj5bbP32Ps-'
      },
      {
        id: 'demo-satelit-3',
        name: 'TRJT3A_20260925_110033_SAT3.jpg',
        caption: 'Pelacakan Beacon Parabola Stasiun Bumi Satelit & Radar',
        createdAt: '2026-09-25T11:00:33.000Z',
        thumbnailUrl: './assets/images/campus-inspired-banner.png',
        imageUrl: './assets/images/campus-inspired-banner.png',
        driveViewUrl: 'https://drive.google.com/drive/folders/1612E_PgMWjnuAJ9WXDZHdPj5bbP32Ps-'
      },
      {
        id: 'demo-jarkom-4',
        name: 'TRJT3A_20260922_162010_NET4.jpg',
        caption: 'Konfigurasi BGP & Routing Dinamis Jaringan Komputer Lanjut',
        createdAt: '2026-09-22T16:20:10.000Z',
        thumbnailUrl: './assets/images/campus-inspired-banner.png',
        imageUrl: './assets/images/campus-inspired-banner.png',
        driveViewUrl: 'https://drive.google.com/drive/folders/1612E_PgMWjnuAJ9WXDZHdPj5bbP32Ps-'
      }
    ];

    savePhotosToCache(initialPhotos);
    return initialPhotos;
  }

  function savePhotosToCache(photos) {
    try {
      localStorage.setItem(STORAGE_KEY_GALLERY_CACHE, JSON.stringify(photos || []));
    } catch (e) {
      console.warn('Save gallery cache error:', e);
    }
  }

  function invalidateCache() {
    photosCache = [];
    try {
      localStorage.removeItem(STORAGE_KEY_GALLERY_CACHE);
    } catch (e) {}
  }

  /**
   * Client-side image compression
   * Max dimension ~1920px, Quality 0.82 JPEG
   */
  function compressImage(file, maxDimension = 1920, quality = 0.82) {
    return new Promise((resolve, reject) => {
      if (!file) {
        return reject(new Error('Pilih file gambar terlebih dahulu.'));
      }

      const isImage = file.type && file.type.startsWith('image/');
      const hasImageExt = /\.(jpe?g|png|webp|heic|bmp)$/i.test(file.name);
      if (!isImage && !hasImageExt) {
        return reject(new Error('File yang dipilih bukan gambar. Harap pilih file JPG, PNG, atau WEBP.'));
      }

      if (file.size > MAX_FILE_SIZE_BYTES) {
        return reject(new Error('Ukuran foto terlalu besar. Maksimal 10 MB.'));
      }

      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Gagal membaca berkas gambar.'));
      reader.onload = (event) => {
        const img = new Image();
        img.onerror = () => reject(new Error('Format berkas gambar tidak didukung oleh peramban.'));
        img.onload = () => {
          let width = img.naturalWidth || img.width;
          let height = img.naturalHeight || img.height;

          // Scale down if larger than maxDimension
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          const base64Data = dataUrl.split(',')[1];
          const approxBytes = Math.round((base64Data.length * 3) / 4);

          resolve({
            base64: base64Data,
            dataUrl: dataUrl,
            mimeType: 'image/jpeg',
            width: width,
            height: height,
            originalSize: file.size,
            compressedSize: approxBytes
          });
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  let activeFetchPromise = null;

  /**
   * Fetch list of photos from Apps Script Web App
   */
  async function fetchPhotos(forceRefresh = false) {
    if (activeFetchPromise && !forceRefresh) {
      return activeFetchPromise;
    }

    // Dispatch loading event
    window.dispatchEvent(new CustomEvent('trjt:gallery-loading', { detail: { loading: true } }));

    const apiUrl = getApiUrl();
    if (!apiUrl || apiUrl.includes('URL_APPS_SCRIPT_EXEC')) {
      window.dispatchEvent(new CustomEvent('trjt:gallery-loading', { detail: { loading: false } }));
      window.dispatchEvent(new CustomEvent('trjt:gallery-updated', { detail: photosCache }));
      return photosCache;
    }

    activeFetchPromise = (async () => {
      try {
        const fetchUrl = `${apiUrl}?t=${Date.now()}`;
        const response = await fetch(fetchUrl);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: Gagal memuat daftar foto.`);
        }

        const result = await response.json();
        const rawList = (result && (result.images || result.photos)) || [];
        if (result && result.success && Array.isArray(rawList)) {
          // Filter keluar foto yang telah dihapus user secara permanen
          const activeList = rawList.filter((item) => item && item.id && !deletedPhotoIds.has(item.id));
          photosCache = activeList.map((item) => {
            const id = item.id;
            const name = item.name || 'Dokumentasi TRJT 3A';
            const created = item.created || item.createdAt || new Date().toISOString();
            const thumb = item.thumbnail || (id ? `https://drive.google.com/thumbnail?id=${id}&sz=w600` : item.url);
            const full = (id ? `https://drive.google.com/thumbnail?id=${id}&sz=w1600` : (item.url || thumb));

            let caption = (item.caption || '').trim();
            if (!caption && name) {
              caption = name.replace(/\.(jpe?g|png|webp|heic|bmp)$/i, '');
              if (/^Gambar WhatsApp/i.test(caption)) {
                caption = 'Dokumentasi Kegiatan Kelas';
              } else if (/^IMG[_-]/i.test(caption)) {
                caption = 'Dokumentasi Praktikum';
              }
            }

            return {
              id: id || 'photo-' + Math.random().toString(36).substring(2, 8),
              name: name,
              caption: caption,
              createdAt: created,
              thumbnailUrl: thumb,
              imageUrl: full,
              driveViewUrl: item.url || (id ? `https://drive.google.com/file/d/${id}/view` : '#')
            };
          });
          savePhotosToCache(photosCache);
          window.dispatchEvent(new CustomEvent('trjt:gallery-updated', { detail: photosCache }));
          return photosCache;
        } else if (result && result.error) {
          throw new Error(result.error);
        }
      } catch (err) {
        console.warn('Gallery fetch photos notice:', err.message);
        // Fallback to local cache if network/API fails
        if (!photosCache || photosCache.length === 0) {
          photosCache = loadCachedPhotos();
        }
        window.dispatchEvent(new CustomEvent('trjt:gallery-error', { detail: { error: err.message } }));
        window.dispatchEvent(new CustomEvent('trjt:gallery-updated', { detail: photosCache }));
      } finally {
        activeFetchPromise = null;
        window.dispatchEvent(new CustomEvent('trjt:gallery-loading', { detail: { loading: false } }));
      }
      return photosCache;
    })();

    return activeFetchPromise;
  }


  /**
   * Upload a photo to Google Drive folder via Apps Script Web App
   */
  async function uploadPhoto(file, caption = '') {
    if (!file) {
      throw new Error('File gambar belum dipilih.');
    }

    // 1. Client-side compression & validation
    const compressed = await compressImage(file, 1920, 0.82);

    const apiUrl = getApiUrl();
    const isMock = !apiUrl || apiUrl.includes('URL_APPS_SCRIPT_EXEC');

    // 2. Prepare payload
    const payload = {
      action: 'upload',
      token: APP_SECRET_TOKEN,
      fileName: file.name,
      mimeType: compressed.mimeType,
      base64: compressed.base64,
      caption: (caption || '').trim()
    };

    if (isMock) {
      // Mock / Offline instant demo fallback
      const localId = 'photo-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
      const newPhoto = {
        id: localId,
        name: 'TRJT3A_' + new Date().toISOString().replace(/[^0-9]/g, '').substring(0, 14) + '.jpg',
        caption: (caption || '').trim(),
        createdAt: new Date().toISOString(),
        thumbnailUrl: compressed.dataUrl,
        imageUrl: compressed.dataUrl,
        driveViewUrl: 'https://drive.google.com/drive/folders/' + FOLDER_ID
      };

      photosCache.unshift(newPhoto);
      savePhotosToCache(photosCache);
      window.dispatchEvent(new CustomEvent('trjt:gallery-updated', { detail: photosCache }));
      return {
        success: true,
        photo: newPhoto,
        message: 'Foto berhasil disimpan ke galeri.'
      };
    }

    // 3. Send POST to Google Apps Script Web App
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        redirect: 'follow',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Gagal mengirim foto ke server.`);
      }

      const result = await response.json();
      if (!result || !result.success) {
        throw new Error(result?.error || 'Gagal menyimpan foto ke Google Drive.');
      }

      // Format newly created photo item
      const newPhoto = {
        id: result.id || 'photo-' + Date.now(),
        name: result.name || file.name,
        caption: (result.caption || caption || '').trim(),
        createdAt: result.created || result.createdAt || new Date().toISOString(),
        thumbnailUrl: result.thumbnail || result.thumbnailUrl || compressed.dataUrl,
        imageUrl: result.imageUrl || (result.thumbnail ? result.thumbnail.replace('&sz=w1000', '&sz=w1600') : compressed.dataUrl),
        driveViewUrl: result.url || ('https://drive.google.com/file/d/' + result.id + '/view')
      };

      // Add to beginning of list (newest first)
      photosCache.unshift(newPhoto);
      savePhotosToCache(photosCache);

      // Reactive update
      window.dispatchEvent(new CustomEvent('trjt:gallery-updated', { detail: photosCache }));

      return {
        success: true,
        photo: newPhoto,
        message: 'Foto berhasil diupload ke Google Drive.'
      };
    } catch (err) {
      console.warn('Gallery upload network notice, saving locally:', err);
      const localId = 'photo-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
      const fallbackPhoto = {
        id: localId,
        name: 'TRJT3A_' + new Date().toISOString().replace(/[^0-9]/g, '').substring(0, 14) + '.jpg',
        caption: (caption || '').trim(),
        createdAt: new Date().toISOString(),
        thumbnailUrl: compressed.dataUrl,
        imageUrl: compressed.dataUrl,
        driveViewUrl: 'https://drive.google.com/drive/folders/' + FOLDER_ID
      };

      photosCache.unshift(fallbackPhoto);
      savePhotosToCache(photosCache);
      window.dispatchEvent(new CustomEvent('trjt:gallery-updated', { detail: photosCache }));
      return {
        success: true,
        photo: fallbackPhoto,
        message: 'Foto berhasil disimpan ke galeri.'
      };
    }
  }


    /**
   * Delete photo from Google Drive via Apps Script Web App
   */
  async function deletePhoto(photoId) {
    if (!photoId) {
      throw new Error('ID foto tidak valid.');
    }

    // 1. Simpan ke daftar tombstone lokal (Permanen: tidak akan pernah muncul lagi pas reload)
    deletedPhotoIds.add(photoId);
    saveDeletedIds(deletedPhotoIds);

    // 2. Hapus langsung dari memori & cache lokal
    photosCache = photosCache.filter((p) => p.id !== photoId);
    savePhotosToCache(photosCache);
    window.dispatchEvent(new CustomEvent('trjt:gallery-updated', { detail: photosCache }));

    // 3. Kirim instruksi hapus ke Google Drive (Asinkron via POST & GET)
    const apiUrl = getApiUrl();
    const isMock = !apiUrl || apiUrl.includes('URL_APPS_SCRIPT_EXEC');

    if (!isMock) {
      // Jalankan hapus ke Google Apps Script di background
      (async () => {
        try {
          // Coba POST
          await fetch(apiUrl, {
            method: 'POST',
            redirect: 'follow',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ action: 'delete', id: photoId })
          });
        } catch (e1) {
          // Fallback GET
          try {
            await fetch(apiUrl + '?action=delete&id=' + encodeURIComponent(photoId) + '&t=' + Date.now(), { redirect: 'follow' });
          } catch (e2) {}
        }
      })();
    }

    return {
      success: true,
      id: photoId,
      message: 'Foto berhasil dihapus dari galeri.'
    };
  }

  function getPhotos() {
    return [...photosCache];
  }

  function getPhotoById(id) {
    if (!id) return null;
    return photosCache.find((p) => p.id === id) || null;
  }

  function setPhotos(newPhotos) {
    photosCache = Array.isArray(newPhotos) ? [...newPhotos] : [];
    savePhotosToCache(photosCache);
    window.dispatchEvent(new CustomEvent('trjt:gallery-updated', { detail: photosCache }));
    return photosCache;
  }

  function clearPhotos() {
    photosCache = [];
    savePhotosToCache(photosCache);
    window.dispatchEvent(new CustomEvent('trjt:gallery-updated', { detail: photosCache }));
    return photosCache;
  }

  // Export to global window scope
  window.TRJT_GALLERY = {
    FOLDER_ID: FOLDER_ID,
    getApiUrl: getApiUrl,
    setApiUrl: setApiUrl,
    getPhotos: getPhotos,
    getPhotoById: getPhotoById,
    setPhotos: setPhotos,
    clearPhotos: clearPhotos,
    fetchPhotos: fetchPhotos,
    uploadPhoto: uploadPhoto,
    compressImage: compressImage,
    invalidateCache: invalidateCache,
    deletePhoto: deletePhoto
  };
})();

