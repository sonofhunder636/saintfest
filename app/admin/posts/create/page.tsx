'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Saint, DailyPost } from '@/types';

interface SaintOption {
  id: string;
  name: string;
}

export default function CreatePostPage() {
  const router = useRouter();
  const { currentUser, loading } = useRequireAuth('admin');
  const [saints, setSaints] = useState<SaintOption[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [dayNumber, setDayNumber] = useState(1);
  const [saint1Id, setSaint1Id] = useState('');
  const [saint2Id, setSaint2Id] = useState('');
  const [bracketRound, setBracketRound] = useState<'round1' | 'round2' | 'semifinals' | 'finals'>('round1');
  const [publishDate, setPublishDate] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  const [previousWinner, setPreviousWinner] = useState({
    saintId: '',
    votesFor: 0,
    votesAgainst: 0,
    percentage: 0
  });

  // Load saints for selection
  useEffect(() => {
    const fetchSaints = async () => {
      try {
        const response = await fetch('/api/saints');
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            setSaints(result.data.map((saint: Saint) => ({
              id: saint.id,
              name: saint.name
            })));
          }
        }
      } catch (error) {
        console.error('Error fetching saints:', error);
      }
    };

    if (currentUser) {
      fetchSaints();
    }
  }, [currentUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!title || !content || !saint1Id || !saint2Id) {
      alert('Please fill in all required fields');
      return;
    }

    if (saint1Id === saint2Id) {
      alert('Please select two different saints');
      return;
    }

    setIsSubmitting(true);

    try {
      const postData = {
        title,
        content,
        dayNumber,
        matchup: {
          saint1Id,
          saint2Id,
          description: `${saints.find(s => s.id === saint1Id)?.name} vs ${saints.find(s => s.id === saint2Id)?.name}`
        },
        bracketRound,
        publishDate: publishDate || new Date().toISOString(),
        isPublished,
        previousWinner: previousWinner.saintId ? previousWinner : undefined
      };

      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          alert('Post created successfully!');
          router.push('/admin/posts');
        } else {
          throw new Error(result.error || 'Failed to create post');
        }
      } else {
        throw new Error('Failed to create post');
      }
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Error creating post: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <div>Access denied</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-sorts-mill text-gray-900">Create Daily Post</h1>
              <p className="text-gray-600">Create a new tournament matchup post</p>
            </div>
            <Button variant="outline" onClick={() => router.push('/admin')}>
              Back to Admin
            </Button>
          </div>
        </div>
      </header>

      {/* Main Form */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Post Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Day Number (1-30)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={dayNumber}
                    onChange={(e) => setDayNumber(parseInt(e.target.value) || 1)}
                    className="w-full p-3 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bracket Round
                  </label>
                  <select
                    value={bracketRound}
                    onChange={(e) => setBracketRound(e.target.value as any)}
                    className="w-full p-3 border border-gray-300 rounded-md"
                  >
                    <option value="round1">Round 1</option>
                    <option value="round2">Round 2</option>
                    <option value="semifinals">Semifinals</option>
                    <option value="finals">Finals</option>
                  </select>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Post Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md"
                  placeholder="e.g., October 1 - Round 1: Augustine vs Aquinas"
                  required
                />
              </div>

              {/* Saint Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Saint
                  </label>
                  <select
                    value={saint1Id}
                    onChange={(e) => setSaint1Id(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-md"
                    required
                  >
                    <option value="">Select first saint...</option>
                    {saints.map(saint => (
                      <option key={saint.id} value={saint.id}>
                        {saint.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Second Saint
                  </label>
                  <select
                    value={saint2Id}
                    onChange={(e) => setSaint2Id(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-md"
                    required
                  >
                    <option value="">Select second saint...</option>
                    {saints.map(saint => (
                      <option key={saint.id} value={saint.id}>
                        {saint.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Post Content
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={12}
                  className="w-full p-3 border border-gray-300 rounded-md"
                  placeholder="Write your post content here. You can use basic formatting."
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  Basic formatting: Use **bold**, *italic*, and line breaks for structure.
                </p>
              </div>

              {/* Publishing Options */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Publish Date
                  </label>
                  <input
                    type="datetime-local"
                    value={publishDate}
                    onChange={(e) => setPublishDate(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-md"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isPublished"
                    checked={isPublished}
                    onChange={(e) => setIsPublished(e.target.checked)}
                    className="mr-2"
                  />
                  <label htmlFor="isPublished" className="text-sm font-medium text-gray-700">
                    Publish immediately
                  </label>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-4 justify-end pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/admin')}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isSubmitting ? 'Creating...' : 'Create Post'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}