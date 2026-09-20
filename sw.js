const CACHE_NAME = 'foodping-v2';
const ASSETS = [
  '/FoodPingg/',
  '/FoodPingg/index.html',
  '/FoodPingg/ui.css',
  '/FoodPingg/app.js',
  '/FoodPingg/badge.png',
  '/FoodPingg/cloud.js',
  '/FoodPingg/empty.png',
  '/FoodPingg/icon.png',
  '/FoodPingg/site.webmanifest',
  '/FoodPingg/404.html',
  '/FoodPingg/sw.js',
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
          return caches.match('/FoodPingg/404.html');
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
      return self.clients.openWindow('/FoodPingg/');
    })
  );
});

self.addEventListener('periodicsync', event => {
  if (event.tag === 'check-expiry') {
    event.waitUntil(checkAndNotifyFromSW());
  }
});

// db read

function readKV(key) {
  return new Promise(resolve => {
    const req = indexedDB.open('foodping', 1);
    req.onupgradeneeded = () => req.result.createObjectStore('kv');
    req.onsuccess = () => {
      const db = req.result;
      const tx = db.transaction('kv', 'readonly');
      const getReq = tx.objectStore('kv').get(key);
      getReq.onsuccess = () => { resolve(getReq.result); db.close(); };
      getReq.onerror = () => { resolve(undefined); db.close(); };
    };
    req.onerror = () => resolve(undefined);
  });
}

async function checkAndNotifyFromSW() {
  const storedFoods = await readKV('foods');
  const foods       = JSON.parse(storedFoods || '[]');
  const now         = new Date();
  const today       = now.toDateString();
  const alertTime   = (await readKV('notifTime')) || '8:00 AM';
  const enabled     = await readKV('notifEnabled');

  if (enabled === 'false') return;

  const parts = alertTime.trim().split(/[\s:]+/);
  let h       = parseInt(parts[0]);
  const m     = parseInt(parts[1]);
  const a     = (parts[2] || '').toUpperCase().trim();
  if (a === 'PM' && h !== 12) h += 12;
  if (a === 'AM' && h === 12) h = 0;

  if (now.getHours() < h || (now.getHours() === h && now.getMinutes() < m)) return;

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
