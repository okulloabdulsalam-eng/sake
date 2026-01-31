// Firebase Configuration for KIUMA
// Initialize Firebase with your project credentials

const firebaseConfig = {
    apiKey: "AIzaSyCKcJ9aJn0EntmXOBc4KdtP00oyN-BaGR4",
    authDomain: "kiuma-2026.firebaseapp.com",
    projectId: "kiuma-2026",
    storageBucket: "kiuma-2026.firebasestorage.app",
    messagingSenderId: "692502410050",
    appId: "1:692502410050:web:ab72c486752bab0384cedb",
    measurementId: "G-3KYL9S9CGN"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = firebase.auth();
const db = firebase.firestore();

// Export for use in other scripts
window.firebaseAuth = auth;
window.firebaseDb = db;

console.log('Firebase initialized successfully');
