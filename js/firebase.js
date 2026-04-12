import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, set, get, onValue } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyDpBsD67onWgFhfeqHCQ-7BYYgYnMLq194",
    authDomain: "grafik-96613.firebaseapp.com",
    projectId: "grafik-96613",
    storageBucket: "grafik-96613.firebasestorage.app",
    messagingSenderId: "262369714005",
    appId: "1:262369714005:web:5b6cffd610c79ec4df19dc",
    measurementId: "G-G0GWHJQ89W"
  };

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// делаем глобально доступным
window.db = db;
window.dbRef = ref;
window.dbSet = set;
window.dbGet = get;
window.dbOnValue = onValue;