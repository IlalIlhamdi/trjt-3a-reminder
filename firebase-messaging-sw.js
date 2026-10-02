/**
 * TRJT 3A REMINDER ?" Firebase Messaging Service Worker
 * Handles background push notifications & offline asset caching for PWA
 */

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

const CACHE_NAME = 'trjt3a-reminder-v9.0';
const ASSETS = [
  './',
  './index.html',
  './css/design-system.css',
  './css/student-ui.css',
  './js/firebase-config.js',
  './js/drive-service.js',
  './js/material-service.js',
  './js/assignment-service.js',
  './js/time-provider.js',
  './js/data.js',
  './js/app.js',
  './manifest.json',
  './favicon.svg',
  './assets/icons/favicon.svg',
  './assets/icons/app-icon.svg',
  './assets/icons/trjt-logo.svg',
  './assets/images/campus-inspired-banner.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Network-First strategy with Cache Fallback for PWA Offline mode
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          if (event.request.headers.get('accept')?.includes('text/html')) {
            return caches.match('./index.html');
          }
        });
      })
  );
});

const firebaseConfig = {
  apiKey: "AIzaSyD16teWyxBrVMxeAlej2-F1yOYW4jn_zvs",
  authDomain: "trjt-3a-reminder.firebaseapp.com",
  projectId: "trjt-3a-reminder",
  storageBucket: "trjt-3a-reminder.firebasestorage.app",
  messagingSenderId: "1050622500629",
  appId: "1:1050622500629:web:871c2db97dc9bf1d72531c",
  measurementId: "G-7B1BY95YZC"
};

let isMessagingInitialized = false;

try {
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }

  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Background message:', payload);

    const title = payload.notification?.title || payload.data?.title || 'TRJT 3A ?" Pengingat Kuliah';
    const body = payload.notification?.body || payload.data?.body || 'Jadwal kuliah Anda akan segera dimulai.';

    const notificationOptions = {
      body: body,
      icon: './assets/icons/app-icon.svg',
      badge: './assets/icons/app-icon.svg',
      vibrate: [200, 100, 200],
      tag: payload.data?.scheduleId || payload.data?.type || 'trjt-class-reminder',
      renotify: true,
      requireInteraction: true,
      data: {
        url: './index.html',
        scheduleId: payload.data?.scheduleId,
        type: payload.data?.type
      }
    };

    return self.registration.showNotification(title, notificationOptions);
  });

  isMessagingInitialized = true;
} catch (e) {
  console.warn('[firebase-messaging-sw.js] Messaging init note:', e);
}

// Fallback push event handler if messaging SDK fails
self.addEventListener('push', (event) => {
  if (isMessagingInitialized || !event.data) return;

  try {
    const data = event.data.json();
    const title = data.notification?.title || data.data?.title || 'TRJT 3A ?" Pengingat Kuliah';
    const body = data.notification?.body || data.data?.body || 'Jadwal kuliah Anda akan segera dimulai.';

    const options = {
      body: body,
      icon: './assets/icons/app-icon.svg',
      badge: './assets/icons/app-icon.svg',
      vibrate: [200, 100, 200],
      tag: data.data?.scheduleId || data.data?.type || 'trjt-class-reminder',
      renotify: true,
      requireInteraction: true,
      data: {
        url: './index.html',
        ...data.data
      }
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch (e) {
    const text = event.data.text();
    event.waitUntil(
      self.registration.showNotification('TRJT 3A Reminder', {
        body: text,
        icon: './assets/icons/app-icon.svg',
        vibrate: [200, 100, 200],
        data: { url: './index.html' }
      })
    );
  }
});

// Click notification handler: Focus or open main page
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
