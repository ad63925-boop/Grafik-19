//Только работа с localStorage и данными
/* DATABASE */

let currentDate = new Date();

// Добавить функцию для обновления даты
function setCurrentDate(date) {
  currentDate = new Date(date);
  syncMonth(); // Перезапускаем синхронизацию с новым ключом
}

// --- Универсальные функции для работы с localStorage ---
function lsGet(key) {
    return localStorage.getItem(key);
}

function lsSet(key, value) {
    localStorage.setItem(key, value);
}

function lsRemove(key) {
    localStorage.removeItem(key);
}

function lsKeys(prefix) {
    const out = [];
    for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!prefix || k.startsWith(prefix)) out.push(k);
    }
    return out;
}

// сотрудники
async function getEmployees() {
  try {
    // Сначала пробуем localStorage
    const stored = localStorage.getItem("employees");
    if (stored) {
      const localEmployees = JSON.parse(stored);
      if (Array.isArray(localEmployees)) {
        console.log("Сотрудники загружены из localStorage");
        return localEmployees;
      }
    }

    // Если localStorage пуст/некорректен, берём из Firebase (только если database определён)
    if (typeof database !== 'undefined') {
      const employeesRef = firebase.database().ref('employees');
      const snapshot = await employeesRef.once('value');
      const firebaseEmployees = snapshot.val();

      if (!firebaseEmployees) {
        console.warn("В Firebase нет данных сотрудников, возвращаем пустой массив");
        return [];
      }

      // Сохраняем в localStorage для следующего раза
      localStorage.setItem("employees", JSON.stringify(firebaseEmployees));
      console.log("Сотрудники загружены из Firebase и сохранены в localStorage");
      return firebaseEmployees;
    } else {
      console.warn("Firebase database не инициализирован, используем пустой массив");
      return [];
    }
  } catch (error) {
    console.error("Ошибка загрузки сотрудников (Firebase/localStorage):", error);
    return []; // Всегда возвращаем массив
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
    // (вместо fallback на LocalStorage)
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