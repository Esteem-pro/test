// js/00-config.js
// ВСТАВЬТЕ СЮДА свои ключи. Пока поля пустые — приложение работает локально (localStorage).

window.FIREBASE_CONFIG = {
  apiKey: "",
  authDomain: "",
  databaseURL: "",   // ← обязательно для RTDB, вида https://XXX-default-rtdb.firebasedatabase.app
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: ""
};

window.CLOUD_CONFIG = {
  googleClientId: "",  // OAuth Client ID (Web) из Google Cloud Console, для Диска
  yandexClientId: "",  // ID OAuth-приложения Яндекс Диска
};

// Где хранить фото: "base64" (в базе, работает сразу) | "google" | "yandex"
window.PHOTO_PROVIDER = "base64";
// Email с правами администратора (нижний регистр).
// Первый вход этих пользователей получит роль admin.
window.ADMIN_EMAILS = ["admin@kd-co.pro"];

// Палитра цветов для новых сотрудников
var MEMBER_PALETTE=['#FF5A2D','#2E6BFF','#0FA36B','#8B5CF6','#F0447E','#0EA5C6','#E8930C','#5BA26B','#E5484D','#F59E0B'];
