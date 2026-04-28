import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAwr0NAzEKOfd1M9pnRYSw7uYpmpHDLsdk",
  authDomain: "uc-smarthelp-1d3ba.firebaseapp.com",
  projectId: "uc-smarthelp-1d3ba",
  storageBucket: "uc-smarthelp-1d3ba.firebasestorage.app",
  messagingSenderId: "870671178304",
  appId: "1:870671178304:web:18099f23abded48a431da5"
};

// Prevent duplicate Firebase app initialization
const app = !getApps().length
  ? initializeApp(firebaseConfig)
  : getApp();

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export default app;
