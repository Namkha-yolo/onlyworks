// Initialize Firebase with your configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

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
