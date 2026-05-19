//Инициализация приложения

/* APP */

let graphChanged = false;
let todayDate = new Date();

window.currentDate = new Date();
window.currentDate.setDate(1);


document.getElementById("monthPicker").value =
    currentDate.getFullYear() + "-" + String(currentDate.getMonth()+1).padStart(2,"0");



// Вызываем инициализацию при загрузке страницы
window.addEventListener("load", initBatchForm);


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

// Инициализация выпадающих списков при загрузке
function initBatchForm() {
  const empSelect = document.getElementById("batchEmpSelect");
  const shiftSelect = document.getElementById("batchShiftSelect");
  const dateSelect = document.getElementById("batchDatesSelect");

  if (!empSelect || !shiftSelect || !dateSelect) return;

  empSelect.innerHTML = "";

  // Получаем список сотрудников
  const list = getEmployees();

  // Проверка: если list не массив, используем пустой массив
  const employees = Array.isArray(list) ? list : [];

  employees.forEach((emp, index) => {
    const option = document.createElement("option");
    option.value = emp.id; // Используем ID сотрудника
    option.textContent = `${emp.name} (ID: ${emp.id})`;
    empSelect.appendChild(option);
  });

  // Заполняем смены
  SHIFT_TYPES.forEach(shift => {
    if (!shift) return;

    const option = document.createElement("option");
    option.value = shift;
    option.textContent = shift;
    shiftSelect.appendChild(option);
  });

  // Заполняем даты
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  dateSelect.innerHTML = "";
  for (let d = 1; d <= daysInMonth; d++) {
    const option = document.createElement("option");
    option.value = d;
    option.textContent = d;
    dateSelect.appendChild(option);
  }
}


//Добавление смен по датам и сотрудникам
document.addEventListener('DOMContentLoaded', function() {
    const showBatchBtn = document.getElementById('btnShowapplyBatchShift');
    const closeBtn = document.getElementById('btnCloseBath');
    const batchPanel = document.getElementById('batchShift');

    function populateBatchForm() {
        const empSelect = document.getElementById('batchEmpSelect');
        const shiftSelect = document.getElementById('batchShiftSelect');
        const dateSelect = document.getElementById('batchDatesSelect');

        empSelect.innerHTML = '<option value="">-- выбрать --</option>';
        shiftSelect.innerHTML = '';
        dateSelect.innerHTML = '';

        const employees = getEmployees();
        employees.forEach(emp => {
            const option = document.createElement('option');
            option.value = emp.id;
            option.textContent = emp.name;
            empSelect.appendChild(option);
        });

        SHIFT_TYPES.forEach(shift => {
            const option = document.createElement('option');
            option.value = shift;
            option.textContent = shift;
            shiftSelect.appendChild(option);
        });

        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        for (let day = 1; day <= daysInMonth; day++) {
            const option = document.createElement('option');
            option.value = day;
            option.textContent = day;
            dateSelect.appendChild(option);
        }
    }

    if (showBatchBtn && batchPanel) {
        showBatchBtn.addEventListener('click', function() {
            batchPanel.classList.add('batch-shift-form-block');
            panelSeting.classList.toggle('is-hidden');
            populateBatchForm();
        });
    }

    if (closeBtn && batchPanel) {
        closeBtn.addEventListener('click', function() {
            batchPanel.classList.remove('batch-shift-form-block');
            panelSeting.classList.toggle('is-hidden');
        });
    }
});

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
