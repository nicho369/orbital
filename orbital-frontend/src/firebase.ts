// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCzDzOTuMT4d-ylkud9NVcvr3wVgKsBCJE",
  authDomain: "soc-gradwise.firebaseapp.com",
  projectId: "soc-gradwise",
  storageBucket: "soc-gradwise.firebasestorage.app",
  messagingSenderId: "541180052252",
  appId: "1:541180052252:web:1001e5695c6c1e99c9b0d9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export { auth, provider, signInWithPopup };