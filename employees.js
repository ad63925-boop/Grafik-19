//Всё что относится к сотрудникам
/* EMPLOYEES */

function updateEmployeeSelect() {
    const select = document.getElementById("employeeSelect");
    if (!select) return;

    select.innerHTML = "";

    const list = getEmployees();
console.log("LIST:", list);
console.log("Is array:", Array.isArray(list));
    list.forEach((emp, index) => {
        const option = document.createElement("option");
        option.value = emp.id;
        option.textContent = emp.name;
        select.appendChild(option);
    });
    // initialize Choices on employee select
    if (typeof initChoicesOn === 'function') initChoicesOn('#employeeSelect', { searchEnabled: true, shouldSort: false });
}

// Получение списка сотрудников из localStorage
var BtnAddEmployeeToList = document.getElementById("BtnAddEmployeeToList");
BtnAddEmployeeToList.addEventListener("click", addEmployeeToList);

function addEmployeeToList() {
    const input = document.getElementById("newEmployeeName");
    if (!input) return;

    const name = input.value.trim();

    if (!name) return Swal.fire({
  icon: "warning",
  title: "Внимание",
  text: "Введите имя сотрудника",
  confirmButtonText: "OK"
});

    const list = getEmployees();
    if (list.some(e => e.name === name))
        return Swal.fire({
  icon: "warning",
  title: "Внимание",
  text: "Сотрудник уже есть в списке",
  confirmButtonText: "OK"
});

    addEmployee(name);

    updateEmployeeSelect();
    renderEmployeesPanel();

    input.value = "";
}

var btnRemoveEmployeeFromList = document.getElementById("btnRemoveEmployeeFromList");
if (btnRemoveEmployeeFromList) {
  btnRemoveEmployeeFromList.addEventListener("click", removeEmployeeFromList);
}

function removeEmployeeFromList() {
  const select = document.getElementById("employeeSelect");
  if (!select) {
    showNotification('error', 'Элемент выбора сотрудников не найден');
    return;
  }

  const selectedId = select.value;

  // Проверка: выбран ли сотрудник
  if (!selectedId) {
    showNotification('warning', 'Выберите сотрудника для удаления');
    return;
  }

  const list = getEmployees();
  // Используем строгое сравнение с приведением типа
  const index = list.findIndex(e => String(e.id) === selectedId);

  if (index === -1) {
    showNotification('error', 'Сотрудник не найден в списке');
    return;
  }

  // Подтверждение удаления с указанием имени сотрудника
  const employeeName = list[index].name;
  if (!confirm(`Удалить сотрудника "${employeeName}" из списка?`)) {
    return;
  }

  try {
    // Удаляем сотрудника из массива
    list.splice(index, 1);

    // Сохраняем обновлённый список
    saveEmployees(list);

    // Обновляем интерфейс
    updateEmployeeSelect();
    renderEmployeesPanel();

    // Уведомление об успехе
    showNotification('success', `Сотрудник "${employeeName}" удалён из списка`);
  } catch (error) {
    console.error('Ошибка при удалении сотрудника:', error);
    showNotification('error', 'Ошибка при удалении сотрудника. Проверьте консоль.');
  }
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
