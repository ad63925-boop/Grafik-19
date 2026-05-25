document.addEventListener("DOMContentLoaded", () => {
  renderTomorrowAlarm();

  window.addEventListener("load", renderTomorrowAlarm);
});

function getTomorrowAlarmTime(shift) {
  const normalizedShift = String(shift || "").trim();

  if (normalizedShift === "О" || normalizedShift === "Уо") {
    return "6:00";
  }

  if (normalizedShift === "Д" || normalizedShift === "У") {
    return "6:20";
  }

  if (normalizedShift === "З") {
    return "7:20";
  }

  if (normalizedShift === "Н" || normalizedShift === "Ун") {
    return "19:30";
  }

  return null;
}

function getTomorrowDateInfo() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
    
  return {
    date: tomorrow,
    day: tomorrow.getDate(),
    key:
      "schedule_" +
      tomorrow.getFullYear() +
      "_" +
      String(tomorrow.getMonth() + 1).padStart(2, "0")
  };
}

async function getCurrentUserEmployeeId() {
  const username = 'Демиденко А.О.';
  const employees = await getEmployees();

  const employee = employees.find(item =>
    String(item.name).trim().toLowerCase() === String(username).trim().toLowerCase()
  );

  return employee ? employee.id : null;
}

async function renderTomorrowAlarm() {
  const box = document.getElementById("tomorrowAlarmBox");
  if (!box) return;

  box.hidden = false;
  box.className = "tomorrow-alarm-box";
  box.innerHTML = `
    <div class="tomorrow-alarm-icon">
      <i class="fa-solid fa-clock"></i>
    </div>
    <div>
      <div class="tomorrow-alarm-title">Проверяем смену на завтра...</div>
      <div class="tomorrow-alarm-text">Загрузка данных графика</div>
    </div>
  `;

  try {
    const employeeId = await getCurrentUserEmployeeId();

    if (!employeeId) {
      box.classList.add("is-muted");
      box.innerHTML = `
        <div class="tomorrow-alarm-icon">
          <i class="fa-solid fa-circle-info"></i>
        </div>
        <div>
          <div class="tomorrow-alarm-title" title="Демиденко А.О.">Будильник на завтра</div>
          <div class="tomorrow-alarm-text">Не найден сотрудник с именем текущего пользователя</div>
        </div>
      `;
      return;
    }

    const tomorrow = getTomorrowDateInfo();
    const snapshot = await dbGet(dbRef(`/schedules/${tomorrow.key}`));
    const data = snapshot.exists() ? snapshot.val() : [];

    const row = Array.isArray(data)
      ? data.find(item => String(item.id) === String(employeeId))
      : null;

    const shift = row?.shifts?.[tomorrow.day] || "";
    const alarmTime = getTomorrowAlarmTime(shift);

    if (!alarmTime) {
      box.classList.add("is-free");
      box.innerHTML = `
        <div class="tomorrow-alarm-icon">
          <i class="fa-solid fa-mug-hot"></i>
        </div>
        <div>
          <div class="tomorrow-alarm-title">Завтра выходной</div>
          <div class="tomorrow-alarm-text">${formatTomorrowDate(tomorrow.date)}</div>
        </div>
      `;
      return;
    }

    box.classList.add("is-active");
    box.innerHTML = `
      <div class="tomorrow-alarm-icon">
        <i class="fa-solid fa-bell"></i>
      </div>
      <div>
        <div class="tomorrow-alarm-title">Будильник на завтра в ${alarmTime}</div>
        <div class="tomorrow-alarm-text">
          ${formatTomorrowDate(tomorrow.date)} · смена ${shift}
        </div>
      </div>
    `;
  } catch (error) {
    console.error("Ошибка определения завтрашней смены:", error);

    box.classList.add("is-error");
    box.innerHTML = `
      <div class="tomorrow-alarm-icon">
        <i class="fa-solid fa-triangle-exclamation"></i>
      </div>
      <div>
        <div class="tomorrow-alarm-title">Не удалось проверить завтрашнюю смену</div>
        <div class="tomorrow-alarm-text">Проверьте подключение к Firebase</div>
      </div>
    `;
  }
}

function formatTomorrowDate(date) {
  return date.toLocaleDateString("ru-RU", {
    weekday: "long",
    day: "2-digit",
    month: "long"
  });
}