// some popup ui

const popupEl = document.createElement('div');
popupEl.innerHTML = `
  <div id="customAlert" style="display:none">
    <div id="customAlertBackdrop"></div>
    <div id="customAlertBox">
      <div id="customAlertTitle">FoodPing</div>
      <div id="customAlertMsg"></div>
      <div id="customAlertDivider"></div>
      <div id="customAlertActions">
        <button id="customAlertBtn">OK</button>
      </div>
    </div>
  </div>
`;
document.body.appendChild(popupEl);

const timePickerEl = document.createElement('div');
timePickerEl.innerHTML = `
  <div id="timePicker" style="display:none">
    <div id="timePickerBackdrop"></div>
    <div id="timePickerSheet">
      <div id="timePickerHeader">
        <button id="timePickerCancel">Cancel</button>
        <span id="timePickerTitle">Alert Time</span>
        <button id="timePickerDone">Done</button>
      </div>
      <div id="timePickerBody">
        <div class="drum-wrapper">
          <div class="drum-fade-top"></div>
          <div class="drum-scroll" id="hourDrum"></div>
          <div class="drum-fade-bottom"></div>
        </div>
        <div class="drum-colon">:</div>
        <div class="drum-wrapper">
          <div class="drum-fade-top"></div>
          <div class="drum-scroll" id="minuteDrum"></div>
          <div class="drum-fade-bottom"></div>
        </div>
        <div class="drum-wrapper">
          <div class="drum-fade-top"></div>
          <div class="drum-scroll" id="ampmDrum"></div>
          <div class="drum-fade-bottom"></div>
        </div>
      </div>
      <div id="timePickerSelector"></div>
    </div>
  </div>
`;
document.body.appendChild(timePickerEl);

// nav

const navOrder = ['home', 'logs', 'feedpage', 'settings', 'about'];
let currentPage = 'home';

function navigateTo(targetPage) {
  if (targetPage === currentPage) return;

  const currentIndex = navOrder.indexOf(currentPage);
  const targetIndex = navOrder.indexOf(targetPage);
  const goingRight = targetIndex > currentIndex;

  const current = document.getElementById(currentPage);
  const target = document.getElementById(targetPage);

  target.classList.add(goingRight ? 'slide-from-right' : 'slide-from-left');

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      target.classList.remove('slide-from-right', 'slide-from-left');
      target.classList.add('active');
      current.classList.add(goingRight ? 'slide-out-left' : 'slide-out-right');
      current.classList.remove('active');
      setTimeout(() => current.classList.remove('slide-out-left', 'slide-out-right'), 350);
    });
  });

  document.querySelectorAll('.nav-item').forEach(n => {
    n.classList.toggle('active', n.dataset.page === targetPage);
  });

  currentPage = targetPage;
}

let touchStartX = 0;
let touchStartY = 0;

document.addEventListener('touchstart', e => {
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
}, { passive: true });

document.addEventListener('touchend', e => {
  const dx = e.changedTouches[0].clientX - touchStartX;
  const dy = e.changedTouches[0].clientY - touchStartY;

  if (Math.abs(dy) > Math.abs(dx)) return;
  if (Math.abs(dx) < 50) return;

  const feedEnabled = localStorage.getItem('feedEnabled') === 'true';
  const swipeOrder = navOrder.filter(p => feedEnabled || p !== 'feedpage');
  const currentIndex = swipeOrder.indexOf(currentPage);

  if (dx < 0) {
    const next = swipeOrder[currentIndex + 1];
    if (next) {
      navigateTo(next);
      if (next === 'feedpage' && !feedLoaded) loadFeed();
    }
  } else {
    const prev = swipeOrder[currentIndex - 1];
    if (prev) {
      navigateTo(prev);
      if (prev === 'feedpage' && !feedLoaded) loadFeed();
    }
  }
}, { passive: true });

// haptic (real)

let hapticEnabled = localStorage.getItem('haptic') !== 'off';

function haptic(pattern = 32) {
  if (!hapticEnabled || !navigator.vibrate) return;
  navigator.vibrate(pattern);
}

const vibrate = haptic;

document.querySelectorAll('#cloudUrlActions button, #wifiActions button, #themeActions button, #fontActions button, #creditsActions button').forEach(btn => {
  btn.addEventListener('click', () => haptic(32));
});

// modal helpers

function openModal({ modalId, boxId, backdropId, duration = 350 }) {
  haptic(32);
  const modal = document.getElementById(modalId);
  const box = document.getElementById(boxId);
  const backdrop = document.getElementById(backdropId);

  modal.style.display = 'flex';
  box.style.animation = '';
  backdrop.style.animation = '';
  requestAnimationFrame(() => {
    box.style.animation = `alertPopIn ${duration}ms cubic-bezier(0.34,1.56,0.64,1) forwards`;
    backdrop.style.animation = 'alertFadeIn 0.25s ease forwards';
  });
}

function closeModal({ modalId, boxId, backdropId, duration = 200 }) {
  haptic(10);
  const modal = document.getElementById(modalId);
  const box = document.getElementById(boxId);
  const backdrop = document.getElementById(backdropId);

  box.style.animation = `alertPopOut ${duration}ms ease forwards`;
  backdrop.style.animation = `alertFadeOut ${duration}ms ease forwards`;

  setTimeout(() => {
    modal.style.display = 'none';
    box.style.animation = '';
    backdrop.style.animation = '';
  }, duration);
}

// alert

function closeAlert() {
  closeModal({ modalId: 'customAlert', boxId: 'customAlertBox', backdropId: 'customAlertBackdrop' });
  setTimeout(() => {
    document.getElementById('customAlertTitle').textContent = 'FoodPing';
    document.getElementById('customAlertActions').innerHTML = '<button id="customAlertBtn">OK</button>';
  }, 200);
}

function openAlert({ title = 'FoodPing', msg, buttons }) {
  const actions = document.getElementById('customAlertActions');
  document.getElementById('customAlertTitle').textContent = title;
  document.getElementById('customAlertMsg').textContent = msg;
  actions.innerHTML = '';

  buttons.forEach((b, i) => {
    if (i > 0) {
      const div = document.createElement('div');
      div.className = 'alert-btn-divider';
      actions.appendChild(div);
    }
    const btn = document.createElement('button');
    btn.textContent = b.label;
    btn.className = 'alert-action-btn';
    btn.style.color = b.subtle ? 'var(--md-sys-color-on-surface)' : 'var(--md-sys-color-primary)';
    btn.style.fontWeight = b.bold ? '600' : '400';
    btn.onclick = () => { closeAlert(); b.action?.(); };
    actions.appendChild(btn);
  });

  openModal({ modalId: 'customAlert', boxId: 'customAlertBox', backdropId: 'customAlertBackdrop' });
}

function showAlert(msg) {
  openAlert({ title: 'FoodPing', msg, buttons: [{ label: 'OK' }] });
}

// reset all

function confirmReset() {
  haptic(32);
  openAlert({
    title: 'Reset All Data',
    msg: 'This will delete all foods, settings and saved data. This cannot be undone.',
    buttons: [
      { label: 'Cancel', subtle: true },
      {
        label: 'Reset', bold: true, danger: true,
        action: () => {
          haptic([30, 50, 30]);
          localStorage.clear();
          renderTable();
          hapticEnabled = true;
          document.getElementById('hapticToggle').checked = true;
          document.getElementById('notifToggle').checked = true;
          document.getElementById('notifTimeDisplay').textContent = '8:00 AM';
          localStorage.setItem('notifTime', '8:00 AM');
        }
      }
    ]
  });
}

// idk me forgot but dont touch

function buildDrum(el, items, selectedIndex) {
  el.innerHTML = items.map(item => `<div class="drum-item">${item}</div>`).join('');
  setTimeout(() => { el.scrollTop = selectedIndex * 44; }, 50);
}

function getDrumIndex(el) {
  return Math.round(el.scrollTop / 44);
}

// choose time

function openTimePicker() {
  haptic(32);
  const saved = localStorage.getItem('notifTime') || '8:00 AM';
  const parts = saved.split(/[: ]/);
  const hour = parseInt(parts[0]);
  const minute = parseInt(parts[1]);
  const ampm = parts[2] || 'AM';

  buildDrum(document.getElementById('hourDrum'), Array.from({length: 12}, (_, i) => i + 1), hour - 1);
  buildDrum(document.getElementById('minuteDrum'), Array.from({length: 60}, (_, i) => String(i).padStart(2, '0')), minute);
  buildDrum(document.getElementById('ampmDrum'), ['AM', 'PM'], ampm === 'AM' ? 0 : 1);

  const picker = document.getElementById('timePicker');
  const sheet = document.getElementById('timePickerSheet');
  const backdrop = document.getElementById('timePickerBackdrop');

  picker.style.display = 'flex';
  sheet.style.animation = '';
  backdrop.style.animation = '';
  requestAnimationFrame(() => {
    sheet.style.animation = 'sheetSlideUp 0.4s cubic-bezier(0.34,1.2,0.64,1) forwards';
    backdrop.style.animation = 'alertFadeIn 0.25s ease forwards';
  });
}

