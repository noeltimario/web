import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBrAYGeYG0kTEjmqGeaJ6FsR_clJSaQtn8",
  authDomain: "uc-smarthelp-1d3ba.firebaseapp.com",
  projectId: "uc-smarthelp-1d3ba",
  storageBucket: "uc-smarthelp-1d3ba.firebasestorage.app",
  messagingSenderId: "360098008892",
  appId: "1:360098008892:web:7f6f8745585098e9882297"
};

// Check if Firebase is already initialized to avoid the crash
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
