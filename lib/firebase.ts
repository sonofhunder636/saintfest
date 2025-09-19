// lib/firebase.ts
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { getStorage, FirebaseStorage } from 'firebase/storage';

// Check if we're in build environment
const isBuildTime = typeof window === 'undefined' && !process.env.FIREBASE_SERVICE_ACCOUNT;

// Validate required environment variables
const requiredEnvVars = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Check for missing environment variables
const missingVars = Object.entries(requiredEnvVars)
  .filter(([key, value]) => !value)
  .map(([key]) => `NEXT_PUBLIC_FIREBASE_${key.toUpperCase()}`);

if (missingVars.length > 0 && !isBuildTime) {
  console.warn(`Missing Firebase environment variables: ${missingVars.join(', ')}`);
}

const firebaseConfig = requiredEnvVars;

// Initialize Firebase with error handling
let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;
let storage: FirebaseStorage | null = null;

try {
  // Only initialize if not in build time and we have required config
  if (!isBuildTime && missingVars.length === 0) {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

    // Initialize Firebase services
    db = getFirestore(app);
    auth = getAuth(app);
    storage = getStorage(app);
  } else {
    console.log('Firebase initialization skipped:', isBuildTime ? 'build environment' : 'missing environment variables');
  }
} catch (error) {
  console.error('Firebase initialization error:', error);
  // Set services to null on error
  app = null;
  db = null;
  auth = null;
  storage = null;
}

// Export with null checks
export { db, auth, storage };
export default app;