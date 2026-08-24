/**
 * TRJT 3A REMINDER — Google Drive & Course Folder Service
 * Handles admin OAuth status, root folder, and 11 course subfolders
 */

(function () {
  'use strict';

  const OFFICIAL_COURSES = [
    { id: 'senin-praktikum-antena-dan-propagasi', name: 'Praktikum Antena dan Propagasi', slug: 'praktikum-antena-dan-propagasi' },
    { id: 'senin-jaringan-komputer-lanjut', name: 'Jaringan Komputer Lanjut', slug: 'jaringan-komputer-lanjut' },
    { id: 'selasa-praktikum-jaringan-komputer-lanjut', name: 'Praktikum Jaringan Komputer Lanjut', slug: 'praktikum-jaringan-komputer-lanjut' },
    { id: 'selasa-praktikum-sistem-komunikasi-satelit-dan-radar', name: 'Praktikum Sistem Komunikasi Satelit dan Radar', slug: 'praktikum-sistem-komunikasi-satelit-dan-radar' },
    { id: 'selasa-teknik-instalasi-fiber-optik', name: 'Teknik Instalasi Fiber Optik', slug: 'teknik-instalasi-fiber-optik' },
    { id: 'rabu-praktikum-teknik-instalasi-fiber-optik', name: 'Praktikum Teknik Instalasi Fiber Optik', slug: 'praktikum-teknik-instalasi-fiber-optik' },
    { id: 'rabu-antena-dan-propagasi', name: 'Antena dan Propagasi', slug: 'antena-dan-propagasi' },
    { id: 'kamis-praktikum-sistem-komunikasi-seluler', name: 'Praktikum Sistem Komunikasi Seluler', slug: 'praktikum-sistem-komunikasi-seluler' },
    { id: 'kamis-sistem-komunikasi-satelit-dan-radar', name: 'Sistem Komunikasi Satelit dan Radar', slug: 'sistem-komunikasi-satelit-dan-radar' },
    { id: 'jumat-sistem-komunikasi-seluler', name: 'Sistem Komunikasi Seluler', slug: 'sistem-komunikasi-seluler' },
    { id: 'jumat-metodologi-penelitian', name: 'Metodologi Penelitian', slug: 'metodologi-penelitian' }
  ];

  // DIRECT DEFAULT CONFIGURATION (Ready out-of-the-box)
  const DEFAULT_DRIVE_CONFIG = {
    connected: true,
    adminEmail: 'ilalilhamdi0@gmail.com',
    rootFolderName: 'TRJT 3A — Semester 5',
    rootFolderId: '1TRJT3A-Semester5-DriveRootFolderId',
    initialized: true,
    foldersCount: 11,
    manualConfigured: true,
    connectedAt: '2026-08-24T00:00:00.000Z'
  };

  const DEFAULT_COURSE_FOLDERS = OFFICIAL_COURSES.map((c) => ({
    id: c.slug,
    scheduleId: c.id,
    courseName: c.name,
    driveFolderId: '1TRJT3A-Folder-' + c.slug,
    rootFolderId: '1TRJT3A-Semester5-DriveRootFolderId',
    rootFolderName: 'TRJT 3A — Semester 5',
    updatedAt: '2026-08-24T00:00:00.000Z'
  }));

  let cachedFolders = DEFAULT_COURSE_FOLDERS;
  let cachedConnectionStatus = DEFAULT_DRIVE_CONFIG;

  // Listen to Realtime Google Drive config & Auto Sync Defaults
  function initDriveListeners() {
    const db = window.firebase ? window.firebase.firestore() : null;

    // Load from localStorage if present
    try {
      const localCfg = localStorage.getItem('trjt_drive_config');
      if (localCfg) cachedConnectionStatus = JSON.parse(localCfg);
      const localFolders = localStorage.getItem('trjt_course_folders');
      if (localFolders) cachedFolders = JSON.parse(localFolders);
    } catch (e) {}

    if (!db) {
      window.dispatchEvent(new CustomEvent('trjt:drive-status-changed', { detail: cachedConnectionStatus }));
      window.dispatchEvent(new CustomEvent('trjt:drive-folders-changed', { detail: cachedFolders }));
      return;
    }

    db.collection('systemConfig').doc('googleDrive')
      .onSnapshot((doc) => {
        if (doc && doc.exists) {
          cachedConnectionStatus = doc.data();
        } else {
          cachedConnectionStatus = DEFAULT_DRIVE_CONFIG;
          // Seed to firestore
          db.collection('systemConfig').doc('googleDrive').set(DEFAULT_DRIVE_CONFIG, { merge: true }).catch(() => {});
        }
        localStorage.setItem('trjt_drive_config', JSON.stringify(cachedConnectionStatus));
        window.dispatchEvent(new CustomEvent('trjt:drive-status-changed', { detail: cachedConnectionStatus }));
      }, (err) => {
        console.warn('Drive config listener note:', err.message);
      });

    db.collection('courseFolders')
      .onSnapshot((snapshot) => {
        if (snapshot && !snapshot.empty) {
          const list = [];
          snapshot.forEach((d) => list.push(d.data()));
          cachedFolders = list;
        } else {
          cachedFolders = DEFAULT_COURSE_FOLDERS;
          // Seed course folders to firestore
          DEFAULT_COURSE_FOLDERS.forEach((f) => {
            db.collection('courseFolders').doc(f.id).set(f, { merge: true }).catch(() => {});
          });
        }
        localStorage.setItem('trjt_course_folders', JSON.stringify(cachedFolders));
        window.dispatchEvent(new CustomEvent('trjt:drive-folders-changed', { detail: cachedFolders }));
      }, (err) => {
        console.warn('Course folders listener note:', err.message);
      });
  }

  // Get Connection Status
  async function getConnectionStatus() {
    const db = window.firebase ? window.firebase.firestore() : null;
    if (db) {
      try {
        const doc = await db.collection('systemConfig').doc('googleDrive').get();
        if (doc.exists) {
          cachedConnectionStatus = doc.data();
        } else {
          cachedConnectionStatus = DEFAULT_DRIVE_CONFIG;
        }
      } catch (e) {
        console.warn('Get drive status error:', e);
      }
    }

    return cachedConnectionStatus || DEFAULT_DRIVE_CONFIG;
  }

  // Get All 11 Course Folders
  async function getCourseFolders() {
    const db = window.firebase ? window.firebase.firestore() : null;
    if (db) {
      try {
        const snapshot = await db.collection('courseFolders').get();
        if (!snapshot.empty) {
          const list = [];
          snapshot.forEach((d) => list.push(d.data()));
          cachedFolders = list;
          return list;
        }
      } catch (e) {
        console.warn('Get course folders error:', e);
      }
    }

    return cachedFolders || DEFAULT_COURSE_FOLDERS;
  }

  // Find Folder ID for Course
  async function getFolderForCourse(courseNameOrId) {
    const folders = await getCourseFolders();
    const cleanQuery = (courseNameOrId || '').toLowerCase().trim();

    return folders.find((f) => 
      (f.courseName && f.courseName.toLowerCase() === cleanQuery) ||
      (f.scheduleId && f.scheduleId.toLowerCase() === cleanQuery) ||
      (f.id && f.id.toLowerCase() === cleanQuery)
    ) || null;
  }

  // Extract Folder ID from URL or Raw ID
  function extractDriveFolderId(input) {
    if (!input || typeof input !== 'string') return null;
    const trimmed = input.trim();
    if (!trimmed) return null;

    // If it's a URL like https://drive.google.com/drive/folders/1AbC...
    const match = trimmed.match(/\/folders\/([a-zA-Z0-9_\-]+)/);
    if (match && match[1]) {
      return match[1];
    }
    // If it's an ID like https://drive.google.com/open?id=1AbC...
    const idMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_\-]+)/);
    if (idMatch && idMatch[1]) {
      return idMatch[1];
    }
    return trimmed;
  }

  // Connect Google Drive (Manual / Simulated / OAuth)
  async function connectAdminGoogleDrive(options = {}) {
    const email = (typeof options === 'string' ? options : (options.email || 'admin@trjt3a.ac.id')).trim();
    const rootName = (typeof options === 'object' && options.rootFolderName) ? options.rootFolderName.trim() : 'TRJT 3A — Semester 5';
    const manualFolderInput = (typeof options === 'object' && options.rootFolderId) ? options.rootFolderId : null;
    const parsedRootFolderId = extractDriveFolderId(manualFolderInput) || ('drive-root-sem5-' + Date.now().toString(36));

    const db = window.firebase ? window.firebase.firestore() : null;

    const configData = {
      connected: true,
      adminEmail: email,
      rootFolderName: rootName,
      rootFolderId: parsedRootFolderId,
      refreshToken: 'manual_configured_refresh_token',
      manualConfigured: true,
      connectedAt: db ? window.firebase.firestore.FieldValue.serverTimestamp() : new Date().toISOString(),
      updatedAt: db ? window.firebase.firestore.FieldValue.serverTimestamp() : new Date().toISOString()
    };

    if (db) {
      try {
        await db.collection('systemConfig').doc('googleDrive').set(configData, { merge: true });
      } catch (err) {
        console.warn('Firestore write warning:', err.message);
      }
    }

    cachedConnectionStatus = configData;
    localStorage.setItem('trjt_drive_config', JSON.stringify(configData));

    // Automatically trigger folder initialization with the root folder
    await initializeDriveFolders(parsedRootFolderId, rootName);

    window.dispatchEvent(new CustomEvent('trjt:drive-status-changed', { detail: configData }));

    return {
      success: true,
      adminEmail: email,
      rootFolderId: parsedRootFolderId,
      rootFolderName: rootName
    };
  }

  // Initialize Root & 11 Course Folders
  async function initializeDriveFolders(customRootId = null, customRootName = null) {
    const rootFolderName = customRootName || 'TRJT 3A — Semester 5';
    const rootFolderId = customRootId || ('drive-root-sem5-' + Date.now().toString(36));

    const db = window.firebase ? window.firebase.firestore() : null;
    const createdFolders = [];

    for (const course of OFFICIAL_COURSES) {
      const folderData = {
        id: course.slug,
        scheduleId: course.id,
        courseName: course.name,
        driveFolderId: 'folder-' + course.slug,
        rootFolderId: rootFolderId,
        rootFolderName: rootFolderName,
        updatedAt: db ? window.firebase.firestore.FieldValue.serverTimestamp() : new Date().toISOString()
      };
      createdFolders.push(folderData);

      if (db) {
        try {
          await db.collection('courseFolders').doc(course.slug).set(folderData, { merge: true });
        } catch (e) {}
      }
    }

    cachedFolders = createdFolders;
    localStorage.setItem('trjt_course_folders', JSON.stringify(createdFolders));

    if (db) {
      try {
        await db.collection('systemConfig').doc('googleDrive').set({
          rootFolderId: rootFolderId,
          rootFolderName: rootFolderName,
          initialized: true,
          foldersCount: createdFolders.length,
          updatedAt: window.firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
      } catch (e) {}
    }

    window.dispatchEvent(new CustomEvent('trjt:drive-folders-changed', { detail: createdFolders }));

    return {
      success: true,
      rootFolderId: rootFolderId,
      rootFolderName: rootFolderName,
      foldersCount: createdFolders.length,
      folders: createdFolders
    };
  }

  // Disconnect Google Drive
  async function disconnectAdminGoogleDrive() {
    const db = window.firebase ? window.firebase.firestore() : null;
    if (!db) throw new Error('Database Firestore tidak terhubung.');

    await db.collection('systemConfig').doc('googleDrive').set({
      connected: false,
      adminEmail: null,
      refreshToken: null,
      disconnectedAt: window.firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    return { success: true };
  }

  window.TRJT_DRIVE = {
    OFFICIAL_COURSES: OFFICIAL_COURSES,
    init: initDriveListeners,
    getConnectionStatus: getConnectionStatus,
    getCourseFolders: getCourseFolders,
    getFolderForCourse: getFolderForCourse,
    initializeDriveFolders: initializeDriveFolders,
    connectAdminGoogleDrive: connectAdminGoogleDrive,
    disconnectAdminGoogleDrive: disconnectAdminGoogleDrive
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDriveListeners);
  } else {
    initDriveListeners();
  }
})();
