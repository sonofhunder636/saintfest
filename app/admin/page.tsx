'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AdminAuthProvider, useAdminAuth } from '@/contexts/AdminAuthContext';
import ImageManager from '@/components/admin/ImageManager';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ImageIcon, Users, Trophy, Settings, FileText } from 'lucide-react';
import SaintImporter from '@/components/admin/SaintImporter';
import SaintManager from '@/components/admin/SaintManager';

// Sample data - in production this would come from your database
const sampleSaints = [
  { id: 'augustine', name: 'Augustine of Hippo', imageUrl: '', feastDay: 'August 28' },
  { id: 'thomas-aquinas', name: 'Thomas Aquinas', imageUrl: '', feastDay: 'January 28' },
  { id: 'teresa-avila', name: 'Teresa of Avila', imageUrl: '', feastDay: 'October 15' },
  { id: 'francis-assisi', name: 'Francis of Assisi', imageUrl: '', feastDay: 'October 4' },
  { id: 'joan-arc', name: 'Joan of Arc', imageUrl: '', feastDay: 'May 30' },
  { id: 'anthony-padua', name: 'Anthony of Padua', imageUrl: '', feastDay: 'June 13' },
  { id: 'catherine-siena', name: 'Catherine of Siena', imageUrl: '', feastDay: 'April 29' },
  { id: 'ignatius-loyola', name: 'Ignatius of Loyola', imageUrl: '', feastDay: 'July 31' }
];

