'use client';

import { useAuth } from '@/contexts/AuthContext';

export default function DebugAuthPage() {
  const { currentUser, firebaseUser, loading, isAdmin } = useAuth();
  
  console.log('Debug page - Auth state:', { currentUser, firebaseUser, loading, isAdmin });

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Auth Debug Page</h1>
      
      <div className="space-y-4">
        <div className="p-4 border rounded">
          <strong>Loading:</strong> {loading ? 'true' : 'false'}
        </div>
        
        <div className="p-4 border rounded">
          <strong>Firebase User:</strong> {firebaseUser ? firebaseUser.email : 'null'}
        </div>
        
        <div className="p-4 border rounded">
          <strong>Current User:</strong> {currentUser ? JSON.stringify(currentUser, null, 2) : 'null'}
        </div>
        
        <div className="p-4 border rounded">
          <strong>Is Admin:</strong> {isAdmin ? 'true' : 'false'}
        </div>
      </div>

      <div className="mt-6">
        <a 
          href="/admin/bracket/editor"
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Try Bracket Editor
        </a>
      </div>
    </div>
  );
}