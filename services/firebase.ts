import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAvjpGpdnd1Fg5E6C6eDQgp7zwFI237gJw",
  authDomain: "lhb-gestao-financeira-pe-56ba0.firebaseapp.com",
  projectId: "lhb-gestao-financeira-pe-56ba0",
  storageBucket: "lhb-gestao-financeira-pe-56ba0.firebasestorage.app",
  messagingSenderId: "650845878072",
  appId: "1:650845878072:web:267d3f954c9a78efd7f3cd"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);