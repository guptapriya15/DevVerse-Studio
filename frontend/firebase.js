import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth"

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "dev-verse-studio.firebaseapp.com",
  projectId: "dev-verse-studio",
  storageBucket: "dev-verse-studio.firebasestorage.app",
  messagingSenderId: "554320488240",
  appId: "1:554320488240:web:786ef62de3b20fb43f8af5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider