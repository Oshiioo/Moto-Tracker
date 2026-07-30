import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA25q5cS_b9JiDU3jlXsW4IE6dq0XZIwtE",
  authDomain: "moto-tracker-683e6.firebaseapp.com",
  projectId: "moto-tracker-683e6",
  storageBucket: "moto-tracker-683e6.firebasestorage.app",
  messagingSenderId: "796710935555",
  appId: "1:796710935555:web:bf92b416e9e5d3a8a44236",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
