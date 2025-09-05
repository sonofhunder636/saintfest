import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export const useRequireAuth = (requiredRole?: 'admin' | 'user') => {
  const { currentUser, loading } = useAuth();
  const router = useRouter();
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    // Temporary debug logging to identify the issue
    console.log('useRequireAuth Debug:', {
      loading,
      hasChecked,
      currentUser: currentUser ? {
        email: currentUser.email,
        role: currentUser.role,
        id: currentUser.id
      } : null,
      requiredRole,
      timestamp: new Date().toISOString()
    });

    // Don't redirect immediately - give Firebase time to restore auth state
    if (!loading && !hasChecked) {
      if (!currentUser) {
        console.log('useRequireAuth: No current user, redirecting to signin');
        router.push('/auth/signin');
        setHasChecked(true);
        return;
      }

      if (requiredRole === 'admin' && currentUser.role !== 'admin') {
        console.log('useRequireAuth: User lacks admin role, redirecting to unauthorized', {
          userRole: currentUser.role,
          requiredRole
        });
        router.push('/unauthorized');
        setHasChecked(true);
        return;
      }
      
      console.log('useRequireAuth: Authentication successful!', {
        email: currentUser.email,
        role: currentUser.role
      });
      setHasChecked(true);
    }
  }, [currentUser, loading, requiredRole, router, hasChecked]);

  return { currentUser, loading: loading || !hasChecked };
};