function closeTimePicker(save) {
  haptic(20);
  const sheet = document.getElementById('timePickerSheet');
  const backdrop = document.getElementById('timePickerBackdrop');
  const picker = document.getElementById('timePicker');

  if (save) {
    const h = getDrumIndex(document.getElementById('hourDrum')) + 1;
    const m = getDrumIndex(document.getElementById('minuteDrum'));
    const a = getDrumIndex(document.getElementById('ampmDrum')) === 0 ? 'AM' : 'PM';
    const formatted = `${h}:${String(m).padStart(2, '0')} ${a}`;
    localStorage.setItem('notifTime', formatted);
    document.getElementById('notifTimeDisplay').textContent = formatted;
    cloudSync?.();
  }

  sheet.style.animation = 'sheetSlideDown 0.3s ease forwards';
  backdrop.style.animation = 'alertFadeOut 0.3s ease forwards';
  setTimeout(() => { picker.style.display = 'none'; }, 300);
}

// choose date

function openDatePicker() {
  if (navigator.vibrate) navigator.vibrate(32);

  const picker = document.getElementById('datePicker');
  const sheet = document.getElementById('datePickerSheet');
  const backdrop = document.getElementById('datePickerBackdrop');

  picker.style.display = 'flex';
  sheet.style.animation = 'none';
  backdrop.style.animation = 'none';
  void sheet.offsetWidth;
  void backdrop.offsetWidth;
  sheet.style.animation = 'sheetSlideUp 0.4s cubic-bezier(0.34,1.2,0.64,1) forwards';
  backdrop.style.animation = 'alertFadeIn 0.25s ease forwards';

  const now = new Date();
  const months = [
    {label:'Jan',value:'01'},{label:'Feb',value:'02'},{label:'Mar',value:'03'},
    {label:'Apr',value:'04'},{label:'May',value:'05'},{label:'Jun',value:'06'},
    {label:'Jul',value:'07'},{label:'Aug',value:'08'},{label:'Sep',value:'09'},
    {label:'Oct',value:'10'},{label:'Nov',value:'11'},{label:'Dec',value:'12'}
  ];

  fillDrum('dayScroll', Array.from({length: 31}, (_, i) => String(i + 1).padStart(2, '0')), now.getDate() - 1);
  fillDrum('monthScroll', months, now.getMonth());
  fillDrum('yearScroll', Array.from({length: 6}, (_, i) => String(now.getFullYear() + i).slice(-2)), 0);
}

function fillDrum(id, items, selectedIndex) {
  const scroll = document.getElementById(id);
  scroll.innerHTML = items.map(val =>
    `<div class="drum-item" data-value="${val.value ?? val}">${val.label ?? val}</div>`
  ).join('');
  setTimeout(() => { scroll.scrollTop = selectedIndex * 44; }, 0);
}

function getSelectedDrum(id) {
  const scroll = document.getElementById(id);
  const index = Math.round(scroll.scrollTop / 44);
  const items = scroll.querySelectorAll('.drum-item');
  return items[Math.min(index, items.length - 1)]?.dataset.value || '';
}

function confirmDate() {
  document.getElementById('expiryDate').value =
    `${getSelectedDrum('dayScroll')}/${getSelectedDrum('monthScroll')}/${getSelectedDrum('yearScroll')}`;
  closeDatePicker();
}

function closeDatePicker() {
  const sheet = document.getElementById('datePickerSheet');
  const backdrop = document.getElementById('datePickerBackdrop');
  const picker = document.getElementById('datePicker');

  sheet.style.animation = 'sheetSlideDown 0.3s ease forwards';
  backdrop.style.animation = 'alertFadeOut 0.3s ease forwards';
  setTimeout(() => { picker.style.display = 'none'; }, 300);
}

// food data

function getFoods() {
  return JSON.parse(localStorage.getItem('foods')) || [];
}

function saveFoods(foods) {
  localStorage.setItem('foods', JSON.stringify(foods));
}

function parseDate(dateStr) {
  const [d, m, y] = dateStr.split('/');
  return new Date(parseInt(y) + (parseInt(y) < 100 ? 2000 : 0), parseInt(m) - 1, parseInt(d));
}

function addFood() {
  const name = document.getElementById('foodName').value.trim();
  const date = document.getElementById('expiryDate').value.trim();

  if (!name || !date) { showAlert('Please enter the name and expiry date!'); return; }
  if (date.split('/').length !== 3) { showAlert('Date format must be DD/MM/YY'); return; }

  haptic([30, 40, 30]);

  const foods = getFoods();
  foods.push({ name, date });
  saveFoods(foods);
  renderTable();
  cloudSync?.();

  document.getElementById('foodName').value = '';
  document.getElementById('expiryDate').value = '';
}

function renderTable() {
  const table = document.getElementById('foodTable');
  if (!table) return;

  while (table.rows.length > 1) table.deleteRow(1);

  const foods = getFoods();
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const card = table.closest('.card');
  let emptyMsg = document.getElementById('emptyMsg');

  if (!foods.length) {
    if (card) card.style.display = 'none';
    if (!emptyMsg) {
      emptyMsg = document.createElement('div');
      emptyMsg.id = 'emptyMsg';
      emptyMsg.textContent = 'Nothing here';
      emptyMsg.style.cssText = 'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);opacity:0.4;font-size:16px;';
      document.getElementById('logs').appendChild(emptyMsg);
    }
    emptyMsg.style.display = 'block';
    return;
  }

  if (card) card.style.display = '';
  if (emptyMsg) emptyMsg.style.display = 'none';

  foods.forEach((food, index) => {
    const diffDays = Math.ceil((parseDate(food.date) - now) / 86400000);
    const [color, icon, label] = diffDays > 3
      ? ['#7bc99a', 'fa-circle-check', `${diffDays} days remaining`]
      : diffDays > 0
        ? ['#f0b97a', 'fa-circle-exclamation', `${diffDays} days remaining`]
        : diffDays === 0
          ? ['#f28b8b', 'fa-circle-xmark', 'Expired Today']
          : ['#f28b8b', 'fa-circle-xmark', 'Expired'];

    const dataRow = table.insertRow();
    dataRow.className = 'data-row';
    dataRow.insertCell(0).textContent = food.name;
    dataRow.insertCell(1).textContent = food.date;

    const statusCell = dataRow.insertCell(2);
    statusCell.style.cssText = 'display:flex;align-items:center;gap:0.4rem;justify-content:flex-end;';
    statusCell.innerHTML = `<span style="color:${color};text-align:right;max-width:80px;">${label}</span><i class="fa-solid ${icon}" style="color:${color};flex-shrink:0;align-self:center;"></i>`;

    const btnRow = table.insertRow();
    btnRow.className = 'btn-row';
    const btnCell = btnRow.insertCell(0);
    btnCell.colSpan = 3;

    const delBtn = document.createElement('button');
    delBtn.textContent = 'Delete';
    Object.assign(delBtn.style, {
      width: '100%', backgroundColor: 'var(--md-sys-color-primary)',
      color: 'var(--md-sys-color-on-primary)', border: 'none',
      borderRadius: '16px', padding: '8px', cursor: 'pointer', marginBottom: '4px'
    });
    delBtn.onclick = () => {
      openAlert({
        title: 'Delete Food',
        msg: `Remove "${food.name}" from your list?`,
        buttons: [
          { label: 'Cancel', subtle: true },
          {
            label: 'Delete', bold: true,
            action: () => {
              haptic([20, 30, 20]);
              const foods = getFoods();
              localStorage.removeItem(`notified_${foods[index].name}_${foods[index].date}`);
              foods.splice(index, 1);
              saveFoods(foods);
              renderTable();
              cloudSync?.();
            }
          }
        ]
      });
    };
    btnCell.appendChild(delBtn);
  });
}

function deleteAllExpired() {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const expired = getFoods().filter(f => parseDate(f.date) < now);
  if (!expired.length) { showAlert('No expired items to remove.'); return; }
  openAlert({
    title: 'Delete Expired',
    msg: `Remove ${expired.length} expired item${expired.length > 1 ? 's' : ''}?`,
    buttons: [
      { label: 'Cancel', subtle: true },
      {
        label: 'Delete', bold: true,
        action: () => {
          haptic([20, 30, 20]);
          expired.forEach(f => localStorage.removeItem(`notified_${f.name}_${f.date}`));
          saveFoods(getFoods().filter(f => parseDate(f.date) >= now));
          renderTable();
          cloudSync?.();
        }
      }
    ]
  });
}

// if else ahh ai

