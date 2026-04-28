import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  // Use the API Key from your .env or Firebase Console
  apiKey: "AIzaSyBrAYGeYG0kTEjmqGeaJ6FsR_clJSaQtn8", 
  authDomain: "uc-smarthelp.firebaseapp.com",
  projectId: "uc-smarthelp",
  storageBucket: "uc-smarthelp.appspot.com",
  // IMPORTANT: Replace these two with the actual numbers from your Firebase Settings
  messagingSenderId: "367123456789", 
  appId: "1:367123456789:web:abcdef12345"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
