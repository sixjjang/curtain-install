// Import the functions you need from the SDKs you need
import { initializeApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";
import { getMessaging, Messaging } from "firebase/messaging";

// Check if we're in a browser environment
const isBrowser = typeof window !== "undefined";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
};

// Initialize Firebase only if we're in browser
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;
let messaging: Messaging | null = null;

if (isBrowser) {
  try {
    // Check if Firebase config is properly set
    const hasValidConfig = process.env.NEXT_PUBLIC_FIREBASE_API_KEY && 
                          process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== "undefined" &&
                          process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== "your-api-key-here" &&
                          process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== "" &&
                          process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN &&
                          process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    
    if (hasValidConfig) {
      console.log('Firebase config validation passed');
      console.log('Initializing Firebase with config:', {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? '***' : 'missing',
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
      });
      
      // Initialize Firebase app
      app = initializeApp(firebaseConfig);
      
      // Initialize services with minimal configuration
      try {
        // Initialize auth with minimal settings
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
    } else {
      console.warn('Firebase config not found! Please create .env.local file with Firebase configuration.');
      console.log('Required environment variables:', {
        NEXT_PUBLIC_FIREBASE_API_KEY: 'your-api-key-here',
        NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: 'your-project.firebaseapp.com',
        NEXT_PUBLIC_FIREBASE_PROJECT_ID: 'your-project-id',
        NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: 'your-project.appspot.com',
        NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: '123456789',
        NEXT_PUBLIC_FIREBASE_APP_ID: '1:123456789:web:abcdef123456'
      });
    }
  } catch (error) {
    console.error('Firebase initialization error:', error);
    auth = null;
    db = null;
    storage = null;
    messaging = null;
  }
}

export { auth, db, storage, messaging as messagingInstance };
export default app; 