import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBrAYGeYG0kTEjmqGeaJ6FsR_clJSaQtn8", 
  authDomain: "uc-smarthelp.firebaseapp.com",
  projectId: "uc-smarthelp",
  storageBucket: "uc-smarthelp.appspot.com",
  messagingSenderId: "367123456789", // <-- Replace with your Sender ID from Firebase
  appId: "1:367123456789:web:abcdef12345" // <-- Replace with your App ID from Firebase
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
