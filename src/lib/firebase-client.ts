import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";

// Клієнтський Firebase — лише для Phone Auth (SMS-фолбек, коли номера немає в
// Telegram). Конфіг веб-застосунку публічний за призначенням.
const firebaseConfig = {
  apiKey: "AIzaSyAqTMt9QpA_L4bsH0Cs3yXrDKgFiCJmmjI",
  authDomain: "volya-finance-itsolutions.firebaseapp.com",
  projectId: "volya-finance-itsolutions",
  storageBucket: "volya-finance-itsolutions.firebasestorage.app",
  messagingSenderId: "680660685393",
  appId: "1:680660685393:web:222e531989a8b6fffb5e70",
};

export function getFirebaseAuth(): Auth {
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  return getAuth(app);
}
