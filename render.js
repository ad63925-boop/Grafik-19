//Только отрисовка интерфейса

/* RENDER */

async function renderTable(data = null) {

     try {
const year = currentDate.getFullYear();
const month = currentDate.getMonth();
const daysInMonth = new Date(year, month + 1, 0).getDate();

    const container = document.getElementById("scheduleTable");

    if (container && data === null) {
      container.innerHTML = `
        <tr>
          <td colspan="${daysInMonth + 4}" class="schedule-loading">
            Загрузка графика...
          </td>
        </tr>
      `;
    }

    // Если данные не переданы, загружаем из Firebase
    if (data === null) {
      data = await loadMonthDataFromFirebase();
    }

        // Гарантируем, что data — массив
    if (!Array.isArray(data)) {
      console.warn("Данные графика не являются массивом, используем пустой массив");
      data = [];
    }
 
        // Загружаем список сотрудников (асинхронно)
    const allEmployees = await getEmployees();
    if (!Array.isArray(allEmployees)) {
      console.error("Список сотрудников не является массивом:", allEmployees);
      return;
    }


const dayNames = ["Вс","Пн","Вт","Ср","Чт","Пт","Сб"];
const monthName = `${currentDate.toLocaleString('ru-RU', { month: 'long' }).toUpperCase()} ${currentDate.getFullYear()}`;


// Шапка: первая строка (название месяца + дни недели)
let table = `
<tr>
<th class="td-none"></th>
<th class="td-month">${monthName}</th>
`;

for (let d = 1; d <= daysInMonth; d++) {
const dt = new Date(year, month, d);
const dayIndex = dt.getDay();
const isWeekend = (dayIndex === 0 || dayIndex === 6);
const isToday = (d === todayDate.getDate() && month === todayDate.getMonth() && year === todayDate.getFullYear());

table += `<th class="${isWeekend ? 'weekend' : ''} ${isToday ? 'today' : ''}">${dayNames[dayIndex]}</th>`;
}

table += `
<th rowspan="2">Итого</th>
<th rowspan="2">Опции</th>
</tr>`;

// Вторая строка: номера и имена + числа месяца
table += `<tr>`;
table += `<th>№</th>`;
table += `<th>Ф.И.О.</th>`;
for (let d = 1; d <= daysInMonth; d++) {
const dt = new Date(year, month, d);
const isWeekend = (dt.getDay() === 0 || dt.getDay() === 6);
const isToday = (d === todayDate.getDate() && month === todayDate.getMonth() && year === todayDate.getFullYear());

table += `<th class="${isWeekend ? 'weekend' : ''} ${isToday ? 'today' : ''} column-header-day-${d}" onclick="highlightColumn(${d})" style="cursor:pointer">${d}</th>`;
}
table += `</tr>`;

// Очищаем массив от null/undefined элементов
data = data.filter(emp => emp !== null && emp !== undefined);

//const allEmployees = getEmployees();

// Строки сотрудников
data.forEach((emp, i) => {
if (!emp) return; // дополнительная защита
const shifts = emp.shifts || {};
table += `<tr id="rowNameSecurity_${i}" class="row-Name-Security">`;
table += `<td onclick="highlightRow(${i})" style="cursor:pointer"><b>${i + 1}</b></td>`;


table += `<td>
<select class="names" title="ID: ${emp.id}" onchange="changeEmployeeInRow(${i}, this.value)">
<option value="">-- выбрать --</option>
${allEmployees.map(e => `
<option value="${e.id}" ${e.id === emp.id ? 'selected' : ''}>
${e.name}
</option>
`).join("")}
</select>
</td>`;

let total = 0;
for (let d = 1; d <= daysInMonth; d++) {
const dt = new Date(year, month, d);
const isWeekend = (dt.getDay() === 0 || dt.getDay() === 6);
const isToday = (d === todayDate.getDate() && month === todayDate.getMonth() && year === todayDate.getFullYear());

const val = shifts[d] ?? "";
if (val) total++;

table += `
<td class="${val ? 'shift-' + val : ''}">
<select onchange="updateShift(${emp.id},${d},this.value)">
${SHIFT_TYPES.map(s => `<option ${s == val ? 'selected' : ''}>${s}</option>`).join("")}
</select>
</td>`;
}

table += `<td>${total}</td>`;
table += `
<td>
<button class="btn-option-edit" onclick="duplicateEmployee(${i})">
<i class="fa-solid fa-copy"></i>
</button>
<button class="btn-option-delete" onclick="deleteEmployee(${i})">
<i class="fa-solid fa-trash-can"></i>
</button>
</td>`;

table += `</tr>`;
});

    if (container) {
      container.innerHTML = table;

      // Обновляем панель сотрудников
      await renderEmployeesPanel();

      // Проверяем повторы смен
      checkColumnRepeats();


      // Прокручиваем к сегодняшнему дню
      setTimeout(scrollToToday, 100);
    } else {
      console.error("Элемент #scheduleTable не найден в DOM");
    }
  } catch (error) {
    console.error("Ошибка при отрисовке таблицы:", error);
    // Показываем сообщение об ошибке в интерфейсе
    const container = document.getElementById("scheduleTable");
    if (container) {
      container.innerHTML = `
<tr>
  <td colspan="32" style="text-align: center; color: red;">
    Ошибка отрисовки таблицы: ${error.message}
  </td>
</tr>`;
    }
  }
}

	/* ======== ПЛАВНАЯ ПРОКРУТКА К СЕГОДНЯШНЕМУ ДНЮ ======== */

