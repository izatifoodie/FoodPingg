function getCloudUrl() {
  const id = localStorage.getItem("cloud_id");
  if (!id) return null;

  return `https://script.google.com/macros/s/${id}/exec`;
}


// ======================================================
// INTERNET STATUS
// ======================================================

function isOnline() {
  return navigator.onLine;
}


// ======================================================
// GET FOODS
// ======================================================

function getFoods() {
  return JSON.parse(localStorage.getItem("foods")) || [];
}


// ======================================================
// CONVERT FOOD DATE TO EXPIRY TIMESTAMP
// ======================================================
//
// Example:
// 20/09/2026
//
// Will become:
// 20/09/2026 23:59:59.999
//
// This means the food is still valid throughout
// the selected expiry date.
//
// ======================================================

function toExpiryTimestamp(f) {

  const [d, m, y] = (f.date || "").split("/");

  if (!d || !m || !y) {
    return 0;
  }

  const year =
    parseInt(y) +
    (parseInt(y) < 100 ? 2000 : 0);

  const date = new Date(
    year,
    parseInt(m) - 1,
    parseInt(d),
    23,
    59,
    59,
    999
  );

  return isNaN(date.getTime())
    ? 0
    : date.getTime();
}


// ======================================================
// GET NOTIFICATION TIME
// ======================================================

function getNotificationTime() {

  return localStorage.getItem("notifTime") || "8:00 AM";
}


// ======================================================
// CLOUD SYNC
// ======================================================

async function cloudSync() {

  const url = getCloudUrl();

  if (!url || !isOnline()) {
    return;
  }


  // ====================================================
  // PREPARE FOOD DATA
  // ====================================================

  const foods = getFoods().map(f => ({
    name: f.name,
    date: toExpiryTimestamp(f)
  }));


  // ====================================================
  // GET NOTIFICATION TIME
  // ====================================================

  const notifTime = getNotificationTime();


  // ====================================================
  // SEND TO GOOGLE APPS SCRIPT
  // ====================================================

  try {

    await fetch(url, {

      method: "POST",

      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },

      body: JSON.stringify({

        action: "mirror",

        foods: foods,

        notifTime: notifTime

      })

    });


    console.log(
      "FoodPing cloud sync successful"
    );

  }

  catch (err) {

    console.error(
      "Cloud sync failed:",
      err
    );

  }
}


// ======================================================
// WATCH LOCAL STORAGE CHANGES
// ======================================================

function watchLocalChanges() {

  let lastState = JSON.stringify({

    foods: getFoods(),

    notifTime: getNotificationTime()

  });


  setInterval(() => {

    const currentState = JSON.stringify({

      foods: getFoods(),

      notifTime: getNotificationTime()

    });


    // ==================================================
    // DATA CHANGED
    // ==================================================

    if (currentState !== lastState) {

      cloudSync();

      lastState = currentState;

    }

  }, 1500);
}


// ======================================================
// INTERNET RECONNECTED
// ======================================================

window.addEventListener(
  "online",
  cloudSync
);


// ======================================================
// PAGE LOAD
// ======================================================

document.addEventListener(
  "DOMContentLoaded",
  () => {

    watchLocalChanges();

    cloudSync();

  }
);
