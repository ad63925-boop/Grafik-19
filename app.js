//Инициализация приложения

/* APP */

let graphChanged = false;
let todayDate = new Date();

document.getElementById("monthPicker").value =
    currentDate.getFullYear() + "-" + String(currentDate.getMonth()+1).padStart(2,"0");

// Переключение панели настроек
var btnSetting = document.getElementById("btnSetting");

const panelSeting = document.getElementById('panelSeting');
btnSetting.addEventListener("click", function() {
    if (panelSeting.classList.contains('is-hidden')) {
        panelSeting.classList.remove('is-hidden');  
}
    else {
        panelSeting.classList.add('is-hidden');
    }
});

document.addEventListener("click", e => {
    const panel = document.getElementById("panelSeting");
    const btn = document.getElementById("btnSetting");

if (panel && btn && !panel.contains(e.target) && !btn.contains(e.target)) {
    panel.classList.add("is-hidden");
}
});

// Предупреждение при попытке закрыть вкладку, если были изменения в графике
window.addEventListener("beforeunload", function (e) {

    if (!graphChanged) return undefined;

    const msg =
        "График был изменён.\nРекомендуется сделать экспорт данных.";

    e.preventDefault();
    e.returnValue = msg;

    return msg;
});

// Функция для печати графика с настройками масштаба и количеством копий
var btnPrintSchedule = document.getElementById("btnPrintSchedule");
btnPrintSchedule.addEventListener("click", printSchedule);
function printSchedule() {
  const scale = document.getElementById("printScale").value;
  const table = document.getElementById("scheduleTable");
  const printContainer = document.getElementById("print-container");
  const copiInput = Number(document.getElementById('copiInput').value) || 1;

  // 1. Очищаем контейнер для печати
  printContainer.innerHTML = "";

  // 2. Создаём копии таблицы
  for (let i = 0; i < copiInput; i++) {
    const clone = table.cloneNode(true);
    clone.style.margin = "5px 0";
    clone.style.display = "inline-block";
    clone.style.width = `calc(${100 / copiInput}% - 20px)`; // copiInput таблицы в ряд
    clone.style.verticalAlign = "center";
    printContainer.appendChild(clone);
  }

  // 3. Применяем масштаб ко всем копиям
  const tables = printContainer.querySelectorAll("table");
  tables.forEach(tbl => {
    tbl.style.transform = `scale(${scale})`;
    tbl.style.transformOrigin = "top center";
  });

  // 4. Показываем контейнер только для печати
  printContainer.style.display = "block";
  
  // 5. Запускаем печать
  window.print();

  // 6. После печати скрываем контейнер и очищаем его
  printContainer.style.display = "none";
  printContainer.innerHTML = "";
}

// Назначение смен по датам из календаря
let selectedBatchDates = new Set();

async function initBatchForm() {
  await populateBatchForm();
}

async function populateBatchForm() {
  const empSelect = document.getElementById("batchEmpSelect");
  const shiftSelect = document.getElementById("batchShiftSelect");

  if (!empSelect || !shiftSelect) return;

  empSelect.innerHTML = '<option value="">-- выбрать --</option>';
  shiftSelect.innerHTML = '<option value="">-- смена --</option>';

  const employees = await getEmployees();

  employees.forEach(emp => {
    const option = document.createElement("option");
    option.value = emp.id;
    option.textContent = emp.name;
    empSelect.appendChild(option);
  });

  SHIFT_TYPES.forEach(shift => {
    if (!shift) return;

    const option = document.createElement("option");
    option.value = shift;
    option.textContent = shift;
    shiftSelect.appendChild(option);
  });

  selectedBatchDates.clear();
  renderBatchCalendar();
}

