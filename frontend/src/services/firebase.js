// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
// Nota: Eliminamos firebase/analytics porque no es compatible con entornos nativos móviles (React Native)

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAeW9p4kAMUtnHoifq6_cMV3XggKS7n3A8",
  authDomain: "serviciomedicodistancia.firebaseapp.com",
  projectId: "serviciomedicodistancia",
  storageBucket: "serviciomedicodistancia.firebasestorage.app",
  messagingSenderId: "842414225506",
  appId: "1:842414225506:web:5083db8d696e546401793b",
  measurementId: "G-XK632PDFBG"
};

// Initialize Firebase (evita múltiples inicializaciones en recargas en caliente)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Inicializar la autenticación con persistencia local para React Native
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

export { auth, app };