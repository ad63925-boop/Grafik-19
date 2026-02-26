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
function openPanelSeting() {
const setingButton = document.getElementById('btnSetting');
const panelSeting = document.getElementById('panelSeting');

if (setingButton && panelSeting) {
    setingButton.addEventListener('click', () => {
        panelSeting.classList.toggle('is-hidden');
        panelSeting.classList.add('is-visible');
    });
}
};

document.addEventListener("click", e => {
    const panel = document.getElementById("panelSeting");
    const btn = document.getElementById("btnSetting");

    if (!panel.contains(e.target) && !btn.contains(e.target)) {
        panel.classList.add("is-hidden");
    }
});

// Предупреждение при попытке закрыть вкладку, если были изменения в графике
window.addEventListener("beforeunload", function (e) {

    if (!graphChanged) return;

    const msg =
        "График был изменён.\nРекомендуется сделать экспорт данных.";

    e.preventDefault();
    e.returnValue = msg;

    return msg;
});

// Функция для печати графика с настройками масштаба и количеством копий
function printSchedule() {
  const scale = document.getElementById("printScale").value;
  const table = document.getElementById("scheduleTable");
  const printContainer = document.getElementById("print-container");
  const copiInput = document.getElementById('copiInput').value;

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

// Эта функция должна быть глобальной, так как вызывается через onclick
function exportData() {
    let dataToExport = {};
    const prefix = "schedule_";

    // 1. Экспорт всех schedule_* и сотрудников
    lsKeys(prefix).forEach(key => {
        dataToExport[key] = lsGet(key);
    });

    const employees = lsGet("employees");
    if (employees) dataToExport["employees"] = employees;

    // 3. Создаем файл
    const jsonString = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;

    const d = new Date();
    const filenameDate = `${d.getDate().toString().padStart(2,'0')}-${(d.getMonth()+1)
        .toString().padStart(2,'0')}-${d.getFullYear()}_${d.getHours()
        .toString().padStart(2,'0')}.${d.getMinutes()
        .toString().padStart(2,'0')}`;

    a.download = `График_${filenameDate}.json`;

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    Swal.fire({
  icon: "warning",
  title: "Внимание",
  text: "График и сотрудники успешно"
});
}

//Показ и скрытие формы
function closeSettings() {
    const panel = document.getElementById("panelSeting");
    panel.classList.add("is-hidden");
    panel.classList.remove("is-visible");
}

const panel = document.getElementById("employeesPanel");
//Показать скрыть панель с сотрудниками
function showEmployeesPanel() {
    panel.style.display = "block";
}

// Эта функция вызывается при клике на кнопку закрытия панели сотрудников
function closeEmployeesPanel() {
    panel.style.display = "none";
}