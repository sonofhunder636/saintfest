'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSimpleAuth } from '@/contexts/SimpleAuthContext';

function AdminContent() {
  const { isAuthenticated, signOut } = useSimpleAuth();
  const router = useRouter();

  // The AdminLayout already handles authentication protection,
  // so we know the user is authenticated if we reach this point

  const handleLogout = () => {
    signOut(); // Clear the authentication token
    router.push('/auth/signin'); // Redirect to login page
  };

  return (
    <div className="min-h-screen" style={{backgroundColor: '#fffbeb'}}>
      {/* Header */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        width: '100%',
        backgroundColor: '#8FBC8F',
        padding: '1rem 0',
        marginBottom: '2rem',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
      }}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 style={{
                fontSize: '2.5rem',
                fontFamily: 'var(--font-sorts-mill)',
                color: 'white',
                fontWeight: '600',
                textShadow: '0 1px 2px rgba(0,0,0,0.1)'
              }}>
                Saintfest Admin
              </h1>
            </div>
            <nav style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
              <a href="/bracket" style={{
                fontSize: '0.875rem',
                fontFamily: 'var(--font-league-spartan)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'white',
                textDecoration: 'none',
                fontWeight: '500',
                padding: '0.5rem 1rem',
                borderRadius: '0.25rem',
                backgroundColor: 'rgba(255,255,255,0.1)'
              }}>
                2025 Saintfest Bracket
              </a>
              <a href="/about" style={{
                fontSize: '0.875rem',
                fontFamily: 'var(--font-league-spartan)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'white',
                textDecoration: 'none',
                fontWeight: '500',
                padding: '0.5rem 1rem',
                borderRadius: '0.25rem',
                backgroundColor: 'rgba(255,255,255,0.1)'
              }}>
                About
              </a>
              <Link href="/posts" style={{
                fontSize: '0.875rem',
                fontFamily: 'var(--font-league-spartan)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'white',
                textDecoration: 'none',
                fontWeight: '500',
                padding: '0.5rem 1rem',
                borderRadius: '0.25rem',
                backgroundColor: 'rgba(255,255,255,0.1)'
              }}>
                Posts
              </Link>
              <button
                onClick={handleLogout}
                style={{
                  fontSize: '0.875rem',
                  fontFamily: 'var(--font-league-spartan)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'white',
                  background: 'none',
                  border: '1px solid rgba(255,255,255,0.3)',
                  fontWeight: '500',
                  padding: '0.5rem 1rem',
                  borderRadius: '0.25rem',
                  cursor: 'pointer'
                }}
              >
                Logout
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="space-y-6">


          {/* Admin Navigation Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 text-center hover:shadow-md transition-shadow">
              <a 
                href="/admin/saints/manager"
                style={{
                  display: 'inline-block',
                  padding: '0.75rem 2rem',
                  backgroundColor: '#8FBC8F',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontFamily: 'var(--font-league-spartan)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  fontWeight: '600',
                  transition: 'background-color 0.2s'
                }}
              >
                Saint Database
              </a>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 text-center hover:shadow-md transition-shadow">
              <a 
                href="/admin/bracket"
                style={{
                  display: 'inline-block',
                  padding: '0.75rem 2rem',
                  backgroundColor: '#8FBC8F',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontFamily: 'var(--font-league-spartan)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  fontWeight: '600',
                  transition: 'background-color 0.2s'
                }}
              >
                Tournament Bracket
              </a>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 text-center hover:shadow-md transition-shadow">
              <a 
                href="/admin/posts"
                style={{
                  display: 'inline-block',
                  padding: '0.75rem 2rem',
                  backgroundColor: '#8FBC8F',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontFamily: 'var(--font-league-spartan)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  fontWeight: '600',
                  transition: 'background-color 0.2s'
                }}
              >
                Posts Management
              </a>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

export default function AdminPage() {
  return <AdminContent />;
}