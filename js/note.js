let editingNoteId = null;
let showAllNotes = false;

document.addEventListener("DOMContentLoaded", () => {
  const btnShowNoteForm = document.getElementById("btnShowNoteForm");
  const btnCloseNoteForm = document.getElementById("btnCloseNoteForm");
  const btnSaveNote = document.getElementById("btnSaveNote");
  const btnShowAllNotes = document.getElementById("btnShowAllNotes");

btnShowAllNotes?.addEventListener("click", toggleShowAllNotes);
  btnShowNoteForm?.addEventListener("click", openCreateNoteForm);
  btnCloseNoteForm?.addEventListener("click", closeNoteForm);
  btnSaveNote?.addEventListener("click", saveNote);

  renderNotes();
});

function getTodayString() {
  return new Date().toISOString().slice(0, 10);
}

function getNotesPath() {
  return `/notes/${getKey()}`;
}

function openCreateNoteForm() {
  editingNoteId = null;

  document.getElementById("noteFormTitle").textContent = "Новая заметка";
  document.getElementById("noteText").value = "";
  document.getElementById("noteReminderDate").value = getTodayString();

  document.getElementById("noteForm").classList.remove("is-hidden");
}

function openEditNoteForm(note) {
  editingNoteId = note.id;

  document.getElementById("noteFormTitle").textContent = "Редактировать заметку";
  document.getElementById("noteText").value = note.text;
  document.getElementById("noteReminderDate").value = note.reminderDate;

  document.getElementById("noteForm").classList.remove("is-hidden");

    //Прокрутка к форме заметки при открытии
    noteForm.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });

}

function closeNoteForm() {
  document.getElementById("noteForm").classList.add("is-hidden");
  editingNoteId = null;
}

async function getNotes() {
  const snapshot = await dbGet(dbRef(getNotesPath()));
  const notes = snapshot.exists() ? snapshot.val() : [];

  return Array.isArray(notes) ? notes.filter(Boolean) : Object.values(notes || {});
}

async function saveNotes(notes) {
  await dbSet(dbRef(getNotesPath()), notes);
}

//Показать все заметки
async function toggleShowAllNotes() {
  showAllNotes = !showAllNotes;

  const btnShowAllNotes = document.getElementById("btnShowAllNotes");

  if (btnShowAllNotes) {
    btnShowAllNotes.innerHTML = showAllNotes
      ? '<i class="fa-solid fa-calendar-day"></i> Показать на сегодня'
      : '<i class="fa-solid fa-list"></i> Показать все заметки';
  }

  await renderNotes();
}

//Сохранение заметки (создание новой или обновление существующей)
async function saveNote() {
  const text = document.getElementById("noteText").value.trim();
  const reminderDate = document.getElementById("noteReminderDate").value;

  if (!text) {
    showNoteMessage("warning", "Введите текст заметки");
    return;
  }

  if (!reminderDate) {
    showNoteMessage("warning", "Выберите дату напоминания");
    return;
  }

  const isEditing = Boolean(editingNoteId);
  const confirmed = await askNoteConfirm(
    isEditing ? "Сохранить изменения в заметке?" : "Создать новую заметку?"
  );

  if (!confirmed) return;

  try {
    const notes = await getNotes();

    if (isEditing) {
      const note = notes.find(item => item.id === editingNoteId);

      if (note) {
        note.text = text;
        note.reminderDate = reminderDate;
        note.updatedAt = new Date().toISOString();
      }
    } else {
      notes.push({
        id: crypto.randomUUID(),
        text,
        reminderDate,
        createdAt: new Date().toISOString(),
        updatedAt: null
      });
    }

    await saveNotes(notes);
    closeNoteForm();
    await renderNotes();

    showNoteMessage(
      "success",
      isEditing ? "Заметка обновлена" : "Заметка создана"
    );
  } catch (error) {
    console.error("Ошибка сохранения заметки:", error);
    showNoteMessage("error", "Не удалось сохранить заметку");
  }
}

