/**
 * TRJT 3A Reminder — Firebase Cloud Functions
 * Server-Side H-10 Cron Scheduler Engine & Google Drive API Integration
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

const db = admin.firestore();

// Official 11 Courses List for TRJT 3A — Semester 5
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

// OAuth configuration helper from environment / config
function getGoogleOAuthConfig() {
  return {
    clientId: process.env.GOOGLE_CLIENT_ID || (functions.config().google ? functions.config().google.client_id : ''),
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || (functions.config().google ? functions.config().google.client_secret : ''),
    redirectUri: process.env.GOOGLE_REDIRECT_URI || (functions.config().google ? functions.config().google.redirect_uri : '')
  };
}

// -----------------------------------------------------------------------------
// 1. Google OAuth & Drive Helpers
// -----------------------------------------------------------------------------
async function getFreshDriveAccessToken(refreshToken) {
  if (!refreshToken) {
    throw new Error('Refresh token Google Drive tidak ditemukan.');
  }

  const oauthConfig = getGoogleOAuthConfig();
  if (!oauthConfig.clientId || !oauthConfig.clientSecret) {
    throw new Error('Google OAuth credentials (Client ID / Secret) belum dikonfigurasi di environment backend.');
  }

  const tokenResp = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: oauthConfig.clientId,
      client_secret: oauthConfig.clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    })
  });

  const tokenData = await tokenResp.json();
  if (!tokenResp.ok || !tokenData.access_token) {
    throw new Error('Gagal memperbarui access token Google Drive: ' + (tokenData.error_description || tokenData.error || 'Unknown error'));
  }

  return tokenData.access_token;
}

// Helper to create or find Google Drive folder
async function findOrCreateDriveFolder(accessToken, folderName, parentId = null) {
  let query = `name = '${folderName.replace(/'/g, "\\'")}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
  if (parentId) {
    query += ` and '${parentId}' in parents`;
  } else {
    query += ` and 'root' in parents`;
  }

  const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,webViewLink)&spaces=drive`;
  const searchResp = await fetch(searchUrl, {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });

  const searchData = await searchResp.json();
  if (searchData.files && searchData.files.length > 0) {
    return searchData.files[0];
  }

  // Folder doesn't exist, create it
  const createBody = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder'
  };
  if (parentId) {
    createBody.parents = [parentId];
  }

  const createResp = await fetch('https://www.googleapis.com/drive/v3/files?fields=id,name,webViewLink', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(createBody)
  });

  const createdData = await createResp.json();
  if (!createResp.ok || !createdData.id) {
    throw new Error(`Gagal membuat folder Drive '${folderName}': ` + (createdData.error?.message || 'Unknown error'));
  }

  return createdData;
}

// Core folder initialization engine
async function coreInitializeDriveFolders(accessToken) {
  // 1. Root Folder: 'TRJT 3A — Semester 5'
  const rootFolderName = 'TRJT 3A — Semester 5';
  const rootFolder = await findOrCreateDriveFolder(accessToken, rootFolderName);
  const rootFolderId = rootFolder.id;

  const results = [];

  // 2. Create/Verify 11 Course Subfolders
  for (const course of OFFICIAL_COURSES) {
    const subfolder = await findOrCreateDriveFolder(accessToken, course.name, rootFolderId);
    
    // Save mapping in Firestore
    const folderDocRef = db.collection('courseFolders').doc(course.slug);
    await folderDocRef.set({
      id: course.slug,
      scheduleId: course.id,
      courseName: course.name,
      driveFolderId: subfolder.id,
      rootFolderId: rootFolderId,
      webViewLink: subfolder.webViewLink || `https://drive.google.com/drive/folders/${subfolder.id}`,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    results.push({
      courseName: course.name,
      slug: course.slug,
      driveFolderId: subfolder.id
    });
  }

  // 3. Update root config status
  await db.collection('systemConfig').doc('googleDrive').set({
    rootFolderId: rootFolderId,
    rootFolderName: rootFolderName,
    initialized: true,
    foldersCount: results.length,
    lastFolderSync: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });

  return {
    rootFolderId,
    rootFolderName,
    foldersCount: results.length,
    folders: results
  };
}

// -----------------------------------------------------------------------------
// 2. Callable Endpoints for Google Drive Admin
// -----------------------------------------------------------------------------

// Generate OAuth Authorization URL
exports.getGoogleDriveAuthUrl = functions.https.onCall(async (data, context) => {
  const oauthConfig = getGoogleOAuthConfig();
  if (!oauthConfig.clientId) {
    throw new functions.https.HttpsError('failed-precondition', 'GOOGLE_CLIENT_ID belum diatur.');
  }

  const redirectUri = data.redirectUri || oauthConfig.redirectUri;
  const scopes = [
    'https://www.googleapis.com/auth/drive.file',
    'email',
    'profile'
  ].join(' ');

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` + new URLSearchParams({
    client_id: oauthConfig.clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: scopes,
    access_type: 'offline',
    prompt: 'consent'
  }).toString();

  return { authUrl };
});

// Exchange Authorization Code & Auto-Initialize Folders
exports.exchangeGoogleDriveCode = functions.https.onCall(async (data, context) => {
  const code = data.code;
  const redirectUri = data.redirectUri;

  if (!code) {
    throw new functions.https.HttpsError('invalid-argument', 'Authorization code diperlukan.');
  }

  const oauthConfig = getGoogleOAuthConfig();
  const tokenResp = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: oauthConfig.clientId,
      client_secret: oauthConfig.clientSecret,
      code: code,
      redirect_uri: redirectUri || oauthConfig.redirectUri,
      grant_type: 'authorization_code'
    })
  });

  const tokenData = await tokenResp.json();
  if (!tokenResp.ok || !tokenData.access_token) {
    throw new functions.https.HttpsError('internal', 'Gagal menukar authorization code: ' + (tokenData.error_description || tokenData.error));
  }

  // Fetch admin user info
  let adminEmail = 'Admin Google Drive';
  try {
    const userResp = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { 'Authorization': `Bearer ${tokenData.access_token}` }
    });
    if (userResp.ok) {
      const userData = await userResp.json();
      adminEmail = userData.email || adminEmail;
    }
  } catch (e) {
    console.warn('UserInfo fetch error:', e);
  }

  // Save refresh token securely in Firestore
  const updateData = {
    connected: true,
    adminEmail: adminEmail,
    connectedAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };
  if (tokenData.refresh_token) {
    updateData.refreshToken = tokenData.refresh_token;
  }

  await db.collection('systemConfig').doc('googleDrive').set(updateData, { merge: true });

  // Automatically initialize root & 11 course folders
  let folderResults = null;
  try {
    folderResults = await coreInitializeDriveFolders(tokenData.access_token);
  } catch (initErr) {
    console.warn('Auto folder init warning:', initErr);
  }

  return {
    success: true,
    adminEmail: adminEmail,
    folderResults
  };
});

// Manual / Re-trigger Folder Initialization
exports.initializeDriveFolders = functions.https.onCall(async (data, context) => {
  const configDoc = await db.collection('systemConfig').doc('googleDrive').get();
  if (!configDoc.exists || !configDoc.data().refreshToken) {
    throw new functions.https.HttpsError('failed-precondition', 'Google Drive belum terhubung dengan akun admin.');
  }

  const refreshToken = configDoc.data().refreshToken;
  const accessToken = await getFreshDriveAccessToken(refreshToken);
  const results = await coreInitializeDriveFolders(accessToken);

  return {
    success: true,
    ...results
  };
});

// Get Connection & Folder Status
exports.getDriveConnectionStatus = functions.https.onCall(async (data, context) => {
  const configDoc = await db.collection('systemConfig').doc('googleDrive').get();
  if (!configDoc.exists) {
    return {
      connected: false,
      adminEmail: null,
      rootFolderId: null,
      initialized: false,
      foldersCount: 0
    };
  }

  const driveData = configDoc.data();
  const foldersSnap = await db.collection('courseFolders').get();
  const folders = [];
  foldersSnap.forEach(d => folders.push(d.data()));

  return {
    connected: !!driveData.connected && !!driveData.refreshToken,
    adminEmail: driveData.adminEmail || null,
    rootFolderId: driveData.rootFolderId || null,
    initialized: !!driveData.initialized,
    foldersCount: folders.length,
    folders: folders
  };
});

// Disconnect Google Drive
exports.disconnectGoogleDrive = functions.https.onCall(async (data, context) => {
  await db.collection('systemConfig').doc('googleDrive').set({
    connected: false,
    refreshToken: null,
    adminEmail: null,
    disconnectedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });

  return { success: true };
});

// -----------------------------------------------------------------------------
// 3. Cron Job: H-10 Class Reminder Scheduler (from Phase 1)
// -----------------------------------------------------------------------------
exports.checkH10ClassReminder = functions.pubsub
  .schedule('* * * * *')
  .timeZone('Asia/Jakarta')
  .onRun(async (context) => {
    const now = new Date();
    const jakartaFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Jakarta',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    const parts = jakartaFormatter.formatToParts(now);
    const partMap = {};
    parts.forEach(p => { partMap[p.type] = p.value; });

    const currentYear = partMap.year;
    const currentMonth = partMap.month;
    const currentDay = partMap.day;
    const currentHour = parseInt(partMap.hour, 10);
    const currentMinute = parseInt(partMap.minute, 10);
    const currentTotalMinutes = currentHour * 60 + currentMinute;
    const todayDateStr = `${currentYear}-${currentMonth}-${currentDay}`;
    const localDayIndex = new Date(`${todayDateStr}T12:00:00+07:00`).getDay();

    if (localDayIndex < 1 || localDayIndex > 5) {
      return null;
    }

    try {
      const scheduleSnapshot = await db.collection('schedules')
        .where('classId', '==', 'trjt-3a')
        .where('dayOfWeek', '==', localDayIndex)
        .where('active', '==', true)
        .get();

      if (scheduleSnapshot.empty) return null;

      for (const doc of scheduleSnapshot.docs) {
        const schedule = doc.data();
        const [startH, startM] = schedule.startTime.split(':').map(Number);
        const classStartMinutes = startH * 60 + startM;
        const minutesUntilClass = classStartMinutes - currentTotalMinutes;

        if (minutesUntilClass === 10 || minutesUntilClass === 9) {
          const deduplicationKey = `${doc.id}_${todayDateStr}_reminder10`;
          const logRef = db.collection('notificationLogs').doc(deduplicationKey);
          const logDoc = await logRef.get();

          if (logDoc.exists) continue;

          const overrideDoc = await db.collection('scheduleOverrides')
            .where('scheduleId', '==', doc.id)
            .where('date', '==', todayDateStr)
            .get();

          let roomCode = schedule.roomCode;
          if (!overrideDoc.empty) {
            const overrideData = overrideDoc.docs[0].data();
            if (overrideData.cancelled) continue;
            if (overrideData.newRoomCode) roomCode = overrideData.newRoomCode;
          }

          const lecturer = schedule.lecturerName || 'Dosen Pengampu';
          const notificationTitle = '🔔 Kelas 10 Menit Lagi';
          const notificationBody = `${schedule.courseName} · ${schedule.startTime.replace(':', '.')} · ${roomCode}`;

          const devicesSnapshot = await db.collection('devices')
            .where('classId', '==', 'trjt-3a')
            .where('active', '==', true)
            .where('reminderEnabled', '==', true)
            .get();

          const targetTokens = [];
          devicesSnapshot.forEach((deviceDoc) => {
            const data = deviceDoc.data();
            if (data.token && !data.token.startsWith('web-local-') && !data.token.startsWith('web-dev-')) {
              targetTokens.push(data.token);
            }
          });

          if (targetTokens.length > 0) {
            await admin.messaging().sendEachForMulticast({
              notification: { title: notificationTitle, body: notificationBody },
              data: {
                type: 'REMINDER_H10',
                scheduleId: doc.id,
                courseName: schedule.courseName,
                lecturer: lecturer,
                room: roomCode,
                startTime: schedule.startTime
              },
              tokens: targetTokens
            });
          }

          await logRef.set({
            scheduleId: doc.id,
            courseName: schedule.courseName,
            sentAt: admin.firestore.FieldValue.serverTimestamp(),
            targetDate: todayDateStr,
            recipientCount: targetTokens.length,
            success: true
          });
        }
      }
    } catch (error) {
      console.error('[H-10 Scheduler Error]:', error);
    }

    return null;
  });

// -----------------------------------------------------------------------------
// 4. Test Notification Endpoint
// -----------------------------------------------------------------------------
exports.sendTestNotificationToDevice = functions.https.onCall(async (data, context) => {
  const token = data.token;
  if (!token) {
    throw new functions.https.HttpsError('invalid-argument', 'Device token is required.');
  }

  const payload = {
    notification: {
      title: '🔔 Uji Notifikasi Berhasil',
      body: 'TRJT 3A Reminder siap mengingatkan jadwal kuliahmu.'
    },
    data: {
      type: 'TEST_NOTIFICATION',
      time: new Date().toISOString()
    },
    token: token
  };

  try {
    const response = await admin.messaging().send(payload);
    return { success: true, messageId: response };
  } catch (error) {
    throw new functions.https.HttpsError('internal', error.message);
  }
});
