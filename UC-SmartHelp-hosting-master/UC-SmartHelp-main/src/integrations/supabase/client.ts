import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBrAYGeYG0kTEjmqGeaJ6FsR_clJSaQtn8", 
  authDomain: "uc-smarthelp.firebaseapp.com",
  projectId: "uc-smarthelp",
  storageBucket: "uc-smarthelp.appspot.com",
  messagingSenderId: "367123456789", 
  appId: "1:367123456789:web:abcdef12345" 
};

// FIX: This check prevents the "Duplicate App" white screen crash
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
