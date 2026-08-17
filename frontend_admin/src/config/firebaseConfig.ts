// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDyqIts2-iiCkBt2WLSkdsLXkejcDATZ24",
  authDomain: "hoan-beb2d.firebaseapp.com",
  projectId: "hoan-beb2d",
  storageBucket: "hoan-beb2d.firebasestorage.app",
  messagingSenderId: "238430218504",
  appId: "1:238430218504:web:9a09f82a17a8628b56a4bd",
  measurementId: "G-G71Q8B602C"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);