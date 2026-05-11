//Всё что относится к сотрудникам
/* EMPLOYEES */

async function updateEmployeeSelect() {
  const select = document.getElementById("employeeSelect");
  if (!select) return;

  select.innerHTML = "";

  let list;
  try {
    list = await getEmployees();
  } catch (error) {
    console.error("Ошибка при загрузке сотрудников:", error);
    showNotification('error', 'Не удалось загрузить список сотрудников');
    return;
  }

  const employees = Array.isArray(list) ? list : [];

  employees.forEach((emp, index) => {
    const option = document.createElement("option");
    option.value = emp.id;
    option.textContent = emp.name;
    select.appendChild(option);
  });

  if (typeof initChoicesOn === 'function') {
    initChoicesOn('#employeeSelect', { searchEnabled: true, shouldSort: false });
  }
}

// Получение списка сотрудников (асинхронная функция для работы с Firebase)
var BtnAddEmployeeToList = document.getElementById("BtnAddEmployeeToList");
BtnAddEmployeeToList.addEventListener("click", addEmployeeToList);

async function addEmployeeToList() {
  const input = document.getElementById("newEmployeeName");
  if (!input) return;

  const name = input.value.trim();
  if (!name) {
    return showNotification('warning', 'Введите имя сотрудника');
  }

  let list;
  try {
    // Загружаем список сотрудников из Firebase
    list = await getEmployees();
  } catch (error) {
    console.error("Ошибка загрузки сотрудников из Firebase:", error);
    return showNotification('error', 'Ошибка загрузки списка сотрудников');
  }

  if (!Array.isArray(list)) list = [];

  // Проверяем, есть ли сотрудник с таким именем в списке
  if (list.some(e => e.name === name)) {
    return showNotification('warning', 'Сотрудник уже есть в списке');
  }

  // Добавляем нового сотрудника в Firebase
  await addEmployeeToFirebase(name);

  // Обновляем панель сотрудников
  await renderEmployeesPanel();

  // Очищаем поле ввода
  input.value = "";
}

// Новая функция для добавления сотрудника в Firebase
async function addEmployeeToFirebase(name) {
  try {
    // Правильный вызов ref(): передаём db и путь как отдельные аргументы
    const employeesRef = dbRef('employees');

    // Получаем текущий список
    const snapshot = await dbGet(dbRef('employees'));
    let currentList = snapshot.exists() ? snapshot.val() : [];

    if (!Array.isArray(currentList)) currentList = [];

    // Генерируем ID для нового сотрудника
    const newId = currentList.length > 0
      ? Math.max(...currentList.map(e => e.id)) + 1
      : 1;

    // Создаём нового сотрудника
    const newEmployee = { id: newId, name: name };

    // Добавляем в список
    currentList.push(newEmployee);

    // Сохраняем обновлённый список в Firebase
    await dbSet(employeesRef, currentList);

    console.log("Сотрудник добавлен в Firebase:", name);
  } catch (error) {
    console.error("Ошибка при добавлении сотрудника в Firebase:", error);
    throw error;
  }
}



var btnRemoveEmployeeFromList = document.getElementById("btnRemoveEmployeeFromList");

if (btnRemoveEmployeeFromList) {
  btnRemoveEmployeeFromList.addEventListener("click", removeEmployeeFromList);
}

async function removeEmployeeFromList() {
  const select = document.getElementById("employeeSelect");
  if (!select) {
    showNotification('error', 'Элемент выбора сотрудников не найден');
    return;
  }

  const selectedId = select.value;
  if (!selectedId) {
    showNotification('warning', 'Выберите сотрудника для удаления');
    return;
  }

  let list;
  try {
    // Исправлено: используем await для асинхронного вызова
    list = await getEmployees();
  } catch (error) {
    console.error("Ошибка загрузки сотрудников:", error);
    return showNotification('error', 'Ошибка загрузки списка сотрудников');
  }

  if (!Array.isArray(list)) {
    showNotification('error', 'Список сотрудников повреждён');
    return;
  }

  const index = list.findIndex(e => String(e.id) === selectedId);
  if (index === -1) {
    showNotification('error', 'Сотрудник не найден в списке');
    return;
  }

  const employeeName = list[index].name;
  if (!confirm(`Удалить сотрудника "${employeeName}" из списка?`)) {
    return;
  }

  try {
    list.splice(index, 1);
    // Сохраняем обновлённый список в Firebase
    await saveEmployees(list);

    renderEmployeesPanel();
    showNotification('success', `Сотрудник "${employeeName}" удалён из списка`);
  } catch (error) {
    console.error('Ошибка при удалении сотрудника:', error);
    showNotification('error', 'Ошибка при удалении сотрудника. Проверьте консоль.');
  }

    console.log("Загруженный список сотрудников:", list);
    console.log("Выбранный ID:", selectedId);
    console.log("Индекс сотрудника:", index);

}



function showNotification(type, message) {
  if (typeof Swal !== 'undefined') {
    Swal.fire({
      icon: type,
      title: type === 'success' ? 'Успех' :
           type === 'warning' ? 'Внимание' : 'Ошибка',
      text: message,
      confirmButtonText: 'OK'
    });
  } else {
    alert(message);
  }
}

