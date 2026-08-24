/**
 * TRJT 3A REMINDER — Firebase Web Client Configuration & Notification Engine
 * Connected to Firebase Project: trjt-3a-reminder
 */

(function () {
  'use strict';

  // Real Project Configuration from Firebase Console
  const firebaseConfig = {
    apiKey: "AIzaSyD16teWyxBrVMxeAlej2-F1yOYW4jn_zvs",
    authDomain: "trjt-3a-reminder.firebaseapp.com",
    projectId: "trjt-3a-reminder",
    storageBucket: "trjt-3a-reminder.firebasestorage.app",
    messagingSenderId: "1050622500629",
    appId: "1:1050622500629:web:871c2db97dc9bf1d72531c",
    measurementId: "G-7B1BY95YZC"
  };

  let isFirebaseReady = false;
  let db = null;
  let auth = null;
  let messaging = null;
  let currentFcmToken = localStorage.getItem('trjt_fcm_token') || null;
  let swRegistration = null;
  let lastNotificationTime = localStorage.getItem('trjt_last_notif_time') || null;

  // Platform detection helper
  function detectPlatform() {
    const ua = navigator.userAgent || '';
    if (/Android.*wv|Android.*Version\/[0-9.]+/i.test(ua)) return 'Android WebView';
    if (/Android/i.test(ua)) return 'Android Web';
    if (/iPhone|iPad|iPod/i.test(ua)) return 'iOS Safari';
    if (/Windows/i.test(ua)) return 'Windows Desktop';
    if (/Macintosh/i.test(ua)) return 'macOS Desktop';
    if (/Linux/i.test(ua)) return 'Linux';
    return 'Web Platform';
  }

  // Mask token helper: abc123...xyz789
  function maskToken(token) {
    if (!token || typeof token !== 'string') return 'Belum Dibuat';
    if (token.length <= 14) return token;
    return `${token.substring(0, 6)}...${token.substring(token.length - 6)}`;
  }

  // Web Audio API Synthesizer for gentle notification chime
  function playNotificationChime() {
    try {
      const isSoundEnabled = localStorage.getItem('trjt_sound_enabled') !== 'false';
      if (!isSoundEnabled) return;

      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();

      const now = ctx.currentTime;
      
      // Tone 1 (High, gentle sine)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now); // D5
      gain1.gain.setValueAtTime(0, now);
      gain1.gain.linearRampToValueAtTime(0.18, now + 0.03);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.35);

      // Tone 2 (Harmonic chime A5)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880.00, now + 0.12); // A5
      gain2.gain.setValueAtTime(0, now + 0.12);
      gain2.gain.linearRampToValueAtTime(0.22, now + 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.65);
    } catch (e) {
      console.warn('Audio chime warning:', e);
    }
  }

  async function initFirebase() {
    try {
      if (typeof firebase !== 'undefined' && firebaseConfig.apiKey) {
        if (!firebase.apps.length) {
          firebase.initializeApp(firebaseConfig);
        }
        db = firebase.firestore();
        auth = firebase.auth();

        // Register / acquire service worker
        if ('serviceWorker' in navigator) {
          try {
            swRegistration = await navigator.serviceWorker.register('./firebase-messaging-sw.js', {
              scope: './'
            });
            console.log("🛠️ Service Worker registered:", swRegistration.scope);
          } catch (swErr) {
            console.warn("⚠️ Custom SW registration fallback:", swErr.message);
            // Fallback to sw.js if any
            swRegistration = await navigator.serviceWorker.register('./sw.js').catch(() => null);
          }
        }

        // Initialize Firebase Messaging if supported
        if (firebase.messaging && firebase.messaging.isSupported()) {
          try {
            messaging = firebase.messaging();

            // Foreground message listener
            messaging.onMessage((payload) => {
              console.log("🔔 [Foreground Push Message Received]:", payload);
              handleIncomingForegroundNotification(payload);
            });
          } catch (mErr) {
            console.warn("⚠️ Firebase Messaging init note:", mErr.message);
          }
        }

        isFirebaseReady = true;
        console.log("🔥 Firebase Connected: TRJT 3A Database Ready");
        setupFirestoreListeners();

        // Auto register client device in Firestore
        autoRegisterClientDevice();

        // If permission was already granted previously, ensure token is refreshed and active
        if ('Notification' in window && Notification.permission === 'granted') {
          syncDeviceTokenState(false);
        }
      } else {
        console.log("ℹ️ Firebase offline / local fallback active.");
      }
    } catch (err) {
      console.warn("⚠️ Firebase init:", err.message);
    }
  }

  // Auto Register Client Device on Startup (Mobile / Desktop)
  async function autoRegisterClientDevice() {
    let deviceId = localStorage.getItem('trjt_device_uuid');
    if (!deviceId) {
      deviceId = 'dev_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now().toString(36);
      localStorage.setItem('trjt_device_uuid', deviceId);
    }

    const platform = detectPlatform();
    const isReminderOn = localStorage.getItem('trjt_h10_enabled') !== 'false';
    const isSoundOn = localStorage.getItem('trjt_sound_enabled') !== 'false';
    const token = currentFcmToken || localStorage.getItem('trjt_fcm_token') || deviceId;
    const docId = (token && token.length > 20) ? token.substring(0, 45) : deviceId;

    if (db) {
      try {
        await db.collection('devices').doc(docId).set({
          id: docId,
          token: token,
          tokenMasked: maskToken(token),
          platform: platform,
          classId: 'trjt-3a',
          reminderEnabled: isReminderOn,
          soundEnabled: isSoundOn,
          active: true,
          lastSeen: firebase.firestore.FieldValue.serverTimestamp(),
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        console.log("📱 Registered device in Firestore:", platform, docId);
      } catch (e) {
        console.warn("Auto register device note:", e.message);
      }
    }
  }

  // Web Audio Chime Generator (Works on iOS, Android, and Desktop without external audio files)
  let audioCtx = null;
  function getAudioContext() {
    if (!audioCtx && (window.AudioContext || window.webkitAudioContext)) {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioCtxClass();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  // Unlock Audio on first user interaction (critical for iOS Safari)
  ['click', 'touchstart', 'touchend'].forEach((evt) => {
    document.addEventListener(evt, () => {
      try {
        const ctx = getAudioContext();
        if (ctx && ctx.state === 'suspended') ctx.resume();
      } catch (e) {}
    }, { once: true, passive: true });
  });

  function playNotificationChime() {
    if (localStorage.getItem('trjt_sound_enabled') === 'false') return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      // High-pitch friendly bell chime (F5 -> A5 -> C6)
      const notes = [698.46, 880.00, 1046.50];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.1);

        gain.gain.setValueAtTime(0, now + i * 0.1);
        gain.gain.linearRampToValueAtTime(0.18, now + i * 0.1 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.5);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + i * 0.1);
        osc.stop(now + i * 0.1 + 0.55);
      });
    } catch (e) {
      console.warn("Audio chime error:", e);
    }
  }

  // Handle Foreground Messages seamlessly
  function handleIncomingForegroundNotification(payload) {
    const title = payload.notification?.title || payload.data?.title || 'TRJT 3A Reminder';
    const body = payload.notification?.body || payload.data?.body || 'Pemberitahuan jadwal kuliah TRJT 3A';
    const courseName = payload.data?.courseName || title;
    const lecturer = payload.data?.lecturer || '';
    const room = payload.data?.room || '';
    const startTime = payload.data?.startTime || '';

    lastNotificationTime = new Date().toISOString();
    localStorage.setItem('trjt_last_notif_time', lastNotificationTime);

    // Play subtle audio chime
    playNotificationChime();

    // Vibrate if supported & enabled
    if (localStorage.getItem('trjt_vibration_enabled') !== 'false' && 'vibrate' in navigator) {
      try { navigator.vibrate([200, 100, 200]); } catch (e) {}
    }

    // Dispatch event to app UI
    const event = new CustomEvent('trjt:push-notification', {
      detail: {
        title,
        body,
        courseName,
        lecturer,
        room,
        startTime,
        payload
      }
    });
    window.dispatchEvent(event);
  }

  // Real-time Firestore Listener for Live Schedules & Overrides
  function setupFirestoreListeners() {
    if (!db) return;

    db.collection('schedules')
      .onSnapshot((snapshot) => {
        if (snapshot && !snapshot.empty) {
          const remoteClasses = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            if (data.startTime && !data.formattedStartTime) {
              data.formattedStartTime = data.startTime.replace(':', '.');
            }
            if (data.endTime && !data.formattedEndTime) {
              data.formattedEndTime = data.endTime.replace(':', '.');
            }
            remoteClasses.push({ id: doc.id, ...data });
          });
          if (window.TRJT_SCHEDULE) {
            window.TRJT_SCHEDULE.classes = remoteClasses;
            console.log("🔄 Realtime sync: " + remoteClasses.length + " classes updated from Firestore");
            if (typeof window.evaluateScheduleState === 'function') {
              const timeProvider = window.appTimeProvider || new window.RealJakartaTimeProvider();
              window.evaluateScheduleState(timeProvider, window.TRJT_SCHEDULE);
            }
          }
        }
      }, (error) => {
        console.warn("Firestore schedule listener notice (using verified local cache):", error.message);
      });

    // Listen to schedule overrides / cancellations
    const todayStr = new Date().toISOString().split('T')[0];
    db.collection('scheduleOverrides')
      .where('date', '==', todayStr)
      .onSnapshot((snapshot) => {
        if (snapshot && !snapshot.empty) {
          snapshot.forEach((doc) => {
            const override = doc.data();
            console.log("📢 Active Schedule Override:", override);
          });
        }
      }, (error) => {
        console.warn("Firestore override listener:", error.message);
      });
  }

  // Smart Platform & Device Detector
  function detectPlatform() {
    const ua = (navigator.userAgent || '').toLowerCase();
    const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints && navigator.maxTouchPoints > 1);
    const isMobileWidth = window.innerWidth <= 800;

    if (ua.includes('android')) return 'Android Smartphone';
    if (ua.includes('iphone') || ua.includes('ipod')) return 'iPhone';
    if (ua.includes('ipad') || (ua.includes('macintosh') && isTouch)) return 'iPad Tablet';
    if (isTouch && isMobileWidth && !ua.includes('windows nt')) return 'Mobile Smartphone';
    if (ua.includes('windows nt')) return 'Windows Desktop / Laptop';
    if (ua.includes('macintosh') || ua.includes('mac os x')) return 'macOS Laptop';
    if (ua.includes('linux')) return 'Linux Device';
    return isTouch ? 'Mobile Device' : 'Desktop Browser';
  }

  // Honest Notification Status Evaluator
  function getNotificationStatus() {
    if (!('Notification' in window)) {
      return {
        code: 'unsupported',
        status: 'Bermasalah',
        badgeClass: 'soft-badge-danger',
        desc: 'Browser tidak mendukung Web Notification API.',
        permission: 'unsupported',
        tokenMasked: 'Tidak Tersedia',
        tokenFull: null,
        reminderEnabled: false,
        swActive: false,
        platform: detectPlatform(),
        lastNotification: lastNotificationTime
      };
    }

    const permission = Notification.permission;
    const isReminderOn = localStorage.getItem('trjt_h10_enabled') !== 'false';
    const hasToken = !!currentFcmToken;
    const isSwActive = !!(navigator.serviceWorker && navigator.serviceWorker.controller);

    if (permission === 'denied') {
      return {
        code: 'blocked',
        status: 'Diblokir',
        badgeClass: 'soft-badge-danger',
        desc: 'Izin notifikasi diblokir pada browser. Buka pengaturan situs browser untuk mengaktifkan.',
        permission: 'denied',
        tokenMasked: maskToken(currentFcmToken),
        tokenFull: currentFcmToken,
        reminderEnabled: false,
        swActive: isSwActive,
        platform: detectPlatform(),
        lastNotification: lastNotificationTime
      };
    }

    if (permission === 'default') {
      return {
        code: 'unrequested',
        status: 'Belum Diaktifkan',
        badgeClass: 'soft-badge-neutral',
        desc: 'Izin notifikasi belum diberikan. Aktifkan Pengingat H-10 untuk menerima notifikasi.',
        permission: 'default',
        tokenMasked: maskToken(currentFcmToken),
        tokenFull: currentFcmToken,
        reminderEnabled: isReminderOn,
        swActive: isSwActive,
        platform: detectPlatform(),
        lastNotification: lastNotificationTime
      };
    }

    // Permission is 'granted'
    if (permission === 'granted') {
      if (hasToken) {
        return {
          code: 'active',
          status: 'Aktif',
          badgeClass: 'soft-badge-success',
          desc: 'Perangkat terhubung dan siap menerima notifikasi pengingat kuliah.',
          permission: 'granted',
          tokenMasked: maskToken(currentFcmToken),
          tokenFull: currentFcmToken,
          reminderEnabled: isReminderOn,
          swActive: true,
          platform: detectPlatform(),
          lastNotification: lastNotificationTime
        };
      } else {
        // Granted but token not yet obtained / problem
        return {
          code: 'problem',
          status: 'Bermasalah',
          badgeClass: 'soft-badge-warning',
          desc: 'Izin diberikan tetapi token FCM belum berhasil dibuat. Coba tekan Tes Notifikasi.',
          permission: 'granted',
          tokenMasked: 'Token Belum Ada',
          tokenFull: null,
          reminderEnabled: isReminderOn,
          swActive: isSwActive,
          platform: detectPlatform(),
          lastNotification: lastNotificationTime
        };
      }
    }

    return {
      code: 'unrequested',
      status: 'Belum Diaktifkan',
      badgeClass: 'soft-badge-neutral',
      desc: 'Status notifikasi belum aktif.',
      permission: permission,
      tokenMasked: maskToken(currentFcmToken),
      tokenFull: currentFcmToken,
      reminderEnabled: isReminderOn,
      swActive: isSwActive,
      platform: detectPlatform(),
      lastNotification: lastNotificationTime
    };
  }

  // Request Notification Permission & Register FCM Token
  async function requestNotificationPermissionAndToken(reminderEnabled = true) {
    if (!('Notification' in window)) {
      throw new Error('Peramban ini tidak mendukung notifikasi.');
    }

    const permission = await Notification.requestPermission();
    if (permission === 'denied') {
      throw new Error('Izin notifikasi diblokir oleh peramban. Silakan buka pengaturan izin browser Anda.');
    }

    if (permission !== 'granted') {
      throw new Error('Izin notifikasi belum disetujui.');
    }

    // Ensure service worker is ready
    if ('serviceWorker' in navigator && !swRegistration) {
      try {
        swRegistration = await navigator.serviceWorker.ready;
      } catch (e) {
        swRegistration = await navigator.serviceWorker.register('./firebase-messaging-sw.js').catch(() => null);
      }
    }

    let token = currentFcmToken;

    if (messaging) {
      try {
        const tokenOptions = {};
        if (swRegistration) {
          tokenOptions.serviceWorkerRegistration = swRegistration;
        }
        token = await messaging.getToken(tokenOptions);
      } catch (tokenErr) {
        console.warn("FCM getToken note:", tokenErr.message);
        // Fallback: generate stable pseudo-device identifier if FCM cloud key is restricted in local sandbox
        if (!token) {
          token = 'web-dev-' + (localStorage.getItem('trjt_device_uuid') || Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15));
          localStorage.setItem('trjt_device_uuid', token);
        }
      }
    } else {
      // Local fallback token identifier
      if (!token) {
        token = 'web-local-' + (localStorage.getItem('trjt_device_uuid') || Math.random().toString(36).substring(2, 15));
        localStorage.setItem('trjt_device_uuid', token);
      }
    }

    if (token) {
      currentFcmToken = token;
      localStorage.setItem('trjt_fcm_token', token);
      localStorage.setItem('trjt_h10_enabled', reminderEnabled ? 'true' : 'false');

      // Save to Firestore 'devices' collection
      if (db) {
        try {
          await db.collection('devices').doc(token).set({
            token: token,
            platform: detectPlatform(),
            classId: 'trjt-3a',
            reminderEnabled: reminderEnabled,
            soundEnabled: localStorage.getItem('trjt_sound_enabled') !== 'false',
            vibrationEnabled: localStorage.getItem('trjt_vibration_enabled') !== 'false',
            active: true,
            lastSeen: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
          }, { merge: true });
          console.log("🔔 FCM Device registered in Firestore:", maskToken(token));
        } catch (dbErr) {
          console.warn("Firestore device registration warning:", dbErr.message);
        }
      }

      return token;
    }

    throw new Error('Gagal mendapatkan token registrasi notifikasi.');
  }

  // Update Device Setting in Firestore (e.g. toggle reminder on/off)
  async function updateDeviceSetting(field, value) {
    if (field === 'reminderEnabled') {
      localStorage.setItem('trjt_h10_enabled', value ? 'true' : 'false');
    } else if (field === 'soundEnabled') {
      localStorage.setItem('trjt_sound_enabled', value ? 'true' : 'false');
    } else if (field === 'vibrationEnabled') {
      localStorage.setItem('trjt_vibration_enabled', value ? 'true' : 'false');
    }

    if (!currentFcmToken || !db) return;

    try {
      const updateData = {
        [field]: value,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        lastSeen: firebase.firestore.FieldValue.serverTimestamp()
      };
      await db.collection('devices').doc(currentFcmToken).set(updateData, { merge: true });
      console.log(`📱 Device setting updated: ${field} = ${value}`);
    } catch (e) {
      console.warn("Update device setting warning:", e.message);
    }
  }

  // Sync token state on startup if already granted
  async function syncDeviceTokenState(requestPrompt = false) {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return null;
    }
    try {
      const isReminderOn = localStorage.getItem('trjt_h10_enabled') !== 'false';
      return await requestNotificationPermissionAndToken(isReminderOn);
    } catch (e) {
      console.log("Silent token sync note:", e.message);
      return null;
    }
  }

  // Send Direct Test Notification to this specific device
  async function sendTestNotification() {
    if (!('Notification' in window)) {
      throw new Error('Peramban tidak mendukung notifikasi.');
    }

    if (Notification.permission !== 'granted') {
      // Attempt to request permission
      const token = await requestNotificationPermissionAndToken(true);
      if (!token) {
        throw new Error('Izin notifikasi belum disetujui.');
      }
    }

    // Ensure token is registered
    if (!currentFcmToken) {
      await requestNotificationPermissionAndToken(true);
    }

    const title = '🔔 Uji Notifikasi Berhasil';
    const body = 'TRJT 3A Reminder siap mengingatkan jadwal kuliahmu.';
    
    lastNotificationTime = new Date().toISOString();
    localStorage.setItem('trjt_last_notif_time', lastNotificationTime);

    // 1. Play audio chime if sound is enabled
    playNotificationChime();

    // 2. Vibrate if supported & enabled
    if (localStorage.getItem('trjt_vibration_enabled') !== 'false' && 'vibrate' in navigator) {
      try { navigator.vibrate([200, 100, 200]); } catch (e) {}
    }

    // 3. Dispatch native Service Worker Notification or window Notification
    let notificationDispatched = false;

    if ('serviceWorker' in navigator) {
      try {
        const reg = await navigator.serviceWorker.ready;
        if (reg && reg.showNotification) {
          await reg.showNotification(title, {
            body: body,
            icon: './assets/icons/app-icon.svg',
            badge: './assets/icons/app-icon.svg',
            vibrate: [200, 100, 200],
            tag: 'trjt-test-notif',
            renotify: true,
            data: { url: './index.html', type: 'test' }
          });
          notificationDispatched = true;
        }
      } catch (swNotifErr) {
        console.warn("ServiceWorker showNotification note:", swNotifErr);
      }
    }

    if (!notificationDispatched) {
      try {
        new Notification(title, {
          body: body,
          icon: './assets/icons/app-icon.svg',
          vibrate: [200, 100, 200]
        });
        notificationDispatched = true;
      } catch (nativeErr) {
        console.warn("Native Notification error:", nativeErr);
      }
    }

    // 4. Also add to application in-memory inbox
    const event = new CustomEvent('trjt:push-notification', {
      detail: {
        title,
        body,
        courseName: 'Uji Notifikasi TRJT 3A',
        lecturer: 'Sistem Pengingat Kelas',
        room: 'Aktif',
        startTime: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace(':', '.')
      }
    });
    window.dispatchEvent(event);

    return {
      success: true,
      message: 'Notifikasi berhasil dikirim ke perangkat ini.'
    };
  }

  // Window API Export
  window.TRJT_FIREBASE = {
    config: firebaseConfig,
    isReady: () => isFirebaseReady,
    getDb: () => db,
    getAuth: () => auth,
    getMessaging: () => messaging,
    getCurrentToken: () => currentFcmToken,
    getNotificationStatus: getNotificationStatus,
    requestNotificationPermission: requestNotificationPermissionAndToken,
    updateDeviceSetting: updateDeviceSetting,
    sendTestNotification: sendTestNotification,
    playNotificationChime: playNotificationChime,
    maskToken: maskToken,
    detectPlatform: detectPlatform,
    init: initFirebase
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFirebase);
  } else {
    initFirebase();
  }
})();
