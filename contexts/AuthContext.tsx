// contexts/AuthContext.tsx
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getFirebaseAuth, getFirebaseFirestore, isFirebaseAvailable } from '@/lib/firebase';
import { User } from '@/types';

interface AuthContextType {
  currentUser: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);


  // Create or update user document in Firestore
  const createUserDocument = async (firebaseUser: FirebaseUser): Promise<User> => {
    const db = getFirebaseFirestore();
    if (!db) {
      throw new Error('Firestore not available');
    }
    const userRef = doc(db, 'users', firebaseUser.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      // Create new user document
      const userData: any = {
        email: firebaseUser.email!,
        displayName: firebaseUser.displayName || 'Anonymous',
        role: 'user',
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
      };

      // Only add photoURL if it exists (Firestore doesn't allow undefined)
      if (firebaseUser.photoURL) {
        userData.photoURL = firebaseUser.photoURL;
      }

      await setDoc(userRef, userData);

      return {
        id: firebaseUser.uid,
        email: firebaseUser.email!,
        displayName: firebaseUser.displayName || 'Anonymous',
        photoURL: firebaseUser.photoURL || undefined,
        role: 'user',
        createdAt: new Date(),
        lastLoginAt: new Date(),
      };
    } else {
      // Update last login time
      const userData = userSnap.data();

      // Update user data with current login time
      await setDoc(userRef, {
        lastLoginAt: serverTimestamp(),
      }, { merge: true });

      return {
        id: firebaseUser.uid,
        email: userData.email,
        displayName: userData.displayName,
        photoURL: userData.photoURL || undefined,
        role: userData.role || 'user',
        createdAt: userData.createdAt?.toDate() || new Date(),
        lastLoginAt: userData.lastLoginAt?.toDate() || new Date(),
      };
    }
  };

  const signUp = async (email: string, password: string, displayName: string) => {
    const auth = getFirebaseAuth();
    if (!auth) {
      throw new Error('Firebase Auth not available');
    }
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName });

    // Create user document will be handled by onAuthStateChanged
  };

  const signIn = async (email: string, password: string) => {
    const auth = getFirebaseAuth();
    if (!auth) {
      console.error('Firebase Auth initialization failed');
      throw new Error('Firebase Auth not available');
    }

    try {
      console.log('Attempting Firebase sign-in with email:', email);
      const result = await signInWithEmailAndPassword(auth, email, password);
      console.log('Firebase sign-in successful:', result.user.uid);
    } catch (error: any) {
      console.error('Firebase sign-in error:', {
        code: error.code,
        message: error.message,
        details: error
      });
      throw error;
    }
  };


  const signOut = async () => {
    const auth = getFirebaseAuth();
    if (!auth) {
      throw new Error('Firebase Auth not available');
    }
    await firebaseSignOut(auth);
  };

  useEffect(() => {
    // Set a timeout to stop loading after 5 seconds if Firebase doesn't respond
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 5000);

    // Check if Firebase is available
    if (!isFirebaseAvailable()) {
      console.log('Firebase not available, skipping auth initialization');
      setLoading(false);
      return;
    }

    const auth = getFirebaseAuth();
    if (!auth) {
      console.log('Firebase Auth not available, skipping auth initialization');
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      clearTimeout(timeout);

      try {
        if (firebaseUser) {
          setFirebaseUser(firebaseUser);
          const userData = await createUserDocument(firebaseUser);
          setCurrentUser(userData);
        } else {
          setFirebaseUser(null);
          setCurrentUser(null);
        }
      } catch (error) {
        console.error('AuthContext: Error handling auth state change:', error);
        setCurrentUser(null);
        setFirebaseUser(null);
      }

      setLoading(false);
    });

    return () => {
      clearTimeout(timeout);
      unsubscribe();
    };
  }, []);

  const value: AuthContextType = {
    currentUser,
    firebaseUser,
    loading,
    signUp,
    signIn,
    signOut,
    isAdmin: !!currentUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};