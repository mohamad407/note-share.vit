// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD2jz8R-Ur7oX5lFtxroZ5Bs1xhO44-rdA",
  authDomain: "notevault-1f4bb.firebaseapp.com",
  projectId: "notevault-1f4bb",
  storageBucket: "notevault-1f4bb.firebasestorage.app",
  messagingSenderId: "600109075790",
  appId: "1:600109075790:web:71626e8701726f3161e21f",
  measurementId: "G-484XPXQLN7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
