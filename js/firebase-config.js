// js/firebase-config.js
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBjuFREFHDRe70efEwp-8RHRN0atLp6gjo",
  authDomain: "partime-389b2.firebaseapp.com",
  projectId: "partime-389b2",
  storageBucket: "partime-389b2.appspot.com",
  messagingSenderId: "481270697427",
  appId: "1:481270697427:web:a4c357f69fd5d5f8257326",
  measurementId: "G-V1WY1KYZYL"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore database
const db = getFirestore(app);

console.log("Firebase initialized successfully!");

// Test the connection (remove this for production)
const testConnection = async () => {
  try {
    const docRef = await addDoc(collection(db, "test"), {
      message: "Firebase connection test",
      timestamp: new Date()
    });
    console.log("Firebase connection successful!", docRef.id);
  } catch (error) {
    console.error("Firebase connection failed:", error);
  }
};

testConnection();

export { db };
