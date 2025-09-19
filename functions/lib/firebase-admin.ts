// lib/firebase-admin.ts
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin SDK
let app;

try {
  if (getApps().length === 0) {
    // For development, you can use the service account key
    // In production, this should use Application Default Credentials
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

    if (serviceAccount) {
      // Parse the service account key from environment variable
      const serviceAccountKey = JSON.parse(serviceAccount);

      app = initializeApp({
        credential: cert(serviceAccountKey),
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      });
    } else {
      // Fallback: Use project ID only (works in Firebase environments)
      app = initializeApp({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      });
    }
  } else {
    app = getApps()[0];
  }
} catch (error) {
  console.warn('Firebase Admin initialization warning:', error);
  // For development, we'll create a basic admin app
  if (getApps().length === 0) {
    app = initializeApp({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    });
  } else {
    app = getApps()[0];
  }
}

// Export admin services
export const adminAuth = getAuth(app);
export const adminDb = getFirestore(app);

export default app;