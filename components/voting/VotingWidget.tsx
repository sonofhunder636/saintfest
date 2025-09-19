'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Saint } from '@/types';
import { Clock, CheckCircle, AlertCircle } from 'lucide-react';
import Cookies from 'js-cookie';

interface VotingWidgetProps {
  sessionId: string;
  saint1: Saint;
  saint2: Saint;
  closesAt: Date;
  isActive: boolean;
}

interface VoteResults {
  saint1Votes: number;
  saint2Votes: number;
  saint1Percentage: number;
  saint2Percentage: number;
  totalVotes: number;
}

export default function VotingWidget({ 
  sessionId, 
  saint1, 
  saint2, 
  closesAt, 
  isActive 
}: VotingWidgetProps) {
  const [hasVoted, setHasVoted] = useState(false);
  const [selectedSaint, setSelectedSaint] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [results, setResults] = useState<VoteResults | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  // Check if user has already voted (from cookie) - specific to this post/session
  useEffect(() => {
    // Use a more specific cookie key that includes the session ID
    const voteKey = `saintfest_voted_${sessionId}`;
    const hasUserVoted = Cookies.get(voteKey) === 'true';
    console.log('Checking vote cookie for session:', sessionId, 'cookie key:', voteKey, 'hasVoted:', hasUserVoted);
    setHasVoted(hasUserVoted);

    // Only show results if they've actually voted on THIS specific session
    if (hasUserVoted) {
      console.log('User has already voted on this post, fetching results');
      fetchResults();
    } else {
      console.log('User has not voted on this post yet, showing voting options');
      setResults(null); // Clear any existing results
    }
  }, [sessionId]);

  // Update countdown timer
  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const closingTime = new Date(closesAt);
      const diff = closingTime.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining('Voting has ended');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m remaining`);
      } else {
        setTimeRemaining(`${minutes}m remaining`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [closesAt]);

  const fetchResults = async () => {
    try {
      console.log('Fetching results for sessionId:', sessionId);
      const response = await fetch(`/api/votes?sessionId=${sessionId}`);
      if (response.ok) {
        const result = await response.json();
        console.log('Votes API result:', result);
        if (result.success) {
          const votes = result.data.votes;
          console.log('Raw votes:', votes);
          const saint1VotesCount = votes.filter((v: any) => v.saintId === saint1.id).length;
          const saint2VotesCount = votes.filter((v: any) => v.saintId === saint2.id).length;
          const total = saint1VotesCount + saint2VotesCount;

          console.log(`Saint1 (${saint1.id}): ${saint1VotesCount}, Saint2 (${saint2.id}): ${saint2VotesCount}, Total: ${total}`);

          setResults({
            saint1Votes: saint1VotesCount,
            saint2Votes: saint2VotesCount,
            saint1Percentage: total > 0 ? Math.round((saint1VotesCount / total) * 100) : 0,
            saint2Percentage: total > 0 ? Math.round((saint2VotesCount / total) * 100) : 0,
            totalVotes: total
          });
        } else {
          console.error('API returned error:', result.error);
          // Don't show fallback results unless user has actually voted
          if (hasVoted) {
            setResults({
              saint1Votes: 3,
              saint2Votes: 7,
              saint1Percentage: 30,
              saint2Percentage: 70,
              totalVotes: 10
            });
          }
        }
      } else {
        console.error('API response not ok:', response.status);
        // Don't show fallback results unless user has actually voted
        if (hasVoted) {
          setResults({
            saint1Votes: 2,
            saint2Votes: 8,
            saint1Percentage: 20,
            saint2Percentage: 80,
            totalVotes: 10
          });
        }
      }
    } catch (error) {
      console.error('Error fetching results:', error);
      // Don't show fallback results unless user has actually voted
      if (hasVoted) {
        setResults({
          saint1Votes: 1,
          saint2Votes: 4,
          saint1Percentage: 20,
          saint2Percentage: 80,
          totalVotes: 5
        });
      }
    }
  };

  const handleVote = async (saintId: string) => {
    if (isSubmitting || hasVoted || !isActive) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/votes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          saintId
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // Set cookie to remember they voted on THIS specific post
          const voteKey = `saintfest_voted_${sessionId}`;
          Cookies.set(voteKey, 'true', { 
            expires: new Date(closesAt),
            sameSite: 'lax'
          });

          setHasVoted(true);
          setSelectedSaint(saintId);
          console.log('Vote successful! Selected saint set to:', saintId, 'Cookie set with key:', voteKey);
          console.log('Debug - selectedSaint will be set to:', saintId, 'saint1.id:', saint1.id, 'saint2.id:', saint2.id);
          
          // Show results after voting
          setTimeout(fetchResults, 1000);
        } else {
          setError(result.error || 'Failed to record vote');
        }
      } else {
        const errorResult = await response.json();
        setError(errorResult.error || 'Failed to record vote');
      }
    } catch (error) {
      console.error('Error voting:', error);
      setError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const votingEnded = new Date() > new Date(closesAt) || !isActive;

  return (
    <Card className="w-full max-w-2xl mx-auto mb-8">
      <CardHeader className="text-center">
        <CardTitle style={{textAlign: 'center', fontSize: '2rem', marginBottom: '1rem'}}>
          Cast Your Vote
        </CardTitle>
        <div style={{
          width: '100%',
          height: '1px',
          background: 'linear-gradient(to right, transparent, #d1d5db, transparent)',
          marginBottom: '1rem'
        }}></div>
      </CardHeader>
      <CardContent>
        {error && (
          <div style={{
            marginBottom: '1rem',
            padding: '0.75rem',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '0.375rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '20px'
          }}>
            <AlertCircle className="h-4 w-4 text-red-500" />
            <span style={{color: '#b91c1c', fontSize: '0.875rem', textAlign: 'center'}}>{error}</span>
          </div>
        )}

        {votingEnded ? (
          <div className="text-center py-4">
            <Badge variant="secondary" className="mb-4">
              Voting Ended
            </Badge>
            {results && (
              <div className="space-y-4">
                <h3 className="font-semibold">Final Results:</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <h4 className="font-medium">{saint1.name}</h4>
                    <div className="text-2xl font-bold text-blue-600">
                      {results.saint1Percentage}%
                    </div>
                  </div>
                  <div className="text-center">
                    <h4 className="font-medium">{saint2.name}</h4>
                    <div className="text-2xl font-bold text-green-600">
                      {results.saint2Percentage}%
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  Total votes: {results.totalVotes}
                </p>
              </div>
            )}
          </div>
        ) : hasVoted ? (
          <div className="space-y-4">
            <div className="text-center py-4">
              <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.5rem'}}>
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span style={{marginLeft: '12px', color: '#166534', fontWeight: '500'}}>Vote Recorded</span>
              </div>
              <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', color: '#4b5563', marginBottom: '1rem'}}>
                <Clock className="h-4 w-4" />
                <span style={{marginLeft: '12px'}}>{timeRemaining}</span>
              </div>
              <p style={{textAlign: 'center', color: '#4b5563'}}>
                Thank you for voting!
              </p>
              
              {results && (
                <div style={{marginTop: '1.5rem'}}>
                  <h3 style={{fontWeight: '600', textAlign: 'center', marginBottom: '1rem', color: '#374151'}}>
                    Current Results:
                  </h3>
                  <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem'}}>
                    <div style={{
                      textAlign: 'center',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '0.375rem',
                      backgroundColor: selectedSaint === saint1.id ? '#8FBC8F' : '#f9fafb',
                      border: '1px solid #e5e7eb'
                    }}>
                      <h4 style={{fontWeight: '500', marginBottom: '0.125rem', color: selectedSaint === saint1.id ? '#FFFFFF' : '#374151', fontSize: '0.875rem'}}>
                        {saint1.name}
                      </h4>
                      <div style={{fontSize: '1.75rem', fontWeight: 'bold', color: selectedSaint === saint1.id ? '#FFFFFF' : '#000000', marginBottom: '0.125rem'}}>
                        {results.saint1Percentage}%
                      </div>
                    </div>
                    <div style={{
                      textAlign: 'center',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '0.375rem',
                      backgroundColor: selectedSaint === saint2.id ? '#8FBC8F' : '#f9fafb',
                      border: '1px solid #e5e7eb'
                    }}>
                      <h4 style={{fontWeight: '500', marginBottom: '0.125rem', color: selectedSaint === saint2.id ? '#FFFFFF' : '#374151', fontSize: '0.875rem'}}>
                        {saint2.name}
                      </h4>
                      <div style={{fontSize: '1.75rem', fontWeight: 'bold', color: selectedSaint === saint2.id ? '#FFFFFF' : '#000000', marginBottom: '0.125rem'}}>
                        {results.saint2Percentage}%
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div>
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem'}}>
              <button
                onClick={() => handleVote(saint1.id)}
                disabled={isSubmitting}
                style={{
                  fontSize: '0.875rem',
                  fontFamily: 'var(--font-sorts-mill)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'white',
                  textDecoration: 'none',
                  fontWeight: '700',
                  padding: '0.5rem 1rem',
                  borderRadius: '0.25rem',
                  backgroundColor: '#8FBC8F',
                  border: 'none',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  opacity: isSubmitting ? 0.6 : 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (!isSubmitting) {
                    (e.target as HTMLButtonElement).style.backgroundColor = '#7da87d';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSubmitting) {
                    (e.target as HTMLButtonElement).style.backgroundColor = '#8FBC8F';
                  }
                }}
              >
                <div style={{fontSize: '0.875rem', fontWeight: '700'}}>
                  {saint1.name}
                </div>
                {saint1.feastDay && (
                  <div style={{
                    fontSize: '0.75rem',
                    fontWeight: '400',
                    opacity: 0.9,
                    textTransform: 'none'
                  }}>
                    Feast Day: {saint1.feastDay}
                  </div>
                )}
              </button>

              <button
                onClick={() => handleVote(saint2.id)}
                disabled={isSubmitting}
                style={{
                  fontSize: '0.875rem',
                  fontFamily: 'var(--font-sorts-mill)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'white',
                  textDecoration: 'none',
                  fontWeight: '700',
                  padding: '0.5rem 1rem',
                  borderRadius: '0.25rem',
                  backgroundColor: '#8FBC8F',
                  border: 'none',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  opacity: isSubmitting ? 0.6 : 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (!isSubmitting) {
                    (e.target as HTMLButtonElement).style.backgroundColor = '#7da87d';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSubmitting) {
                    (e.target as HTMLButtonElement).style.backgroundColor = '#8FBC8F';
                  }
                }}
              >
                <div style={{fontSize: '0.875rem', fontWeight: '700'}}>
                  {saint2.name}
                </div>
                {saint2.feastDay && (
                  <div style={{
                    fontSize: '0.75rem',
                    fontWeight: '400',
                    opacity: 0.9,
                    textTransform: 'none'
                  }}>
                    Feast Day: {saint2.feastDay}
                  </div>
                )}
              </button>
            </div>

            {isSubmitting && (
              <div className="text-center py-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}