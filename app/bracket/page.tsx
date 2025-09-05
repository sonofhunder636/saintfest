'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Trophy, Download, Share2, Calendar } from 'lucide-react';
import { Bracket, Saint } from '@/types';
import Navigation from '@/components/Navigation';

export default function PublicBracketPage() {
  const [brackets, setBrackets] = useState<Bracket[]>([]);
  const [saints, setSaints] = useState<Record<string, Saint>>({});
  const [loading, setLoading] = useState(true);
  const [selectedBracket, setSelectedBracket] = useState<Bracket | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    // For demo purposes, show "coming soon" message
    setLoading(false);
  }, []);

  const getSaintName = (saintId: string): string => {
    return saints[saintId]?.name || 'TBD';
  };

  const downloadBracket = async (bracket: Bracket) => {
    try {
      const response = await fetch(`/api/brackets/${bracket.id}/pdf`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `saintfest-${bracket.year}-bracket.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Failed to download bracket:', error);
    }
  };

  const shareBracket = async (bracket: Bracket) => {
    const url = `${window.location.origin}/bracket/${bracket.id}`;
    try {
      await navigator.share({
        title: `Saintfest ${bracket.year} Bracket`,
        text: 'Check out this March Madness style saint tournament!',
        url: url,
      });
    } catch (error) {
      // Fallback to copying to clipboard
      navigator.clipboard.writeText(url);
      alert('Bracket URL copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6 text-center">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div style={{minHeight: '100vh', backgroundColor: '#fffbeb'}}>
      {/* Green Header Banner - Same as other pages */}
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
          <a href="/" style={{
            fontSize: '2.5rem',
            fontFamily: 'var(--font-sorts-mill)',
            color: 'white',
            textDecoration: 'none',
            fontWeight: '600',
            textShadow: '0 1px 2px rgba(0,0,0,0.1)'
          }}>
            Saintfest
          </a>
          
          <Navigation />
        </div>
      </header>

      <main style={{maxWidth: '48rem', margin: '0 auto', padding: '3rem 1.5rem', textAlign: 'center'}}>
        <div style={{textAlign: 'center', marginBottom: '3rem'}}>
          <h1 style={{
            fontSize: '3rem',
            fontFamily: 'var(--font-sorts-mill)',
            color: '#374151',
            marginBottom: '1rem',
            fontWeight: '600'
          }}>
            2025 Saintfest Bracket
          </h1>
          <div style={{
            width: '6rem',
            height: '1px',
            backgroundColor: '#d1d5db',
            margin: '0 auto'
          }}></div>
        </div>

        <h2 style={{
          fontSize: '2rem',
          fontFamily: 'var(--font-sorts-mill)',
          color: '#374151',
          marginBottom: '1rem',
          fontWeight: '600'
        }}>
          Announcement Coming Soon!
        </h2>
        <p style={{
          fontFamily: 'var(--font-cormorant)',
          fontSize: '1.125rem',
          lineHeight: '1.75',
          color: '#6b7280',
          marginBottom: '2rem',
          maxWidth: '32rem',
          margin: '0 auto 2rem auto'
        }}>
          The 2025 Saintfest bracket will be announced on September 14.
          <br />
          Until then, explore our community posts and learn about past tournaments!
        </p>
        
        <div style={{
          display: 'flex',
          gap: '1rem',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          <a href="/posts/" style={{
            backgroundColor: '#8FBC8F',
            color: 'white',
            padding: '0.75rem 1.5rem',
            borderRadius: '0.375rem',
            textDecoration: 'none',
            fontFamily: 'var(--font-league-spartan)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            fontWeight: '600',
            fontSize: '0.875rem'
          }}>
            Read Latest Posts
          </a>
        </div>
      </main>

      <footer style={{
        borderTop: '1px solid #f3f4f6',
        padding: '4rem 0',
        marginTop: '4rem'
      }}>
        <div style={{
          maxWidth: '48rem',
          margin: '0 auto',
          padding: '0 1.5rem',
          textAlign: 'center'
        }}>
          <p style={{
            fontSize: '0.75rem',
            fontFamily: 'var(--font-league-spartan)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: '#9ca3af'
          }}>
            © 2024 Saintfest · A celebration of saints through community
          </p>
        </div>
      </footer>
    </div>

  );
}