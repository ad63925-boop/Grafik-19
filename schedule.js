//Вся логика графика
//deleteEmployee
//duplicateEmployee
//clearShifts
//applyTemplateForOne
//applyBatchShifts
//changeEmployeeInRow

/* SCHEDULE */

const SHIFT_TYPES = ["", "Д", "Н", "У", "З", "О", "Т", "П", "К", "Р", "Уо", "Уз", "Ун"];

function updateShift(empId, day, val) {

    let data = getMonthData();

    let employee = data.find(e => e.id === empId);
    if (!employee) return;

    if (!employee.shifts) employee.shifts = {};

    employee.shifts[day] = val;

    saveMonthData(data);

    graphChanged = true;

    checkColumnRepeats();
}

var btnAddEmployeeToTable = document.getElementById("btnAddEmployeeToTable");
btnAddEmployeeToTable.addEventListener("click", addEmployeeToTable);
function addEmployeeToTable() {

    const select = document.getElementById("employeeSelect");

    const empList = getEmployees();
    const selectedId = select.value;
    const selectedEmp = empList.find(e => e.id == selectedId);

    if (!selectedEmp) return;

    let data = getMonthData();

    if (data.some(e => e.id === selectedEmp.id)) {
        Swal.fire({
  icon: "warning",
  title: "Внимание",
  text: "Сотрудник уже в графике"
});
        return;
    }

    data.push({
        id: selectedEmp.id,
        shifts: {}
    });

    saveMonthData(data);

    graphChanged = true;

    renderTable();
}

// Эта функция удаляет сотрудника из графика по индексу строки, который соответствует позиции в массиве данных графика
function deleteEmployee(employeeIndex) {

    const key = getKey();
    let data = lsGetJSON(key) || [];

    if (employeeIndex < 0 || employeeIndex >= data.length) return;

    // получаем имя сотрудника для красивого сообщения
    const directory = getEmployees();
    const employee = directory.find(e => e.id === data[employeeIndex].id);
    const employeeName = employee ? employee.name : "сотрудника";

    const isConfirmed = confirm(
        `Вы уверены, что хотите удалить ${employeeName} из графика?\n\nЭто действие нельзя отменить.`
    );

    if (!isConfirmed) return; // если нажали "Отмена" — ничего не делаем

    data.splice(employeeIndex, 1);

    lsSetJSON(key, data);
    graphChanged = true;
    renderTable();
}

// Эта функция дублирует строку сотрудника в графике, вставляя пустую строку ниже текущей
function duplicateEmployee(i) {

    let data = lsGetJSON(getKey()) || [];

    if (i < 0 || i >= data.length) return;

    // создаём пустую строку
    let emptyRow = {
        id: null,
        shifts: {}
    };

    // вставляем после текущей строки
    data.splice(i + 1, 0, emptyRow);

    lsSetJSON(getKey(), data);
    renderTable();
}

// Эта функция вызывается при клике на кнопку "Очистить смены"
var btnClearShifts = document.getElementById("btnClearShifts");
btnClearShifts.addEventListener("click", clearShifts);
function clearShifts() {
    let data = lsGetJSON(getKey()) || [];
    data.forEach(e => e.shifts = {});
    lsSetJSON(getKey(), data);
    graphChanged = true;
    renderTable();
}

// Эта функция вызывается при клике на кнопку применения шаблона для одного сотрудника
var btnApplyTemplateForOne = document.getElementById("btnApplyTemplateForOne");
btnApplyTemplateForOne.addEventListener("click", function() {
    applyTemplateForOne('2_2');
});

var btnApplyTemplateForOne4 = document.getElementById("btnApplyTemplateForOne4");
btnApplyTemplateForOne4.addEventListener("click", function() {
    applyTemplateForOne('4_2');
});

