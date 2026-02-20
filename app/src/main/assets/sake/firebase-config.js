// Firebase Configuration for KIUMA
// Initialize Firebase with your project credentials

const firebaseConfig = {
    apiKey: "AIzaSyDOZ1UzDPXuxmGMZTxKcB7CzeWi7esB08c",
    authDomain: "kiuma-mob-app.firebaseapp.com",
    projectId: "kiuma-mob-app",
    storageBucket: "kiuma-mob-app.firebasestorage.app",
    messagingSenderId: "69327390212",
    appId: "1:69327390212:web:bc519469946b80a7549751",
    measurementId: "G-9MFDFQG80N"
};

// Initialize Firebase
try {
    if (typeof firebase !== 'undefined' && !firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    console.log('Firebase initialized successfully');
} catch (error) {
    console.error('Firebase initialization error:', error);
}

// Initialize Firebase services (with safety checks)
try {
    if (typeof firebase !== 'undefined' && firebase.auth) {
        window.firebaseAuth = firebase.auth();
    }
} catch (e) {
    console.warn('Firebase Auth not available:', e.message);
}

try {
    if (typeof firebase !== 'undefined' && firebase.firestore) {
        window.firebaseDb = firebase.firestore();
    }
} catch (e) {
    console.warn('Firebase Firestore not available:', e.message);
}

window.firebaseConfig = firebaseConfig;

// Connection test — verifies Firestore is reachable
window.testFirebaseConnection = async function() {
    const results = { app: false, auth: false, firestore: false, firestoreReadWrite: false };
    try {
        if (typeof firebase !== 'undefined' && firebase.apps.length > 0) {
            results.app = true;
            console.log('✅ Firebase App: Connected (project: ' + firebase.app().options.projectId + ')');
        } else {
            console.error('❌ Firebase App: Not initialized');
            return results;
        }
    } catch(e) {
        console.error('❌ Firebase App:', e.message);
        return results;
    }

    try {
        if (window.firebaseAuth) {
            results.auth = true;
            console.log('✅ Firebase Auth: Ready');
        } else {
            console.warn('⚠️ Firebase Auth: Not available');
        }
    } catch(e) {
        console.warn('⚠️ Firebase Auth:', e.message);
    }

    try {
        if (window.firebaseDb) {
            results.firestore = true;
            console.log('✅ Firestore: Instance ready');
            // Try reading from 'mosques' collection (has allow read: true)
            const snap = await window.firebaseDb.collection('mosques').limit(1).get();
            results.firestoreReadWrite = true;
            console.log('✅ Firestore Connection: Working (' + snap.size + ' docs read)');
        } else {
            console.error('❌ Firestore: Not available');
        }
    } catch(e) {
        console.warn('⚠️ Firestore Connection:', e.message);
        if (e.code === 'permission-denied') {
            console.warn('   → Deploy your firestore.rules to allow reads. See firestore.rules file.');
        } else if (e.message && e.message.includes('Could not reach Cloud Firestore')) {
            console.error('   → Firestore database not created yet.');
            console.error('   → Go to: https://console.firebase.google.com/project/kiuma-mob-app/firestore');
            console.error('   → Click "Create Database" → Start in test mode → Choose location');
        }
    }

    return results;
};

// Auto-test on load (delayed to not block page)
if (typeof window !== 'undefined') {
    setTimeout(function() {
        if (window.firebaseDb) {
            window.testFirebaseConnection().then(function(r) {
                window._firebaseStatus = r;
            });
        }
    }, 2000);
}
