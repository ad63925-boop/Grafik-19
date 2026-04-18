// Проверка загрузки Firebase SDK
if (typeof firebase === 'undefined') {
  console.error("❌ Firebase SDK не загружен! Проверьте подключение скриптов.");
  throw new Error("Firebase SDK not available");
}

// Инициализация Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDpBsD67onWgFhfeqHCQ-7BYYgYnMLq194",
  authDomain: "grafik-96613.firebaseapp.com",
  // Исправление: добавлено "s" в "https"
  databaseURL: "https://grafik-96613-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "grafik-96613",
  storageBucket: "grafik-96613.firebasestorage.app",
  messagingSenderId: "262369714005",
  appId: "1:26236971405:web:5b6cffd610c79ec4df19dc",
  measurementId: "G-G0GWHJQ89W"
};

try {
  // Инициализируем приложение (compat-режим)
  const app = firebase.initializeApp(firebaseConfig);

  // Получаем экземпляр базы данных
  const db = firebase.database();

  // Глобальные ссылки — для compat-режима
  window.db = db;

  // Исправленная версия dbRef с валидацией
  window.dbRef = (path) => {
    // Проверка инициализации Firebase
    if (typeof db === 'undefined' || !db) {
      console.error("❌ Firebase db не инициализирован");
      throw new Error("Firebase database not initialized");
    }

    // Валидация типа пути
    if (typeof path !== 'string') {
      console.error(
        "❌ dbRef вызван с некорректным типом пути:",
        typeof path,
        path
      );
      throw new Error(`dbRef expects string path, got ${typeof path}`);
    }

    // Очистка пути от лишних пробелов
    const cleanPath = path.trim();

    // Проверка на пустую строку
    if (cleanPath === '') {
      console.error("❌ Путь не может быть пустой строкой");
      throw new Error("dbRef path cannot be empty");
    }

    return db.ref(cleanPath);
  };

  window.dbGet = async (ref) => {
    if (!ref) {
      throw new Error("dbGet called with null/undefined reference");
    }
    const snapshot = await ref.once('value');
    return snapshot;
  };

  window.dbSet = async (ref, data) => {
    if (!ref) {
      throw new Error("dbSet called with null/undefined reference");
    }
    await ref.set(data);
  };

  window.dbOnValue = (ref, callback) => {
    if (!ref) {
      throw new Error("dbOnValue called with null/undefined reference");
    }
    if (typeof callback !== 'function') {
      throw new Error("dbOnValue callback must be a function");
    }
    ref.on('value', callback);
    return ref;
  };

  console.log("🔥 Firebase (compat-режим) готов");
  window.firebaseReady = true;
} catch (error) {
  console.error("❌ Ошибка инициализации Firebase:", error);
}
