import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyDhsyBDTunGA-cAJb9XbGc2oYLAyycDqsE",
    authDomain: "promptlib-56d93.firebaseapp.com",
    projectId: "promptlib-56d93",
    storageBucket: "promptlib-56d93.firebasestorage.app",
    messagingSenderId: "721150784339",
    appId: "1:721150784339:web:55a3d89f3e9c6d633a67a6",
    measurementId: "G-3N53RZWTP1"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
