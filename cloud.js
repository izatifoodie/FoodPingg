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
// Expiry date tetap sampai penghujung hari.
// Contoh:
// 20/09/2026
// = 20/09/2026 23:59:59.999
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
//
// App simpan:
// 8:00 AM
// 8:00 PM
//
// Google/ESP terima:
// 08:00
// 20:00
//
// ======================================================

function getNotificationTime() {

  const value =
    localStorage.getItem("notifTime") || "8:00 AM";

  const match =
    value.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);

  if (!match) {

    // Kalau sudah dalam format 24 jam
    const twentyFour =
      value.match(/^(\d{1,2}):(\d{2})$/);

    if (twentyFour) {

      const h =
        parseInt(twentyFour[1]);

      const m =
        parseInt(twentyFour[2]);

      return (
        String(h).padStart(2, "0") +
        ":" +
        String(m).padStart(2, "0")
      );
    }

    return "08:00";
  }


  let hour =
    parseInt(match[1]);

  const minute =
    match[2];

  const ampm =
    match[3].toUpperCase();


  if (ampm === "AM") {

    if (hour === 12) {
      hour = 0;
    }

  } else {

    if (hour !== 12) {
      hour += 12;
    }
  }


  return (
    String(hour).padStart(2, "0") +
    ":" +
    minute
  );
}


// ======================================================
// CLOUD SYNC
// ======================================================

async function cloudSync() {

  const url = getCloudUrl();

  if (!url || !isOnline()) {
    return;
  }


  const foods =
    getFoods().map(f => ({
      name: f.name,
      date: toExpiryTimestamp(f)
    }));


  const notifTime =
    getNotificationTime();


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
// WATCH LOCAL CHANGES
// ======================================================

function watchLocalChanges() {

  let lastState =
    JSON.stringify({

      foods: getFoods(),

      notifTime:
        localStorage.getItem("notifTime") || "8:00 AM"

    });


  setInterval(() => {

    const currentState =
      JSON.stringify({

        foods: getFoods(),

        notifTime:
          localStorage.getItem("notifTime") || "8:00 AM"

      });


    if (
      currentState !== lastState
    ) {

      cloudSync();

      lastState =
        currentState;
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
