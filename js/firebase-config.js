// Initialize Firebase with your configuration
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
firebase.initializeApp(firebaseConfig);

// Initialize Firestore database
const db = firebase.firestore();

console.log("Firebase initialized successfully!");
