import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, inMemoryPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyAPB1N4uWgGnZ4zvwTzdlTath42EKpxGeM",
  authDomain: "journal-sportif.firebaseapp.com",
  projectId: "journal-sportif",
  storageBucket: "journal-sportif.firebasestorage.app",
  messagingSenderId: "490734071506",
  appId: "1:490734071506:web:1d9d3108f21abea0f5c70b",
  measurementId: "G-0CJ9C3BQWY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth
const auth = getAuth();
setPersistence(auth, inMemoryPersistence);

// Initialize Firestore
const db = getFirestore(app);

export { auth, db };
export default app;