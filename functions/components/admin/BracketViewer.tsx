'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Trophy, Download, Eye, Users } from 'lucide-react';
import { Bracket, Saint } from '@/types';

interface BracketViewerProps {
  bracketId?: string;
}

export default function BracketViewer({ bracketId }: BracketViewerProps) {
  const [bracket, setBracket] = useState<Bracket | null>(null);
  const [saints, setSaints] = useState<Record<string, Saint>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (bracketId) {
      loadBracket(bracketId);
    }
  }, [bracketId]);

  const loadBracket = async (id: string) => {
    setLoading(true);
    setError('');

    try {
      // Load bracket data
      const bracketResponse = await fetch(`/api/admin/brackets/${id}`);
      const bracketResult = await bracketResponse.json();

      if (!bracketResult.success) {
        throw new Error(bracketResult.error);
      }

      setBracket(bracketResult.data);

      // Load saints data
      const saintsResponse = await fetch('/api/admin/saints');
      const saintsResult = await saintsResponse.json();

      if (saintsResult.success) {
        const saintsMap: Record<string, Saint> = {};
        saintsResult.data.forEach((saint: Saint) => {
          saintsMap[saint.id] = saint;
        });
        setSaints(saintsMap);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load bracket');
    } finally {
      setLoading(false);
    }
  };

  const getSaintName = (saintId: string): string => {
    return saints[saintId]?.name || 'TBD';
  };

  const generatePrintableBracket = async () => {
    if (!bracket) return;

    try {
      const response = await fetch(`/api/admin/brackets/${bracket.id}/pdf`, {
        method: 'POST',
      });

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
      console.error('Failed to generate PDF:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  if (!bracket) {
    return (
      <div className="text-center p-8">
        <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <div className="text-gray-600">No bracket selected</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center space-x-2">
              <Trophy className="h-6 w-6" />
              <span>Saintfest {bracket.year} Bracket</span>
            </span>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={generatePrintableBracket}>
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </Button>
              <Button variant="outline">
                <Eye className="mr-2 h-4 w-4" />
                Public View
              </Button>
            </div>
          </CardTitle>
          <CardDescription>
            {bracket.rounds[0]?.matches.length * 2}-saint tournament bracket
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="space-y-8">
        {bracket.rounds.map((round) => (
          <Card key={round.roundNumber}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Badge variant="outline">{round.roundName}</Badge>
                <span className="text-sm text-muted-foreground">
                  {round.matches.length} matches
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {round.matches.map((match) => (
                  <Card key={match.matchId} className="p-4">
                    <div className="space-y-3">
                      <div className="text-sm font-medium text-center">
                        {match.matchId}
                      </div>
                      
                      <div className="space-y-2">
                        <div className={`flex items-center justify-between p-2 rounded ${
                          match.winnerId === match.saint1Id ? 'bg-green-50 border-green-200' : 'bg-gray-50'
                        }`}>
                          <span className="font-medium">
                            {getSaintName(match.saint1Id)}
                          </span>
                          <span className="text-sm">
                            {match.votesForSaint1}
                          </span>
                        </div>
                        
                        <div className="text-center text-xs text-muted-foreground">
                          vs
                        </div>
                        
                        <div className={`flex items-center justify-between p-2 rounded ${
                          match.winnerId === match.saint2Id ? 'bg-green-50 border-green-200' : 'bg-gray-50'
                        }`}>
                          <span className="font-medium">
                            {getSaintName(match.saint2Id)}
                          </span>
                          <span className="text-sm">
                            {match.votesForSaint2}
                          </span>
                        </div>
                      </div>
                      
                      {match.winnerId && (
                        <div className="text-center">
                          <Badge variant="secondary">
                            Winner: {getSaintName(match.winnerId)}
                          </Badge>
                        </div>
                      )}
                      
                      {match.pollId && (
                        <div className="text-center">
                          <Button size="sm" variant="outline">
                            <Users className="mr-2 h-4 w-4" />
                            View Poll
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
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="text-center py-8">
            <Trophy className="h-16 w-16 text-yellow-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-yellow-800 mb-2">
              Champion
            </h2>
            <p className="text-xl text-yellow-700">
              {getSaintName(bracket.finalWinner)}
            </p>
            <p className="text-sm text-yellow-600 mt-2">
              Saintfest {bracket.year} Winner
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}