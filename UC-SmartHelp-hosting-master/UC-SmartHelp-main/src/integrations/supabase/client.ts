import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// GO TO: Firebase Console > Project Settings to get these real values
const firebaseConfig = {
  apiKey: "AIzaSy...", // REPLACED: Put your real Web API Key here
  authDomain: "uc-smarthelp.firebaseapp.com",
  projectId: "uc-smarthelp",
  storageBucket: "uc-smarthelp.appspot.com",
  messagingSenderId: "123456789", 
  appId: "1:123456789:web:abcdef" // REPLACED: Put your real App ID here
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