function AdminContent() {
  const { adminUser, loading, signOut } = useAdminAuth();
  const [saints, setSaints] = useState(sampleSaints);
  const router = useRouter();

  // Redirect to login if not authenticated
  if (!loading && !adminUser) {
    router.push('/admin/login');
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{backgroundColor: '#fffbeb'}}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4" style={{borderBottomColor: '#8FBC8F'}}></div>
          <p style={{fontFamily: 'var(--font-cormorant)', fontSize: '1.125rem', color: '#6b7280'}}>Loading admin panel...</p>
        </div>
      </div>
    );
  }

  if (!adminUser) {
    return null; // Will redirect above
  }

  const handleBackToSite = async () => {
    try {
      await signOut(); // Clear admin session
      router.push('/'); // Navigate to homepage
    } catch (error) {
      console.error('Logout error:', error);
      router.push('/'); // Navigate anyway
    }
  };

  const handleUpdateSaintImage = (saintId: string, imageUrl: string) => {
    setSaints(prev => 
      prev.map(saint => 
        saint.id === saintId 
          ? { ...saint, imageUrl }
          : saint
      )
    );
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
                textShadow: '0 1px 2px rgba(0,0,0,0.1)',
                marginBottom: '0.25rem'
              }}>
                Saintfest Admin
              </h1>
              <p style={{
                fontFamily: 'var(--font-cormorant)',
                color: 'rgba(255,255,255,0.9)',
                fontSize: '1.125rem'
              }}>
                Manage your Saintfest tournament
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <span style={{
                fontSize: '0.875rem',
                fontFamily: 'var(--font-league-spartan)',
                color: 'rgba(255,255,255,0.9)',
                fontWeight: '500'
              }}>
                Welcome, {adminUser.displayName}
              </span>
              <button
                onClick={handleBackToSite}
                style={{
                  fontSize: '0.875rem',
                  fontFamily: 'var(--font-league-spartan)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: '#8FBC8F',
                  backgroundColor: 'white',
                  border: '1px solid white',
                  borderRadius: '0.375rem',
                  padding: '0.5rem 1rem',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Back to Site
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Custom Tab Navigation */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-2">
            <div className="grid grid-cols-5 gap-1">
              <button
                onClick={() => document.querySelector('[data-tab="images"]')?.click()}
                className="flex items-center justify-center space-x-2 px-4 py-3 rounded-md transition-colors hover:bg-gray-100"
                style={{
                  fontSize: '0.875rem',
                  fontFamily: 'var(--font-league-spartan)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  fontWeight: '500',
                  color: '#374151'
                }}
              >
                <ImageIcon className="h-4 w-4" />
                <span>Images</span>
              </button>
              <button
                onClick={() => document.querySelector('[data-tab="saints"]')?.click()}
                className="flex items-center justify-center space-x-2 px-4 py-3 rounded-md transition-colors hover:bg-gray-100"
                style={{
                  fontSize: '0.875rem',
                  fontFamily: 'var(--font-league-spartan)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  fontWeight: '500',
                  color: '#374151'
                }}
              >
                <Users className="h-4 w-4" />
                <span>Saints</span>
              </button>
              <button
                onClick={() => document.querySelector('[data-tab="tournaments"]')?.click()}
                className="flex items-center justify-center space-x-2 px-4 py-3 rounded-md transition-colors hover:bg-gray-100"
                style={{
                  fontSize: '0.875rem',
                  fontFamily: 'var(--font-league-spartan)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  fontWeight: '500',
                  color: '#374151'
                }}
              >
                <Trophy className="h-4 w-4" />
                <span>Tournaments</span>
              </button>
              <button
                onClick={() => document.querySelector('[data-tab="posts"]')?.click()}
                className="flex items-center justify-center space-x-2 px-4 py-3 rounded-md transition-colors hover:bg-gray-100"
                style={{
                  fontSize: '0.875rem',
                  fontFamily: 'var(--font-league-spartan)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  fontWeight: '500',
                  color: '#374151'
                }}
              >
                <FileText className="h-4 w-4" />
                <span>Posts</span>
              </button>
              <button
                onClick={() => document.querySelector('[data-tab="settings"]')?.click()}
                className="flex items-center justify-center space-x-2 px-4 py-3 rounded-md transition-colors hover:bg-gray-100"
                style={{
                  fontSize: '0.875rem',
                  fontFamily: 'var(--font-league-spartan)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  fontWeight: '500',
                  color: '#374151'
                }}
              >
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </button>
            </div>
          </div>

        <Tabs defaultValue="images" className="space-y-6">
          <TabsList className="hidden">
            <TabsTrigger value="images" data-tab="images">Images</TabsTrigger>
            <TabsTrigger value="saints" data-tab="saints">Saints</TabsTrigger>
            <TabsTrigger value="tournaments" data-tab="tournaments">Tournaments</TabsTrigger>
            <TabsTrigger value="posts" data-tab="posts">Posts</TabsTrigger>
            <TabsTrigger value="settings" data-tab="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="images">
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <h2 style={{
                  fontSize: '1.875rem',
                  fontFamily: 'var(--font-sorts-mill)',
                  color: '#111827',
                  fontWeight: '600',
                  marginBottom: '0.5rem'
                }}>
                  Saint Image Management
                </h2>
                <p style={{
                  fontFamily: 'var(--font-cormorant)',
                  color: '#6b7280',
                  fontSize: '1.125rem'
                }}>
                  Upload and manage images for your saints using public domain sources.
                </p>
              </div>
              <div className="p-6">
                <ImageManager 
                  saints={saints}
                  onUpdateSaintImage={handleUpdateSaintImage}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="saints">
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <h2 style={{
                  fontSize: '1.875rem',
                  fontFamily: 'var(--font-sorts-mill)',
                  color: '#111827',
                  fontWeight: '600',
                  marginBottom: '0.5rem'
                }}>
                  Saint Database Management
                </h2>
                <p style={{
                  fontFamily: 'var(--font-cormorant)',
                  color: '#6b7280',
                  fontSize: '1.125rem'
                }}>
                  Import and manage your saints database.
                </p>
              </div>
              <div className="p-6 space-y-6">
                <SaintImporter />
                <SaintManager />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="tournaments">
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <h2 style={{
                  fontSize: '1.875rem',
                  fontFamily: 'var(--font-sorts-mill)',
                  color: '#111827',
                  fontWeight: '600',
                  marginBottom: '0.5rem'
                }}>
                  Tournament Management
                </h2>
                <p style={{
                  fontFamily: 'var(--font-cormorant)',
                  color: '#6b7280',
                  fontSize: '1.125rem'
                }}>
                  Create and manage March Madness style brackets
                </p>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white border border-gray-100 rounded-lg p-6">
                    <Trophy className="h-8 w-8 text-blue-600 mb-3" />
                    <h3 style={{
                      fontFamily: 'var(--font-sorts-mill)',
                      fontSize: '1.25rem',
                      fontWeight: '600',
                      color: '#111827',
                      marginBottom: '0.5rem'
                    }}>
                      Generate New Bracket
                    </h3>
                    <p style={{
                      fontFamily: 'var(--font-cormorant)',
                      fontSize: '1rem',
                      color: '#6b7280',
                      marginBottom: '1rem'
                    }}>
                      Create a new tournament bracket with random saint selection from your chosen categories.
                    </p>
                    <a 
                      href="/admin/bracket"
                      style={{
                        display: 'block',
                        width: '100%',
                        padding: '0.75rem 1.5rem',
                        backgroundColor: '#8FBC8F',
                        color: 'white',
                        textAlign: 'center',
                        textDecoration: 'none',
                        borderRadius: '0.375rem',
                        fontSize: '0.875rem',
                        fontFamily: 'var(--font-league-spartan)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        fontWeight: '600'
                      }}
                    >
                      Generate Bracket
                    </a>
                  </div>
                  
                  <div className="bg-white border border-gray-100 rounded-lg p-6">
                    <Trophy className="h-8 w-8 text-green-600 mb-3" />
                    <h3 style={{
                      fontFamily: 'var(--font-sorts-mill)',
                      fontSize: '1.25rem',
                      fontWeight: '600',
                      color: '#111827',
                      marginBottom: '0.5rem'
                    }}>
                      View Brackets
                    </h3>
                    <p style={{
                      fontFamily: 'var(--font-cormorant)',
                      fontSize: '1rem',
                      color: '#6b7280',
                      marginBottom: '1rem'
                    }}>
                      View and manage existing tournament brackets and results.
                    </p>
                    <button style={{
                      display: 'block',
                      width: '100%',
                      padding: '0.75rem 1.5rem',
                      backgroundColor: 'white',
                      color: '#8FBC8F',
                      border: '1px solid #8FBC8F',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem',
                      fontFamily: 'var(--font-league-spartan)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}>
                      View All Brackets
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="posts">
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <h2 style={{
                  fontSize: '1.875rem',
                  fontFamily: 'var(--font-sorts-mill)',
                  color: '#111827',
                  fontWeight: '600',
                  marginBottom: '0.5rem'
                }}>
                  Daily Post Management
                </h2>
                <p style={{
                  fontFamily: 'var(--font-cormorant)',
                  color: '#6b7280',
                  fontSize: '1.125rem'
                }}>
                  Create and manage daily voting posts for the tournament.
                </p>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white border border-gray-100 rounded-lg p-6">
                      <FileText className="h-8 w-8 text-blue-600 mb-3" />
                      <h3 style={{
                        fontFamily: 'var(--font-sorts-mill)',
                        fontSize: '1.25rem',
                        fontWeight: '600',
                        color: '#111827',
                        marginBottom: '0.5rem'
                      }}>
                        Create New Post
                      </h3>
                      <p style={{
                        fontFamily: 'var(--font-cormorant)',
                        fontSize: '1rem',
                        color: '#6b7280',
                        marginBottom: '1rem'
                      }}>
                        Create a new daily matchup post with saint information and voting widget.
                      </p>
                      <a 
                        href="/admin/posts/create"
                        style={{
                          display: 'block',
                          width: '100%',
                          padding: '0.75rem 1.5rem',
                          backgroundColor: '#8FBC8F',
                          color: 'white',
                          textAlign: 'center',
                          textDecoration: 'none',
                          borderRadius: '0.375rem',
                          fontSize: '0.875rem',
                          fontFamily: 'var(--font-league-spartan)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          fontWeight: '600'
                        }}
                      >
                        Create Post
                      </a>
                    </div>
                    
                    <div className="bg-white border border-gray-100 rounded-lg p-6">
                      <FileText className="h-8 w-8 text-green-600 mb-3" />
                      <h3 style={{
                        fontFamily: 'var(--font-sorts-mill)',
                        fontSize: '1.25rem',
                        fontWeight: '600',
                        color: '#111827',
                        marginBottom: '0.5rem'
                      }}>
                        Manage Posts
                      </h3>
                      <p style={{
                        fontFamily: 'var(--font-cormorant)',
                        fontSize: '1rem',
                        color: '#6b7280',
                        marginBottom: '1rem'
                      }}>
                        Edit existing posts, view voting results, and manage scheduling.
                      </p>
                      <a 
                        href="/admin/posts"
                        style={{
                          display: 'block',
                          width: '100%',
                          padding: '0.75rem 1.5rem',
                          backgroundColor: 'white',
                          color: '#8FBC8F',
                          border: '1px solid #8FBC8F',
                          textAlign: 'center',
                          textDecoration: 'none',
                          borderRadius: '0.375rem',
                          fontSize: '0.875rem',
                          fontFamily: 'var(--font-league-spartan)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          fontWeight: '600'
                        }}
                      >
                        Manage Posts
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="settings">
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
              <div className="text-center py-12">
                <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 style={{
                  fontSize: '1.25rem',
                  fontFamily: 'var(--font-sorts-mill)',
                  fontWeight: '600',
                  color: '#111827',
                  marginBottom: '0.5rem'
                }}>
                  System Settings
                </h3>
                <p style={{
                  fontFamily: 'var(--font-cormorant)',
                  color: '#6b7280',
                  fontSize: '1.125rem'
                }}>
                  Global configuration options coming soon.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        </div>
      </main>
    </div>
  );
}

export default function AdminPage() {
  return <AdminContent />;
}