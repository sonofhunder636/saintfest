'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AdminAuthProvider, useAdminAuth } from '@/contexts/AdminAuthContext';
import Navigation from '@/components/Navigation';

function AdminLoginContent() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const { signInWithGoogle, isAuthenticated, isAuthorizedAdmin, clearSession } = useAdminAuth();
  const router = useRouter();

  // Only clear session if there's an error or explicit logout, not on every mount
  // This prevents the login loop issue

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      // Use Google OAuth for actual authentication
      await signInWithGoogle();
      // Redirect will be handled by the useEffect above
    } catch (error: any) {
      console.error('Admin login error:', error);
      setError(error.message || 'Authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Effect to handle redirect when authentication state changes
  useEffect(() => {
    if (isAuthenticated && isAuthorizedAdmin) {
      router.push('/admin');
    }
  }, [isAuthenticated, isAuthorizedAdmin, router]);

  return (
    <div className="min-h-screen text-center" style={{backgroundColor: '#fffbeb'}}>
      {/* Green Header Banner */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        width: '100%',
        backgroundColor: '#8FBC8F',
        padding: '1rem 0',
        marginBottom: '2rem'
      }}>
        <div style={{
          maxWidth: '64rem',
          margin: '0 auto',
          padding: '0 1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          {/* Site Title */}
          <Link href="/" style={{
            fontSize: '2.5rem',
            fontFamily: 'var(--font-sorts-mill)',
            color: 'white',
            textDecoration: 'none',
            fontWeight: '600',
            textShadow: '0 1px 2px rgba(0,0,0,0.1)'
          }}>
            Saintfest
          </Link>
          
          {/* Navigation */}
          <Navigation />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto px-4 py-12">
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-8">
          <div className="text-center mb-8">
            <h1 style={{
              fontSize: '3rem',
              fontFamily: 'var(--font-sorts-mill)',
              color: '#111827',
              marginBottom: '1rem',
              fontWeight: '600'
            }}>
              Admin Access
            </h1>
            <p style={{
              fontFamily: 'var(--font-cormorant)',
              fontSize: '1.125rem',
              color: '#6b7280',
              lineHeight: '1.6'
            }}>
              Enter your administrative credentials to access the Saintfest management panel.
            </p>
          </div>

          {error && (
            <div style={{
              backgroundColor: '#fee2e2',
              color: '#dc2626',
              padding: '0.75rem 1rem',
              borderRadius: '0.375rem',
              marginBottom: '1.5rem',
              fontFamily: 'var(--font-cormorant)',
              fontSize: '0.875rem',
              border: '1px solid #fecaca'
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="username" style={{
                display: 'block',
                fontSize: '0.875rem',
                fontFamily: 'var(--font-league-spartan)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: '#374151',
                fontWeight: '500',
                marginBottom: '0.5rem'
              }}>
                Username
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontFamily: 'var(--font-cormorant)',
                  fontSize: '1rem',
                  backgroundColor: 'white'
                }}
                placeholder="Enter username"
              />
            </div>

            <div>
              <label htmlFor="password" style={{
                display: 'block',
                fontSize: '0.875rem',
                fontFamily: 'var(--font-league-spartan)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: '#374151',
                fontWeight: '500',
                marginBottom: '0.5rem'
              }}>
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontFamily: 'var(--font-cormorant)',
                  fontSize: '1rem',
                  backgroundColor: 'white'
                }}
                placeholder="Enter password"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '0.875rem 1.5rem',
                backgroundColor: '#8FBC8F',
                color: 'white',
                border: 'none',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                fontFamily: 'var(--font-league-spartan)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                fontWeight: '600',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.7 : 1
              }}
            >
              {isLoading ? 'Authenticating...' : 'Sign In'}
            </button>

            <div className="text-center mt-6">
              <p style={{
                fontFamily: 'var(--font-cormorant)',
                fontSize: '0.875rem',
                color: '#6b7280',
                fontStyle: 'italic'
              }}>
                Administrative access requires proper authentication through secure channels.
              </p>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

export default function AdminLoginPage() {
  return <AdminLoginContent />;
}