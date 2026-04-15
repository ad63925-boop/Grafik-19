//Только работа с localStorage и данными
/* DATABASE */

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

// --- Универсальные функции для работы с JSON в localStorage ---
function lsGetJSON(key) {
    try {
        return JSON.parse(localStorage.getItem(key));
    } catch (e) {
        return null;
    }
}

function lsSetJSON(key, obj) {
    localStorage.setItem(key, JSON.stringify(obj));
}

//localStorage.removeItem("employees"); // очистка для тестов
//console.log("Employees in storage:", getEmployees());
// сотрудники
async function getEmployees() {
    try {
        const snapshot = await dbGet(dbRef(db, "employees"));
        if (snapshot.exists()) {
            const data = snapshot.val();
            lsSetJSON("employees", data);
            return data;
        }
    } catch (e) {}

    return lsGetJSON("employees") || [];
}

// сохранение сотрудников
function saveEmployees(data) {
    lsSetJSON("employees", data);
    dbSet(dbRef(db, "employees"), data);
}

// добавление сотрудника исправить на добавление с id и сменой
function addEmployee(name, id, shifting) {
    let employees = getEmployees();

    employees.push({
        id: new Date().getTime(), // уникальный id на основе времени
        name: name,
        shifting: shifting
    });

    saveEmployees(employees);
}

// ключ месяца
function getKey() {
    return "schedule_" + currentDate.getFullYear() + "_" + currentDate.getMonth();
}

// данные месяца
async function getMonthData() {
    const key = getKey();

    // пробуем из Firebase
    try {
        const snapshot = await dbGet(dbRef(db, key));
        if (snapshot.exists()) {
            const data = snapshot.val();
            lsSetJSON(key, data); // кеш
            return data;
        }
    } catch (e) {
        console.warn("Firebase недоступен, берём localStorage");
    }

    // fallback
    return lsGetJSON(key) || [];
}

function syncMonth() {
    const key = getKey();

    dbOnValue(dbRef(db, key), (snapshot) => {
        if (snapshot.exists()) {
            const data = snapshot.val();

            lsSetJSON(key, data);
            renderTable(); // обновляем таблицу
        }
    });
}

async function saveMonthData(data) {
    const key = getKey();

    // локально
    lsSetJSON(key, data);

    // в Firebase
    dbSet(dbRef(db, key), data);
}

//сохранение смены когда выбираешь смену:
function saveShift(employeeId, date, value) {

    let monthData = getMonthData();

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

syncMonth();