'use client';

import React, { useState } from 'react';
import { ChakraProvider } from '@chakra-ui/react';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { Tournament } from '@/types';
import { saintfestTheme } from '@/lib/chakra-theme';
import TournamentGenerator from '@/components/admin/TournamentGenerator';
import { publishTournament } from '@/lib/tournamentService';

export default function BracketAdminPage() {
  const { currentUser, loading } = useRequireAuth();
  const [currentTournament, setCurrentTournament] = useState<Tournament | undefined>(undefined);

  const handleTournamentGenerated = (tournament: Tournament) => {
    setCurrentTournament(tournament);
    console.log('Tournament generated:', tournament);
  };

  const handleTournamentSaved = async (tournament: Tournament) => {
    try {
      console.log('Publishing tournament:', tournament);

      const result = await publishTournament(
        tournament,
        currentUser?.id || 'admin'
      );

      if (result.success) {
        console.log('Tournament published successfully:', result);
        alert(`Tournament published successfully!\n\nPublished Bracket ID: ${result.publishedBracketId}\nArchive ID: ${result.archiveId}`);
      } else {
        console.error('Failed to publish tournament:', result.error);
        alert(`Failed to publish tournament: ${result.error}`);
      }

    } catch (error) {
      console.error('Failed to publish tournament:', error);
      alert(`Failed to publish tournament: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  if (loading) {
    return (
      <ChakraProvider theme={saintfestTheme}>
        <div className="min-h-screen flex items-center justify-center" style={{backgroundColor: '#fffbeb'}}>
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4" style={{borderBottomColor: '#8FBC8F'}}></div>
            <p style={{fontFamily: 'var(--font-cormorant)', fontSize: '1.125rem', color: '#6b7280'}}>Loading tournament system...</p>
          </div>
        </div>
      </ChakraProvider>
    );
  }

  if (!currentUser) {
    return (
      <ChakraProvider theme={saintfestTheme}>
        <div className="min-h-screen flex items-center justify-center" style={{backgroundColor: '#fffbeb'}}>
          <div className="text-center">
            <p style={{fontFamily: 'var(--font-cormorant)', fontSize: '1.125rem', color: '#ef4444'}}>
              Access denied. Admin privileges required.
            </p>
            <button 
              onClick={() => window.location.href = '/admin/login'}
              style={{
                marginTop: '1rem',
                padding: '0.5rem 1rem',
                backgroundColor: '#8FBC8F',
                color: 'white',
                border: 'none',
                borderRadius: '0.25rem',
                cursor: 'pointer'
              }}
            >
              Go to Login
            </button>
          </div>
        </div>
      </ChakraProvider>
    );
  }

  return (
    <ChakraProvider theme={saintfestTheme}>
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
                  Tournament Bracket System
                </h1>
                <p style={{
                  fontSize: '1rem',
                  fontFamily: 'var(--font-league-spartan)',
                  color: 'rgba(255,255,255,0.9)',
                  marginTop: '0.5rem'
                }}>
                  Generate and manage Saintfest tournament brackets
                </p>
              </div>
              <nav style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <a href="/admin" style={{
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
                  ← Admin Dashboard
                </a>
              </nav>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 py-8">
          <TournamentGenerator
            onTournamentGenerated={handleTournamentGenerated}
            onTournamentSaved={handleTournamentSaved}
            initialTournament={currentTournament}
          />
        </main>
      </div>
    </ChakraProvider>
  );
}