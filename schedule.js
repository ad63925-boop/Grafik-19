//Вся логика графика
//deleteEmployee
//duplicateEmployee
//clearShifts
//applyTemplateForOne
//applyBatchShifts
//changeEmployeeInRow

/* SCHEDULE */

const SHIFT_TYPES = ["", "Д", "Н", "У", "З", "О", "Т", "П", "К", "Р", "Уо", "Уз", "Ун"];

async function updateShift(empId, day, val) {
  try {
    const key = getKey();
    const snapshot = await dbGet(dbRef(`/schedules/${key}`));
    let data = snapshot.exists() ? snapshot.val() : [];

    let employee = data.find(e => e.id === empId);
    if (!employee) return;

    if (!employee.shifts) employee.shifts = {};

    employee.shifts[day] = val;

    await dbSet(dbRef(`/schedules/${key}`), data);

    graphChanged = true;
    checkColumnRepeats();
  } catch (error) {
    console.error("Ошибка при обновлении смены:", error);
  }
}

var btnAddEmployeeToTable = document.getElementById("btnAddEmployeeToTable");
btnAddEmployeeToTable.addEventListener("click", addEmployeeToTable);

async function addEmployeeToTable() {
  try {
    // Загружаем список сотрудников
    let empList = await getEmployees();

    // Гарантируем, что empList — массив
    if (!Array.isArray(empList)) {
      console.error("❌ empList не является массивом:", empList);
      empList = [];
    }

    // Получаем ID сотрудника из выпадающего списка
    const employeeSelect = document.getElementById('employeeSelect');
    const selectedId = employeeSelect.value;

    if (!selectedId) {
      showNotification('warning', 'Выберите сотрудника из списка');
      return;
    }

    // Теперь безопасно используем find()
    const employee = empList.find(emp =>
      emp.id.toString() === selectedId.toString()
    );

    if (!employee) {
      console.warn("Сотрудник с ID", selectedId, "не найден в списке");
      showNotification('error', 'Сотрудник не найден в базе данных');
      return;
    }

    // ПОЛУЧАЕМ ТЕКУЩИЕ ДАННЫЕ ГРАФИКА
    const key = getKey();
    const snapshot = await dbGet(dbRef(`/schedules/${key}`));
    let data = snapshot.exists() ? snapshot.val() : [];

    // Добавляем сотрудника в данные графика
    data.push({
      id: employee.id,
      shifts: {}
    });

    // Сохраняем обновлённые данные в Firebase
    await dbSet(dbRef(`/schedules/${key}`), data);

    // ЗАГРУЖАЕМ АКТУАЛЬНЫЕ ДАННЫЕ ПОСЛЕ СОХРАНЕНИЯ И ПЕРЕДАЁМ В renderTable
    const updatedData = await loadMonthDataFromFirebase();
    renderTable(updatedData);

    // Показываем уведомление об успехе
    Swal.fire({
      icon: "success",
      title: "Успешно!",
      text: `Сотрудник "${employee.name}" добавлен в график`,
      timer: 2000,
      showConfirmButton: false
    });
  } catch (error) {
    console.error("Ошибка в addEmployeeToTable:", error);
    showNotification('error', 'Ошибка при добавлении сотрудника в график');
  }
}

//Удаление сотрудника из графика по индексу строки в таблице
async function deleteEmployee(employeeIndex) {
  const key = getKey();

  try {
    const snapshot = await dbGet(dbRef(`/schedules/${key}`));
    let data = snapshot.exists() ? snapshot.val() : [];

    if (!Array.isArray(data)) data = [];

    if (employeeIndex < 0 || employeeIndex >= data.length) return;

    const directory = await getEmployees();
    const employee = directory.find(e =>
      String(e.id) === String(data[employeeIndex].id)
    );

    const employeeName = employee ? employee.name : "сотрудника";

const result = await Swal.fire({
  icon: "warning",
  title: "Удалить из графика?",
  html: `Сотрудник: <b>${employeeName}</b><br><br>Это действие нельзя отменить.`,
  showCancelButton: true,
  confirmButtonText: "Да, удалить",
  cancelButtonText: "Отмена",
  confirmButtonColor: "#dc2626",
  cancelButtonColor: "#64748b",
  reverseButtons: true
});

if (!result.isConfirmed) return;

    data.splice(employeeIndex, 1);

    await dbSet(dbRef(`/schedules/${key}`), data);

    await renderTable(data);

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
    applyTemplateForOne("2_2");
});