function applyTemplateForOne(type) {
    let data = lsGetJSON(getKey()) || [];
    if (data.length === 0) return Swal.fire({
  icon: "warning",
  title: "Внимание",
  text: "Нет сотрудников!",
  confirmButtonText: "OK"
});

    let emp = prompt("Введите номер сотрудника (1-" + data.length + "):");
    if (!emp) return;
    emp = parseInt(emp) - 1;

    if (emp < 0 || emp >= data.length) return alert("Ошибка.");

    let startDay = prompt("Введите дату начала шаблона (1-31):");
    if (!startDay) return;
    startDay = parseInt(startDay);

    applyPatternToEmployee(data, emp, type, startDay);

    lsSetJSON(getKey(), data);
    renderTable();
}

//Добавление смен по датам
var btnApplyBatchShifts = document.getElementById("btnApplyBatchShifts");
btnApplyBatchShifts.addEventListener("click", applyBatchShifts);
function applyBatchShifts() {

    const empId = Number(document.getElementById("batchEmpSelect").value);
    const shiftValue = document.getElementById("batchShiftSelect").value;

    const selectedDates = Array.from(
        document.getElementById("batchDatesSelect").selectedOptions
    ).map(opt => Number(opt.value));

    if (!empId) {
        Swal.fire({
  icon: "warning",
  title: "Внимание",
  text: "Выберите сотрудника",
  confirmButtonText: "OK"
});
        return;
    }

    if (!shiftValue) {
        Swal.fire({
  icon: "warning",
  title: "Внимание",
  text: "Выберите смену",
  confirmButtonText: "OK"
});
        return;
    }

    if (selectedDates.length === 0) {
        Swal.fire({
  icon: "warning",
  title: "Внимание",
  text: "Выберите даты",
  confirmButtonText: "OK"
});
        return;
    }

    const key = getKey();
    let data = lsGetJSON(key) || [];

    const employee = data.find(e => e.id === empId);

    if (!employee) {
        Swal.fire({
  icon: "warning",
  title: "Внимание",
  text: "Этот сотрудник не добавлен в график этого месяца",
  confirmButtonText: "OK"
});
        return;
}

    if (!employee.shifts) employee.shifts = {};

    selectedDates.forEach(day => {
        employee.shifts[day] = shiftValue;
    });

    lsSetJSON(key, data);

    renderTable();

    Swal.fire({
  icon: "success",
  title: "Успешно",
  text: `Смены назначены (${selectedDates.length})`,
  confirmButtonText: "OK"
});
}

// Эта функция сохраняет новое имя сотрудника в localStorage при изменении значения в input
/*function saveName(i, name) {
    let data = lsGetJSON(getKey()) || [];
    if (!data[i]) data[i] = { name: '', shifts: {} };
    data[i].name = name;
    localStorage.setItem(getKey(), JSON.stringify(data));
}*/

// Эта функция вызывается при изменении сотрудника в строке и сохраняет новый ID сотрудника, не трогая смены
function changeEmployeeInRow(rowIndex, newEmployeeId) {

    let data = lsGetJSON(getKey()) || [];

    if (!data[rowIndex]) return;

    newEmployeeId = Number(newEmployeeId);

    // если ничего не выбрано
    if (!newEmployeeId) {
        data[rowIndex].id = null;
        lsSetJSON(getKey(), data);
        renderTable();
        return;
    }

    // проверка — есть ли уже такой сотрудник в графике
    if (data.some((e, index) => e.id === newEmployeeId && index !== rowIndex)) {
        Swal.fire({
  icon: "warning",
  title: "Внимание",
  text: "Этот сотрудник уже есть в графике",
  confirmButtonText: "OK"
});
        renderTable();
        return;
    }

    // 🔥 главное — смены не трогаем!
    data[rowIndex].id = newEmployeeId;

    lsSetJSON(getKey(), data);
    renderTable();
}

/* ——— КНОПКА СЕГОДНЯ ——— */
var todayBtn = document.getElementById("btnToDay");
todayBtn.addEventListener("click", goToday);
function goToday() {
    currentDate = new Date(todayDate.getFullYear(), todayDate.getMonth(), 1);
    updatePicker();
    renderTable();
}

/* ——— МЕСЯЦЫ ——— */
var prevMonthBtn = document.getElementById("prevMonthBtn");
var nextMonthBtn = document.getElementById("nextMonthBtn");     
prevMonthBtn.addEventListener("click", prevMonth);
nextMonthBtn.addEventListener("click", nextMonth);