async function scrollToToday() {
  const wrapper = document.querySelector(".table-wrapper");
  const todayCell = document.querySelector("th.today");

  if (!wrapper) {
    console.warn("Элемент .table-wrapper не найден");
    return;
  }
  if (!todayCell) {
    console.warn("Сегодняшняя ячейка не найдена");
    return;
  }

    // ширина фиксированных колонок: № + ФИО
    const fixedCols = document.querySelectorAll(
        "#scheduleTable th:first-child, #scheduleTable th:nth-child(2)"
    );

    let fixedWidth = 0;
    fixedCols.forEach(col => fixedWidth += col.offsetWidth);

    // прокрутка так, чтобы today был СРАЗУ СПРАВА от ФИО
    wrapper.scrollTo({
        left: todayCell.offsetLeft - fixedWidth,
        behavior: "smooth"
    });
}

/* ——— ПОДСВЕТКА СТРОКИ ——— */
// Эта функция вызывается при клике на номер строки и выделяет всю строку с именем сотрудника
function highlightRow(i) {
    document.querySelectorAll("tr").forEach(r => r.classList.remove("highlight"));
    document.getElementById("rowNameSecurity_" + i).classList.add("highlight");
}

/* ——— ПОДСВЕТКА СТОЛБЦА ——— */
// Эта функция вызывается при клике на заголовок дня (столбец) и выделяет все ячейки этого столбца
function highlightColumn(day) {
    const table = document.getElementById("scheduleTable");
    if (!table) return;

    // Сбрасываем все выделения "highlight-column" со всех ячеек
    document.querySelectorAll(".highlight-column").forEach(cell => {
        cell.classList.remove("highlight-column");
    });
    
    // Индекс столбца (ячейки) в строке:
    // 0: № | 1: Ф.И.О. | 2: День 1 | 3: День 2 | ...
    // Таким образом, день 'd' соответствует индексу 'd + 1'
    const columnIndex = day + 1;
    console.log('Дата: '+columnIndex);
    // Перебираем все строки таблицы (включая заголовки)
    for (let r = 1; r < table.rows.length; r++) {
        const row = table.rows[r];
        
        // Проверяем, существует ли ячейка с таким индексом в текущей строке
        if (columnIndex < row.cells.length) {
            const cell = row.cells[columnIndex];
			
            // Добавляем класс выделения к нужной ячейке
            cell.classList.add("highlight-column");
        }
    }
}

