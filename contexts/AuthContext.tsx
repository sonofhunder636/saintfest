// contexts/AuthContext.tsx
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User as FirebaseUser, 
  onAuthStateChanged, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { User } from '@/types';

interface AuthContextType {
  currentUser: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
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

  // Define admin email - only this Google account can access admin functions
  const ADMIN_EMAIL = 'andrewfisher1024@gmail.com';

  // Create or update user document in Firestore
  const createUserDocument = async (firebaseUser: FirebaseUser) => {
    const userRef = doc(db, 'users', firebaseUser.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      // Create new user document
      // Only assign admin role to the specific Google account
      const isAdmin = firebaseUser.email === ADMIN_EMAIL;
      const userData: any = {
        email: firebaseUser.email!,
        displayName: firebaseUser.displayName || 'Anonymous',
        role: isAdmin ? 'admin' : 'user',
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
        role: isAdmin ? 'admin' : 'user',
        createdAt: new Date(),
        lastLoginAt: new Date(),
      };
    } else {
      // Update last login time and verify admin status
      const userData = userSnap.data();
      const isAdmin = firebaseUser.email === ADMIN_EMAIL;
      
      // Update user data with current admin status check
      await setDoc(userRef, {
        lastLoginAt: serverTimestamp(),
        role: isAdmin ? 'admin' : 'user', // Ensure role is current
      }, { merge: true });

      return { 
        id: firebaseUser.uid, 
        email: userData.email,
        displayName: userData.displayName,
        photoURL: userData.photoURL || undefined,
        role: isAdmin ? 'admin' : 'user', // Use verified role
        createdAt: userData.createdAt?.toDate() || new Date(),
        lastLoginAt: userData.lastLoginAt?.toDate() || new Date(),
      };
    }
  };

  const signUp = async (email: string, password: string, displayName: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName });
    
    // Create user document will be handled by onAuthStateChanged
  };

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  useEffect(() => {
    // Set a timeout to stop loading after 5 seconds if Firebase doesn't respond
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 5000);

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
    signInWithGoogle,
    signOut,
    isAdmin: currentUser?.role === 'admin' && currentUser?.email === ADMIN_EMAIL,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};