const defaultFoods = [
  "Apple","Banana","Carrot","Chicken Breast","Rice",
  "Milk","Eggs","Broccoli","Salmon","Cheese",
  "Tomato","Potato","Onion","Spinach","Bread",
  "Pasta","Yogurt","Strawberries","Beef","Cucumber",

  "Rice","Basmati Rice","Glutinous Rice",
  "Chicken Thighs","Chicken Wings","Whole Chicken",
  "Mackerel","Sardines","Anchovies","Tuna Canned",
  "Shrimp","Squid",

  "Coconut Milk","Coconut","Palm Sugar","Brown Sugar","White Sugar",
  "Salt","Cooking Oil","Palm Oil","Butter","Margarine",

  "Garlic","Ginger","Turmeric","Lemongrass","Galangal",
  "Chili","Lime Leaves","Pandan Leaves",

  "Soy Sauce","Sweet Soy Sauce","Oyster Sauce","Fish Sauce","Chili Sauce","Ketchup",
  "Curry Powder","Sambal Paste",

  "Kangkung","Kailan","Long Beans","Okra","Eggplant","Cabbage",
  "Lettuce","Bean Sprouts",

  "Mango","Papaya","Watermelon","Pineapple","Orange","Durian",

  "Tofu","Tempeh","Noodles","Instant Noodles","Maggi",
  "Flour","All-purpose Flour","Rice Flour",

  "Tea","Coffee","Biscuit","Crackers","Ayam Gepuk Set D"
];

function isLearningEnabled() {
  return localStorage.getItem('neuralLearning') === 'true';
}

function getStoredFoods() {
  return JSON.parse(localStorage.getItem('foodsData')) || {};
}

function getLearnedSortedList() {
  return Object.entries(getStoredFoods())
    .sort((a, b) => b[1] - a[1])
    .map(x => x[0]);
}

function saveFood() {
  if (!isLearningEnabled()) return;
  const input = document.getElementById('foodName').value.trim();
  if (!input || input.includes('/learned')) return;
  const data = getStoredFoods();
  data[input] = (data[input] || 0) + 1;
  localStorage.setItem('foodsData', JSON.stringify(data));
}

let learnedIndex = 0;

function setRandomFood() {
  if (navigator.vibrate) navigator.vibrate(32);
  const input = document.getElementById('foodName');
  if (!isLearningEnabled()) {
    input.value = defaultFoods[Math.floor(Math.random() * defaultFoods.length)];
    return;
  }
  const learned = getLearnedSortedList();
  if (learned.length > 0 && learnedIndex < learned.length) {
    input.value = learned[learnedIndex++];
    return;
  }
  input.value = defaultFoods[Math.floor(Math.random() * defaultFoods.length)];
}

function openResetLearningModal() {
  vibrate(32);
  openModal({ modalId: 'resetLearningModal', boxId: 'resetLearningBox', backdropId: 'resetLearningBackdrop' });
}

function closeResetLearningModal() {
  closeModal({ modalId: 'resetLearningModal', boxId: 'resetLearningBox', backdropId: 'resetLearningBackdrop' });
}

function confirmResetLearning() {
  vibrate(48);
  localStorage.removeItem('foodsData');
  learnedIndex = 0;
  closeResetLearningModal();
}

// setup

function openWifiModal() {
  const saved = JSON.parse(localStorage.getItem('pendingWifi') || '{}');
  if (saved.ssid) document.getElementById('wifiSsid').value = saved.ssid;
  if (saved.password) document.getElementById('wifiPass').value = saved.password;
  openModal({ modalId: 'wifiModal', boxId: 'wifiBox', backdropId: 'wifiBackdrop' });
}

function closeWifiModal() {
  closeModal({ modalId: 'wifiModal', boxId: 'wifiBox', backdropId: 'wifiBackdrop' });
}

function toggleWifiPass() {
  const input = document.getElementById('wifiPass');
  const icon = document.querySelector('.wifi-eye');
  const isPass = input.type === 'password';
  input.type = isPass ? 'text' : 'password';
  icon.textContent = isPass ? 'visibility_off' : 'visibility';
}

function saveWifi() {
  const ssid = document.getElementById('wifiSsid').value.trim();
  const pass = document.getElementById('wifiPass').value;
  if (!ssid) return;
  localStorage.setItem('pendingWifi', JSON.stringify({ ssid, password: pass }));
  document.getElementById('wifiStatus').textContent = 'Connect to FoodPing Setup';
  closeWifiModal();
  startWifiSync();
}

async function trySendWifi() {
  const pending = JSON.parse(localStorage.getItem('pendingWifi') || '{}');
  if (!pending.ssid) return;
  const cloudId = localStorage.getItem('cloud_id') || '';

  if (!cloudId) {
    try {
      await fetch('http://192.168.4.1/save', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ssid: pending.ssid, password: pending.password, script_id: '' }) });
    } catch {}
    document.getElementById('wifiStatus').textContent = 'Cloud ID not found';
    return;
  }

  try {
    const res = await fetch('http://192.168.4.1/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ssid: pending.ssid, password: pending.password, script_id: cloudId })
    });
    if (res.ok) {
      localStorage.removeItem('pendingWifi');
      document.getElementById('wifiStatus').textContent = 'Configured';
      stopWifiSync();
    }
  } catch {}
}

let wifiSyncInterval = null;

function startWifiSync() {
  if (wifiSyncInterval) return;
  wifiSyncInterval = setInterval(trySendWifi, 3000);
}

function stopWifiSync() {
  clearInterval(wifiSyncInterval);
  wifiSyncInterval = null;
}

async function resetWifi() {
  openAlert({
    title: 'Reset WiFi',
    msg: 'This will clear WiFi credentials. ESP will restart as a hotspot. Continue?',
    buttons: [
      { label: 'Cancel', subtle: true },
      {
        label: 'Reset', bold: true, danger: true,
        action: async () => {
          closeWifiModal();
          localStorage.removeItem('pendingWifi');
          document.getElementById('wifiStatus').textContent = 'Not Configured';
          stopWifiSync();
          try { await fetch('http://esp32.local/reset-wifi', { method: 'POST' }); } catch {}
          setTimeout(() => openAlert({
            title: 'WiFi Reset',
            msg: "Connect to 'FoodPing-Setup' hotspot, then reopen this app to reconfigure.",
            buttons: [{ label: 'OK' }]
          }), 300);
        }
      }
    ]
  });
}

if (localStorage.getItem('pendingWifi')) {
  document.getElementById('wifiStatus').textContent = 'Connect to FoodPing Setup';
  startWifiSync();
}

// cloud

function openCloudIdModal() {
  vibrate(32);
  document.getElementById('cloudIdInput').value = localStorage.getItem('cloud_id') || '';
  document.getElementById('cloudUsrInput').value = localStorage.getItem('cloud_user') || '';
  openModal({ modalId: 'cloudIdModal', boxId: 'cloudIdBox', backdropId: 'cloudIdBackdrop' });
}

function closeCloudIdModal() {
  closeModal({ modalId: 'cloudIdModal', boxId: 'cloudIdBox', backdropId: 'cloudIdBackdrop' });
}

function saveCloudId() {
  vibrate(48);
  const usr = document.getElementById('cloudUsrInput').value.trim();
  const val = document.getElementById('cloudIdInput').value.trim();
  localStorage.setItem('cloud_user', usr);
  localStorage.setItem('cloud_id', val);
  document.getElementById('cloudIdDisplay').textContent = val ? 'Set' : 'Not set';
  closeCloudIdModal();
}

// hmm

function initDevsEasterEgg() {
  const el = document.getElementById('devs');
  if (!el) return;
  let toggled = false;
  Object.assign(el.style, {transition: 'opacity 0.3s' });
  el.addEventListener('click', (e) => {
    e.stopPropagation();
    el.style.opacity = 0;
    setTimeout(() => {
      toggled = !toggled;
      el.textContent = toggled ? 'Ryne' : 'Izatifoodie';
      el.style.opacity = 0.5;
    }, 300);
  });
}

// debug

(function () {
  function printLearnedFoods() {
    const sorted = Object.entries(JSON.parse(localStorage.getItem('foodsData')) || {}).sort((a, b) => b[1] - a[1]);
    console.clear();
    console.log('What i learned from this user?');
    sorted.forEach(([food, count], i) => console.log(`${i + 1}. ${food} → ${count}`));
  }

  document.addEventListener('DOMContentLoaded', () => {
    const foodInput = document.getElementById('foodName');
    if (!foodInput) return;
    foodInput.addEventListener('input', () => {
      if (foodInput.value.includes('/learned')) {
        printLearnedFoods();
        foodInput.value = foodInput.value.replace('/learned', '').trim();
      }
    });
  });
})();

// sw

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations()
    .then(regs => Promise.all(regs.map(r => r.unregister())))
    .then(() => navigator.serviceWorker.register('/FoodPingg/sw.js'));
}

// greetings

let shakeReady = false;
setTimeout(() => { shakeReady = true; }, 5000);

