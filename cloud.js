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

// Convert a food's date field into a ms timestamp for syncing.
// Assumes f.date is "YYYY-MM-DD" (e.g. from <input type="date">).
// Adjust the parsing line if your date field is stored differently.
function toExpiryTimestamp(f) {
  const ms = new Date(f.date).getTime();
  return isNaN(ms) ? 0 : ms;
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
