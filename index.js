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

const navOrder = ['home', 'logs', 'settings', 'about'];
let currentPage = 'home';
let hapticEnabled = localStorage.getItem('haptic') !== 'off';

function haptic(pattern = 32) {
  if (!hapticEnabled) return;
  if (navigator.vibrate) navigator.vibrate(pattern);
}

function navigateTo(targetPage) {
  if (targetPage === currentPage) return;

  const currentIndex = navOrder.indexOf(currentPage);
  const targetIndex  = navOrder.indexOf(targetPage);
  const goingRight   = targetIndex > currentIndex;

  const current = document.getElementById(currentPage);
  const target  = document.getElementById(targetPage);

  target.classList.add(goingRight ? 'slide-from-right' : 'slide-from-left');

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      target.classList.remove('slide-from-right', 'slide-from-left');
      target.classList.add('active');

      current.classList.add(goingRight ? 'slide-out-left' : 'slide-out-right');
      current.classList.remove('active');

      setTimeout(() => {
        current.classList.remove('slide-out-left', 'slide-out-right');
      }, 350);
    });
  });

  document.querySelectorAll('.nav-item').forEach(n => {
    n.classList.toggle('active', n.dataset.page === targetPage);
  });

  currentPage = targetPage;
}

function closeAlert() {
  const box      = document.getElementById('customAlertBox');
  const backdrop = document.getElementById('customAlertBackdrop');
  const wrapper  = document.getElementById('customAlert');
  haptic(10);
  box.style.animation      = 'alertPopOut 0.2s ease forwards';
  backdrop.style.animation = 'alertFadeOut 0.2s ease forwards';
  setTimeout(() => {
    wrapper.style.display = 'none';
    document.getElementById('customAlertTitle').textContent = 'FoodPing';
    const actions = document.getElementById('customAlertActions');
    actions.innerHTML = '<button id="customAlertBtn">OK</button>';
  }, 200);
}

function openAlert({ title = 'FoodPing', msg, buttons }) {
  const wrapper  = document.getElementById('customAlert');
  const msgEl    = document.getElementById('customAlertMsg');
  const titleEl  = document.getElementById('customAlertTitle');
  const box      = document.getElementById('customAlertBox');
  const backdrop = document.getElementById('customAlertBackdrop');
  const actions  = document.getElementById('customAlertActions');

  titleEl.textContent = title;
  msgEl.textContent   = msg;
  actions.innerHTML   = '';

  buttons.forEach((b, i) => {
    if (i > 0) {
      const div = document.createElement('div');
      div.className = 'alert-btn-divider';
      actions.appendChild(div);
    }
    const btn = document.createElement('button');
    btn.textContent   = b.label;
    btn.style.color   = b.danger ? 'var(--md-sys-color-primary)' : b.subtle ? 'var(--md-sys-color-on-surface)' : 'var(--md-sys-color-primary)';
    btn.style.fontWeight = b.bold ? '600' : '400';
    btn.className     = 'alert-action-btn';
    btn.onclick       = () => { closeAlert(); b.action?.(); };
    actions.appendChild(btn);
  });

  wrapper.style.display = 'flex';
  box.style.animation = 'none';
  backdrop.style.animation = 'none';
  requestAnimationFrame(() => {
    box.style.animation      = 'alertPopIn 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards';
    backdrop.style.animation = 'alertFadeIn 0.25s ease forwards';
  });
}

function showAlert(msg) {
  openAlert({
    title: 'FoodPing',
    msg,
    buttons: [{ label: 'OK', bold: false }]
  });
}

function confirmReset() {
  haptic(32);
  openAlert({
    title: 'Reset All Data',
    msg: 'This will delete all foods, settings and saved data. This cannot be undone.',
    buttons: [
      {
        label: 'Reset',
        bold: true,
        danger: true,
        action: () => {
          haptic([30, 50, 30]);
          localStorage.clear();
          renderTable();
          hapticEnabled = true;
          document.getElementById('hapticToggle').checked  = true;
          document.getElementById('notifToggle').checked   = true;
          document.getElementById('notifTimeDisplay').textContent = '8:00 AM';
        }
      },
      {
        label: 'Cancel',
        bold: false,
        subtle: true
      }
    ]
  });
}

function buildDrum(el, items, selectedIndex) {
  el.innerHTML = '';
  items.forEach(item => {
    const div = document.createElement('div');
    div.className = 'drum-item';
    div.textContent = item;
    el.appendChild(div);
  });
  setTimeout(() => { el.scrollTop = selectedIndex * 44; }, 50);
}

function getDrumIndex(el) {
  return Math.round(el.scrollTop / 44);
}

function openTimePicker() {
  haptic(32);
  const saved  = localStorage.getItem('notifTime') || '8:00 AM';
  const parts  = saved.split(/[: ]/);
  const hour   = parseInt(parts[0]);
  const minute = parseInt(parts[1]);
  const ampm   = parts[2] || 'AM';

  buildDrum(document.getElementById('hourDrum'),   Array.from({length: 12}, (_, i) => String(i + 1)), hour - 1);
  buildDrum(document.getElementById('minuteDrum'), Array.from({length: 60}, (_, i) => String(i).padStart(2, '0')), minute);
  buildDrum(document.getElementById('ampmDrum'),   ['AM', 'PM'], ampm === 'AM' ? 0 : 1);

  const picker   = document.getElementById('timePicker');
  const sheet    = document.getElementById('timePickerSheet');
  const backdrop = document.getElementById('timePickerBackdrop');

  picker.style.display = 'flex';
  sheet.style.animation    = 'none';
  backdrop.style.animation = 'none';
  requestAnimationFrame(() => {
    sheet.style.animation    = 'sheetSlideUp 0.4s cubic-bezier(0.34,1.2,0.64,1) forwards';
    backdrop.style.animation = 'alertFadeIn 0.25s ease forwards';
  });
}

