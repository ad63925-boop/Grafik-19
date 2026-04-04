//Инициализация приложения

/* APP */

let graphChanged = false;

let todayDate = new Date();

let currentDate = new Date();
currentDate.setDate(1);

document.getElementById("monthPicker").value =
    currentDate.getFullYear() +
    "-" +
    String(currentDate.getMonth()+1).padStart(2,"0");

updateEmployeeSelect();
renderTable();

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

    empSelect.innerHTML = "";

    // сотрудники
    const list = getEmployees();

    list.forEach((emp, index) => {
        const option = document.createElement("option");
        option.value = index;
        option.textContent = `${emp.name} (ID: ${emp.id})`;
        empSelect.appendChild(option);
    });

    // смены
    SHIFT_TYPES.forEach(shift => {
        if (!shift) return;

        const option = document.createElement("option");
        option.value = shift;
        option.textContent = shift;
        shiftSelect.appendChild(option);
    });

    // даты
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

//Экспорт и импорт данных
var btnExportData = document.getElementById("btnExportData");
btnExportData.addEventListener("click", exportData);

var btnImportData = document.getElementById("btnImportData");
btnImportData.addEventListener("click", function() {
    document.getElementById("fileInput").click();
});

// Обработчик выбора файла
document.getElementById("fileInput").addEventListener("change", importData);

function importData(event) {
    const file = event.target.files[0];
    if (!file) {
        Swal.fire({
            icon: "error",
            title: "Ошибка",
            text: "Файл не выбран"
        });
        return;
    }

    // Проверяем тип файла
    if (file.type !== "application/json") {
        Swal.fire({
            icon: "error",
            title: "Ошибка",
            text: "Пожалуйста, выберите JSON-файл"
        });
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);

            // Подтверждение перезаписи
            Swal.fire({
                title: "Подтверждение импорта",
                text: "Это перезапишет существующие данные. Продолжить?",
                icon: "warning",
                showCancelButton: true,
                confirmButtonText: "Да, импортировать"
            }).then((result) => {
                if (result.isConfirmed) {
                    // Импортируем данные в LocalStorage
                    Object.keys(importedData).forEach(key => {
                        localStorage.setItem(key, JSON.stringify(importedData[key]));
                    });

                    Swal.fire({
                icon: "success",
                title: "Импорт выполнен",
                text: "Данные успешно импортированы"
            });

            // Обновляем интерфейс
            updateEmployeeSelect();
            renderTable();
            loadGuards();
            renderCalendar();
                }
            });
        } catch (error) {
            Swal.fire({
                icon: "error",
                title: "Ошибка импорта",
                text: "Некорректный формат JSON-файла"
            });
            console.error("Ошибка импорта:", error);
        }
    };
    reader.onerror = () => {
        Swal.fire({
            icon: "error",
            title: "Ошибка чтения файла",
            text: "Не удалось прочитать выбранный файл"
        });
    };
    reader.readAsText(file);
}


function exportData() {
    let dataToExport = {};
    const prefix = "schedule_";

    // Получаем все ключи из LocalStorage, начинающиеся с префикса
    Object.keys(localStorage).forEach(key => {
        if (key.startsWith(prefix)) {
            try {
                dataToExport[key] = JSON.parse(localStorage.getItem(key));
            } catch (e) {
                console.error(`Ошибка парсинга данных для ключа ${key}:`, e);
            }
        }
    });

    // Добавляем сотрудников, если есть
    try {
        const employees = JSON.parse(localStorage.getItem("employees"));
        if (employees) dataToExport["employees"] = employees;
    } catch (e) {
        console.warn("Не удалось загрузить сотрудников:", e);
    }

    // Создаём файл
    const jsonString = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;

    // Корректная генерация имени файла
    const d = new Date();
    const filenameDate = `${d.getDate().toString().padStart(2, '0')}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getFullYear()}_${d.getHours().toString().padStart(2, '0')}.${d.getMinutes().toString().padStart(2, '0')}`;
    a.download = `График_${filenameDate}.json`;

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    Swal.fire({
        icon: "success",
        title: "Экспорт выполнен",
        text: "График и сотрудники успешно экспортированы"
    });
}


//Показ и скрытие формы
var btnClosePanelSeting = document.getElementById("btnClosePanelSeting");
btnClosePanelSeting.addEventListener("click", closeSettings);
function closeSettings() {
    const panel = document.getElementById("panelSeting");
    panel.classList.add("is-hidden");
    panel.classList.remove("is-visible");
}

//Показать скрыть панель с сотрудниками
const panel = document.getElementById("employeesPanel");

var btnShowEmployeesPanel = document.getElementById("btnShowEmployeesPanel");
btnShowEmployeesPanel.addEventListener("click", showEmployeesPanel);

function showEmployeesPanel() {
    employeesPanel.style.display = "block";
    panelSeting.classList.add("is-hidden");
    updateEmployeeSelect();
    renderEmployeesPanel();
}

// Эта функция вызывается при клике на кнопку закрытия панели сотрудников
var btnCloseEmployeesPanel = document.getElementById("btnCloseEmployeesPanel");
btnCloseEmployeesPanel.addEventListener("click", closeEmployeesPanel);
function closeEmployeesPanel() {
    panel.style.display = "none";
}