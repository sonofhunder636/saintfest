'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Trophy, ArrowLeft, Download, Eye } from 'lucide-react';
import { Bracket, Saint } from '@/types';
import { useParams } from 'next/navigation';

export default function BracketViewPage() {
  const params = useParams();
  const id = params.id as string;
  const { currentUser, loading } = useRequireAuth('admin');
  const [bracket, setBracket] = useState<Bracket | null>(null);
  const [saints, setSaints] = useState<Record<string, Saint>>({});
  const [loadingBracket, setLoadingBracket] = useState(true);
  const [error, setError] = useState<string>('');

  const loadBracket = useCallback(async () => {
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
  }, [id]);

  const loadSaints = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    if (!loading && currentUser) {
      loadBracket();
      loadSaints();
    }
  }, [loading, currentUser, loadBracket, loadSaints]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">{error}</p>
            <Button
              onClick={() => window.history.back()}
              className="mt-4"
              variant="outline"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loadingBracket) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading bracket...</p>
        </div>
      </div>
    );
  }

  if (!bracket) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Bracket Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">The requested bracket could not be found.</p>
            <Button
              onClick={() => window.history.back()}
              variant="outline"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'draft': return 'secondary';
      case 'published': return 'default';
      case 'active': return 'default';
      case 'completed': return 'outline';
      case 'archived': return 'outline';
      default: return 'secondary';
    }
  };

  const getSaintName = (saintId: string) => {
    return saints[saintId]?.name || `Saint ID: ${saintId}`;
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="container mx-auto py-6 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            onClick={() => window.history.back()}
            variant="outline"
            size="sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">{bracket.title}</h1>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant={getStatusBadgeVariant(bracket.status)}>
            {bracket.status}
          </Badge>
          {bracket.status === 'completed' && bracket.finalWinner && (
            <Badge variant="default" className="bg-yellow-500">
              <Trophy className="w-3 h-3 mr-1" />
              Winner: {typeof bracket.finalWinner === 'string' ? getSaintName(bracket.finalWinner) : getSaintName((bracket.finalWinner as any).id || bracket.finalWinner)}
            </Badge>
          )}
        </div>
      </div>

      {/* Bracket Info */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Basic Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <span className="font-medium">Year:</span> {bracket.year}
            </div>
            <div>
              <span className="font-medium">Status:</span>{' '}
              <Badge variant={getStatusBadgeVariant(bracket.status)}>
                {bracket.status}
              </Badge>
            </div>
            <div>
              <span className="font-medium">Created:</span>{' '}
              {formatDate(bracket.createdAt?.toString())}
            </div>
            {bracket.publishedAt && (
              <div>
                <span className="font-medium">Published:</span>{' '}
                {formatDate(bracket.publishedAt.toString())}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {bracket.categories.map((category, index) => (
                <div key={category.id} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  <span className="text-sm">{category.name}</span>
                  <span className="text-xs text-gray-500">
                    ({category.saints.length} saints)
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Tournament Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {bracket.rounds.map((round, index) => (
                <div key={round.roundNumber || index} className="flex justify-between text-sm">
                  <span>{(round as any).name || (round as any).roundName}</span>
                  <span className="text-gray-500">
                    {round.matches?.length || 0} matches
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tournament Rounds */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold mb-4">Tournament Structure</h2>

        {bracket.rounds.map((round) => (
          <Card key={round.roundNumber || (round as any).name || (round as any).roundName}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">{(round as any).name || (round as any).roundName}</CardTitle>
                <Badge variant="outline">
                  {round.matches?.length || 0} matches
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {(round.matches || []).map((match, index) => (
                  <div
                    key={(match as any).id || (match as any).matchId || index}
                    className="border rounded-lg p-4 bg-gray-50"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Match {(match as any).position || index + 1}</span>
                      <Badge variant="outline" className="text-xs">
                        {(match as any).status || 'pending'}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">{getSaintName((match as any).saint1Id)}</span>
                        {(match as any).winner === (match as any).saint1Id && (
                          <Trophy className="w-4 h-4 text-yellow-500" />
                        )}
                      </div>

                      <div className="text-center text-xs text-gray-500">vs</div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm">{getSaintName((match as any).saint2Id)}</span>
                        {(match as any).winner === (match as any).saint2Id && (
                          <Trophy className="w-4 h-4 text-yellow-500" />
                        )}
                      </div>
                    </div>

                    {(match as any).votesForSaint1 !== undefined && (match as any).votesForSaint2 !== undefined && (
                      <div className="mt-3 pt-2 border-t">
                        <div className="text-xs text-gray-600 mb-1">Votes:</div>
                        <div className="flex justify-between text-xs">
                          <span>{(match as any).votesForSaint1}</span>
                          <span>{(match as any).votesForSaint2}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Winner Section */}
      {bracket.status === 'completed' && bracket.finalWinner && (
        <Card className="mt-8 bg-yellow-50 border-yellow-200">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Trophy className="w-6 h-6 text-yellow-500" />
              Tournament Winner
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <h3 className="text-3xl font-bold text-yellow-700 mb-2">
                {typeof bracket.finalWinner === 'string' ? getSaintName(bracket.finalWinner) : getSaintName((bracket.finalWinner as any).id || bracket.finalWinner)}
              </h3>
              <p className="text-yellow-600">
                Congratulations to the Blessed Intercessor for {bracket.year}!
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Export URLs */}
      {bracket.exportUrls && Object.keys(bracket.exportUrls).length > 0 && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="w-5 h-5" />
              Download Bracket
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              {bracket.exportUrls.pdf && (
                <a
                  href={bracket.exportUrls.pdf}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  PDF
                </a>
              )}
              {bracket.exportUrls.png && (
                <a
                  href={bracket.exportUrls.png}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  PNG
                </a>
              )}
              {bracket.exportUrls.svg && (
                <a
                  href={bracket.exportUrls.svg}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  SVG
                </a>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}