/* ——— ПОВТОРЫ ПО СТОЛБЦАМ ——— */
// Эта функция проверяет каждый день (столбец) на наличие повторяющихся смен и выделяет красным, если есть повторы
function checkColumnRepeats() {
    const rows = document.getElementById("scheduleTable").rows;
    if (!rows.length) return;

    let days = rows[0].cells.length - 3;

    for (let d = 2; d <= days; d++) {

        let used = {};
        let repeated = false;

        for (let r = 1; r < rows.length; r++) {
            let sel = rows[r].cells[d].querySelector("select");
            if (!sel) continue;

            let val = sel.value;

            if (val !== "") {
                if (used[val]) repeated = true;
                used[val] = true;
            }
        }

        for (let r = 0; r < rows.length; r++) {
            rows[r].cells[d].classList.toggle("red", repeated);
        }
    }
}

// Эта функция рендерит панель со списком сотрудников и кнопками редактирования/удаления
async function renderEmployeesPanel() {
  const employeesListcont = document.getElementById("employeesList");
  if (!employeesListcont) return;

  // Показываем индикатор загрузки
  employeesListcont.innerHTML = '<div class="loading">Загрузка сотрудников...</div>';

  try {
    // Асинхронно получаем сотрудников
    const employees = await getEmployees();

    // Проверка: если employees не массив, используем пустой массив
    const validEmployees = Array.isArray(employees) ? employees : [];

    if (validEmployees.length === 0) {
      employeesListcont.innerHTML = '<div class="no-data">Сотрудники не найдены</div>';
      return;
    }

    // Очищаем контейнер
    employeesListcont.innerHTML = '';

    validEmployees.forEach(emp => {
      const div = document.createElement('div');
      div.className = 'employee-item';
      div.innerHTML = `
        <span>${emp.name}</span>
        <div class="employee-actions">
          <button class="btn-edit-emp" data-id="${emp.id}" title="Редактировать имя">
            ✏️ Edit
          </button>
          <button class="btn-remove-emp" data-id="${emp.id}" title="Удалить сотрудника">
            🗑️ Del
          </button>
        </div>
      `;

      // Добавляем обработчики событий
      const removeBtn = div.querySelector('.btn-remove-emp');
      removeBtn.addEventListener('click', () => {
        deleteEmployeeForID(emp.id);
      });

      const editBtn = div.querySelector('.btn-edit-emp');
      editBtn.addEventListener('click', () => {
        editEmployeeNameId(emp.id);
      });

      employeesListcont.appendChild(div);
    });
  } catch (error) {
    console.error('Ошибка при рендере панели сотрудников:', error);
    employeesListcont.innerHTML = `
      <div class="error">
        Ошибка загрузки сотрудников: ${error.message}
      </div>
    `;
  }
}



async function loadMonthDataFromFirebase() {
  const key = getKey();
  console.log("Загрузка данных из:", `/schedules/${key}`);

  try {
    const snapshot = await dbGet(dbRef(`/schedules/${key}`));
    const data = snapshot.exists() ? snapshot.val() : [];
    console.log("Загруженные данные графика:", data);
    return data;
  } catch (error) {
    console.error("Ошибка загрузки данных месяца:", error);
    throw error;
  }
}


//Скрытие формы добавления смен из календаря
var btnCloseBath = document.getElementById("btnCloseBath");
btnCloseBath.addEventListener("click", closeBath);
function closeBath(){
    batchShift.classList.remove('batch-shift-form-block');
    panelSeting.classList.toggle('is-hidden');
}

//---СКРИНШОТ---
const screenshotBtn = document.getElementById('screenshotBtn');
if (screenshotBtn) {
    screenshotBtn.addEventListener('click', async () => {
        const graphElement = document.getElementById('scheduleTable');
        if (!graphElement) return alert('Элемент с графиком не найден.');

        const screenshot = await html2canvas(graphElement, {
            scale: 2,
            useCORS: true
        });

        const screenshotBlob = await new Promise((resolve) => {
            screenshot.toBlob(resolve, 'image/png');
        });

        const screenshotUrl = URL.createObjectURL(screenshotBlob);
        const link = document.createElement('a');
        link.href = screenshotUrl;
        link.download = 'График_смен.png';
        link.click();
        URL.revokeObjectURL(screenshotUrl);
    });
}


renderEmployeesPanel();
scrollToToday();

async function loadAndRenderTable() {
  try {
    const data = await loadMonthDataFromFirebase();
    await renderTable(data);
  } catch (error) {
    console.error("Ошибка загрузки и отрисовки таблицы:", error);
  }
}

