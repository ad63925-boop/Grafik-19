const EMPLOYEE_CALENDAR_DEFAULT_NAME = "Демиденко А.О.";

document.addEventListener("DOMContentLoaded", () => {
  initEmployeeCalendar();
  initEmployeeCalendarToggle();
});

async function initEmployeeCalendar() {
  const select = document.getElementById("employeeCalendarSelect");

  if (!select) return;

  select.addEventListener("change", renderEmployeeCalendar);

  await fillEmployeeCalendarSelect();
  await renderEmployeeCalendar();
}

function initEmployeeCalendarToggle() {
  const toggleBtn = document.getElementById("toggleViewBtn");
  const calendarSection = document.getElementById("employeeCalendarSection");

  if (!toggleBtn || !calendarSection) return;

  toggleBtn.addEventListener("click", async () => {
    const shouldShow = calendarSection.hidden;

    calendarSection.hidden = !shouldShow;

    if (shouldShow) {
      await renderEmployeeCalendar();

      calendarSection.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });
    }
  });
}

async function fillEmployeeCalendarSelect() {
  const select = document.getElementById("employeeCalendarSelect");
  if (!select) return;

  const employees = await getEmployees();
  const list = Array.isArray(employees) ? employees : [];

  select.innerHTML = "";

  list.forEach(employee => {
    const option = document.createElement("option");
    option.value = employee.id;
    option.textContent = employee.name;

    if (normalizeName(employee.name) === normalizeName(EMPLOYEE_CALENDAR_DEFAULT_NAME)) {
      option.selected = true;
    }

    select.appendChild(option);
  });

  if (!select.value && list.length > 0) {
    select.value = list[0].id;
  }
}

async function renderEmployeeCalendar() {
  const grid = document.getElementById("employeeCalendarGrid");
  const select = document.getElementById("employeeCalendarSelect");
  const title = document.getElementById("employeeCalendarTitle");
  const monthName = document.getElementById("employeeCalendarMonthName");

  if (!grid || !select || !title || !monthName) return;

  const employeeId = select.value;
  const employeeName = select.options[select.selectedIndex]?.textContent || "Сотрудник";
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  title.textContent = `График: ${employeeName}`;
  monthName.textContent = currentDate.toLocaleDateString("ru-RU", {
    month: "long",
    year: "numeric"
  });

  grid.innerHTML = '<div class="employee-calendar-loading">Загрузка графика...</div>';

  try {
    const data = await loadMonthDataFromFirebase();
    const schedule = Array.isArray(data) ? data : [];
    const employeeRow = schedule.find(row => String(row.id) === String(employeeId));
    const shifts = employeeRow?.shifts || {};

    drawEmployeeCalendarGrid(grid, year, month, shifts);
  } catch (error) {
    console.error("Ошибка отрисовки календаря сотрудника:", error);
    grid.innerHTML = '<div class="employee-calendar-empty">Не удалось загрузить календарь</div>';
  }
}

function drawEmployeeCalendarGrid(grid, year, month, shifts) {
  const weekNumbers = getMonthWeekNumbers(year, month);
  const rows = buildEmployeeCalendarRows(year, month);
  const dayLabels = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

  grid.innerHTML = "";
  grid.style.setProperty("--employee-calendar-columns", weekNumbers.length);

  const corner = document.createElement("div");
  corner.className = "employee-calendar-corner";
  grid.appendChild(corner);

  weekNumbers.forEach(weekNumber => {
    const cell = document.createElement("div");
    cell.className = "employee-calendar-week";
    cell.textContent = weekNumber;
    grid.appendChild(cell);
  });

  rows.forEach((days, rowIndex) => {
    const label = document.createElement("div");
    label.className = "employee-calendar-day-label";
    label.textContent = dayLabels[rowIndex];
    grid.appendChild(label);

    days.forEach(day => {
      const cell = document.createElement("div");
      cell.className = "employee-calendar-cell";

      if (!day) {
        cell.classList.add("is-empty");
        grid.appendChild(cell);
        return;
      }

      const shift = shifts[day] || "";

      if (rowIndex >= 5) {
        cell.classList.add("is-weekend");
      }

      cell.innerHTML = `
        <div class="employee-calendar-date">${day}</div>
        <div class="employee-calendar-shift ${shift ? "" : "is-day-off"}">
          ${getCalendarShiftLabel(shift)}
        </div>
      `;

      grid.appendChild(cell);
    });
  });
}

function buildEmployeeCalendarRows(year, month) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const weekCount = getMonthWeekNumbers(year, month).length;
  const rows = Array.from({ length: 7 }, () => Array(weekCount).fill(null));

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const weekdayIndex = (date.getDay() + 6) % 7;
    const weekIndex = getWeekIndexInMonth(date, year, month);

    rows[weekdayIndex][weekIndex] = day;
  }

  return rows;
}

function getMonthWeekNumbers(year, month) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const weeks = [];

  for (let day = 1; day <= daysInMonth; day++) {
    const week = getIsoWeekNumber(new Date(year, month, day));

    if (!weeks.includes(week)) {
      weeks.push(week);
    }
  }

  return weeks;
}

function getWeekIndexInMonth(date, year, month) {
  const weekNumbers = getMonthWeekNumbers(year, month);
  const week = getIsoWeekNumber(date);

  return weekNumbers.indexOf(week);
}

function getIsoWeekNumber(date) {
  const target = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNumber = target.getUTCDay() || 7;

  target.setUTCDate(target.getUTCDate() + 4 - dayNumber);

  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));

  return Math.ceil((((target - yearStart) / 86400000) + 1) / 7);
}

function getCalendarShiftLabel(shift) {
  if (!shift) return "";

  const labels = {
    "Д": "Ден",
    "Н": "Ноч",
    "О": "Отк",
    "У": "У",
    "З": "Уз",
    "Уо": "Уо",
    "Уз": "Уз",
    "Ун": "Ун",
    "Р": "Рез",
    "Т": "Тр",
    "П": "Пр",
    "К": "Ком"
  };

  return labels[shift] || shift;
}

function normalizeName(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}