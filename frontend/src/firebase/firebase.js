// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getMessaging } from "firebase/messaging";

// Check if we're in a browser environment
const isBrowser = typeof window !== "undefined";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'demo-api-key',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'demo-project.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'demo-project',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'demo-project.appspot.com',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '123456789',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:123456789:web:demo123',
};

// Initialize Firebase only if we're in browser
let app = null;
let auth = null;
let db = null;
let storage = null;
let messaging = null;

if (isBrowser) {
  try {
    // Initialize Firebase app with demo config if no real config
    console.log('Initializing Firebase with config:', {
      hasApiKey: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      hasAuthDomain: !!process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      hasProjectId: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
    });
    
    // Initialize Firebase app
    app = initializeApp(firebaseConfig);
    
    // Initialize services with error handling
    try {
      // Initialize auth
      auth = getAuth(app);
      console.log('Firebase auth instance created successfully');
    } catch (authError) {
      console.error('Firebase auth initialization failed:', authError);
      auth = null;
    }
    
    try {
      db = getFirestore(app);
      console.log('Firestore initialized successfully');
    } catch (dbError) {
      console.warn('Firestore initialization failed:', dbError);
      db = null;
    }
    
    try {
      storage = getStorage(app);
      console.log('Storage initialized successfully');
    } catch (storageError) {
      console.warn('Storage initialization failed:', storageError);
      storage = null;
    }

    try {
      messaging = getMessaging(app);
      console.log('Messaging initialized successfully');
    } catch (error) {
      console.warn('Messaging initialization failed:', error);
      messaging = null;
    }
    
    console.log('Firebase initialization completed');
  } catch (error) {
    console.error('Firebase initialization error:', error);
    // Create mock objects for demo mode
    auth = {
      currentUser: null,
      onAuthStateChanged: () => () => {},
      signOut: async () => ({ success: true }),
      signInWithEmailAndPassword: async () => {
        throw new Error('Firebase not configured. Please set up your Firebase project.');
      },
      createUserWithEmailAndPassword: async () => {
        throw new Error('Firebase not configured. Please set up your Firebase project.');
      }
    };
    db = null;
    storage = null;
    messaging = null;
  }
}

export { auth, db, storage, messaging };
export default app; 