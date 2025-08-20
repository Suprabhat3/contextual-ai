// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from 'firebase/firestore';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: "contextual-ai3.firebaseapp.com",
  projectId: "contextual-ai3",
  storageBucket: "contextual-ai3.firebasestorage.app",
  messagingSenderId: "265140623559",
  appId: "1:265140623559:web:d8d8c0c9336981939c06e2",
  measurementId: "G-5Y4TK9DK9S"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);
export const auth = getAuth(app)

export const db = getFirestore(app);