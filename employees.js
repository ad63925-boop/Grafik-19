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



// Получение списка сотрудников из localStorage
var BtnAddEmployeeToList = document.getElementById("BtnAddEmployeeToList");
BtnAddEmployeeToList.addEventListener("click", addEmployeeToList);

function addEmployeeToList() {
  const input = document.getElementById("newEmployeeName");
  if (!input) return;

  const name = input.value.trim();
  if (!name) {
    return showNotification('warning', 'Введите имя сотрудника');
  }

  let list;
  try {
    list = getEmployees();
  } catch (error) {
    console.error("Ошибка загрузки сотрудников:", error);
    return showNotification('error', 'Ошибка загрузки списка сотрудников');
  }

  if (!Array.isArray(list)) list = [];

  if (list.some(e => e.name === name)) {
    return showNotification('warning', 'Сотрудник уже есть в списке');
  }

  addEmployee(name);

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
  if (!selectedId) {
    showNotification('warning', 'Выберите сотрудника для удаления');
    return;
  }

  let list;
  try {
    list = getEmployees();
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
    saveEmployees(list);

    renderEmployeesPanel();
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

console.log(localStorage.getItem("employees"));
