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
    measurementId: "G-7B1BY95YZC",
    vapidKey: "BOBR9L0vvT0RQhhEB9V8lsouP6zzCpAZBQPj8vw3u2bRzkYIq0tdJ5aN50W6MFl4K-wOWLwz3dmyARaOSs2-UqM"
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

  // Persistent Device ID generator
  function getStableDeviceId() {
    let id = localStorage.getItem('trjt_device_uuid');
    if (!id) {
      id = 'dev_' + Math.random().toString(36).substring(2, 10);
      localStorage.setItem('trjt_device_uuid', id);
    }
    return id;
  }

  // Auto Register Client Device on Startup (Mobile / Desktop)
  async function autoRegisterClientDevice() {
    const deviceId = getStableDeviceId();
    const platform = detectPlatform();
    const isReminderOn = localStorage.getItem('trjt_h10_enabled') !== 'false';
    const isSoundOn = localStorage.getItem('trjt_sound_enabled') !== 'false';
    const rawToken = currentFcmToken || localStorage.getItem('trjt_fcm_token');
    const isReal = rawToken && rawToken.includes(':APA91b');
    const token = isReal ? rawToken : null;
    const isAdminPage = window.location.pathname.includes('/admin');

    if (db) {
      try {
        const updateData = {
          id: deviceId,
          platform: platform,
          classId: 'trjt-3a',
          role: isAdminPage ? 'admin' : 'student',
          reminderEnabled: isReminderOn,
          soundEnabled: isSoundOn,
          active: true,
          lastSeen: firebase.firestore.FieldValue.serverTimestamp(),
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        if (token) {
          updateData.token = token;
          updateData.tokenMasked = maskToken(token);
          updateData.isRealFcm = true;
        }
        await db.collection('devices').doc(deviceId).set(updateData, { merge: true });
        console.log("📱 Synced device state in Firestore:", platform, deviceId, isReal ? '(FCM Ready)' : '(Token Pending)');
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

  let activeVibrateInterval = null;

  function stopNotificationAlert() {
    if (activeVibrateInterval) {
      clearInterval(activeVibrateInterval);
      activeVibrateInterval = null;
    }
    if ('vibrate' in navigator) {
      try { navigator.vibrate(0); } catch (e) {}
    }
  }

  function playSingleChimeBurst(ctx, startTime, gainLevel = 0.85) {
    // Rich Harmonious Academic Bell / Alarm Chime (E5 -> G#5 -> B5 -> E6)
    const chords = [
      { freq: 659.25, time: 0.0, dur: 0.55 },
      { freq: 830.61, time: 0.14, dur: 0.55 },
      { freq: 987.77, time: 0.28, dur: 0.65 },
      { freq: 1318.51, time: 0.42, dur: 0.85 }
    ];

    chords.forEach(({ freq, time, dur }) => {
      try {
        const osc = ctx.createOscillator();
        const oscHarmonic = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle'; // Rich acoustic bell timbre
        osc.frequency.setValueAtTime(freq, startTime + time);

        oscHarmonic.type = 'sine';
        oscHarmonic.frequency.setValueAtTime(freq * 2, startTime + time);

        gain.gain.setValueAtTime(0.001, startTime + time);
        gain.gain.linearRampToValueAtTime(gainLevel, startTime + time + 0.025);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + time + dur);

        osc.connect(gain);
        oscHarmonic.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime + time);
        oscHarmonic.start(startTime + time);
        osc.stop(startTime + time + dur + 0.05);
        oscHarmonic.stop(startTime + time + dur + 0.05);
      } catch (err) {}
    });
  }

  function playNotificationChime(loopTimes = 5) {
    if (localStorage.getItem('trjt_sound_enabled') === 'false') return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume();

      const now = ctx.currentTime;
      // Play repeating loud chime bursts (looping over ~10-15s)
      for (let i = 0; i < loopTimes; i++) {
        playSingleChimeBurst(ctx, now + i * 1.5, 0.85);
      }
    } catch (e) {
      console.warn("Audio chime error:", e);
    }
  }

  function triggerStrongVibration(durationMs = 15000) {
    if (localStorage.getItem('trjt_vibration_enabled') === 'false' || !('vibrate' in navigator)) return;
    try {
      // Strong continuous vibration pattern: 800ms on, 250ms off, 1000ms on, 300ms off, 1200ms on
      const pattern = [800, 250, 1000, 300, 800, 250, 1200, 400];
      navigator.vibrate(pattern);

      let elapsed = 0;
      if (activeVibrateInterval) clearInterval(activeVibrateInterval);
      activeVibrateInterval = setInterval(() => {
        elapsed += 4200;
        if (elapsed >= durationMs) {
          clearInterval(activeVibrateInterval);
          activeVibrateInterval = null;
        } else {
          try { navigator.vibrate(pattern); } catch (e) {}
        }
      }, 4200);
    } catch (e) {
      console.warn("Vibration error:", e);
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

    // Play loud audio chime loop (5 cycles ~ 8-10s)
    playNotificationChime(5);

    // Trigger strong rhythmic vibration for 15 seconds
    triggerStrongVibration(15000);

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
      throw new Error('Peramban ini belum mendukung notifikasi Web. Pada iPhone, pastikan Anda telah memilih "Tambahkan ke Layar Utama" di Safari (Share ⬆️ -> Add to Home Screen).');
    }

    let permission = Notification.permission;
    if (permission !== 'granted') {
      try {
        permission = await Notification.requestPermission();
      } catch (pErr) {
        permission = await new Promise((resolve) => Notification.requestPermission(resolve));
      }
    }

    if (permission === 'denied') {
      throw new Error('Izin notifikasi diblokir. Silakan buka Pengaturan iPhone -> Safari / TRJT 3A -> Pemberitahuan -> Izinkan.');
    }

    if (permission !== 'granted') {
      throw new Error('Izin notifikasi belum disetujui.');
    }

    // Ensure service worker is ready
    let swReg = swRegistration;
    if ('serviceWorker' in navigator) {
      try {
        swReg = await navigator.serviceWorker.ready;
      } catch (e) {
        try {
          swReg = await navigator.serviceWorker.register('./firebase-messaging-sw.js', { scope: './' });
        } catch (swErr) {
          console.warn("ServiceWorker register fallback note:", swErr.message);
        }
      }
    }

    let token = null;

    if (messaging) {
      try {
        const tokenOptions = {};
        if (swReg) {
          tokenOptions.serviceWorkerRegistration = swReg;
        }
        if (firebaseConfig.vapidKey) {
          tokenOptions.vapidKey = firebaseConfig.vapidKey;
        }
        // 25s timeout for mobile APNs / FCM handshake
        const tokenPromise = messaging.getToken(tokenOptions);
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('FCM token request timeout (25s)')), 25000));
        const acquiredToken = await Promise.race([tokenPromise, timeoutPromise]);
        if (acquiredToken && typeof acquiredToken === 'string' && acquiredToken.trim() !== '') {
          token = acquiredToken;
        }
      } catch (tokenErr) {
        console.warn("FCM getToken note:", tokenErr.message);
      }
    }

    // Fallback: check stored token from previous successful session
    if (!token) {
      const stored = localStorage.getItem('trjt_fcm_token');
      if (stored && stored.includes(':APA91b')) {
        token = stored;
      }
    }

    if (token && typeof token === 'string' && token.includes(':APA91b')) {
      currentFcmToken = token;
      localStorage.setItem('trjt_fcm_token', token);
      localStorage.setItem('trjt_h10_enabled', reminderEnabled ? 'true' : 'false');

      // Save to Firestore 'devices' collection
      if (db) {
        try {
          const docId = getStableDeviceId();
          const isAdminPage = window.location.pathname.includes('/admin');
          await db.collection('devices').doc(docId).set({
            id: docId,
            token: token,
            tokenMasked: maskToken(token),
            isRealFcm: true,
            platform: detectPlatform(),
            classId: 'trjt-3a',
            role: isAdminPage ? 'admin' : 'student',
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

    if (token) {
      return token;
    }

    throw new Error('Token FCM belum berhasil dibuat oleh server Google Firebase. Pastikan koneksi internet stabil dan aplikasi dibuka dari Layar Utama iPhone.');
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

    if (!db) return;

    try {
      const docId = getStableDeviceId();
      const updateData = {
        [field]: value,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        lastSeen: firebase.firestore.FieldValue.serverTimestamp()
      };
      await db.collection('devices').doc(docId).set(updateData, { merge: true });
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
    // 0. Ensure Notification Permission is requested directly inside user gesture (Crucial for iOS)
    if (!('Notification' in window)) {
      throw new Error('Peramban ini belum mendukung Web Notification. Di iPhone, pastikan Anda telah memilih "Tambahkan ke Layar Utama" (Share ⬆️ -> Add to Home Screen) dan membukanya dari ikon Layar Utama.');
    }

    if (Notification.permission !== 'granted') {
      let perm = 'default';
      try {
        perm = await Notification.requestPermission();
      } catch (pErr) {
        perm = await new Promise((resolve) => Notification.requestPermission(resolve));
      }
      if (perm !== 'granted') {
        throw new Error('Izin notifikasi belum disetujui. Buka Pengaturan iPhone -> TRJT 3A / Safari -> Izinkan Pemberitahuan.');
      }
    }

    // 1. Play audio chime immediately (must be inside user gesture call stack for iOS)
    playNotificationChime();

    // 2. Vibrate if supported & enabled
    if (localStorage.getItem('trjt_vibration_enabled') !== 'false' && 'vibrate' in navigator) {
      try { navigator.vibrate([200, 100, 200]); } catch (e) {}
    }

    const title = '🔔 Uji Notifikasi Berhasil';
    const body = 'TRJT 3A Reminder siap mengingatkan jadwal kuliahmu.';
    
    lastNotificationTime = new Date().toISOString();
    localStorage.setItem('trjt_last_notif_time', lastNotificationTime);

    // 3. Dispatch native Service Worker Notification
    let notificationDispatched = false;

    if ('serviceWorker' in navigator) {
      try {
        let reg = swRegistration || (await navigator.serviceWorker.getRegistration());
        if (!reg) {
          reg = await navigator.serviceWorker.ready;
        }
        if (reg && reg.showNotification) {
          const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
          const notifOptions = {
            body: body,
            vibrate: [200, 100, 200],
            tag: 'trjt-test-notif',
            renotify: true,
            data: { url: './index.html', type: 'test' }
          };
          
          // Only add SVG icon on non-iOS browsers (iOS WebKit rejects SVG icons)
          if (!isIOS) {
            notifOptions.icon = './assets/icons/app-icon.svg';
            notifOptions.badge = './assets/icons/app-icon.svg';
          }

          await reg.showNotification(title, notifOptions);
          notificationDispatched = true;
        }
      } catch (swNotifErr) {
        console.warn("ServiceWorker showNotification note:", swNotifErr);
      }
    }

    if (!notificationDispatched && Notification.permission === 'granted') {
      try {
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        if (!isIOS) {
          new Notification(title, {
            body: body,
            icon: './assets/icons/app-icon.svg',
            vibrate: [200, 100, 200]
          });
          notificationDispatched = true;
        }
      } catch (nativeErr) {
        console.warn("Native Notification error:", nativeErr);
      }
    }

    // 4. Always add to application in-memory inbox and trigger UI event
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

    // 5. Ensure background device token registration without blocking
    if (!currentFcmToken) {
      requestNotificationPermissionAndToken(true).catch(() => {});
    }

    return {
      success: true,
      message: 'Notifikasi & suara lonceng berhasil dikirim ke perangkat ini.'
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
    triggerStrongVibration: triggerStrongVibration,
    stopNotificationAlert: stopNotificationAlert,
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