function closeTimePicker(save) {
  haptic(10);
  const sheet    = document.getElementById('timePickerSheet');
  const backdrop = document.getElementById('timePickerBackdrop');
  const picker   = document.getElementById('timePicker');

  if (save) {
    const h = getDrumIndex(document.getElementById('hourDrum')) + 1;
    const m = getDrumIndex(document.getElementById('minuteDrum'));
    const a = getDrumIndex(document.getElementById('ampmDrum')) === 0 ? 'AM' : 'PM';
    const formatted = `${h}:${String(m).padStart(2, '0')} ${a}`;
    localStorage.setItem('notifTime', formatted);
    document.getElementById('notifTimeDisplay').textContent = formatted;
  }

  sheet.style.animation    = 'sheetSlideDown 0.3s ease forwards';
  backdrop.style.animation = 'alertFadeOut 0.3s ease forwards';
  setTimeout(() => { picker.style.display = 'none'; }, 300);
}

document.getElementById('timePickerCancel').onclick   = () => closeTimePicker(false);
document.getElementById('timePickerDone').onclick     = () => closeTimePicker(true);
document.getElementById('timePickerBackdrop').onclick = () => closeTimePicker(false);

document.addEventListener('DOMContentLoaded', () => {
  renderTable();

  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      haptic(32);
      navigateTo(btn.dataset.page);
    });
  });

  document.querySelectorAll('.md-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      haptic(64);
    });
  });

  document.querySelectorAll('input').forEach(input => {
    input.addEventListener('focus', () => haptic(10));
  });

  document.querySelectorAll('.settings-row').forEach(row => {
    row.addEventListener('click', () => haptic(20));
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
    haptic(20);
    localStorage.setItem('notifEnabled', notifToggle.checked ? 'true' : 'false');
    if (notifToggle.checked && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  });

  document.getElementById('notifTimeDisplay').textContent = localStorage.getItem('notifTime') || '8:00 AM';
});

function getFoods() {
  return JSON.parse(localStorage.getItem('foods')) || [];
}

function saveFoods(foods) {
  localStorage.setItem('foods', JSON.stringify(foods));
}

function parseDate(dateStr) {
  const parts = dateStr.split('/');
  let year = parseInt(parts[2]);
  if (year < 100) year += 2000;
  return new Date(year, parseInt(parts[1]) - 1, parseInt(parts[0]));
}

function addFood() {
  const name = document.getElementById('foodName').value.trim();
  const date = document.getElementById('expiryDate').value.trim();

  if (!name || !date) {
    showAlert('Please enter the name and expiry date!');
    return;
  }

  if (date.split('/').length !== 3) {
    showAlert('Date format must be DD/MM/YY');
    return;
  }

  haptic([30, 40, 30]);
  const foods = getFoods();
  foods.push({ name, date });
  saveFoods(foods);
  renderTable();

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

  foods.forEach((food, index) => {
    const diffDays = Math.ceil((parseDate(food.date) - now) / (1000 * 60 * 60 * 24));

    const dataRow = table.insertRow();
    dataRow.className = 'data-row';
    dataRow.insertCell(0).textContent = food.name;
    dataRow.insertCell(1).textContent = food.date;

    const statusCell = dataRow.insertCell(2);
    if (diffDays > 3) {
      statusCell.textContent = `🟢 ${diffDays} days remaining`;
      statusCell.style.color = 'green';
    } else if (diffDays > 0) {
      statusCell.textContent = `🟡 ${diffDays} days remaining`;
      statusCell.style.color = 'orange';
    } else if (diffDays === 0) {
      statusCell.textContent = '🔴 Expired Today';
      statusCell.style.color = 'red';
    } else {
      statusCell.textContent = '🔴 Expired';
      statusCell.style.color = 'red';
    }

    const btnRow = table.insertRow();
    btnRow.className = 'btn-row';
    const btnCell = btnRow.insertCell(0);
    btnCell.colSpan = 3;

    const delBtn = document.createElement('button');
    delBtn.textContent = 'Delete';
    Object.assign(delBtn.style, {
      width: '100%',
      backgroundColor: 'var(--md-sys-color-primary)',
      color: 'var(--md-sys-color-on-primary)',
      border: 'none',
      borderRadius: '16px',
      padding: '8px',
      cursor: 'pointer',
      marginBottom: '4px'
    });

    delBtn.onclick = () => {
      haptic([20, 30, 20]);
      const foods = getFoods();
      localStorage.removeItem(`notified_${foods[index].name}_${foods[index].date}`);
      foods.splice(index, 1);
      saveFoods(foods);
      renderTable();
    };

    btnCell.appendChild(delBtn);
  });
}

function deleteAllExpired() {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const foods = getFoods();
  const expired = foods.filter(food => parseDate(food.date) < now);
  expired.forEach(food => {
    localStorage.removeItem(`notified_${food.name}_${food.date}`);
  });

  haptic([20, 30, 20]);
  saveFoods(foods.filter(food => parseDate(food.date) >= now));
  renderTable();
}
