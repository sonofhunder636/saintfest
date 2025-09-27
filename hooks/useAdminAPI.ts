'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useCallback } from 'react';

/**
 * Custom hook for making authenticated admin API calls
 * Automatically includes Firebase authentication token
 */
export function useAdminAPI() {
  const { firebaseUser } = useAuth();

  const makeAdminRequest = useCallback(async (
    url: string,
    options: RequestInit = {}
  ): Promise<Response> => {
    if (!firebaseUser) {
      throw new Error('User not authenticated');
    }

    try {
      // Get the current user's ID token
      const token = await firebaseUser.getIdToken(false);

      // Prepare headers with authentication
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      };

      // Make the authenticated request
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Handle authentication errors specifically
      if (response.status === 401) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Authentication failed');
      }

      return response;
    } catch (error) {
      console.error('Admin API request failed:', error);
      throw error;
    }
  }, [firebaseUser]);

  const adminPost = useCallback(async (url: string, data: any) => {
    return makeAdminRequest(url, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }, [makeAdminRequest]);

  const adminPut = useCallback(async (url: string, data: any) => {
    return makeAdminRequest(url, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }, [makeAdminRequest]);

  const adminDelete = useCallback(async (url: string) => {
    return makeAdminRequest(url, {
      method: 'DELETE',
    });
  }, [makeAdminRequest]);

  const adminGet = useCallback(async (url: string) => {
    return makeAdminRequest(url, {
      method: 'GET',
    });
  }, [makeAdminRequest]);

  return {
    makeAdminRequest,
    adminPost,
    adminPut,
    adminDelete,
    adminGet,
    isAdminAuthenticated: !!firebaseUser,
  };
}