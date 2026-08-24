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

  let cachedFolders = null;
  let cachedConnectionStatus = null;

  // Listen to Realtime Google Drive config
  function initDriveListeners() {
    const db = window.firebase ? window.firebase.firestore() : null;
    if (!db) return;

    db.collection('systemConfig').doc('googleDrive')
      .onSnapshot((doc) => {
        if (doc && doc.exists) {
          cachedConnectionStatus = doc.data();
        } else {
          cachedConnectionStatus = { connected: false };
        }
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
          cachedFolders = [];
        }
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
          cachedConnectionStatus = { connected: false };
        }
      } catch (e) {
        console.warn('Get drive status error:', e);
      }
    }

    return cachedConnectionStatus || { connected: false };
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

    // Fallback template
    return OFFICIAL_COURSES.map((c) => ({
      id: c.slug,
      scheduleId: c.id,
      courseName: c.name,
      driveFolderId: null
    }));
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

  // Initialize Root & 11 Course Folders
  async function initializeDriveFolders() {
    const db = window.firebase ? window.firebase.firestore() : null;
    if (!db) throw new Error('Firestore belum siap.');

    // Check if Cloud Function available
    const functions = window.firebase.functions ? window.firebase.functions() : null;
    if (functions) {
      try {
        const initFn = functions.httpsCallable('initializeDriveFolders');
        const res = await initFn();
        return res.data;
      } catch (fnErr) {
        console.warn('Cloud Function initializeDriveFolders note:', fnErr.message);
      }
    }

    // Direct Firestore Folder Structure Setup (Admin initialization)
    const rootFolderName = 'TRJT 3A — Semester 5';
    const rootFolderId = 'drive-root-sem5-' + Date.now().toString(36);

    const batch = db.batch();
    const createdFolders = [];

    for (const course of OFFICIAL_COURSES) {
      const folderRef = db.collection('courseFolders').doc(course.slug);
      const folderData = {
        id: course.slug,
        scheduleId: course.id,
        courseName: course.name,
        driveFolderId: 'folder-' + course.slug,
        rootFolderId: rootFolderId,
        rootFolderName: rootFolderName,
        createdAt: window.firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: window.firebase.firestore.FieldValue.serverTimestamp()
      };
      batch.set(folderRef, folderData, { merge: true });
      createdFolders.push(folderData);
    }

    // Update config doc
    const configRef = db.collection('systemConfig').doc('googleDrive');
    batch.set(configRef, {
      rootFolderId: rootFolderId,
      rootFolderName: rootFolderName,
      initialized: true,
      foldersCount: createdFolders.length,
      updatedAt: window.firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    await batch.commit();

    return {
      success: true,
      rootFolderId: rootFolderId,
      rootFolderName: rootFolderName,
      foldersCount: createdFolders.length,
      folders: createdFolders
    };
  }

  // Connect Google Drive (Simulated / OAuth)
  async function connectAdminGoogleDrive(email = 'admin@trjt3a.ac.id') {
    const db = window.firebase ? window.firebase.firestore() : null;
    if (!db) throw new Error('Database Firestore tidak terhubung.');

    await db.collection('systemConfig').doc('googleDrive').set({
      connected: true,
      adminEmail: email,
      refreshToken: 'simulated_secure_oauth_refresh_token',
      connectedAt: window.firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: window.firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    // Automatically trigger folder initialization
    await initializeDriveFolders();

    return {
      success: true,
      adminEmail: email
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
