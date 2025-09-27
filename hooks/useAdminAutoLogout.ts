'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export function useAdminAutoLogout() {
  const pathname = usePathname();
  const { currentUser, signOut } = useAuth();

  useEffect(() => {
    // Check if user is authenticated as admin
    if (currentUser) {
      // Check if current path is outside admin area
      const isInAdminArea = pathname.startsWith('/admin');

      if (!isInAdminArea) {
        // User navigated away from admin area, sign out
        signOut();
      }
    }
  }, [pathname, currentUser, signOut]);
}