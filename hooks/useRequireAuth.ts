import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export const useRequireAuth = (requiredRole?: 'admin' | 'user') => {
  const { currentUser, loading } = useAuth();
  const router = useRouter();
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    // Don't redirect immediately - give Firebase time to restore auth state
    if (!loading && !hasChecked) {
      if (!currentUser) {
        router.push('/auth/signin');
        setHasChecked(true);
        return;
      }

      if (requiredRole === 'admin' && currentUser.role !== 'admin') {
        router.push('/unauthorized');
        setHasChecked(true);
        return;
      }

      setHasChecked(true);
    }
  }, [currentUser, loading, requiredRole, router, hasChecked]);

  return { currentUser, loading: loading || !hasChecked };
};