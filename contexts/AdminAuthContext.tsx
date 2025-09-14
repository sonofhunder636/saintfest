'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User as FirebaseUser, 
  onAuthStateChanged, 
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { User } from '@/types';

interface AdminAuthContextType {
  adminUser: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
  isAuthorizedAdmin: boolean;
  clearSession: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};

interface AdminAuthProviderProps {
  children: React.ReactNode;
}

export const AdminAuthProvider: React.FC<AdminAuthProviderProps> = ({ children }) => {
  const [adminUser, setAdminUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Define admin email - only this Google account can access admin functions
  const ADMIN_EMAIL = 'andrewfisher1024@gmail.com';

  const createAdminUser = (firebaseUser: FirebaseUser): User => {
    return {
      id: firebaseUser.uid,
      email: firebaseUser.email!,
      displayName: firebaseUser.displayName || 'Admin User',
      photoURL: firebaseUser.photoURL || undefined,
      role: 'admin',
      createdAt: new Date(),
      lastLoginAt: new Date(),
    };
  };

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // Check if the authenticated user is the authorized admin
      if (result.user.email !== ADMIN_EMAIL) {
        // Sign out immediately if not authorized
        await firebaseSignOut(auth);
        throw new Error('Unauthorized: Admin access denied');
      }
      
      // If authorized, create admin user object
      const adminUserData = createAdminUser(result.user);
      setAdminUser(adminUserData);
    } catch (error: any) {
      console.error('Admin authentication failed:', error);
      setAdminUser(null);
      throw error;
    }
  };


  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setAdminUser(null);
    } catch (error) {
      console.error('Admin sign out failed:', error);
      throw error;
    }
  };

  const clearSession = () => {
    setAdminUser(null);
    // Force sign out from Firebase as well
    firebaseSignOut(auth).catch(console.error);
  };

  useEffect(() => {
    // Set a timeout to stop loading after 5 seconds if Firebase doesn't respond
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 5000);

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      clearTimeout(timeout);
      
      try {
        if (firebaseUser && firebaseUser.email === ADMIN_EMAIL) {
          // Only allow the authorized admin email
          const adminUserData = createAdminUser(firebaseUser);
          setAdminUser(adminUserData);
        } else {
          // Clear admin user if not authorized or not signed in
          setAdminUser(null);
          if (firebaseUser && firebaseUser.email !== ADMIN_EMAIL) {
            // Sign out unauthorized users
            await firebaseSignOut(auth);
          }
        }
      } catch (error) {
        console.error('AdminAuthContext: Error handling auth state change:', error);
        setAdminUser(null);
      }
      
      setLoading(false);
    });

    return () => {
      clearTimeout(timeout);
      unsubscribe();
    };
  }, []);

  const value: AdminAuthContextType = {
    adminUser,
    loading,
    signInWithGoogle,
    signOut,
    isAuthenticated: adminUser !== null,
    isAuthorizedAdmin: adminUser?.email === ADMIN_EMAIL,
    clearSession,
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
};