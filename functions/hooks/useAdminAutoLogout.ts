'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAdminAuth } from '@/contexts/AdminAuthContext';

export function useAdminAutoLogout() {
  const pathname = usePathname();
  const { isAuthenticated, clearSession } = useAdminAuth();

  useEffect(() => {
    // Check if user is authenticated as admin
    if (isAuthenticated) {
      // Check if current path is outside admin area
      const isInAdminArea = pathname.startsWith('/admin');
      
      if (!isInAdminArea) {
        // User navigated away from admin area, clear the admin session
        clearSession();
      }
    }
  }, [pathname, isAuthenticated, clearSession]);
}