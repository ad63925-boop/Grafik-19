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

  
}

// Эта функция удаляет сотрудника из графика по индексу строки, который соответствует позиции в массиве данных графика
async function deleteEmployee(employeeIndex) {
  const key = getKey();

  try {
    // Загружаем текущие данные из Firebase
    const snapshot = await dbGet(dbRef(`/schedules/${key}`));
    let data = snapshot.exists() ? snapshot.val() : [];

    if (employeeIndex < 0 || employeeIndex >= data.length) return;

    // Получаем имя сотрудника для красивого сообщения
    const directory = getEmployees();
    const employee = directory.find(e => e.id === data[employeeIndex].id);
    const employeeName = employee ? employee.name : "сотрудника";

    const isConfirmed = confirm(
      `Вы уверены, что хотите удалить ${employeeName} из графика?\n\nЭто действие нельзя отменить.`
    );

    if (!isConfirmed) return; // если нажали "Отмена" — ничего не делаем

    // Удаляем сотрудника по индексу
    data.splice(employeeIndex, 1);

    // Сохраняем обновлённые данные в Firebase
    await dbSet(dbRef(`/schedules/${key}`), data);

    // Обновляем интерфейс
    renderTable();

    // Показываем уведомление об успехе
    Swal.fire({
      icon: "success",
      title: "Успешно!",
      text: `Сотрудник "${employeeName}" удалён из графика`,
      timer: 2000,
      showConfirmButton: false
    });

    graphChanged = true;
  } catch (error) {
    console.error("Ошибка при удалении сотрудника из Firebase:", error);

    // Показываем сообщение об ошибке
    Swal.fire({
      icon: "error",
      title: "Ошибка",
      text: "Не удалось удалить сотрудника. Проверьте подключение к интернету."
    });
  }
}


// Эта функция дублирует строку сотрудника в графике, вставляя пустую строку ниже текущей
async function duplicateEmployee(i) {
  const key = getKey();

  try {
    // Загружаем текущие данные из Firebase
    const snapshot = await dbGet(dbRef(`/schedules/${key}`));
    let data = snapshot.exists() ? snapshot.val() : [];

    if (i < 0 || i >= data.length) return;

    // Создаём пустую строку
    let emptyRow = {
      id: null,
      shifts: {}
    };

    // Вставляем после текущей строки
    data.splice(i + 1, 0, emptyRow);

    // Сохраняем обновлённые данные в Firebase
    await dbSet(dbRef(`/schedules/${key}`), data);

    // Обновляем интерфейс
    renderTable();

    // Показываем уведомление об успехе
    Swal.fire({
      icon: "success",
      title: "Успешно!",
      text: "Строка продублирована",
      timer: 1500,
      showConfirmButton: false
    });

    graphChanged = true;
  } catch (error) {
    console.error("Ошибка при дублировании сотрудника в Firebase:", error);

    // Показываем сообщение об ошибке
    Swal.fire({
      icon: "error",
      title: "Ошибка",
      text: "Не удалось продублировать строку. Проверьте подключение к интернету."
    });
  }
}


// Эта функция вызывается при клике на кнопку "Очистить смены"
async function clearShifts() {
  const key = getKey();

  try {
    // Загружаем текущие данные из Firebase
    const snapshot = await dbGet(dbRef(`/schedules/${key}`));
    let data = snapshot.exists() ? snapshot.val() : [];

    // Очищаем смены для всех сотрудников
    data.forEach(e => e.shifts = {});

    // Сохраняем обновлённые данные в Firebase
    await dbSet(dbRef(`/schedules/${key}`), data);

    // Обновляем интерфейс
    renderTable();

    // Показываем уведомление об успехе
    Swal.fire({
      icon: "success",
      title: "Успешно!",
      text: "Все смены очищены",
      timer: 1500,
      showConfirmButton: false
    });

    graphChanged = true;
  } catch (error) {
    console.error("Ошибка при очистке смен в Firebase:", error);

    // Показываем сообщение об ошибке
    Swal.fire({
      icon: "error",
      title: "Ошибка",
      text: "Не удалось очистить смены. Проверьте подключение к интернету."
    });
  }
}

// Добавляем обработчик события (убедимся, что элемент существует)
document.addEventListener('DOMContentLoaded', function() {
  var btnClearShifts = document.getElementById("btnClearShifts");
  if (btnClearShifts) {
    btnClearShifts.addEventListener("click", clearShifts);
  } else {
    console.warn('Элемент btnClearShifts не найден');
  }
});


