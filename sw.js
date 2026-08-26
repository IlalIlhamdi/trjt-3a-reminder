const CACHE_NAME = 'trjt3a-reminder-v4.1';
const ASSETS = [
  './',
  './index.html',
  './css/design-system.css',
  './css/design-system.css?v=4.1',
  './js/firebase-config.js?v=4.1',
  './js/drive-service.js?v=4.1',
  './js/material-service.js?v=4.1',
  './js/time-provider.js?v=4.1',
  './js/data.js?v=4.1',
  './js/app.js?v=4.1',
  './manifest.json',
  './favicon.svg',
  './assets/icons/favicon.svg',
  './assets/icons/app-icon.svg',
  './assets/icons/trjt-logo.svg'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
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

// Network-First with Cache Fallback for instant updates
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

self.addEventListener('push', (event) => {
  let title = 'TRJT 3A Reminder';
  let body = 'Jadwal kuliah akan segera dimulai!';
  let dataPayload = { url: './index.html' };

  if (event.data) {
    try {
      const data = event.data.json();
      title = data.notification?.title || data.data?.title || data.title || title;
      body = data.notification?.body || data.data?.body || data.body || body;
      dataPayload = data.data || dataPayload;
    } catch (e) {
      body = event.data.text();
    }
  }

  const options = {
    body: body,
    icon: './assets/icons/app-icon.svg',
    badge: './assets/icons/app-icon.svg',
    vibrate: [800, 250, 1000, 300, 800, 250, 1200, 400, 800, 250, 1000],
    tag: dataPayload.type || 'trjt-reminder',
    renotify: true,
    requireInteraction: true,
    data: dataPayload
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

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
