// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBjuFREFHDRe70efEwp-8RHRN0atLp6gjo",
  authDomain: "partime-389b2.firebaseapp.com",
  projectId: "partime-389b2",
  storageBucket: "partime-389b2.firebasestorage.app",
  messagingSenderId: "481270697427",
  appId: "1:481270697427:web:a4c357f69fd5d5f8257326",
  measurementId: "G-V1WY1KYZYL"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firestore database
const db = firebase.firestore();

console.log("Firebase initialized successfully!");

// Add to the end of your firebase-config.js file
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


// Initialize Firestore database
const db = firebase.firestore();

console.log("Firebase initialized successfully!");

// Add to the end of your firebase-config.js file
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