function greetUser() {
  const h1 = document.querySelector('#home h1');
  if (!h1) return;

  const username = localStorage.getItem('cloud_user');
  const hour = new Date().getHours();

  const greeting =
    hour < 12 ? 'Good Morning' :
    hour < 17 ? 'Good Afternoon' :
    hour < 21 ? 'Good Evening' :
    'Good Night';

  const greetText = username ? `${greeting},<br>${username}!` : `${greeting}!`;

  let isBusy = false;

  const fade = (content, delay) => setTimeout(() => {
    h1.style.transition = 'opacity 0.5s ease';
    h1.style.opacity = '0';
    setTimeout(() => { h1.innerHTML = content; h1.style.opacity = '1'; }, 500);
  }, delay);

  setTimeout(() => {
    isBusy = true;
    fade(greetText, 0);
    setTimeout(() => {
      fade('FoodPing', 2000);
      setTimeout(() => { isBusy = false; }, 3000);
    }, 500);
  }, 2000);

  const saveOriginals = () => {
    document.querySelectorAll('.home-bg .material-symbols-outlined').forEach(icon => {
      if (!icon.dataset.original) icon.dataset.original = icon.textContent.trim();
    });
  };

  const iconsAtOriginal = () => {
    const icons = document.querySelectorAll('.home-bg .material-symbols-outlined');
    return [...icons].every(icon => !icon.dataset.original || icon.textContent.trim() === icon.dataset.original);
  };

  const swapIcons = (to) => {
    document.querySelectorAll('.home-bg .material-symbols-outlined').forEach((icon, i) => {
      setTimeout(() => {
        icon.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
        icon.style.transform = `rotate(var(--r, 0deg)) rotateY(90deg)`;
        icon.style.opacity = '0';
        setTimeout(() => {
          icon.textContent = to === 'original' ? icon.dataset.original : to;
          icon.style.transform = `rotate(var(--r, 0deg)) rotateY(0deg)`;
          icon.style.opacity = '1';
        }, 300);
      }, i * 40);
    });
  };

  const showMessage = (text, iconName) => {
    isBusy = true;
    const original = h1.innerHTML;
    h1.style.transition = 'opacity 0.3s ease';
    h1.style.opacity = '0';
    setTimeout(() => { h1.innerHTML = text; h1.style.opacity = '1'; }, 300);
    setTimeout(() => {
      h1.style.opacity = '0';
      setTimeout(() => {
        h1.innerHTML = original;
        h1.style.opacity = '1';
        setTimeout(() => { isBusy = false; }, 500);
      }, 300);
    }, 2000);

    saveOriginals();
    swapIcons(iconName);
    setTimeout(() => swapIcons('original'), 2600);
  };

  const isGreeting = () => {
    const current = h1.innerHTML;
    return current.includes('Good Morning') || current.includes('Good Afternoon') ||
           current.includes('Good Evening') || current.includes('Good Night');
  };

  if (hour >= 0 && hour < 4) {
    setTimeout(() => {
      if (!isBusy) showMessage("Shouldn't you<br>be sleeping?", 'bedtime');
    }, 7000);
  }

  if (navigator.getBattery) {
    navigator.getBattery().then(battery => {
      battery.addEventListener('chargingchange', () => {
        showMessage(battery.charging ? 'Yummy!' : 'Ouch!',
          battery.charging ? 'bolt' : (battery.level * 100 > 20 ? 'error' : 'sentiment_very_dissatisfied'));
      });
      if (battery.charging) showMessage('Yummy!', 'bolt');
    });
  }

  let idleTimer = null;

  const resetIdle = () => {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      if (!isBusy && iconsAtOriginal()) showMessage('Still there?', 'sentiment_calm');
    }, 120000);
  };

  document.addEventListener('touchstart', resetIdle);
  resetIdle();

  let shakeIndex = 0;
  let lastShake = 0;
  let shakeCount = 0;
  let shakeWindowTimer = null;

  const shakeStates = [
    { message: 'Hey, you made<br>me dizzy!', icon: 'sentiment_stressed' },
    { message: 'Stop itt!',                  icon: 'sentiment_neutral' },
    { message: 'My "head" hurts<br>T-T',     icon: 'sick' },
  ];

  const handleShake = (force) => {
    if (!shakeReady || isBusy || !iconsAtOriginal()) return;
    if (isGreeting() && force < 64) return;

    const now = Date.now();
    if (now - lastShake > 1500) shakeCount = 0;
    shakeCount++;
    lastShake = now;

    clearTimeout(shakeWindowTimer);
    shakeWindowTimer = setTimeout(() => { shakeCount = 0; }, 1500);

    if (shakeCount < 3) return;
    shakeCount = 0;
    clearTimeout(shakeWindowTimer);

    const { message, icon } = shakeStates[shakeIndex];
    shakeIndex = (shakeIndex + 1) % shakeStates.length;

    showMessage(message, icon);
    if (navigator.vibrate) navigator.vibrate([32, 30, 48]);
  };

  function onMotion(e) {
    const a = e.accelerationIncludingGravity || e.acceleration;
    if (!a) return;
    const force = Math.sqrt((a.x || 0) ** 2 + (a.y || 0) ** 2 + (a.z || 0) ** 2);
    if (force > 48) handleShake(force);
  }

  document.addEventListener('click', function initMotion() {
    document.removeEventListener('click', initMotion);
    window.addEventListener('devicemotion', onMotion);
  }, { once: true });
}

// themes

