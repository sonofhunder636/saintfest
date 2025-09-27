import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export const useRequireAuth = () => {
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

      setHasChecked(true);
    }
  }, [currentUser, loading, router, hasChecked]);

  return { currentUser, loading: loading || !hasChecked };
};