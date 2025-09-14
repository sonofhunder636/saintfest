'use client';

import { useState, useEffect } from 'react';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Trophy, ArrowLeft, Download, Eye } from 'lucide-react';
import { Bracket, Saint } from '@/types';

interface BracketViewPageProps {
  params: Promise<{ id: string }>;
}

export default async function BracketViewPage({ params }: BracketViewPageProps) {
  const { id } = await params;
  const { currentUser, loading } = useRequireAuth('admin');
  const [bracket, setBracket] = useState<Bracket | null>(null);
  const [saints, setSaints] = useState<Record<string, Saint>>({});
  const [loadingBracket, setLoadingBracket] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (id) {
      loadBracket();
      loadSaints();
    }
  }, [id]);

  const loadBracket = async () => {
    try {
      const response = await fetch(`/api/admin/brackets/${id}`);
      const result = await response.json();

      if (result.success) {
        setBracket(result.data);
      } else {
        setError(result.error || 'Failed to load bracket');
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setLoadingBracket(false);
    }
  };

  const loadSaints = async () => {
    try {
      const response = await fetch('/api/admin/saints');
      const result = await response.json();

      if (result.success) {
        const saintsMap: Record<string, Saint> = {};
        result.data.forEach((saint: Saint) => {
          saintsMap[saint.id] = saint;
        });
        setSaints(saintsMap);
      }
    } catch (err) {
      console.error('Failed to load saints:', err);
    }
  };

  const getSaintName = (saintId: string): string => {
    if (!saintId || saintId.trim() === '') {
      return 'TBD';
    }
    return saints[saintId]?.name || 'Loading...';
  };

  if (loading || loadingBracket) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!currentUser || error) {
    return (
      <div className="container mx-auto p-6 text-center">
        <div className="text-red-600">{error || 'Access denied'}</div>
        <Button className="mt-4" asChild>
          <a href="/admin/bracket">Back to Bracket Generator</a>
        </Button>
      </div>
    );
  }

  if (!bracket) {
    return (
      <div className="container mx-auto p-6 text-center">
        <div className="text-red-600">Bracket not found</div>
        <Button className="mt-4" asChild>
          <a href="/admin/bracket">Back to Bracket Generator</a>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" asChild>
            <a href="/admin/bracket">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Generator
            </a>
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center space-x-2">
              <Trophy className="h-8 w-8 text-yellow-600" />
              <span>Saintfest {bracket.year} Tournament</span>
            </h1>
            <p className="text-muted-foreground">
              32-saint tournament bracket • {bracket.rounds.length} rounds
            </p>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
          <Button variant="outline" asChild>
            <a href={`/bracket/${bracket.id}`} target="_blank">
              <Eye className="mr-2 h-4 w-4" />
              Public View
            </a>
          </Button>
        </div>
      </div>

      <div className="space-y-8">
        {bracket.rounds.map((round) => (
          <Card key={round.roundNumber}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">Round {round.roundNumber}</Badge>
                  <span>{round.roundName}</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {round.matches.length} matches
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {round.matches.map((match) => (
                  <Card key={match.matchId} className="p-4">
                    <div className="space-y-3">
                      <div className="text-sm font-medium text-center">
                        {match.matchId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </div>
                      
                      <div className="space-y-2">
                        <div className={`p-3 rounded-lg border ${
                          match.winnerId === match.saint1Id 
                            ? 'bg-green-50 border-green-200 font-semibold' 
                            : 'bg-gray-50 border-gray-200'
                        }`}>
                          <div className="flex justify-between items-center">
                            <div className="text-sm font-medium pr-4">
                              {getSaintName(match.saint1Id)}
                            </div>
                            <div className="text-sm font-bold">
                              {match.votesForSaint1 || 0}
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-center text-xs text-muted-foreground font-medium">
                          VS
                        </div>
                        
                        <div className={`p-3 rounded-lg border ${
                          match.winnerId === match.saint2Id 
                            ? 'bg-green-50 border-green-200 font-semibold' 
                            : 'bg-gray-50 border-gray-200'
                        }`}>
                          <div className="flex justify-between items-center">
                            <div className="text-sm font-medium pr-4">
                              {getSaintName(match.saint2Id)}
                            </div>
                            <div className="text-sm font-bold">
                              {match.votesForSaint2 || 0}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {match.winnerId && (
                        <div className="text-center">
                          <Badge className="bg-green-600">
                            ✓ {getSaintName(match.winnerId)}
                          </Badge>
                        </div>
                      )}
                      
                      {!match.winnerId && round.roundNumber === 1 && (
                        <div className="text-center">
                          <Button size="sm" variant="outline">
                            Start Voting
                          </Button>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {bracket.finalWinner && (
        <Card className="border-yellow-200 bg-gradient-to-br from-yellow-50 to-orange-50">
          <CardContent className="text-center py-12">
            <Trophy className="h-20 w-20 text-yellow-600 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-yellow-800 mb-3">
              🎉 Champion 🎉
            </h2>
            <p className="text-2xl text-yellow-700 font-semibold mb-2">
              {getSaintName(bracket.finalWinner)}
            </p>
            <p className="text-lg text-yellow-600">
              Saintfest {bracket.year} Winner
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}