const themes = {
  strawberry: {
    name: 'Strawberry Cupcake',
    '--md-sys-color-primary':              'rgb(240, 182, 193)',
    '--md-sys-color-on-primary':           'rgb(255, 255, 255)',
    '--md-sys-color-primary-container':    'rgb(255, 210, 220)',
    '--md-sys-color-on-primary-container': 'rgb(90, 35, 55)',
    '--md-sys-color-background':           'rgb(255, 245, 248)',
    '--md-sys-color-on-background':        'rgb(120, 60, 80)',
    '--md-sys-color-surface':              'rgb(255, 245, 248)',
    '--md-sys-color-on-surface':           'rgb(120, 60, 80)',
    '--md-sys-color-outline':              'rgb(255, 182, 193)',
    '--md-sys-color-surface-container':    'rgb(255, 230, 240)',
    '--md-sys-color-scrim':                'rgba(0, 0, 0, 0.08)',
    '--md-sys-shadow-settings-icon':       '0 2px 6px rgba(255, 105, 180, 0.2)',
    '--md-sys-shadow-switch-thumb':        '0 2px 4px rgba(255, 105, 180, 0.15)',
    '--md-sys-shadow-modal':               '0 8px 32px rgba(0, 0, 0, 0.12)',
    '--md-sys-color-input-border':         'rgba(255, 210, 220, 0.8)',
    '--md-sys-color-input-background':     'rgb(255, 240, 246)',
    '--md-sys-shadow-home-card':           '0 0 0 2px rgba(240, 182, 193, 0.15)',
  },
  tomato: {
    name: 'Tomato Jelly',
    '--md-sys-color-primary':              'rgb(220, 70, 60)',
    '--md-sys-color-on-primary':           'rgb(255, 255, 255)',
    '--md-sys-color-primary-container':    'rgb(255, 210, 205)',
    '--md-sys-color-on-primary-container': 'rgb(90, 20, 15)',
    '--md-sys-color-background':           'rgb(255, 248, 247)',
    '--md-sys-color-on-background':        'rgb(110, 35, 30)',
    '--md-sys-color-surface':              'rgb(255, 248, 247)',
    '--md-sys-color-on-surface':           'rgb(110, 35, 30)',
    '--md-sys-color-outline':              'rgb(240, 160, 155)',
    '--md-sys-color-surface-container':    'rgb(255, 228, 225)',
    '--md-sys-color-scrim':                'rgba(0, 0, 0, 0.08)',
    '--md-sys-shadow-settings-icon':       '0 2px 6px rgba(220, 70, 60, 0.25)',
    '--md-sys-shadow-switch-thumb':        '0 2px 4px rgba(220, 70, 60, 0.2)',
    '--md-sys-shadow-modal':               '0 8px 32px rgba(0, 0, 0, 0.12)',
    '--md-sys-color-input-border':         'rgba(240, 160, 155, 0.8)',
    '--md-sys-color-input-background':     'rgb(255, 244, 243)',
    '--md-sys-shadow-home-card':           '0 0 0 2px rgba(220, 70, 60, 0.12)',
  },
  honey: {
    name: 'Honey Amber',
    '--md-sys-color-primary':              'rgb(240, 180, 60)',
    '--md-sys-color-on-primary':           'rgb(60, 35, 0)',
    '--md-sys-color-primary-container':    'rgb(255, 225, 160)',
    '--md-sys-color-on-primary-container': 'rgb(70, 45, 0)',
    '--md-sys-color-background':           'rgb(255, 252, 242)',
    '--md-sys-color-on-background':        'rgb(80, 55, 10)',
    '--md-sys-color-surface':              'rgb(255, 252, 242)',
    '--md-sys-color-on-surface':           'rgb(80, 55, 10)',
    '--md-sys-color-outline':              'rgb(235, 200, 110)',
    '--md-sys-color-surface-container':    'rgb(255, 242, 200)',
    '--md-sys-color-scrim':                'rgba(0, 0, 0, 0.08)',
    '--md-sys-shadow-settings-icon':       '0 2px 6px rgba(200, 140, 20, 0.25)',
    '--md-sys-shadow-switch-thumb':        '0 2px 4px rgba(200, 140, 20, 0.2)',
    '--md-sys-shadow-modal':               '0 8px 32px rgba(0, 0, 0, 0.10)',
    '--md-sys-color-input-border':         'rgba(235, 200, 110, 0.8)',
    '--md-sys-color-input-background':     'rgb(255, 250, 235)',
    '--md-sys-shadow-home-card':           '0 0 0 2px rgba(240, 180, 60, 0.15)',
  },
  mint: {
    name: 'Mint Breeze',
    '--md-sys-color-primary':              'rgb(170, 230, 210)',
    '--md-sys-color-on-primary':           'rgb(0, 60, 50)',
    '--md-sys-color-primary-container':    'rgb(210, 245, 235)',
    '--md-sys-color-on-primary-container': 'rgb(0, 80, 70)',
    '--md-sys-color-background':           'rgb(245, 255, 252)',
    '--md-sys-color-on-background':        'rgb(40, 70, 65)',
    '--md-sys-color-surface':              'rgb(245, 255, 252)',
    '--md-sys-color-on-surface':           'rgb(40, 70, 65)',
    '--md-sys-color-outline':              'rgb(180, 220, 210)',
    '--md-sys-color-surface-container':    'rgb(230, 250, 245)',
    '--md-sys-color-scrim':                'rgba(0, 0, 0, 0.08)',
    '--md-sys-shadow-settings-icon':       '0 2px 6px rgba(0, 150, 120, 0.2)',
    '--md-sys-shadow-switch-thumb':        '0 2px 4px rgba(0, 150, 120, 0.15)',
    '--md-sys-shadow-modal':               '0 8px 32px rgba(0, 0, 0, 0.10)',
    '--md-sys-color-input-border':         'rgba(180, 220, 210, 0.8)',
    '--md-sys-color-input-background':     'rgb(240, 253, 250)',
    '--md-sys-shadow-home-card':           '0 0 0 2px rgba(170, 230, 210, 0.15)',
  },
  android: {
    name: 'Android Green',
    '--md-sys-color-primary':              'rgb(91, 122, 74)',
    '--md-sys-color-on-primary':           'rgb(255, 255, 255)',
    '--md-sys-color-primary-container':    'rgb(221, 241, 208)',
    '--md-sys-color-on-primary-container': 'rgb(40, 60, 30)',
    '--md-sys-color-background':           'rgb(248, 251, 245)',
    '--md-sys-color-on-background':        'rgb(60, 75, 50)',
    '--md-sys-color-surface':              'rgb(248, 251, 245)',
    '--md-sys-color-on-surface':           'rgb(60, 75, 50)',
    '--md-sys-color-outline':              'rgb(195, 210, 185)',
    '--md-sys-color-surface-container':    'rgb(238, 245, 230)',
    '--md-sys-color-scrim':                'rgba(0, 0, 0, 0.05)',
    '--md-sys-shadow-settings-icon':       '0 2px 6px rgba(91, 122, 74, 0.15)',
    '--md-sys-shadow-switch-thumb':        '0 2px 4px rgba(91, 122, 74, 0.1)',
    '--md-sys-shadow-modal':               '0 8px 32px rgba(0, 0, 0, 0.06)',
    '--md-sys-color-input-border':         'rgba(195, 210, 185, 0.6)',
    '--md-sys-color-input-background':     'rgb(242, 248, 236)',
    '--md-sys-shadow-home-card':           '0 0 0 2px rgba(91, 122, 74, 0.08)',
  },
  blueberry: {
    name: 'Blueberry Muffin',
    '--md-sys-color-primary':              'rgb(100, 120, 200)',
    '--md-sys-color-on-primary':           'rgb(255, 255, 255)',
    '--md-sys-color-primary-container':    'rgb(210, 218, 245)',
    '--md-sys-color-on-primary-container': 'rgb(20, 35, 100)',
    '--md-sys-color-background':           'rgb(247, 248, 255)',
    '--md-sys-color-on-background':        'rgb(35, 45, 110)',
    '--md-sys-color-surface':              'rgb(247, 248, 255)',
    '--md-sys-color-on-surface':           'rgb(35, 45, 110)',
    '--md-sys-color-outline':              'rgb(170, 185, 225)',
    '--md-sys-color-surface-container':    'rgb(228, 232, 250)',
    '--md-sys-color-scrim':                'rgba(0, 0, 0, 0.08)',
    '--md-sys-shadow-settings-icon':       '0 2px 6px rgba(80, 100, 190, 0.25)',
    '--md-sys-shadow-switch-thumb':        '0 2px 4px rgba(80, 100, 190, 0.2)',
    '--md-sys-shadow-modal':               '0 8px 32px rgba(0, 0, 0, 0.12)',
    '--md-sys-color-input-border':         'rgba(170, 185, 225, 0.8)',
    '--md-sys-color-input-background':     'rgb(242, 244, 255)',
    '--md-sys-shadow-home-card':           '0 0 0 2px rgba(100, 120, 200, 0.15)',
  },
  amethyst: {
    name: 'Amethyst Shard',
    '--md-sys-color-primary':              'rgb(155, 110, 200)',
    '--md-sys-color-on-primary':           'rgb(255, 255, 255)',
    '--md-sys-color-primary-container':    'rgb(225, 210, 248)',
    '--md-sys-color-on-primary-container': 'rgb(55, 20, 100)',
    '--md-sys-color-background':           'rgb(251, 248, 255)',
    '--md-sys-color-on-background':        'rgb(70, 35, 115)',
    '--md-sys-color-surface':              'rgb(251, 248, 255)',
    '--md-sys-color-on-surface':           'rgb(70, 35, 115)',
    '--md-sys-color-outline':              'rgb(200, 175, 230)',
    '--md-sys-color-surface-container':    'rgb(238, 230, 252)',
    '--md-sys-color-scrim':                'rgba(0, 0, 0, 0.08)',
    '--md-sys-shadow-settings-icon':       '0 2px 6px rgba(130, 80, 190, 0.25)',
    '--md-sys-shadow-switch-thumb':        '0 2px 4px rgba(130, 80, 190, 0.2)',
    '--md-sys-shadow-modal':               '0 8px 32px rgba(0, 0, 0, 0.12)',
    '--md-sys-color-input-border':         'rgba(200, 175, 230, 0.8)',
    '--md-sys-color-input-background':     'rgb(248, 244, 255)',
    '--md-sys-shadow-home-card':           '0 0 0 2px rgba(155, 110, 200, 0.15)',
  },
  coco: {
    name: 'Coco Cream',
    '--md-sys-color-primary':              'rgb(210, 180, 140)',
    '--md-sys-color-on-primary':           'rgb(60, 40, 20)',
    '--md-sys-color-primary-container':    'rgb(240, 220, 190)',
    '--md-sys-color-on-primary-container': 'rgb(80, 55, 30)',
    '--md-sys-color-background':           'rgb(255, 250, 240)',
    '--md-sys-color-on-background':        'rgb(80, 60, 40)',
    '--md-sys-color-surface':              'rgb(255, 250, 240)',
    '--md-sys-color-on-surface':           'rgb(80, 60, 40)',
    '--md-sys-color-outline':              'rgb(220, 200, 170)',
    '--md-sys-color-surface-container':    'rgb(245, 235, 220)',
    '--md-sys-color-scrim':                'rgba(0, 0, 0, 0.08)',
    '--md-sys-shadow-settings-icon':       '0 2px 6px rgba(160, 120, 60, 0.2)',
    '--md-sys-shadow-switch-thumb':        '0 2px 4px rgba(160, 120, 60, 0.15)',
    '--md-sys-shadow-modal':               '0 8px 32px rgba(0, 0, 0, 0.10)',
    '--md-sys-color-input-border':         'rgba(220, 200, 170, 0.8)',
    '--md-sys-color-input-background':     'rgb(255, 252, 245)',
    '--md-sys-shadow-home-card':           '0 0 0 2px rgba(210, 180, 140, 0.15)',
  },
  white: {
    name: 'Steamed Bun',
    '--md-sys-color-primary':              'rgb(180, 180, 180)',
    '--md-sys-color-on-primary':           'rgb(255, 255, 255)',
    '--md-sys-color-primary-container':    'rgb(220, 220, 220)',
    '--md-sys-color-on-primary-container': 'rgb(40, 40, 40)',
    '--md-sys-color-background':           'rgb(250, 250, 250)',
    '--md-sys-color-on-background':        'rgb(50, 50, 50)',
    '--md-sys-color-surface':              'rgb(250, 250, 250)',
    '--md-sys-color-on-surface':           'rgb(50, 50, 50)',
    '--md-sys-color-outline':              'rgb(210, 210, 210)',
    '--md-sys-color-surface-container':    'rgb(238, 238, 238)',
    '--md-sys-color-scrim':                'rgba(0, 0, 0, 0.08)',
    '--md-sys-shadow-settings-icon':       '0 2px 6px rgba(100, 100, 100, 0.2)',
    '--md-sys-shadow-switch-thumb':        '0 2px 4px rgba(100, 100, 100, 0.15)',
    '--md-sys-shadow-modal':               '0 8px 32px rgba(0, 0, 0, 0.10)',
    '--md-sys-color-input-border':         'rgba(210, 210, 210, 0.8)',
    '--md-sys-color-input-background':     'rgb(248, 248, 248)',
    '--md-sys-shadow-home-card':           '0 0 0 2px rgba(180, 180, 180, 0.15)',
  },
  void: {
    name: 'The Void',
    '--md-sys-color-primary':              'rgb(170, 170, 170)',
    '--md-sys-color-on-primary':           'rgb(10, 10, 10)',
    '--md-sys-color-primary-container':    'rgb(50, 50, 50)',
    '--md-sys-color-on-primary-container': 'rgb(210, 210, 210)',
    '--md-sys-color-background':           'rgb(18, 18, 18)',
    '--md-sys-color-on-background':        'rgb(195, 195, 195)',
    '--md-sys-color-surface':              'rgb(18, 18, 18)',
    '--md-sys-color-on-surface':           'rgb(195, 195, 195)',
    '--md-sys-color-outline':              'rgb(80, 80, 80)',
    '--md-sys-color-surface-container':    'rgb(28, 28, 28)',
    '--md-sys-color-scrim':                'rgba(0, 0, 0, 0.08)',
    '--md-sys-shadow-settings-icon':       '0 2px 6px rgba(0, 0, 0, 0.5)',
    '--md-sys-shadow-switch-thumb':        '0 2px 4px rgba(0, 0, 0, 0.4)',
    '--md-sys-shadow-modal':               '0 8px 32px rgba(0, 0, 0, 0.5)',
    '--md-sys-color-input-border':         'rgba(80, 80, 80, 0.8)',
    '--md-sys-color-input-background':     'rgb(22, 22, 22)',
    '--md-sys-shadow-home-card':           '0 0 0 2px rgba(170, 170, 170, 0.07)',
  },
};

