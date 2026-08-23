/**
 * TRJT 3A REMINDER — Firebase Web Client Configuration
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

  function initFirebase() {
    try {
      if (typeof firebase !== 'undefined' && firebaseConfig.apiKey) {
        if (!firebase.apps.length) {
          firebase.initializeApp(firebaseConfig);
        }
        db = firebase.firestore();
        auth = firebase.auth();

        if (firebase.messaging && firebase.messaging.isSupported()) {
          messaging = firebase.messaging();
        }

        isFirebaseReady = true;
        console.log("🔥 Firebase Connected: TRJT 3A Database Ready");
        setupFirestoreListeners();
      } else {
        console.log("ℹ️ Firebase offline / local fallback active.");
      }
    } catch (err) {
      console.warn("⚠️ Firebase init:", err.message);
    }
  }

  // Real-time Firestore Listener for Live Schedules & Overrides
  function setupFirestoreListeners() {
    if (!db) return;

    // Listen to official schedules
    db.collection('schedules')
      .where('classId', '==', 'trjt-3a')
      .where('active', '==', true)
      .onSnapshot((snapshot) => {
        if (snapshot && !snapshot.empty) {
          const remoteClasses = [];
          snapshot.forEach((doc) => {
            remoteClasses.push({ id: doc.id, ...doc.data() });
          });
          if (window.TRJT_SCHEDULE) {
            window.TRJT_SCHEDULE.classes = remoteClasses;
            console.log("🔄 Realtime sync: " + remoteClasses.length + " classes updated from Firestore");
            if (typeof window.evaluateScheduleState === 'function') {
              // Trigger UI refresh
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

  // Request FCM Notification Permission & Save Token
  async function requestNotificationPermission() {
    if (!messaging || !db) return null;
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const token = await messaging.getToken();
        if (token) {
          await db.collection('devices').doc(token).set({
            token: token,
            platform: 'web',
            classId: 'trjt-3a',
            active: true,
            lastSeen: firebase.firestore.FieldValue.serverTimestamp()
          }, { merge: true });
          console.log("🔔 FCM Token registered successfully:", token);
          return token;
        }
      }
    } catch (err) {
      console.warn("FCM registration error:", err);
    }
    return null;
  }

  window.TRJT_FIREBASE = {
    config: firebaseConfig,
    isReady: () => isFirebaseReady,
    getDb: () => db,
    getAuth: () => auth,
    getMessaging: () => messaging,
    requestNotificationPermission: requestNotificationPermission,
    init: initFirebase
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFirebase);
  } else {
    initFirebase();
  }
})();
