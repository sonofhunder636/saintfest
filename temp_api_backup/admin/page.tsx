'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import ImageManager from '@/components/admin/ImageManager';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ImageIcon, Users, Trophy, Settings } from 'lucide-react';
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

export default function AdminPage() {
  const { currentUser, loading } = useRequireAuth('admin');
  const [saints, setSaints] = useState(sampleSaints);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading admin panel...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="text-center py-12">
            <h2 className="text-xl font-sorts-mill mb-4">Access Denied</h2>
            <p className="text-gray-600 mb-4">You need to be signed in as an admin to access this page.</p>
            <Button onClick={() => window.location.href = '/auth/signin'}>
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-sorts-mill text-gray-900">Saintfest Admin</h1>
              <p className="text-gray-600">Manage your Saintfest tournament</p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {currentUser.displayName}
              </span>
              <Button variant="outline" onClick={() => window.location.href = '/'}>
                Back to Site
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <Tabs defaultValue="images" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="images" className="flex items-center space-x-2">
              <ImageIcon className="h-4 w-4" />
              <span>Images</span>
            </TabsTrigger>
            <TabsTrigger value="saints" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Saints</span>
            </TabsTrigger>
            <TabsTrigger value="tournaments" className="flex items-center space-x-2">
              <Trophy className="h-4 w-4" />
              <span>Tournaments</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="images">
            <Card>
              <CardHeader>
                <CardTitle>Saint Image Management</CardTitle>
                <p className="text-gray-600">
                  Upload and manage images for your saints using public domain sources.
                </p>
              </CardHeader>
              <CardContent>
                <ImageManager 
                  saints={saints}
                  onUpdateSaintImage={handleUpdateSaintImage}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="saints">
            <Card>
              <CardHeader>
                <CardTitle>Saint Database Management</CardTitle>
                <p className="text-gray-600">
                  Import and manage your saints database.
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <SaintImporter />
                <SaintManager />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tournaments">
            <Card>
              <CardHeader>
                <CardTitle>Tournament Management</CardTitle>
                <p className="text-gray-600">
                  Create and manage March Madness style brackets
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <Trophy className="h-8 w-8 text-blue-600 mb-3" />
                      <h3 className="font-semibold mb-2">Generate New Bracket</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Create a new tournament bracket with random saint selection from your chosen categories.
                      </p>
                      <Button className="w-full" asChild>
                        <a href="/admin/bracket">Generate Bracket</a>
                      </Button>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="pt-6">
                      <Trophy className="h-8 w-8 text-green-600 mb-3" />
                      <h3 className="font-semibold mb-2">View Brackets</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        View and manage existing tournament brackets and results.
                      </p>
                      <Button variant="outline" className="w-full">
                        View All Brackets
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardContent className="text-center py-12">
                <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">System Settings</h3>
                <p className="text-gray-600">
                  Global configuration options coming soon.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}