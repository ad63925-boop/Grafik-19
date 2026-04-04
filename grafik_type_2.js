/* ===== СОСТОЯНИЕ ===== */
let calendar2Date = new Date();
let currentGuard = null;
let calendarScheduleData = {};

/* ===== КНОПКА ПЕРЕКЛЮЧЕНИЯ ===== */
var scheduleTable = document.getElementById("scheduleTable");
var calendarView = document.getElementById("calendarView");
var toggleViewBtn = document.getElementById("toggleViewBtn");
var prevMonths = document.getElementById("prevMonth");//Кнопка
var nextMonths = document.getElementById("nextMonth");//Кнопка
var calendarGrid = document.getElementById("calendarGrid");//Сетка календаря
var monthLabel = document.getElementById("monthLabel");
var guardSelect = document.getElementById("guardSelect");

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
    if (!guardSelect) return;

    const employees = getEmployees();
    guardSelect.innerHTML = '';

    employees.forEach(emp => {
        const opt = document.createElement("option");
        opt.value = emp.id; // ID — только в value
        opt.textContent = emp.name || `Охранник ${emp.id}`; // Имя — в тексте опции
        if (emp.id === currentGuard) opt.selected = true;
        guardSelect.appendChild(opt);

    });
    // Инициализируем выборщик, если функция доступна
    if (typeof initChoicesOn === 'function') {
        initChoicesOn('#guardSelect', { searchEnabled: true, shouldSort: false });
    }
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

/* ===== НАВИГАЦИЯ ===== */
prevMonths.addEventListener('click', () => {
    calendar2Date.setMonth(calendar2Date.getMonth() - 1);
    renderCalendar();
});

nextMonths?.addEventListener('click', () => {
    calendar2Date.setMonth(calendar2Date.getMonth() + 1);
    renderCalendar();
});

// Смена охранника
guardSelect.onchange = () => {
    currentGuard = guardSelect.value;

    // Находим имя выбранного охранника
    const employees = getEmployees();
    const selectedEmployee = employees.find(emp => emp.id === currentGuard);
    const guardName = selectedEmployee ? selectedEmployee.name : 'Неизвестный охранник';

    // Обновляем какой‑либо элемент с именем охранника (если есть)
    const guardNameDisplay = document.getElementById('guardNameDisplay');
    if (guardNameDisplay) {
        guardNameDisplay.textContent = guardName;
    }

    renderGuardPreview(currentGuard);
    renderCalendar();
};

/* ===== ПРЕДПРОСМОТР ГРАФИКА ОХРАННИКА ===== */

function renderGuardPreview(guardId) {
    const monthLabel = document.getElementById('monthLabel');
    const guardSelect = document.getElementById('guardSelect');

    if (!monthLabel || !guardSelect) {
        console.error('Элементы календаря не найдены');
        return;
    }

    // Обновляем заголовок месяца
    const monthNames = [
        'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
        'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
    ];
    monthLabel.textContent = `${monthNames[calendar2Date.getMonth()]} ${calendar2Date.getFullYear()}`;

    // Заполняем список охранников
    const employees = getEmployees();
    guardSelect.innerHTML = '';
    employees.forEach(emp => {
        const option = document.createElement('option');
        option.value = emp.id;
        option.textContent = emp.name || `Охранник ${emp.id}`;
        if (emp.id === guardId) option.selected = true;
        guardSelect.appendChild(option);
    });
}

/* ===== СТАРТ ===== */

calendarScheduleData = loadScheduleDataForDate(calendar2Date);

// Устанавливаем первого охранника по умолчанию
const employees = getEmployees();
if (employees.length > 0) {
    currentGuard = employees[0].id;
}

loadGuards();
renderCalendar();
renderGuardPreview(currentGuard);