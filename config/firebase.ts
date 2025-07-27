import { getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
    apiKey: "AIzaSyCIwWpgUl9kYuPE9dMvozZ7WD54yv8ibbY",
    authDomain: "saferoute-758ad.firebaseapp.com",
    projectId: "saferoute-758ad",
    storageBucket: "saferoute-758ad.firebasestorage.app",
    messagingSenderId: "954471065861",
    appId: "1:954471065861:web:43794a2de01b0ea9bb6f6c",
    measurementId: "G-CCL0QZZM11"
};

// Initialize Firebase only if it hasn't been initialized yet
let app;
if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
} else {
    app = getApps()[0];
}

// Initialize Auth
const auth = getAuth(app);

export { app, auth };
export default app;
