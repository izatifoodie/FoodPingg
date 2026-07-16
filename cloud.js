function getCloudUrl() {
  const id = localStorage.getItem("cloud_id");
  if (!id) return null;
  return `https://script.google.com/macros/s/${id}/exec`;
}

function isOnline() {
  return navigator.onLine;
}

function getFoods() {
  return JSON.parse(localStorage.getItem("foods")) || [];
}

function toExpiryTimestamp(f) {
  const [d, m, y] = (f.date || "").split("/");
  if (!d || !m || !y) return 0;
  const year = parseInt(y) + (parseInt(y) < 100 ? 2000 : 0);
  const date = new Date(year, parseInt(m) - 1, parseInt(d));
  return isNaN(date.getTime()) ? 0 : date.getTime();
}

async function cloudSync() {
  const url = getCloudUrl();
  if (!url || !isOnline()) return;

  const foods = getFoods().map(f => ({
    name: f.name,
    date: toExpiryTimestamp(f)
  }));

  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({
      action: "mirror",
      foods
    })
  });
}

function watchLocalChanges() {
  let lastState = JSON.stringify(getFoods());
  setInterval(() => {
    const current = JSON.stringify(getFoods());
    if (current !== lastState) {
      cloudSync();
      lastState = current;
    }
  }, 1500);
}

window.addEventListener("online", cloudSync);
document.addEventListener("DOMContentLoaded", () => {
  watchLocalChanges();
  cloudSync();
});
