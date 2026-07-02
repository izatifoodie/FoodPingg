const CACHE_NAME = 'foodping-v1';
const ASSETS = [
  '/foodping/',
  '/foodping/index.html',
  '/foodping/ui.css',
  '/foodping/app.js',
  '/foodping/badge.png',
  '/foodping/cloud.js',
  '/foodping/empty.png',
  '/foodping/icon.png',
  '/foodping/site.webmanifest',
  '/foodping/404.html',
  '/foodping/sw.js',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  e.respondWith(
    fetch(e.request)
      .then(res => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(e.request, copy));
        return res;
      })
      .catch(() =>
        caches.match(e.request).then(cached => {
          if (cached) return cached;
          return caches.match('/foodping/404.html');
        })
      )
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      const existing = clients.find(c => 'focus' in c);
      if (existing) return existing.focus();
      return self.clients.openWindow('/foodping/');
    })
  );
});

self.addEventListener('periodicsync', event => {
  if (event.tag === 'check-expiry') {
    event.waitUntil(checkAndNotifyFromSW());
  }
});

async function checkAndNotifyFromSW() {
  const stored    = await self.registration.storage?.get?.('foods');
  const foods     = JSON.parse(stored || '[]');
  const now       = new Date();
  const today     = now.toDateString();
  const alertTime = await self.registration.storage?.get?.('notifTime') || '8:00 AM';
  const enabled   = await self.registration.storage?.get?.('notifEnabled');

  if (enabled === 'false') return;

  const parts = alertTime.trim().split(/[\s:]+/);
  let h       = parseInt(parts[0]);
  const m     = parseInt(parts[1]);
  const a     = (parts[2] || '').toUpperCase().trim();
  if (a === 'PM' && h !== 12) h += 12;
  if (a === 'AM' && h === 12) h = 0;

  if (now.getHours() !== h || now.getMinutes() !== m) return;

  const nowDay = new Date();
  nowDay.setHours(0, 0, 0, 0);

  foods.forEach(food => {
    const parts  = food.date.split('/');
    let year     = parseInt(parts[2]);
    if (year < 100) year += 2000;
    const expiry = new Date(year, parseInt(parts[1]) - 1, parseInt(parts[0]));
    const diff   = Math.ceil((expiry - nowDay) / (1000 * 60 * 60 * 24));

    if (diff <= 3 && diff >= 0) {
      const msg = diff === 0
        ? `${food.name} expired hari ini!`
        : `${food.name} hampir expired (${diff} hari lagi)`;

      self.registration.showNotification('FoodPing Reminder', {
        body: msg,
        icon: 'empty.png',
        badge: 'badge.png',
        vibrate: [200, 100, 200],
        tag: `foodping_${food.name}_${today}_${alertTime}`,
        renotify: true
      });
    }
  });
}
