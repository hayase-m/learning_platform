// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBZFuHJsP_TX7wCQnVX-YoYJjHetO2WF88",
  authDomain: "ai-study-buddy-rival.firebaseapp.com",
  projectId: "ai-study-buddy-rival",
  storageBucket: "ai-study-buddy-rival.firebasestorage.app",
  messagingSenderId: "325643116545",
  appId: "1:325643116545:web:9427756df08579f89de000",
  measurementId: "G-M13CBCYQVF"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const auth = getAuth(app);
