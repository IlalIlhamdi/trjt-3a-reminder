/**
 * TRJT 3A REMINDER — Firebase Messaging Service Worker
 * Handles background push notifications via Firebase Cloud Messaging (FCM)
 */

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyD16teWyxBrVMxeAlej2-F1yOYW4jn_zvs",
  authDomain: "trjt-3a-reminder.firebaseapp.com",
  projectId: "trjt-3a-reminder",
  storageBucket: "trjt-3a-reminder.firebasestorage.app",
  messagingSenderId: "1050622500629",
  appId: "1:1050622500629:web:871c2db97dc9bf1d72531c",
  measurementId: "G-7B1BY95YZC"
};

try {
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }

  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message:', payload);

    const title = payload.notification?.title || payload.data?.title || 'TRJT 3A — Pengingat Kuliah';
    const body = payload.notification?.body || payload.data?.body || 'Jadwal kuliah Anda akan segera dimulai.';

    const notificationOptions = {
      body: body,
      vibrate: [200, 100, 200],
      tag: payload.data?.scheduleId || payload.data?.type || 'trjt-class-reminder',
      renotify: true,
      data: {
        url: './index.html',
        scheduleId: payload.data?.scheduleId,
        type: payload.data?.type
      }
    };

    return self.registration.showNotification(title, notificationOptions);
  });
} catch (e) {
  console.warn('[firebase-messaging-sw.js] Messaging init note:', e);
}

// Fallback push event handler for raw push payloads
self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    if (data.notification || data.data) {
      const title = data.notification?.title || data.data?.title || 'TRJT 3A — Pengingat Kuliah';
      const body = data.notification?.body || data.data?.body || 'Jadwal kuliah Anda akan segera dimulai.';

      const options = {
        body: body,
        vibrate: [200, 100, 200],
        tag: data.data?.scheduleId || data.data?.type || 'trjt-class-reminder',
        renotify: true,
        data: {
          url: './index.html',
          ...data.data
        }
      };

      event.waitUntil(self.registration.showNotification(title, options));
    }
  } catch (e) {
    const text = event.data.text();
    event.waitUntil(
      self.registration.showNotification('TRJT 3A Reminder', {
        body: text,
        vibrate: [200, 100, 200],
        data: { url: './index.html' }
      })
    );
  }
});

// Focus or open window when clicking notification
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes('index.html') && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('./index.html');
      }
    })
  );
});
