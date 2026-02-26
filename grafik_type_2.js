/* ===== СОСТОЯНИЕ ===== */
let calendar2Date = new Date();
let currentGuard = null;
let calendarScheduleData = {};

/* ===== КНОПКА ПЕРЕКЛЮЧЕНИЯ ===== */
var scheduleTable = document.getElementById("scheduleTable");
var calendarView = document.getElementById("calendarView");
var toggleViewBtn = document.getElementById("toggleViewBtn");

toggleViewBtn.onclick = () => {
  scheduleTable.hidden = !scheduleTable.hidden;
  calendarView.hidden = !calendarView.hidden;
};

/* ===== КЛЮЧ ХРАНЕНИЯ ===== */
function getScheduleKeyForDate(date) {
  return "schedule_" + date.getFullYear() + "_" + date.getMonth();
}

/* ===== ЗАГРУЗКА ДАННЫХ ===== */
function loadScheduleDataForDate(date) {

  const key = getScheduleKeyForDate(date);
  const data = JSON.parse(localStorage.getItem(key)) || [];

  const out = {};

  data.forEach(emp => {

    const id = emp.id;
    if (!id) return;

    out[id] = {
      name: emp.name || "",
      shifts: {}
    };

    const shifts = emp.shifts || {};

    Object.keys(shifts).forEach(dayKey => {

      const val = shifts[dayKey];
      if (!val) return;

      const day = parseInt(dayKey, 10);
      if (isNaN(day)) return;

      const year = date.getFullYear();
      const month = date.getMonth();

      const dateStr =
        `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;

      out[id].shifts[dateStr] = val;

    });

  });

  return out;
}

/* ===== ЗАПОЛНЕНИЕ SELECT ===== */
function loadGuards() {

  guardSelect.innerHTML = "";

  Object.keys(calendarScheduleData).forEach(id => {

    const opt = document.createElement("option");
    opt.value = id;
    opt.textContent = calendarScheduleData[id].name || id;

    guardSelect.appendChild(opt);

  });

  currentGuard = guardSelect.value;
  if (typeof initChoicesOn === 'function') initChoicesOn('#guardSelect', { searchEnabled: true, shouldSort: false });
}

/* ===== РЕНДЕР КАЛЕНДАРЯ ===== */
function renderCalendar() {

  calendarGrid.innerHTML = "";

  const year = calendar2Date.getFullYear();
  const month = calendar2Date.getMonth();

  monthLabel.textContent =
    calendar2Date.toLocaleString("ru", { month:"long", year:"numeric" });

  const firstDay = new Date(year, month, 1).getDay() || 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  for (let i = 1; i < firstDay; i++) {
    calendarGrid.appendChild(document.createElement("div"));
  }

  for (let d = 1; d <= daysInMonth; d++) {

    const cell = document.createElement("div");
    cell.className = "calendar-cell";

    const dateStr =
      `${year}-${String(month+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;

    cell.innerHTML = `<div class="day">${d}</div>`;

    const shift = calendarScheduleData[currentGuard]?.shifts?.[dateStr];

    if (shift) {
      cell.innerHTML += `<div class="shift">${shift}</div>`;
    } else {
      cell.classList.add('cell-color-red');
    }

    calendarGrid.appendChild(cell);
  }
}

/* ===== НАВИГАЦИЯ ===== */

prevMonth.onclick = () => {

  calendar2Date.setMonth(calendar2Date.getMonth() - 1);

  calendarScheduleData = loadScheduleDataForDate(calendar2Date);

  loadGuards();
  renderCalendar();

};

nextMonth.onclick = () => {
  calendar2Date.setMonth(calendar2Date.getMonth() + 1);
  calendarScheduleData = loadScheduleDataForDate(calendar2Date);
  loadGuards();
  renderCalendar();

  if (guardSelect && guardSelect.value) {
    renderGuardPreview(guardSelect.value);
  }
};

guardSelect.onchange = () => {

  currentGuard = guardSelect.value;

  renderCalendar();
  renderGuardPreview(currentGuard);

};

/* ===== СТАРТ ===== */

calendarScheduleData = loadScheduleDataForDate(calendar2Date);

loadGuards();
renderCalendar();
renderGuardPreview(currentGuard);