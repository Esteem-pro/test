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
