import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyCCxVBKgX-QDHNvbGE1Er129I-OYJwO1OU",
  authDomain: "hmhm-70a37.firebaseapp.com",
  projectId: "hmhm-70a37",
  storageBucket: "hmhm-70a37.firebasestorage.app",
  messagingSenderId: "314726722587",
  appId: "1:314726722587:web:dcb27c89260e64d9531cbe",
  measurementId: "G-F0HNSJ7KS2",
  databaseURL: "https://hmhm-70a37-default-rtdb.europe-west1.firebasedatabase.app"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
