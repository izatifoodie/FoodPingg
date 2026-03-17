const CHECK_INTERVAL = 5 * 1000;

if ('Notification' in window && Notification.permission === 'default') {
  Notification.requestPermission();
}

function parseDateNotif(dateStr) {
  const parts = dateStr.split('/');
  let year = parseInt(parts[2]);
  if (year < 100) year += 2000;
  return new Date(year, parseInt(parts[1]) - 1, parseInt(parts[0]));
}

function showNotification(foodName, days, date) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return null;

  const today     = new Date().toDateString();
  const alertTime = localStorage.getItem('notifTime') || '8:00 AM';
  const key       = `notified_${foodName}_${date}_${today}_${alertTime}`;

  if (localStorage.getItem(key) === 'true') return null;
  localStorage.setItem(key, 'true');

  const msg = days === 0
    ? `${foodName} expired today!`
    : `${foodName} is about to expire (${days} days left)`;

  navigator.serviceWorker.getRegistration().then(reg => {
    if (!reg) return;
    reg.showNotification('FoodPing Reminder', {
      body: msg,
      icon: 'empty.png',
      badge: 'badge.png',
      vibrate: [200, 100, 200],
      tag: `foodping_${foodName}_${today}_${alertTime}`,
      renotify: true
    });
  });

  return foodName;
}

function parseNotifTime(saved) {
  const parts = saved.trim().split(/[\s:]+/);
  let h       = parseInt(parts[0]);
  const m     = parseInt(parts[1]);
  const a     = (parts[2] || '').toUpperCase().trim();

  if (a === 'PM' && h !== 12) h += 12;
  if (a === 'AM' && h === 12) h = 0;

  return { h, m };
}

function isWithinNotifWindow() {
  if (localStorage.getItem('notifEnabled') === 'false') return false;

  const saved    = localStorage.getItem('notifTime') || '8:00 AM';
  const { h, m } = parseNotifTime(saved);
  const now      = new Date();

  const nowMin = now.getHours() * 60 + now.getMinutes();
  const setMin = h * 60 + m;

  
  return nowMin >= setMin && nowMin < setMin + 2;
}

function checkFoodExpiry() {
  if (!isWithinNotifWindow()) return;

  const foods = JSON.parse(localStorage.getItem('foods')) || [];
  const now   = new Date();
  now.setHours(0, 0, 0, 0);

  foods.forEach(food => {
    const diffDays = Math.ceil((parseDateNotif(food.date) - now) / (1000 * 60 * 60 * 24));
    if (diffDays <= 3 && diffDays >= 0) {
      showNotification(food.name, diffDays, food.date);
    }
  });
}

checkFoodExpiry();
setInterval(checkFoodExpiry, CHECK_INTERVAL);
