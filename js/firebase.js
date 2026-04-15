// Проверка загрузки Firebase SDK
if (typeof firebase === 'undefined') {
  console.error("❌ Firebase SDK не загружен! Проверьте подключение скриптов.");
  throw new Error("Firebase SDK not available");
}

// Инициализация Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDpBsD67onWgFhfeqHCQ-7BYYgYnMLq194",
  authDomain: "grafik-96613.firebaseapp.com",
  databaseURL: "https://grafik-96613-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "grafik-96613",
  storageBucket: "grafik-96613.firebasestorage.app",
  messagingSenderId: "262369714005",
  appId: "1:26236971405:web:5b6cffd610c79ec4df19dc",
  measurementId: "G-G0GWHJQ89W"
};

try {
  // Инициализируем приложение
  const app = firebase.initializeApp(firebaseConfig);
  
  // Получаем экземпляр базы данных (правильный способ для compat-режима)
  const db = firebase.database();
  
  // Глобальные ссылки — адаптируем под compat-режим
  window.db = db;
  window.dbRef = db.ref; // ref() вызывается у экземпляра db
  window.dbSet = db.set; // set() вызывается у ref
  window.dbGet = db.get; // get() вызывается у ref
  window.dbOnValue = db.onValue; // onValue() вызывается у ref

  console.log("🔥 Firebase v10 готов");
  window.firebaseReady = true;
} catch (error) {
  console.error("❌ Ошибка инициализации Firebase:", error);
}
