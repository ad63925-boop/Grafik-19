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

function removeEmployeeFromList() {
    const select = document.getElementById("employeeSelect");
    if (!select) return;

    const selectedId = select.value;
    const list = getEmployees();
    const index = list.findIndex(e => e.id == selectedId);

    if (index === -1) return;

    if (!confirm("Удалить сотрудника из списка?")) return;

    list.splice(index, 1);

    saveEmployees(list);

    updateEmployeeSelect();
    renderEmployeesPanel();
}