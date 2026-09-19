const CACHE_NAME = 'foodping-v2';

const ASSETS = [
  '/FoodPingg/',
  '/FoodPingg/index.html',
  '/FoodPingg/ui.css',
  '/FoodPingg/app.js',
  '/FoodPingg/cloud.js',
  '/FoodPingg/icon.png',
  '/FoodPingg/badge.png',
  '/FoodPingg/empty.png',
  '/FoodPingg/site.webmanifest',
  '/FoodPingg/404.html',
  '/FoodPingg/sw.js'
];

// ================================
// INSTALL
// ================================

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
  );

  self.skipWaiting();
});

// ================================
// ACTIVATE
// ================================

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  );

  self.clients.claim();
});

// ================================
// FETCH
// ================================

self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(response => {

        const copy = response.clone();

        caches.open(CACHE_NAME)
          .then(cache => {
            cache.put(event.request, copy);
          });

        return response;
      })
      .catch(() => {

        return caches.match(event.request)
          .then(cached => {

            if (cached) {
              return cached;
            }

            return caches.match('/FoodPingg/404.html');
          });

      })
  );
});

// ================================
// NOTIFICATION CLICK
// ================================

self.addEventListener('notificationclick', event => {

  event.notification.close();

  event.waitUntil(

    self.clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    })

    .then(clients => {

      for (const client of clients) {

        if ('focus' in client) {
          return client.focus();
        }

      }

      return self.clients.openWindow('/FoodPingg/');

    })

  );

});
