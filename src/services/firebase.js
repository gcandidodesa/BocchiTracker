// src/services/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, doc, deleteDoc, updateDoc, getDoc, setDoc } from "firebase/firestore";

// O import.meta.env puxa as variáveis do seu arquivo .env com segurança
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Inicializa o app e o banco de dados
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Exporta o banco de dados e as funções que vamos usar nos componentes
export { db, collection, addDoc, getDocs, doc, deleteDoc, updateDoc, getDoc, setDoc };