function applyTheme(key) {
  haptic(22);
  const theme = themes[key];
  if (!theme) return;

  const currentTheme = localStorage.getItem('theme') || 'strawberry';
  const duration = (key === 'void' || currentTheme === 'void') ? 0 : 350;

  document.body.style.setProperty('--theme-transition-duration', `${duration}ms`);
  document.body.classList.add('theme-transitioning');
  document.body.style.willChange = 'background-color, color';

  Object.entries(theme).forEach(([prop, val]) => {
    if (prop.startsWith('--')) document.body.style.setProperty(prop, val);
  });

  const surfaceContainer = theme['--md-sys-color-surface-container'];
  document.querySelectorAll('meta[name="theme-color"]').forEach(el => el.setAttribute('content', surfaceContainer));
  document.querySelector('meta[name="msapplication-navbutton-color"]')?.setAttribute('content', surfaceContainer);
  document.querySelector('meta[name="msapplication-TileColor"]')?.setAttribute('content', surfaceContainer);

  setTimeout(() => {
    document.body.classList.remove('theme-transitioning');
    document.body.style.willChange = 'auto';
  }, duration + 30);

  localStorage.setItem('theme', key);
  document.getElementById('themeDisplay').textContent = theme.name;
  document.querySelectorAll('.theme-check').forEach(el => el.classList.remove('visible'));
  document.getElementById(`check-${key}`)?.classList.add('visible');
}

function initTheme() {
  applyTheme(localStorage.getItem('theme') || 'strawberry');
}

function openThemeModal() {
  openModal({ modalId: 'themeModal', boxId: 'themeBox', backdropId: 'themeBackdrop' });
  const saved = localStorage.getItem('theme') || 'strawberry';
  document.querySelectorAll('.theme-check').forEach(el => el.classList.remove('visible'));
  document.getElementById(`check-${saved}`)?.classList.add('visible');
}

function closeThemeModal() {
  closeModal({ modalId: 'themeModal', boxId: 'themeBox', backdropId: 'themeBackdrop' });
}

// fonts

const FONT_SOURCES = {
  default: null,
  patrickhand: 'https://fonts.googleapis.com/css2?family=Patrick+Hand&display=swap',
  gaegu: 'https://fonts.googleapis.com/css2?family=Gaegu&display=swap',
  monocraft: null,
  jetbrains: 'https://fonts.googleapis.com/css2?family=JetBrains+Mono&display=swap',
};

const FONT_FAMILY = {
  default: '"Google Sans Flex", system-ui, sans-serif',
  patrickhand: '"Patrick Hand", cursive',
  gaegu: '"Gaegu", cursive',
  monocraft: '"Monocraft", monospace',
  jetbrains: '"JetBrains Mono", monospace',
};

const loadedFonts = new Set(['default']);
let allFontsLoaded = false;

function loadFont(fontKey) {
  if (loadedFonts.has(fontKey)) return Promise.resolve();
  loadedFonts.add(fontKey);

  return new Promise(resolve => {
    if (fontKey === 'monocraft') {
      const style = document.createElement('style');
      style.textContent = `@font-face{font-family:'Monocraft';src:url('https://cdn.jsdelivr.net/gh/IdreesInc/Monocraft@main/dist/Monocraft-ttf/Monocraft.ttf') format('truetype');font-weight:normal;font-style:normal;}`;
      document.head.appendChild(style);
      setTimeout(resolve, 100);
    } else if (FONT_SOURCES[fontKey]) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = FONT_SOURCES[fontKey];
      link.onload = link.onerror = resolve;
      document.head.appendChild(link);
    } else {
      resolve();
    }
  });
}

function loadAllFonts() {
  if (allFontsLoaded) return Promise.resolve();
  return Promise.all(Object.keys(FONT_SOURCES).filter(k => k !== 'default').map(loadFont))
    .then(() => { allFontsLoaded = true; });
}

function setFontStyle(family) {
  let styleEl = document.getElementById('font-override-style');
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'font-override-style';
    document.head.appendChild(styleEl);
  }
  styleEl.textContent = `
    *{font-family:${family}!important;}
    .material-symbols-outlined{font-family:'Material Symbols Outlined'!important;}
    .material-icons{font-family:'Material Icons'!important;}
    .material-icons-round{font-family:'Material Icons Round'!important;}
    .fa,.fa-solid,.fa-regular,.fa-brands{font-family:'Font Awesome 7 Free','Font Awesome 7 Brands'!important;}
    #font-default .font-preview,#font-default .font-name{font-family:"Google Sans Flex",system-ui,sans-serif!important;}
    #font-patrickhand .font-preview,#font-patrickhand .font-name{font-family:"Patrick Hand",cursive!important;}
    #font-gaegu .font-preview,#font-gaegu .font-name{font-family:"Gaegu",cursive!important;}
    #font-monocraft .font-preview,#font-monocraft .font-name{font-family:"Monocraft",monospace!important;}
    #font-jetbrains .font-preview,#font-jetbrains .font-name{font-family:"JetBrains Mono",monospace!important;}
  `;
}

function applyFont(fontKey) {
  loadFont(fontKey).then(() => setFontStyle(FONT_FAMILY[fontKey]));
  localStorage.setItem('selectedFont', fontKey);
  document.querySelectorAll('.font-check').forEach(el => el.classList.remove('visible'));
  document.getElementById(`check-font-${fontKey}`)?.classList.add('visible');
  const display = document.getElementById('fontDisplay');
  if (display) display.textContent = document.querySelector(`#font-${fontKey} .font-name`)?.textContent || 'Default';
}

async function openFontModal() {
  const list = document.getElementById('fontList');
  openModal({ modalId: 'fontModal', boxId: 'fontBox', backdropId: 'fontBackdrop' });

  if (!allFontsLoaded) {
    list.style.cssText = 'opacity:0.4;pointer-events:none;transition:opacity 0.3s ease;';
    const spinner = document.createElement('div');
    spinner.id = 'fontLoadingSpinner';
    spinner.style.cssText = 'position:absolute;top:40%;left:50%;transform:translate(-50%,-50%);font-size:0.75rem;color:var(--md-sys-color-on-surface);opacity:0.5;font-family:"Google Sans Flex",sans-serif!important;white-space:nowrap;';
    spinner.textContent = 'Loading fonts...';
    document.getElementById('fontBox').appendChild(spinner);

    await loadAllFonts();
    list.style.opacity = '1';
    list.style.pointerEvents = '';
    spinner.remove();
  }
}

