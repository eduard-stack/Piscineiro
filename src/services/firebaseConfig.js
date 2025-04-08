// firebaseConfig.js
// firebaseConfig.js
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

console.log('firebaseConfig.js: Carregando arquivo de configuração do Firebase');

const firebaseConfig = {
  apiKey: "AIzaSyCwsYzWZuS_pLfDusAY42FXhg4tQMQ03iI",
  authDomain: "piscineiro-68ac1.firebaseapp.com",
  projectId: "piscineiro-68ac1",
  storageBucket: "piscineiro-68ac1.firebasestorage.app",
  messagingSenderId: "231844613305",
  appId: "1:231844613305:web:50fe264b8cbccfc0d95f68"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

export { app, auth };