function getLEDUrl() {
  return localStorage.getItem('led_script_url') || '';
}

async function syncLED() {
  const url = getLEDUrl();
  if (!url) return;

  const foods = JSON.parse(localStorage.getItem('foods')) || [];
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const hasAlmostExpired = foods.some(food => {
    const parts = food.date.split('/');
    let year = parseInt(parts[2]);

    if (year < 100) year += 2000;

    const d = new Date(
      year,
      parseInt(parts[1]) - 1,
      parseInt(parts[0])
    );

    const diff = Math.ceil((d - now) / (1000 * 60 * 60 * 24));

    return diff <= 3 && diff >= 0;
  });

  try {
    await fetch(`${url}?action=set&state=${hasAlmostExpired ? 'ON' : 'OFF'}`);
  } catch (error) {
    console.warn('LED sync failed', error);
  }
}

syncLED();
setInterval(syncLED, 15 * 60 * 1000);
