'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DailyPost } from '@/types';
import { Edit, Eye, Trash2, Plus, Calendar } from 'lucide-react';

export default function PostsManagementPage() {
  const router = useRouter();
  const { currentUser, loading } = useRequireAuth('admin');
  const [posts, setPosts] = useState<DailyPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await fetch('/api/posts');
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            setPosts(result.data);
          }
        }
      } catch (error) {
        console.error('Error fetching posts:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (currentUser) {
      fetchPosts();
    }
  }, [currentUser]);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoundColor = (round: string) => {
    switch (round) {
      case 'round1': return 'bg-blue-100 text-blue-800';
      case 'round2': return 'bg-green-100 text-green-800';
      case 'semifinals': return 'bg-yellow-100 text-yellow-800';
      case 'finals': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const deletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setPosts(posts.filter(post => post.id !== postId));
        alert('Post deleted successfully');
      } else {
        throw new Error('Failed to delete post');
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Error deleting post');
    }
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading posts...</p>
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
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-sorts-mill text-gray-900">Posts Management</h1>
              <p className="text-gray-600">Manage your daily tournament posts</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => router.push('/admin/posts/create')}>
                <Plus className="h-4 w-4 mr-2" />
                Create Post
              </Button>
              <Button variant="outline" onClick={() => router.push('/admin')}>
                Back to Admin
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {posts.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Posts Yet</h3>
              <p className="text-gray-600 mb-4">
                Create your first daily tournament post to get started.
              </p>
              <Button onClick={() => router.push('/admin/posts/create')}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Post
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {posts.map((post) => (
              <Card key={post.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={getRoundColor(post.bracketRound)}>
                          {post.bracketRound.replace(/(\d)/, ' $1').toUpperCase()}
                        </Badge>
                        <Badge variant="outline">Day {post.dayNumber}</Badge>
                        {post.isPublished ? (
                          <Badge className="bg-green-100 text-green-800">Published</Badge>
                        ) : (
                          <Badge variant="secondary">Draft</Badge>
                        )}
                      </div>
                      <CardTitle className="text-xl mb-2">{post.title}</CardTitle>
                      <div className="text-sm text-gray-600">
                        {post.matchup && (
                          <p className="mb-1">
                            <strong>Matchup:</strong> {post.matchup.description}
                          </p>
                        )}
                        <p>
                          <strong>Publish Date:</strong> {formatDate(post.publishDate)}
                        </p>
                        <p>
                          <strong>Created:</strong> {formatDate(post.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button size="sm" variant="outline" onClick={() => router.push(`/posts/${post.id}`)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => router.push(`/admin/posts/${post.id}/edit`)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => deletePost(post.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-gray-700">
                    <p className="line-clamp-3">
                      {post.content.substring(0, 200)}
                      {post.content.length > 200 && '...'}
                    </p>
                  </div>
                  
                  {post.previousWinner && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-md">
                      <p className="text-sm font-medium text-gray-700">
                        Previous Winner: {post.previousWinner.saintId} ({post.previousWinner.percentage}%)
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}