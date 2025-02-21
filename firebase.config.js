import { getApp, initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Vérifie si Firebase n'est pas déjà initialisé
let app;
let auth;
let db;

try {
  const firebaseConfig = {
    apiKey: "AIzaSyAPB1N4uWgGnZ4zvwTzdlTath42EKpxGeM",
    authDomain: "journal-sportif.firebaseapp.com",
    projectId: "journal-sportif",
    storageBucket: "journal-sportif.firebasestorage.app",
    messagingSenderId: "490734071506",
    appId: "1:490734071506:web:1d9d3108f21abea0f5c70b",
    measurementId: "G-0CJ9C3BQWY"
  };

  // Initialize Firebase seulement s'il n'est pas déjà initialisé
  app = initializeApp(firebaseConfig);

  // Initialize Auth with persistence
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });

  // Initialize Firestore
  db = getFirestore(app);
} catch (error) {
  // Si Firebase est déjà initialisé, on récupère l'instance existante
  if (error.code === 'auth/already-initialized') {
    console.log('Firebase already initialized, using existing instance');
    app = getApp();
    auth = getAuth(app);
    db = getFirestore(app);
  } else {
    console.error('Firebase initialization error:', error);
  }
}

export { auth, db };
export default app;