function renderBatchCalendar() {
  const grid = document.getElementById("batchCalendarGrid");
  const monthLabel = document.getElementById("batchCalendarMonth");
  const selectedLabel = document.getElementById("batchSelectedDates");

  if (!grid || !monthLabel || !selectedLabel) return;

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const emptyCells = firstDay === 0 ? 6 : firstDay - 1;

  monthLabel.textContent = currentDate.toLocaleDateString("ru-RU", {
    month: "long",
    year: "numeric"
  });

  grid.innerHTML = "";

  for (let i = 0; i < emptyCells; i++) {
    const empty = document.createElement("span");
    empty.className = "batch-calendar-empty";
    grid.appendChild(empty);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const btn = document.createElement("button");
    const date = new Date(year, month, day);
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;

    btn.type = "button";
    btn.textContent = day;
    btn.className = "batch-calendar-day";
    btn.classList.toggle("is-weekend", isWeekend);
    btn.classList.toggle("is-selected", selectedBatchDates.has(day));

    btn.addEventListener("click", () => {
      if (selectedBatchDates.has(day)) {
        selectedBatchDates.delete(day);
      } else {
        selectedBatchDates.add(day);
      }

      renderBatchCalendar();
    });

    grid.appendChild(btn);
  }

  updateBatchSelectedDatesLabel();
}

function updateBatchSelectedDatesLabel() {
  const selectedLabel = document.getElementById("batchSelectedDates");
  if (!selectedLabel) return;

  const dates = Array.from(selectedBatchDates).sort((a, b) => a - b);

  selectedLabel.textContent = dates.length
    ? `Выбрано: ${dates.join(", ")}`
    : "Даты не выбраны";
}

function clearBatchDates() {
  selectedBatchDates.clear();
  renderBatchCalendar();
}

async function applyBatchShifts() {
  const empSelect = document.getElementById("batchEmpSelect");
  const shiftSelect = document.getElementById("batchShiftSelect");

  const employeeId = empSelect.value;
  const shift = shiftSelect.value;
  const dates = Array.from(selectedBatchDates).sort((a, b) => a - b);

  if (!employeeId) return showNotification("warning", "Выберите сотрудника");
  if (!shift) return showNotification("warning", "Выберите смену");
  if (!dates.length) return showNotification("warning", "Выберите даты");

  const key = getKey();
  const snapshot = await dbGet(dbRef(`/schedules/${key}`));
  let data = snapshot.exists() ? snapshot.val() : [];

  if (!Array.isArray(data)) data = [];

  let employee = data.find(item => String(item.id) === String(employeeId));

  if (!employee) {
    employee = {
      id: Number(employeeId),
      shifts: {}
    };
    data.push(employee);
  }

  if (!employee.shifts) employee.shifts = {};

  dates.forEach(day => {
    employee.shifts[day] = shift;
  });

  await dbSet(dbRef(`/schedules/${key}`), data);

  graphChanged = true;
  await renderTable(data);
  closeBatchForm();
  
  showNotification("success", `Смена "${shift}" назначена на ${dates.length} дн.`);
}

function closeBatchForm() {
  const batchPanel = document.getElementById("batchShift");
  batchPanel.classList.remove("batch-shift-form-block");
  panelSeting.classList.remove("is-hidden");
}

document.addEventListener("DOMContentLoaded", function() {
  const showBatchBtn = document.getElementById("btnShowapplyBatchShift");
  const closeBtn = document.getElementById("btnCloseBath");
  const applyBtn = document.getElementById("btnApplyBatchShifts");
  const clearDatesBtn = document.getElementById("btnClearBatchDates");
  const batchPanel = document.getElementById("batchShift");

  showBatchBtn.addEventListener("click", async function() {
    batchPanel.classList.add("batch-shift-form-block");
    panelSeting.classList.add("is-hidden");
    await populateBatchForm();
  });

  closeBtn.addEventListener("click", closeBatchForm);
  applyBtn.addEventListener("click", applyBatchShifts);
  clearDatesBtn.addEventListener("click", clearBatchDates);
});
// Конец назначения смен по датам из календаря

//Показать скрыть панель с сотрудниками
const panel = document.getElementById("employeesPanel");

var btnShowEmployeesPanel = document.getElementById("btnShowEmployeesPanel");
btnShowEmployeesPanel.addEventListener("click", showEmployeesPanel);

function showEmployeesPanel() {
    employeesPanel.style.display = "block";
    panelSeting.classList.add("is-hidden");

    renderEmployeesPanel();
}

