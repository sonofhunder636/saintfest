'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

interface SimpleAuthContextType {
  isAuthenticated: boolean;
  isAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<boolean>;
  signOut: () => void;
  error: string | null;
}

const SimpleAuthContext = createContext<SimpleAuthContextType | undefined>(undefined);

export const useSimpleAuth = () => {
  const context = useContext(SimpleAuthContext);
  if (context === undefined) {
    throw new Error('useSimpleAuth must be used within a SimpleAuthProvider');
  }
  return context;
};

interface SimpleAuthProviderProps {
  children: React.ReactNode;
}

// Hardcoded admin credentials
const ADMIN_EMAIL = 'andrewfisher1024@gmail.com';
const ADMIN_PASSWORD = 'Goblet of Fire';

export const SimpleAuthProvider: React.FC<SimpleAuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check for existing auth on mount
  useEffect(() => {
    const checkAuth = () => {
      try {
        const authToken = localStorage.getItem('saintfest_admin_auth');
        const authTimestamp = localStorage.getItem('saintfest_admin_timestamp');

        if (authToken === 'authenticated' && authTimestamp) {
          // Check if auth is less than 24 hours old
          const timestamp = parseInt(authTimestamp);
          const now = Date.now();
          const twentyFourHours = 24 * 60 * 60 * 1000;

          if (now - timestamp < twentyFourHours) {
            setIsAuthenticated(true);
          } else {
            // Auth expired, clear it
            localStorage.removeItem('saintfest_admin_auth');
            localStorage.removeItem('saintfest_admin_timestamp');
            setIsAuthenticated(false);
          }
        }
      } catch (error) {
        console.error('Error checking auth:', error);
        setIsAuthenticated(false);
      }

      setLoading(false);
    };

    checkAuth();
  }, []);

  const signIn = async (email: string, password: string): Promise<boolean> => {
    setError(null);
    setLoading(true);

    try {
      // Simple delay to simulate auth process
      await new Promise(resolve => setTimeout(resolve, 500));

      if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        // Set auth in localStorage with timestamp
        localStorage.setItem('saintfest_admin_auth', 'authenticated');
        localStorage.setItem('saintfest_admin_timestamp', Date.now().toString());
        setIsAuthenticated(true);
        setLoading(false);
        return true;
      } else {
        setError('Invalid email or password');
        setLoading(false);
        return false;
      }
    } catch (error) {
      setError('Login failed. Please try again.');
      setLoading(false);
      return false;
    }
  };

  const signOut = () => {
    localStorage.removeItem('saintfest_admin_auth');
    localStorage.removeItem('saintfest_admin_timestamp');
    setIsAuthenticated(false);
    setError(null);
  };

  const value: SimpleAuthContextType = {
    isAuthenticated,
    isAdmin: isAuthenticated, // In this simple system, authenticated = admin
    loading,
    signIn,
    signOut,
    error
  };

  return (
    <SimpleAuthContext.Provider value={value}>
      {children}
    </SimpleAuthContext.Provider>
  );
};