async function deleteNote(noteId) {
  const confirmed = await askNoteConfirm("Удалить эту заметку?");

  if (!confirmed) return;

  try {
    const notes = await getNotes();
    const updatedNotes = notes.filter(note => note.id !== noteId);

    await saveNotes(updatedNotes);
    await renderNotes();

    showNoteMessage("success", "Заметка удалена");
  } catch (error) {
    console.error("Ошибка удаления заметки:", error);
    showNoteMessage("error", "Не удалось удалить заметку");
  }
}

async function renderNotes() {
  updateNotesMonthTitle();
  
  const container = document.getElementById("notesList");
  if (!container) return;

  container.innerHTML = '<div class="notes-empty">Загрузка заметок...</div>';

  try {
    const notes = await getNotes();
    const today = getTodayString();

const visibleNotes = (showAllNotes
  ? notes
  : notes.filter(note => note.reminderDate <= today)
).sort((a, b) => {
  return new Date(a.reminderDate) - new Date(b.reminderDate);
});

if (visibleNotes.length === 0) {
  container.innerHTML = showAllNotes
    ? '<div class="notes-empty">Заметок пока нет</div>'
    : '<div class="notes-empty">На сегодня заметок нет</div>';
  return;
}
    container.innerHTML = "";

    visibleNotes.forEach(note => {
      const card = document.createElement("div");
      card.className = "note-card";

      card.innerHTML = `
        <div class="note-card-content">
          <div class="note-text">${escapeHtml(note.text)}</div>

        <div class="note-meta">
        <span>
            <i class="fa-regular fa-calendar"></i>
            Напоминание: ${formatDate(note.reminderDate)}
        </span>

        <span>
            <i class="fa-regular fa-clock"></i>
            Создано: ${formatDateTime(note.createdAt)}
        </span>

        ${note.updatedAt ? `
            <span>
            <i class="fa-regular fa-pen-to-square"></i>
            Изменено: ${formatDateTime(note.updatedAt)}
            </span>
        ` : ""}
        </div>

        <div class="note-actions">
          <button class="note-action-btn edit" title="Редактировать">
            <i class="fa-solid fa-pen"></i>
            <span>Редактировать</span>
          </button>

          <button class="note-action-btn delete" title="Удалить">
            <i class="fa-solid fa-trash"></i>
            <span>Удалить</span>
          </button>
        </div>
      `;

      card.querySelector(".edit").addEventListener("click", () => openEditNoteForm(note));
      card.querySelector(".delete").addEventListener("click", () => deleteNote(note.id));

      container.appendChild(card);
    });
  } catch (error) {
    console.error("Ошибка загрузки заметок:", error);
    container.innerHTML = '<div class="notes-empty notes-error">Не удалось загрузить заметки</div>';
  }
}

function formatDate(value) {
  if (!value) return "";

  return new Date(value + "T00:00:00").toLocaleDateString("ru-RU");
}

function formatDateTime(value) {
  if (!value) return "";

  return new Date(value).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

// Обновление заголовка месяца при загрузке страницы и при смене месяца
function updateNotesMonthTitle() {
  const title = document.getElementById("notesMonthTitle");
  if (!title) return;

  const monthName = currentDate.toLocaleDateString("ru-RU", {
    month: "long",
    year: "numeric"
  });

  title.textContent = `Заметки на ${monthName}`;
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function showNoteMessage(type, message) {
  if (typeof Swal !== "undefined") {
    Swal.fire({
      icon: type,
      title: type === "success" ? "Готово" :
             type === "warning" ? "Внимание" : "Ошибка",
      text: message,
      confirmButtonText: "OK"
    });
  } else {
    alert(message);
  }
}

async function askNoteConfirm(message) {
  if (typeof Swal !== "undefined") {
    const result = await Swal.fire({
      icon: "warning",
      title: "Подтверждение",
      text: message,
      showCancelButton: true,
      confirmButtonText: "Да",
      cancelButtonText: "Отмена",
      reverseButtons: true
    });

    return result.isConfirmed;
  }

  return window.confirm(message);
}