function closeFontModal() {
  closeModal({ modalId: 'fontModal', boxId: 'fontBox', backdropId: 'fontBackdrop' });
}

function initFont() {
  const saved = localStorage.getItem('selectedFont') || 'default';
  loadFont(saved).then(() => setFontStyle(FONT_FAMILY[saved]));
  document.querySelectorAll('.font-check').forEach(el => el.classList.remove('visible'));
  document.getElementById(`check-font-${saved}`)?.classList.add('visible');
  const display = document.getElementById('fontDisplay');
  if (display) display.textContent = document.querySelector(`#font-${saved} .font-name`)?.textContent || 'Default';
}

initFont();

const fontSizeSlider = document.getElementById('fontSizeSlider');
const fontSizeValue = document.getElementById('fontSizeValue');
let fontSizeTimer = null;

const savedSize = localStorage.getItem('fontSize') || '16';
fontSizeSlider.value = savedSize;
fontSizeValue.textContent = savedSize;
document.documentElement.style.fontSize = savedSize + 'px';

fontSizeSlider.addEventListener('input', () => {
  const size = fontSizeSlider.value;
  fontSizeValue.textContent = size;
  clearTimeout(fontSizeTimer);
  fontSizeTimer = setTimeout(() => {
    document.documentElement.style.fontSize = size + 'px';
    localStorage.setItem('fontSize', size);
    haptic(32);
  }, 500);
});

// backups

function backupData() {
  const o = {};
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
     if (k === 'feedCache_v1') continue; 
    o[k] = localStorage.getItem(k);
  }
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  const stamp = `${pad(now.getDate())}${pad(now.getMonth()+1)}${String(now.getFullYear()).slice(-2)}${pad(now.getHours())}${pad(now.getMinutes())}`;
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify({ v: 1, data: o })], { type: 'application/octet-stream' }));
  a.download = `Foodping_${stamp}.foodping-backup`;
  a.click();
  URL.revokeObjectURL(a.href);
}

function restoreData(f) {
  const r = new FileReader();
  r.onload = () => {
    const parsed = JSON.parse(r.result);
    const data = parsed.data || parsed;
    localStorage.clear();
    for (const k in data) {
      if (data[k] != null) localStorage.setItem(k, data[k]);
    }
    location.reload();
  };
  r.readAsText(f);
}

document.getElementById('backupBtn').onclick = () => {
  openAlert({
    title: 'Backup Data',
    msg: 'This will download all your data as a backup file.',
    buttons: [
      { label: 'Cancel', subtle: true },
      { label: 'Backup', bold: true, action: backupData }
    ]
  });
};

document.getElementById('restoreBtn').onclick = () => {
  openAlert({
    title: 'Restore Data',
    msg: 'This will replace all current data with the backup. This cannot be undone.',
    buttons: [
      { label: 'Cancel', subtle: true },
      {
        label: 'Restore', bold: true,
        action: () => {
          const i = document.createElement('input');
          i.type = 'file';
          i.accept = '.foodping-backup';
          i.onchange = e => {
            const f = e.target.files[0];
            if (!f) return;
            if (!f.name.endsWith('.foodping-backup')) {
              openAlert({ title: 'Wrong File', msg: 'Please select a valid .foodping-backup file.', buttons: [{ label: 'OK' }] });
              return;
            }
            restoreData(f);
          };
          i.click();
        }
      }
    ]
  });
};

// credits

function openCreditsModal() {
  openModal({ modalId: 'creditsModal', boxId: 'creditsBox', backdropId: 'creditsBackdrop' });
}

function closeCreditsModal() {
  closeModal({ modalId: 'creditsModal', boxId: 'creditsBox', backdropId: 'creditsBackdrop' });
}

function openLinkAlert(name, url) {
  openAlert({
    title: 'Open Link?',
    msg: `Visit ${name}'s GitHub profile?`,
    buttons: [
      { label: 'Cancel', subtle: true },
      { label: 'Open', bold: true, action: () => window.open(url, '_blank') }
    ]
  });
}

// feeds

function applyFeedToggle() {
  const enabled = localStorage.getItem('feedEnabled') === 'true';
  const btn = document.getElementById('feedNavBtn');
  btn.style.display = enabled ? 'flex' : 'none';
  if (!enabled && currentPage === 'feedpage') navigateTo('home');
}

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function extractRssImage(item) {
  if (item.enclosure?.link) return item.enclosure.link;
  if (item['media:content']?.url) return item['media:content'].url;
  if (item['media:thumbnail']?.url) return item['media:thumbnail'].url;
  const imgMatch = (item.content || item.description || '').match(/<img[^>]+src=["']([^"']+)["']/i);
  return imgMatch ? imgMatch[1] : null;
}

function stripHtml(html) {
  return (html || '').replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ').trim();
}

const FEED_CACHE_KEY = 'feedCache_v1';

function getCachedPosts() {
  try { return JSON.parse(localStorage.getItem(FEED_CACHE_KEY)); } catch { return null; }
}

function cachePosts(posts) {
  try { localStorage.setItem(FEED_CACHE_KEY, JSON.stringify(posts)); } catch {}
}

function clearFeedCache() {
  localStorage.removeItem(FEED_CACHE_KEY);

  if ('caches' in window) {
    caches.keys().then(names =>
      Promise.all(names.map(name => caches.delete(name)))
    );
  }
}

function mergeAndDedupe(cached, fresh) {
  const seen = new Set(cached.map(p => p.link));
  const merged = [...cached];
  fresh.forEach(p => { if (!seen.has(p.link)) merged.push(p); });
  merged.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
  return merged;
}

