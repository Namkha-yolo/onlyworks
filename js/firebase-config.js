// Import Firebase (if using modules / bundler)
import firebase from "firebase/app";
import "firebase/firestore";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBjuFREFHDRe70efEwp-8RHRN0atLp6gjo",
  authDomain: "partime-389b2.firebaseapp.com",
  projectId: "partime-389b2",
  storageBucket: "partime-389b2.appspot.com",
  messagingSenderId: "481270697427",
  appId: "1:481270697427:web:a4c357f69fd5d5f8257326",
  measurementId: "G-V1WY1KYZYL"
};

// Initialize Firebase (only once)
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Firestore reference
const db = firebase.firestore();

// Test Firestore connection
db.collection('test').add({
  message: 'Firebase connection test',
  timestamp: new Date()
})
.then(() => {
  console.log('Firebase connection successful!');
})
.catch((error) => {
  console.error('Firebase connection failed:', error);
});