// Эта функция вызывается при клике на кнопку закрытия панели сотрудников
var btnCloseEmployeesPanel = document.getElementById("btnCloseEmployeesPanel");
btnCloseEmployeesPanel.addEventListener("click", closeEmployeesPanel);
function closeEmployeesPanel() {
    panel.style.display = "none";
}

//Экспорт и импорт
//Кнопки
const btnExportData = document.getElementById("btnExportData");
const btnImportData = document.getElementById("btnImportData");
const fileInput = document.getElementById("fileInput");

if (btnExportData) {
  btnExportData.addEventListener("click", exportData);
}

if (btnImportData && fileInput) {
  btnImportData.addEventListener("click", () => {
    fileInput.click();
  });
}

//Экспорт данных в JSON файл
async function exportData() {
  try {
    const key = getKey();

    const employeesSnapshot = await dbGet(dbRef("employees"));
    const scheduleSnapshot = await dbGet(dbRef(`/schedules/${key}`));

    const exportObject = {
      version: 1,
      exportedAt: new Date().toISOString(),
      monthKey: key,
      employees: employeesSnapshot.exists() ? employeesSnapshot.val() : [],
      schedule: scheduleSnapshot.exists() ? scheduleSnapshot.val() : []
    };

    const json = JSON.stringify(exportObject, null, 2);
    const blob = new Blob([json], { type: "application/json;charset=utf-8" });

    saveAs(blob, `${key}_backup.json`);

    if (typeof Swal !== "undefined") {
      Swal.fire({
        icon: "success",
        title: "Экспорт готов",
        text: `Файл ${key}_backup.json сохранен`,
        timer: 1800,
        showConfirmButton: false
      });
    }
  } catch (error) {
    console.error("Ошибка экспорта:", error);
    showNotification("error", "Не удалось экспортировать данные");
  }
}

//Импорт данных из JSON файла
async function importData(event) {
  const file = event.target.files[0];
  if (!file) return;

  try {
    const text = await file.text();
    const imported = JSON.parse(text);

    if (!imported || !imported.monthKey) {
      throw new Error("Некорректный файл импорта");
    }

    const currentKey = getKey();

    const confirmed = confirm(
      `Импортировать данные из файла?\n\n` +
      `Месяц в файле: ${imported.monthKey}\n` +
      `Текущий месяц: ${currentKey}\n\n` +
      `Сотрудники и график текущего месяца будут перезаписаны.`
    );

    if (!confirmed) return;

    const employees = Array.isArray(imported.employees) ? imported.employees : [];
    const schedule = Array.isArray(imported.schedule) ? imported.schedule : [];

    await dbSet(dbRef("employees"), employees);
    await dbSet(dbRef(`/schedules/${currentKey}`), schedule);

    await updateEmployeeSelect();
    await renderTable(schedule);

    if (typeof renderEmployeesPanel === "function") {
      await renderEmployeesPanel();
    }

    if (typeof Swal !== "undefined") {
      Swal.fire({
        icon: "success",
        title: "Импорт завершен",
        text: "Данные успешно загружены",
        timer: 1800,
        showConfirmButton: false
      });
    }
  } catch (error) {
    console.error("Ошибка импорта:", error);
    showNotification("error", "Не удалось импортировать файл");
  } finally {
    event.target.value = "";
  }
}

async function initializeApp() {
  try {
    await updateEmployeeSelect();
    if (typeof renderTable === 'function') {
      await renderTable();
    } else {
      console.warn('Функция renderTable не найдена, пропускаем отрисовку таблицы');
    }
    initBatchForm();
    console.log('Приложение успешно инициализировано');
  } catch (error) {
    console.error('Ошибка инициализации приложения:', error);
    showNotification('error', 'Не удалось загрузить приложение. Проверьте консоль.');
  }
}


// Вызываем при загрузке страницы
window.addEventListener("load", async () => {
  await initializeApp();
  initBatchForm();
});

//для запуска приложения после загрузки DOM и инициализации Firebase
document.addEventListener('DOMContentLoaded', () => {
  if (window.firebaseReady) {
    console.log('Firebase готов при загрузке DOM');
    // Ваш основной код инициализации приложения
  } else {
    console.error("Firebase не готов при загрузке DOM");
  }
});
