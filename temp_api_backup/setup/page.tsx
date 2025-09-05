'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Crown, Loader2, CheckCircle } from 'lucide-react';

export default function SetupPage() {
  const { currentUser, loading, firebaseUser } = useAuth();
  const [promoting, setPromoting] = useState(false);
  const [status, setStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  // Debug logging
  console.log('Setup page - currentUser:', currentUser);
  console.log('Setup page - firebaseUser:', firebaseUser);
  console.log('Setup page - loading:', loading);

  const promoteToAdmin = async () => {
    if (!currentUser) {
      setStatus({ type: 'error', message: 'You must be signed in to promote to admin' });
      return;
    }

    setPromoting(true);
    setStatus({ type: null, message: '' });

    try {
      const response = await fetch('/api/admin/promote-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id }),
      });

      const result = await response.json();

      if (result.success) {
        setStatus({
          type: 'success',
          message: 'Successfully promoted to admin! Please refresh the page or sign out and back in.',
        });
        // Refresh the page after a delay to reload user data
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        setStatus({
          type: 'error',
          message: result.error || 'Failed to promote to admin',
        });
      }
    } catch (error) {
      setStatus({
        type: 'error',
        message: 'Failed to promote to admin',
      });
    } finally {
      setPromoting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center space-x-2">
        <Crown className="h-8 w-8 text-yellow-600" />
        <h1 className="text-3xl font-bold">Saintfest Setup</h1>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>First-Time Setup</CardTitle>
          <CardDescription>
            Set up your admin account to manage the Saintfest database and brackets
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-xs text-gray-500 p-2 bg-gray-100 rounded mb-4">
            <strong>Debug Info:</strong><br />
            Loading: {loading.toString()}<br />
            CurrentUser: {currentUser ? `${currentUser.email} (${currentUser.role})` : 'null'}<br />
            FirebaseUser: {firebaseUser ? firebaseUser.email : 'null'}
          </div>
          
          {!currentUser ? (
            <Alert>
              <AlertDescription>
                Please <a href="/auth/signin" className="text-blue-600 underline">sign in</a> first to set up your admin account.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <div className="space-y-2">
                <h3 className="font-semibold">Current User:</h3>
                <p>Email: {currentUser.email}</p>
                <p>Name: {currentUser.displayName}</p>
                <p>Role: <span className={`font-semibold ${currentUser.role === 'admin' ? 'text-green-600' : 'text-orange-600'}`}>
                  {currentUser.role}
                </span></p>
              </div>

              {currentUser.role === 'admin' ? (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    You are already an admin! You can now access the admin dashboard at{' '}
                    <a href="/admin" className="text-blue-600 underline">/admin</a>
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  <div className="space-y-2">
                    <h3 className="font-semibold">Promote to Admin</h3>
                    <p className="text-sm text-muted-foreground">
                      Click the button below to promote your account to admin status. This will allow you to:
                    </p>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                      <li>Import saints from your Google Sheets database</li>
                      <li>Manage the saints database</li>
                      <li>Generate March Madness style brackets</li>
                      <li>Control tournament settings</li>
                    </ul>
                  </div>

                  <Button 
                    onClick={promoteToAdmin}
                    disabled={promoting}
                    className="w-full"
                  >
                    {promoting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Promoting to Admin...
                      </>
                    ) : (
                      <>
                        <Crown className="mr-2 h-4 w-4" />
                        Promote to Admin
                      </>
                    )}
                  </Button>
                </>
              )}

              {status.type && (
                <Alert variant={status.type === 'error' ? 'destructive' : 'default'}>
                  <AlertDescription>{status.message}</AlertDescription>
                </Alert>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Next Steps</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Sign in or create an account</li>
            <li>Promote your account to admin using the button above</li>
            <li>Visit the <a href="/admin" className="text-blue-600 underline">admin dashboard</a></li>
            <li>Import your saints database from Google Sheets</li>
            <li>Generate tournament brackets</li>
            <li>Share the public bracket page with visitors</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}