function prevMonth() {
    currentDate.setMonth(currentDate.getMonth() - 1);
    updatePicker();
    renderTable();
}

function nextMonth() {
    currentDate.setMonth(currentDate.getMonth() + 1);
    updatePicker();
    renderTable();
}

function updatePicker() {
    document.getElementById("monthPicker").value =
        currentDate.getFullYear() + "-" + String(currentDate.getMonth()+1).padStart(2,"0");
}

var monthPicker = document.getElementById("monthPicker");
monthPicker.addEventListener("change", loadMonthFromPicker);
function loadMonthFromPicker() {
    let v = document.getElementById("monthPicker").value.split("-");
    currentDate = new Date(v[0], v[1]-1, 1);
    renderTable();
}

// Эта функция вызывается при клике на кнопку редактирования сотрудника и позволяет изменить его имя
function deleteEmployeeForID(employeeId) {

    if (!confirm("Удалить сотрудника?")) return;

    let employees = getEmployees();
    employees = employees.filter(e => e.id !== employeeId);
    saveEmployees(employees);

    renderEmployeesPanel();
    renderTable();
}

// Эта функция вызывается при клике на кнопку редактирования сотрудника и позволяет изменить его имя
function editEmployeeNameId(employeeId) {

    let employees = getEmployees();
    const emp = employees.find(e => e.id === employeeId);

    if (!emp) return;

    const newName = prompt("Новое имя:", emp.name);

    if (newName && newName.trim() !== "") {
        emp.name = newName.trim();
        saveEmployees(employees);

        renderEmployeesPanel();
        renderTable();
    }
}

//Показ формы
function removeEmployee() {
    const select = document.getElementById("employeeSelect");
    if (!select) return;
    const index = parseInt(select.value);
    if (isNaN(index)) return;
    if (!confirm("Удалить сотрудника из списка?")) return;

    const list = getEmployees();
    list.splice(index, 1);
    saveEmployees(list);
    updateEmployeeSelect();
}


/* ——— ИМПОРТ ДАННЫХ ——— */

// Эта функция должна быть глобальной, так как вызывается при изменении input type="file"
function importData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);

            if (confirm("Внимание! Текущие данные LocalStorage будут перезаписаны импортированными данными. Продолжить?")) {

                let count = 0;

                for (const key in importedData) {

                    // Импорт месяцев
                    if (key.startsWith("schedule_")) {
                        lsSetJSON(key, importedData[key]);
                        count++;
                    }

                    // Импорт сотрудников
                    if (key === "employees") {
                        lsSetJSON("employees", importedData[key]);
                    }
                }

                Swal.fire({
  icon: "success",
  title: "Успешно",
  text: `Импорт завершён.\nГрафиков: ${count}\nСотрудники обновлены.`,
  confirmButtonText: "OK"
});

                updateEmployeeSelect();
                renderTable();
            }

        } catch (error) {
            Swal.fire({
  icon: "warning",
  title: "Внимание",
  text: "Ошибка при чтении файла: Неверный формат JSON.",
  confirmButtonText: "OK"
});
            console.error(error);
        }
    };

    reader.readAsText(file);
    event.target.value = '';
}

/* ——— ЛОГИКА ШАБЛОНОВ ДЛЯ 1 СОТРУДНИКА ——— */

// Эта функция применяет заданный шаблон к одному сотруднику, начиная с указанной даты

function applyPatternToEmployee(data, employeeId, type, startDay) {

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const days = new Date(year, month + 1, 0).getDate();

    const employee = data.find(e => e.id === employeeId);
    if (!employee) return;

    if (!employee.shifts) employee.shifts = {};

    let pattern = [];

    if (type === "2_2") pattern = ["Д", "Д", "", ""];
    if (type === "4_2") pattern = ["Р", "Р", "Р", "Р", "", ""];

    let pos = 0;

    for (let d = startDay; d <= days; d++) {
        employee.shifts[d] = pattern[pos];
        pos = (pos + 1) % pattern.length;
    }
}