// Эта функция вызывается при клике на кнопку применения шаблона для одного сотрудника
var btnApplyTemplateForOne = document.getElementById("btnApplyTemplateForOne");
btnApplyTemplateForOne.addEventListener("click", function() {
    applyTemplateForOne('2_2');
});

var btnApplyTemplateForOne4 = document.getElementById("btnApplyTemplateForOne4");
btnApplyTemplateForOne4.addEventListener("click", function() {
    applyTemplateForOne('4_2');
});

async function applyTemplateForOne(type) {
  const key = getKey();

  try {
    // Загружаем текущие данные из Firebase
    const snapshot = await dbGet(dbRef(`/schedules/${key}`));
    let data = snapshot.exists() ? snapshot.val() : [];

    if (data.length === 0) {
      return Swal.fire({
        icon: "warning",
        title: "Внимание",
        text: "Нет сотрудников!",
        confirmButtonText: "OK"
      });
    }

    // Здесь должна быть логика применения шаблона (см. пояснения ниже)
    // Например, вызов applyPatternToEmployee() для каждого сотрудника

    // Сохраняем обновлённые данные в Firebase
    await dbSet(dbRef(`/schedules/${key}`), data);

    // Обновляем интерфейс
    renderTable();

    // Показываем уведомление об успехе
    Swal.fire({
      icon: "success",
      title: "Успешно!",
      text: `Шаблон "${type}" применён ко всем сотрудникам`,
      timer: 2000,
      showConfirmButton: false
    });

    graphChanged = true;
  } catch (error) {
    console.error("Ошибка при применении шаблона в Firebase:", error);

    // Показываем сообщение об ошибке
    Swal.fire({
      icon: "error",
      title: "Ошибка",
      text: "Не удалось применить шаблон. Проверьте подключение к интернету."
    });
  }
}


// Эта функция вызывается при изменении сотрудника в строке и сохраняет новый ID сотрудника, не трогая смены
async function changeEmployeeInRow(rowIndex, newEmployeeId) {
  const key = getKey();

  try {
    // Загружаем текущие данные из Firebase
    const snapshot = await dbGet(dbRef(`/schedules/${key}`));
    let data = snapshot.exists() ? snapshot.val() : [];

    if (!data[rowIndex]) return;

    newEmployeeId = Number(newEmployeeId);

    // Если ничего не выбрано
    if (!newEmployeeId) {
      data[rowIndex].id = null;
      await dbSet(dbRef(`/schedules/${key}`), data);
      renderTable(); // Обновляем интерфейс
      graphChanged = true;
      return;
    }

    // Проверка — есть ли уже такой сотрудник в графике
    if (data.some((e, index) => e.id === newEmployeeId && index !== rowIndex)) {
      Swal.fire({
        icon: "warning",
        title: "Внимание",
        text: "Этот сотрудник уже есть в графике",
        confirmButtonText: "OK"
      });
      return;
    }

    // 🔥 Главное — смены не трогаем!
    data[rowIndex].id = newEmployeeId;

    // Сохраняем обновлённые данные в Firebase
    await dbSet(dbRef(`/schedules/${key}`), data);

    // Обновляем интерфейс
    renderTable();

    graphChanged = true;
  } catch (error) {
    console.error("Ошибка при изменении сотрудника в Firebase:", error);

    // Показываем сообщение об ошибке
    Swal.fire({
      icon: "error",
      title: "Ошибка",
      text: "Не удалось изменить сотрудника. Проверьте подключение к интернету."
    });
  }
}


/* ——— КНОПКА СЕГОДНЯ ——— */
var todayBtn = document.getElementById("btnToDay");
todayBtn.addEventListener("click", goToday);
function goToday() {
    currentDate = new Date(todayDate.getFullYear(), todayDate.getMonth(), 1);
    updatePicker();
    
}

/* ——— МЕСЯЦЫ ——— */
var prevMonthBtn = document.getElementById("prevMonthBtn");
var nextMonthBtn = document.getElementById("nextMonthBtn");     
prevMonthBtn.addEventListener("click", prevMonth);
nextMonthBtn.addEventListener("click", nextMonth);

function prevMonth() {
    currentDate.setMonth(currentDate.getMonth() - 1);
    updatePicker();
    
}

function nextMonth() {
    currentDate.setMonth(currentDate.getMonth() + 1);
    updatePicker();
    
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
    
}

//Удаление сотрудника по id
function deleteEmployeeForID(employeeId) {

    if (!confirm("Удалить сотрудника?")) return;

    let employees = getEmployees();
    employees = employees.filter(e => e.id !== employeeId);
    saveEmployees(employees);
    renderEmployeesPanel();
    
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