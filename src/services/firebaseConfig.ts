import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCwsYzWZuS_pLfDusAY42FXhg4tQMQ03iI",
  authDomain: "piscineiro-68ac1.firebaseapp.com",
  projectId: "piscineiro-68ac1",
  storageBucket: "piscineiro-68ac1.firebasestorage.app",
  messagingSenderId: "231844613305",
  appId: "1:231844613305:web:50fe264b8cbccfc0d95f68"
};

// Inicializa o app apenas se ainda não tiver sido iniciado
const app: FirebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);

export { app, auth, db };