
/* DATABASE */

let currentDate = new Date();

// Добавить функцию для обновления даты
function setCurrentDate(date) {
  currentDate = new Date(date);
  syncMonth(); // Перезапускаем синхронизацию с новым ключом
}

// сотрудники
async function getEmployees() {
  try {
    // Загружаем данные сотрудников из Firebase
    const snapshot = await dbGet(dbRef(db, 'employees'));

    if (snapshot.exists()) {
      const firebaseEmployees = snapshot.val();

      // Проверяем, что данные — массив
      if (Array.isArray(firebaseEmployees)) {
        console.log("Сотрудники загружены из Firebase");
        return firebaseEmployees;
      } else {
        // Если данные есть, но не в формате массива, возвращаем пустой массив
        console.warn("Данные сотрудников в Firebase не являются массивом");
        return [];
      }
    } else {
      // Если данных нет в Firebase, возвращаем пустой массив
      console.log("В Firebase нет данных о сотрудниках, возвращаем пустой массив");
      return [];
    }
  } catch (error) {
    console.error("Ошибка при загрузке сотрудников из Firebase:", error);

    // В случае ошибки Firebase возвращаем пустой массив,
    // чтобы интерфейс мог корректно отрисоваться
    return [];
  }
}


async function getEmployees() {
  try {
    // Проверяем, инициализирован ли Firebase
    if (typeof db === 'undefined') {
      console.warn("Firebase database не инициализирован, возвращаем пустой массив");
      return [];
    }

    // Загружаем данные сотрудников из Firebase
    const snapshot = await dbGet(dbRef(db, 'employees'));

    if (!snapshot.exists()) {
      console.log("В Firebase нет данных о сотрудниках, возвращаем пустой массив");
      return [];
    }

    const firebaseEmployees = snapshot.val();

    // Проверяем, что данные — массив
    if (Array.isArray(firebaseEmployees)) {
      console.log("Сотрудники загружены из Firebase");
      return firebaseEmployees;
    } else {
      // Если данные есть, но не в формате массива, возвращаем пустой массив
      console.warn("Данные сотрудников в Firebase не являются массивом, возвращаем пустой массив");
      return [];
    }
  } catch (error) {
    console.error("Ошибка при загрузке сотрудников из Firebase:", error);

    // В случае ошибки Firebase возвращаем пустой массив,
    // чтобы интерфейс мог корректно отрисоваться
    return [];
  }
}




// сохранение сотрудников
function saveEmployees(data) {
  // Базовая валидация
  if (!Array.isArray(data)) {
    console.error("Данные сотрудников должны быть массивом");
    return;
  }

  lsSetJSON("employees", data);
  dbSet(dbRef(db, "employees"), data)
    .catch(error => {
      console.error("Ошибка сохранения в Firebase:", error);
      showError("Не удалось сохранить данные в облаке. Изменения сохранены локально.");
    });
}


// добавление сотрудника исправить на добавление с id и сменой
async function addEmployee(name, shifting) {
  let employees = await getEmployees();

  employees.push({
    id: crypto.randomUUID(), // более надёжный способ генерации ID
    name: name,
    shifting: shifting
  });

  saveEmployees(employees);
}


// ключ месяца
function getKey() {
  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, '0');
  return `schedule_${year}_${month}`;
}


// данные месяца
async function getMonthData() {
  const key = getKey();

  try {
    // Загружаем данные из Firebase
    const snapshot = await dbGet(dbRef(db, key));

    if (snapshot.exists()) {
      // Возвращаем данные из Firebase
      return snapshot.val();
    } else {
      // Если данных нет в Firebase, возвращаем пустой массив
      console.log("В Firebase нет данных для ключа:", key);
      return [];
    }
  } catch (error) {
    console.error("Критическая ошибка при загрузке данных из Firebase:", error);

    // В случае ошибки Firebase возвращаем пустой массив
    return [];
  }
}


let currentSyncSubscription = null;

function syncMonth() {
  const key = getKey();

  // Отписываемся от старой подписки
  if (currentSyncSubscription) {
    currentSyncSubscription();
  }

  currentSyncSubscription = dbOnValue(dbRef(db, key), (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      lsSetJSON(key, data);
    }
  });
}

// Функция для остановки синхронизации
function stopSyncMonth() {
  if (currentSyncSubscription) {
    currentSyncSubscription();
    currentSyncSubscription = null;
  }
}


async function saveMonthData(data) {
  const key = getKey();

  // Локально
  lsSetJSON(key, data);

  // В Firebase с обработкой ошибок
  try {
    await dbSet(dbRef(db, key), data);
    console.log("Данные успешно сохранены в Firebase");
  } catch (error) {
    console.error("Ошибка сохранения в Firebase:", error);
    showError("Не удалось синхронизировать с облаком. Изменения сохранены локально.");
  }
}


//сохранение смены когда выбираешь смену:
async function saveShift(employeeId, date, value) {
    let monthData = await getMonthData();

    let employee = monthData.find(e => e.id === employeeId);
    if (!employee) return;

    if (!employee.shifts) employee.shifts = {};
    employee.shifts[date] = value;

    saveMonthData(monthData);
}

// ------- Choices.js helpers -------
window._choicesMap = window._choicesMap || new Map();

function destroyChoicesOn(selector) {
    const els = document.querySelectorAll(selector);
    els.forEach(el => {
        const inst = window._choicesMap.get(el);
        if (inst && typeof inst.destroy === 'function') {
            try { inst.destroy(); } catch(e) {}
            window._choicesMap.delete(el);
        }
    });
}

function initChoicesOn(selector, options) {
    if (!selector) return;
    const els = document.querySelectorAll(selector);
    els.forEach(el => {
        if (!(el instanceof HTMLElement)) return;
        // destroy previous
        const existing = window._choicesMap.get(el);
        if (existing && typeof existing.destroy === 'function') {
            try { existing.destroy(); } catch(e) {}
            window._choicesMap.delete(el);
        }
        if (typeof Choices === 'function') {
            try {
                const cfg = Object.assign({searchEnabled: false, shouldSort: false, itemSelectText: ''}, options || {});
                const instance = new Choices(el, cfg);
                window._choicesMap.set(el, instance);
            } catch (e) {
                console.warn('Choices init failed for', el, e);
            }
        }
    });
}

function refreshChoices(selector, options) {
    destroyChoicesOn(selector);
    initChoicesOn(selector, options);
}

function showError(message) {
  if (typeof Swal !== 'undefined') {
    Swal.fire({
      icon: 'error',
      title: 'Ошибка',
      text: message,
      confirmButtonText: 'OK'
    });
  } else {
    alert(message);
  }
}

syncMonth();