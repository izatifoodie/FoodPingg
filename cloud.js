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

async function cloudSync() {
  const url = getCloudUrl();
  if (!url || !isOnline()) return;

  const foods = getFoods();

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
