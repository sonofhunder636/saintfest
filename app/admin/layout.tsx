'use client';

import { SimpleAuthProvider, useSimpleAuth } from "@/contexts/SimpleAuthContext";
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

function AdminProtection({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useSimpleAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/auth/signin');
    }
  }, [isAuthenticated, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  return <>{children}</>;
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SimpleAuthProvider>
      <AdminProtection>
        {children}
      </AdminProtection>
    </SimpleAuthProvider>
  );
}