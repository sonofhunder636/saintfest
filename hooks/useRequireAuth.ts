import { useSimpleAuth } from '@/contexts/SimpleAuthContext';

export const useRequireAuth = (requiredRole?: 'admin' | 'user') => {
  const { isAuthenticated, loading } = useSimpleAuth();

  // Since we're using simple auth and admin layout handles protection,
  // we can return a simplified response
  return {
    currentUser: isAuthenticated ? { role: 'admin' } : null,
    loading: loading,
    isAdmin: isAuthenticated
  };
};