function openFeedDetail(post) {
  haptic(32);
  const detail = document.getElementById('feedDetail');
  const body = stripHtml(post.content || post.description || '');
  const paragraphs = body.split(/\n{2,}/).filter(Boolean).slice(0, 8).map(p => `<p>${p}</p>`).join('');

  detail.innerHTML = `
    <div class="feed-detail-bar">
      <button class="feed-back-btn" onclick="closeFeedDetail()">
        <span class="material-symbols-outlined">arrow_back</span>
      </button>
      <span class="feed-detail-bar-title">Post</span>
    </div>
    <div class="feed-detail-body">
      ${post.imgUrl ? `<div class="feed-detail-img"><img src="${post.imgUrl}" alt="" onclick="openImageViewer('${post.imgUrl}')" onerror="this.parentElement.remove()" style="cursor:zoom-in"></div>` : ''}
      <div class="feed-detail-meta">
        <span class="feed-tag">${post.source}</span>
        <span class="feed-time">${post.author || ''}</span>
        <span class="feed-time">${timeAgo(post.pubDate)}</span>
      </div>
      <div class="feed-detail-title">${post.title}</div>
      ${paragraphs
        ? `<div class="feed-detail-text">${paragraphs}</div>`
        : post.link
          ? `<a href="${post.link}" target="_blank" rel="noopener" class="feed-detail-link"><span class="material-symbols-outlined">link</span>${post.link.replace(/^https?:\/\//, '').slice(0, 55)}…</a>`
          : `<p class="feed-detail-empty">No text content.</p>`
      }
      ${post.link ? `<a href="${post.link}" target="_blank" rel="noopener" class="feed-detail-link" style="margin-top:.5rem"><span class="material-symbols-outlined">open_in_new</span>Read full article</a>` : ''}
    </div>
  `;

  detail.classList.add('open');
  history.pushState({ feedDetail: true }, '');
}

function closeFeedDetail() {
  haptic(22);
  document.getElementById('feedDetail').classList.remove('open');
  if (history.state?.feedDetail) {
    history.back();
  }
}

window.addEventListener('popstate', () => {
  if (document.getElementById('imgViewer')) return;
  if (document.getElementById('feedDetail').classList.contains('open')) {
    closeFeedDetail();
  }
});

function openImageViewer(src) {
  const existing = document.getElementById('imgViewer');
  if (existing) existing.remove();

  const viewer = document.createElement('div');
  viewer.id = 'imgViewer';
  viewer.style.cssText = `
    position: fixed;
    inset: 0;
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0,0,0,0);
    transition: background 0.32s cubic-bezier(.4,0,.2,1);
    cursor: zoom-out;
  `;

  const img = document.createElement('img');
  img.src = src;
  img.style.cssText = `
    max-width: 92vw;
    max-height: 88vh;
    border-radius: 14px;
    box-shadow: 0 8px 48px rgba(0,0,0,0.38);
    opacity: 0;
    transform: scale(0.82);
    transition: opacity 0.32s cubic-bezier(.4,0,.2,1), transform 0.32s cubic-bezier(.4,0,.2,1), border-radius 0.32s cubic-bezier(.4,0,.2,1);
    will-change: transform, opacity;
    cursor: zoom-out;
    user-select: none;
    -webkit-user-select: none;
  `;

  viewer.appendChild(img);
  document.body.appendChild(viewer);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      viewer.style.background = '#000';
      img.style.opacity = '1';
      img.style.transform = 'scale(1)';
    });
  });

  function animateOut() {
    viewer.style.background = 'rgba(0,0,0,0)';
    img.style.opacity = '0';
    img.style.transform = 'scale(0.82)';
    img.style.borderRadius = '28px';
    setTimeout(() => viewer.remove(), 340);
    haptic(22);
  }

  viewer.addEventListener('click', () => history.back());
  img.addEventListener('click', e => { e.stopPropagation(); history.back(); });

  history.pushState({ imgViewer: true }, '');

  window.addEventListener('popstate', function handler() {
    animateOut();
    window.removeEventListener('popstate', handler);
  });
}

function showFeedSkeleton() {
  document.getElementById('feedList').innerHTML = Array.from({ length: 5 }, () => `
    <div class="feed-skel-card">
      <div class="feed-skel feed-skel-img"></div>
      <div class="feed-skel feed-skel-title"></div>
      <div class="feed-skel feed-skel-title2"></div>
      <div class="feed-skel feed-skel-meta"></div>
    </div>
  `).join('');
}

function renderPosts(posts) {
  const list = document.getElementById('feedList');
  list.innerHTML = '';
  posts.forEach((post, i) => {
    const card = document.createElement('div');
    card.className = 'feed-card' + (i === 0 ? ' feed-card-featured' : '');
    card.style.animationDelay = `${i * 35}ms`;
    card.onclick = () => openFeedDetail(post);
    card.innerHTML = `
      ${post.imgUrl ? `<div class="feed-card-img"><img src="${post.imgUrl}" alt="" loading="lazy" onerror="this.parentElement.remove()"></div>` : ''}
      <span class="feed-card-index">${String(i + 1).padStart(2, '0')}</span>
      <div class="feed-card-title">${post.title}</div>
      <div class="feed-card-footer">
        <div class="feed-card-meta">
          <span class="feed-tag">${post.source}</span>
          <span class="feed-time">${timeAgo(post.pubDate)}</span>
        </div>
        <span class="material-symbols-outlined feed-card-chevron">chevron_right</span>
      </div>
    `;
    list.appendChild(card);
  });
}

const RSS_FEEDS = [
  { url: 'https://blog.myfitnesspal.com/feed/', source: 'MyFitnessPal' },
  { url: 'https://www.eatingwell.com/feed/', source: 'EatingWell' },
  { url: 'https://nutritionfacts.org/feed/', source: 'NutritionFacts' },
  { url: 'https://dontwastethecrumbs.com/feed/', source: 'Don\'t Waste the Crumbs' },
  { url: 'https://www.skinnytaste.com/feed/', source: 'Skinnytaste' },
  { url: 'https://zerowastechef.com/feed/', source: 'Zero-Waste Chef' },
];

async function fetchRssFeed(feedInfo) {
  const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedInfo.url)}&api_key=&count=10`;
  const res = await fetch(apiUrl, { signal: AbortSignal.timeout(8000), cache: 'no-store'  });
  if (!res.ok) throw new Error('bad status');
  const json = await res.json();
  if (json.status !== 'ok' || !json.items?.length) throw new Error('empty');
  return json.items.map(item => ({
    title: item.title || '',
    link: item.link || '',
    pubDate: item.pubDate || '',
    author: item.author || '',
    description: item.description || '',
    content: item.content || item.description || '',
    imgUrl: item.thumbnail || extractRssImage(item) || null,
    source: feedInfo.source,
  }));
}

const feedErrorHTML = (retry = 'loadFeed(true)') => `
  <div class="feed-error">
    <span class="material-symbols-outlined">wifi_off</span>
    <p>Couldn't load feed</p>
    <button class="md-btn" style="width:auto;padding:.6rem 1.5rem" onclick="${retry}">Retry</button>
  </div>
`;

let feedLoaded = false;

async function loadFeed(forceRefresh = false) {
  const refreshBtn = document.getElementById('feedRefreshBtn');
  const setRefreshing = (state) => {
    if (!refreshBtn) return;
    refreshBtn.classList.toggle('spinning', state);
    refreshBtn.disabled = state;
  };

  if (forceRefresh) {
    clearFeedCache();
    feedLoaded = false;
    showFeedSkeleton();
    setRefreshing(true);

    let fresh = [];
    const results = await Promise.allSettled(RSS_FEEDS.map(f => fetchRssFeed(f)));
    results.forEach(r => { if (r.status === 'fulfilled') fresh = fresh.concat(r.value); });
    setRefreshing(false);

    if (!fresh.length) { document.getElementById('feedList').innerHTML = feedErrorHTML(); return; }
    fresh.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
    cachePosts(fresh);
    feedLoaded = true;
    renderPosts(fresh);
    return;
  }

  const cached = getCachedPosts();
  if (cached?.length) {
    feedLoaded = true;
    renderPosts(cached);
    fetchFreshInBackground(cached);
    return;
  }

  showFeedSkeleton();
  setRefreshing(true);

  let fresh = [];
  const results = await Promise.allSettled(RSS_FEEDS.map(f => fetchRssFeed(f)));
  results.forEach(r => { if (r.status === 'fulfilled') fresh = fresh.concat(r.value); });
  setRefreshing(false);

  if (!fresh.length) { document.getElementById('feedList').innerHTML = feedErrorHTML(); return; }
  fresh.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
  cachePosts(fresh);
  feedLoaded = true;
  renderPosts(fresh);
}

async function fetchFreshInBackground(cached) {
  let fresh = [];
  const results = await Promise.allSettled(RSS_FEEDS.map(f => fetchRssFeed(f)));
  results.forEach(r => { if (r.status === 'fulfilled') fresh = fresh.concat(r.value); });
  if (!fresh.length) return;
  const merged = mergeAndDedupe(cached, fresh);
  cachePosts(merged);
  if (merged.length > cached.length) renderPosts(merged);
}

// init

document.addEventListener('DOMContentLoaded', () => {
  renderTable();
  initDevsEasterEgg();

  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      haptic(32);
      navigateTo(btn.dataset.page);
      if (btn.dataset.page === 'feedpage' && !feedLoaded) loadFeed();
    });
  });

  document.getElementById('timePickerCancel').onclick = () => closeTimePicker(false);
  document.getElementById('timePickerDone').onclick = () => closeTimePicker(true);
  document.getElementById('timePickerBackdrop').onclick = () => closeTimePicker(false);

  document.querySelectorAll('.md-btn').forEach(btn => {
    btn.addEventListener('click', e => { e.stopPropagation(); haptic(64); });
  });

  document.querySelectorAll('input').forEach(input => {
    input.addEventListener('focus', () => haptic(20));
  });

  document.querySelectorAll('.settings-row').forEach(row => {
    row.addEventListener('click', () => haptic(22));
  });

  const hapticToggle = document.getElementById('hapticToggle');
  hapticToggle.checked = hapticEnabled;
  hapticToggle.addEventListener('change', () => {
    hapticEnabled = hapticToggle.checked;
    localStorage.setItem('haptic', hapticEnabled ? 'on' : 'off');
    if (hapticEnabled) haptic(32);
  });

  const notifToggle = document.getElementById('notifToggle');
  notifToggle.checked = localStorage.getItem('notifEnabled') !== 'false';
  notifToggle.addEventListener('change', () => {
    haptic(22);
    localStorage.setItem('notifEnabled', notifToggle.checked);
    if (notifToggle.checked && Notification.permission === 'default') Notification.requestPermission();
  });

  const neuralToggle = document.getElementById('neuralLearning');
  neuralToggle.checked = localStorage.getItem('neuralLearning') === 'true';
  neuralToggle.addEventListener('change', () => localStorage.setItem('neuralLearning', neuralToggle.checked));

  const feedsToggle = document.getElementById('feeds');
  feedsToggle.checked = localStorage.getItem('feedEnabled') === 'true';
  applyFeedToggle();
  feedsToggle.addEventListener('change', () => {
    haptic(22);
    localStorage.setItem('feedEnabled', feedsToggle.checked);
    applyFeedToggle();
  });

  document.getElementById('notifTimeDisplay').textContent = localStorage.getItem('notifTime') || '8:00 AM';
  const cloudId = localStorage.getItem('cloud_id') || '';
  document.getElementById('cloudIdDisplay').textContent = cloudId ? 'Set' : 'Not set';
});

document.getElementById('rowDev').addEventListener('click', () => openLinkAlert('Izatifoodie', 'https://github.com/Izatifoodie'));
document.getElementById('rowDesigner').addEventListener('click', () => openLinkAlert('rynekryz', 'https://github.com/rynekryz'));
greetUser();
initTheme();
