if (save) {
    const h = getDrumIndex(document.getElementById('hourDrum')) + 1;
    const m = getDrumIndex(document.getElementById('minuteDrum'));
    const a = getDrumIndex(document.getElementById('ampmDrum')) === 0 ? 'AM' : 'PM';
    const formatted = `${h}:${String(m).padStart(2, '0')} ${a}`;
    googlesheets.setItem('notifTime', formatted);
    document.getElementById('notifTimeDisplay').textContent = formatted;
  }
