// lib/firebase.ts
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { getStorage, FirebaseStorage } from 'firebase/storage';

// Check if we're in build environment
const isBuildTime = typeof window === 'undefined' && !process.env.FIREBASE_SERVICE_ACCOUNT;

// Hardcoded Firebase config for static export (production fallback)
const STATIC_FIREBASE_CONFIG = {
  apiKey: "AIzaSyDrXi3ZG2iaf5mjrGrridPjAalKyAG8fRk",
  authDomain: "saintfestcode.firebaseapp.com",
  projectId: "saintfestcode",
  storageBucket: "saintfestcode.firebasestorage.app",
  messagingSenderId: "804981147510",
  appId: "1:804981147510:web:68ede21d243cac65869c57"
};

// Try to use environment variables first, fall back to hardcoded config
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || STATIC_FIREBASE_CONFIG.apiKey,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || STATIC_FIREBASE_CONFIG.authDomain,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || STATIC_FIREBASE_CONFIG.projectId,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || STATIC_FIREBASE_CONFIG.storageBucket,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || STATIC_FIREBASE_CONFIG.messagingSenderId,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || STATIC_FIREBASE_CONFIG.appId,
};

// Check if we have valid config
const hasValidConfig = firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId;

// Initialize Firebase services lazily
let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;
let storage: FirebaseStorage | null = null;
let initialized = false;

// Lazy initialization function
function initializeFirebase(): boolean {
  if (initialized) return app !== null;

  initialized = true;

  try {
    // Skip initialization during build or if no valid config
    if (isBuildTime || !hasValidConfig) {
      console.log('Firebase initialization skipped:', isBuildTime ? 'build environment' : 'invalid configuration');
      return false;
    }

    // Initialize Firebase app
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

    // Initialize Firebase services
    db = getFirestore(app);
    auth = getAuth(app);
    storage = getStorage(app);

    console.log('Firebase initialized successfully');
    return true;
  } catch (error) {
    console.error('Firebase initialization error:', error);
    // Reset services to null on error
    app = null;
    db = null;
    auth = null;
    storage = null;
    return false;
  }
}

// Runtime assertion helpers - initialize Firebase lazily when needed
export function assertFirestore(): Firestore {
  if (!initializeFirebase() || !db) {
    throw new Error('Firestore not initialized. Check Firebase configuration.');
  }
  return db;
}

export function assertAuth(): Auth {
  if (!initializeFirebase() || !auth) {
    throw new Error('Auth not initialized. Check Firebase configuration.');
  }
  return auth;
}

export function assertStorage(): FirebaseStorage {
  if (!initializeFirebase() || !storage) {
    throw new Error('Storage not initialized. Check Firebase configuration.');
  }
  return storage;
}

// Safe getter functions that don't throw errors
export function getFirebaseAuth(): Auth | null {
  initializeFirebase();
  return auth;
}

export function getFirebaseFirestore(): Firestore | null {
  initializeFirebase();
  return db;
}

export function getFirebaseStorage(): FirebaseStorage | null {
  initializeFirebase();
  return storage;
}

// Check if Firebase is available
export function isFirebaseAvailable(): boolean {
  return initializeFirebase();
}

// Export with null checks (legacy compatibility)
export { db, auth, storage };
export default app;