var btnApplyTemplateForOne4 = document.getElementById("btnApplyTemplateForOne4");
btnApplyTemplateForOne4.addEventListener("click", function() {
    applyTemplateForOne("4_2");
});

//Назначение шаблона для одного сотрудника с выбором даты начала смен
async function applyTemplateForOne(type) {
  const key = getKey();

  try {
    const snapshot = await dbGet(dbRef(`/schedules/${key}`));
    let data = snapshot.exists() ? snapshot.val() : [];

    if (!Array.isArray(data)) {
      data = [];
    }

    if (data.length === 0) {
      return Swal.fire({
        icon: "warning",
        title: "Внимание",
        text: "Нет сотрудников в графике!",
        confirmButtonText: "OK"
      });
    }

    const patternName = type === "2_2" ? "2д/2в" : "4д/2в";

    const result = await Swal.fire({
      icon: "question",
      title: `Шаблон ${patternName}`,
      text: "Выберите дату начала смен",
      input: "date",
      inputValue:
        currentDate.getFullYear() +
        "-" +
        String(currentDate.getMonth() + 1).padStart(2, "0") +
        "-01",
      showCancelButton: true,
      confirmButtonText: "Применить",
      cancelButtonText: "Отмена",
      inputValidator: (value) => {
        if (!value) {
          return "Выберите дату начала";
        }

        const selectedDate = new Date(value + "T00:00:00");

        if (
          selectedDate.getFullYear() !== currentDate.getFullYear() ||
          selectedDate.getMonth() !== currentDate.getMonth()
        ) {
          return "Выберите дату из текущего месяца графика";
        }

        return null;
      }
    });

    if (!result.isConfirmed) {
      return;
    }

    const startDay = new Date(result.value + "T00:00:00").getDate();

const employees = await getEmployees();

const employeeOptions = {};

data.forEach(row => {
  const emp = employees.find(item => String(item.id) === String(row.id));

  if (emp) {
    employeeOptions[emp.id] = emp.name;
  }
});

const employeeResult = await Swal.fire({
  icon: "question",
  title: "Выберите сотрудника",
  input: "select",
  inputOptions: employeeOptions,
  inputPlaceholder: "Сотрудник",
  showCancelButton: true,
  confirmButtonText: "Далее",
  cancelButtonText: "Отмена",
  inputValidator: (value) => {
    if (!value) {
      return "Выберите сотрудника";
    }

    return null;
  }
});

if (!employeeResult.isConfirmed) {
  return;
}

const selectedEmployeeId = employeeResult.value;

applyPatternToEmployee(data, selectedEmployeeId, type, startDay);

    await dbSet(dbRef(`/schedules/${key}`), data);

    await renderTable(data);

    Swal.fire({
      icon: "success",
      title: "Успешно!",
      text: `Шаблон ${patternName} применён с ${startDay} числа`,
      timer: 2000,
      showConfirmButton: false
    });

    graphChanged = true;
  } catch (error) {
    console.error("Ошибка при применении шаблона:", error);

    Swal.fire({
      icon: "error",
      title: "Ошибка",
      text: "Не удалось применить шаблон."
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

/* ——— МЕСЯЦЫ и КНОПКА СЕГОДНЯ ——— */

var todayBtn = document.getElementById("btnToDay");
var prevMonthBtn = document.getElementById("prevMonthBtn");
var nextMonthBtn = document.getElementById("nextMonthBtn");
var monthPicker = document.getElementById("monthPicker");

todayBtn.addEventListener("click", goToday);
prevMonthBtn.addEventListener("click", prevMonth);
nextMonthBtn.addEventListener("click", nextMonth);

monthPicker.addEventListener("change", loadMonthFromPicker);
monthPicker.addEventListener("input", loadMonthFromPicker);

async function goToday() {
    await switchScheduleMonth(new Date());
}

async function prevMonth() {
  const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
  await switchScheduleMonth(date);
}

async function nextMonth() {
  const date = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
  await switchScheduleMonth(date);
}

async function loadMonthFromPicker() {
  const value = monthPicker.value;

  if (!value || !value.includes("-")) return;

  const [year, month] = value.split("-").map(Number);

  if (!year || !month) return;

  await switchScheduleMonth(new Date(year, month - 1, 1));
}

function updatePicker() {
  monthPicker.value =
    currentDate.getFullYear() +
    "-" +
    String(currentDate.getMonth() + 1).padStart(2, "0");
}

async function switchScheduleMonth(date) {
  const selectedDate = new Date(date.getFullYear(), date.getMonth(), 1);

  if (typeof setCurrentDate === "function") {
    setCurrentDate(selectedDate);
  } else {
    currentDate = selectedDate;
  }

  updatePicker();

  const data = await loadMonthDataFromFirebase();

  await renderTable(data);

  if (typeof renderEmployeeCalendar === "function") {
  await renderEmployeeCalendar();
}

  if (typeof renderNotes === "function") {
    await renderNotes();
  }

  if (typeof initBatchForm === "function") {
    await initBatchForm();
  }
}

/* ——— МЕСЯЦЫ и КНОПКА СЕГОДНЯ конец——— */

async function switchScheduleMonth(date) {
    if (typeof setCurrentDate === "function") {
        setCurrentDate(date);
    } else {
        currentDate = new Date(date);
    }

    updatePicker();

    if (typeof renderTable === "function") {
        await renderTable();
    }

    if (typeof renderNotes === "function") {
    await renderNotes();
}
}


//Удаление сотрудника по id
async function deleteEmployeeForID(employeeId) {
  if (!confirm('Удалить сотрудника?')) return;

  try {
    let employees = await getEmployees();
    employees = employees.filter(e => e.id !== employeeId);
    await saveEmployees(employees);
    // Обновляем панель сотрудников
    await renderEmployeesPanel();
  } catch (error) {
    console.error('Ошибка при удалении сотрудника:', error);
    showNotification('error', 'Не удалось удалить сотрудника');
  }
}

// Эта функция вызывается при клике на кнопку редактирования сотрудника и позволяет изменить его имя
async function editEmployeeNameId(employeeId) {
  let employees = await getEmployees();
  const emp = employees.find(e => e.id === employeeId);

  if (!emp) return;

  const newName = prompt('Новое имя:', emp.name);

  if (newName && newName.trim() !== '') {
    emp.name = newName.trim();
    await saveEmployees(employees);
    // Обновляем панель сотрудников
    await renderEmployeesPanel();
  }
}


//Показ формы
async function removeEmployee() {
  const select = document.getElementById("employeeSelect");
  if (!select) return;
  const employeeId = select.value; // Получаем ID, а не индекс
  if (!employeeId) return;

  if (!confirm("Удалить сотрудника из списка?")) return;

  try {
    const list = await getEmployees();
    const updatedList = list.filter(e => e.id.toString() !== employeeId.toString());
    await saveEmployees(updatedList);
    renderEmployeesPanel();
    // Обновляем выпадающий список
    initEmployeeSelect();
  } catch (error) {
    console.error("Ошибка при удалении сотрудника из списка:", error);
    showNotification('error', 'Не удалось удалить сотрудника из списка');
  }
}


/* ——— ЛОГИКА ШАБЛОНОВ ДЛЯ 1 СОТРУДНИКА ——— */

// Эта функция применяет заданный шаблон к одному сотруднику, начиная с указанной даты

function applyPatternToEmployee(data, employeeId, type, startDay) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const days = new Date(year, month + 1, 0).getDate();

  const employee = data.find(e => String(e.id) === String(employeeId));
  if (!employee) {
    console.warn("Сотрудник не найден в графике:", employeeId, data);
    return;
  }

  if (!employee.shifts) employee.shifts = {};

  let pattern = [];

  if (type === "2_2") {
    pattern = ["Д", "Д", "", ""];
  }

  if (type === "4_2") {
    pattern = ["Р", "Р", "Р", "Р", "", ""];
  }

  let pos = 0;

  for (let d = startDay; d <= days; d++) {
    employee.shifts[d] = pattern[pos];
    pos = (pos + 1) % pattern.length;
  }
}

async function initEmployeeSelect() {
  const select = document.getElementById('employeeSelect');
  if (!select) return;

  const employees = await getEmployees();
  select.innerHTML = '<option value="">-- Выберите сотрудника --</option>';

  employees.forEach(emp => {
    const option = document.createElement('option');
    option.value = emp.id;
    option.textContent = emp.name;
    select.appendChild(option);
  });
}

// Вызовите эту функцию при загрузке страницы
document.addEventListener('DOMContentLoaded', initEmployeeSelect);

getEmployees().then(list => console.log("Список сотрудников:", list));
getMonthData().then(data => console.log("Данные графика:", data));

