'use client';

import { useState, useEffect, useCallback } from 'react';
import { uploadPostImage, ImageUploadResult } from '@/lib/storage';
import { BlogPost } from '@/types';

interface PostMetadata {
  title: string;
  slug: string;
  status: 'draft' | 'published' | 'scheduled' | 'archived';
  publishedAt?: Date;
  scheduledFor?: Date;
  scheduledAt?: Date;
  excerpt?: string;
  tags: string[];
  categories?: string[];
  featuredImage?: string;
  featured?: boolean;
  priority?: 'low' | 'medium' | 'high';
  seoTitle?: string;
  seoDescription?: string;
}

interface BlogStats {
  totalPosts: number;
  publishedPosts: number;
  draftPosts: number;
  scheduledPosts: number;
  archivedPosts: number;
  featuredPosts: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  avgWordsPerPost: number;
  avgReadTime: number;
  topTags: { tag: string; count: number }[];
  topCategories: { category: string; count: number }[];
  recentActivity: any[];
  priorityDistribution: { low: number; medium: number; high: number };
  statusDistribution: { draft: number; published: number; scheduled: number; archived: number };
  monthlyTrends: { month: string; posts: number }[];
}

interface BulkOperationData {
  status?: string;
  priority?: string;
  categories?: string[];
}

export function usePosts() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<BlogStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const fetchPosts = useCallback(async (status?: string, limit = 10) => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (status) params.append('status', status);
      params.append('limit', limit.toString());
      
      const response = await fetch(`/api/admin/posts?${params.toString()}`);
      const result = await response.json();
      
      if (result.success) {
        setPosts(result.posts);
      } else {
        setError(result.error || 'Failed to fetch posts');
      }
    } catch (err) {
      setError('Failed to fetch posts');
    } finally {
      setLoading(false);
    }
  }, []);

  const createPost = useCallback(async (content: string, metadata: PostMetadata): Promise<BlogPost | null> => {
    try {
      const requestData = {
        title: metadata.title,
        slug: metadata.slug,
        content,
        status: metadata.status,
        tags: metadata.tags,
        categories: metadata.categories || [],
        excerpt: metadata.excerpt,
        featuredImage: metadata.featuredImage,
        scheduledFor: metadata.scheduledFor,
        scheduledAt: metadata.scheduledAt,
        featured: metadata.featured || false,
        priority: metadata.priority || 'medium',
        seoTitle: metadata.seoTitle,
        seoDescription: metadata.seoDescription,
      };
      
      console.log('Creating post with data:', requestData);
      
      const response = await fetch('/api/admin/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });

      const result = await response.json();
      
      console.log('Create post API response:', { 
        status: response.status, 
        success: result.success, 
        error: result.error,
        post: result.post ? 'Post returned' : 'No post returned' 
      });
      
      if (result.success && result.post) {
        setPosts(prev => [result.post, ...prev]);
        return result.post;
      } else {
        // Enhanced error message extraction with specific guidance
        let errorMessage = 'Failed to save post';
        
        if (result.error) {
          errorMessage = result.error;
        } else if (response.status === 400) {
          errorMessage = 'Validation failed - please check your title, content, and URL slug';
        } else if (response.status === 409) {
          errorMessage = 'A post with this URL slug already exists - please choose a different slug';
        } else if (response.status >= 500) {
          errorMessage = 'Server error - please try again in a moment';
        } else if (!response.ok) {
          errorMessage = `Request failed with status ${response.status}`;
        }
        
        console.error('Create post error details:', {
          status: response.status,
          statusText: response.statusText,
          serverError: result.error,
          finalMessage: errorMessage
        });
        
        throw new Error(errorMessage);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create post');
      return null;
    }
  }, []);

  const updatePost = useCallback(async (id: string, content: string, metadata: PostMetadata): Promise<BlogPost | null> => {
    try {
      const response = await fetch(`/api/admin/posts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: metadata.title,
          slug: metadata.slug,
          content,
          status: metadata.status,
          tags: metadata.tags,
          categories: metadata.categories || [],
          excerpt: metadata.excerpt,
          featuredImage: metadata.featuredImage,
          scheduledFor: metadata.scheduledFor,
          scheduledAt: metadata.scheduledAt,
          featured: metadata.featured || false,
          priority: metadata.priority || 'medium',
          seoTitle: metadata.seoTitle,
          seoDescription: metadata.seoDescription,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setPosts(prev => prev.map(post => post.id === id ? result.post : post));
        return result.post;
      } else {
        // Enhanced error message extraction with specific guidance
        let errorMessage = 'Failed to update post';
        
        if (result.error) {
          errorMessage = result.error;
        } else if (response.status === 400) {
          errorMessage = 'Validation failed - please check your title, content, and URL slug';
        } else if (response.status === 409) {
          errorMessage = 'A post with this URL slug already exists - please choose a different slug';
        } else if (response.status >= 500) {
          errorMessage = 'Server error - please try again in a moment';
        } else if (!response.ok) {
          errorMessage = `Request failed with status ${response.status}`;
        }
        
        console.error('Update post error details:', {
          postId: id,
          status: response.status,
          statusText: response.statusText,
          serverError: result.error,
          finalMessage: errorMessage
        });
        
        throw new Error(errorMessage);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update post');
      return null;
    }
  }, []);

  const deletePost = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/admin/posts/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      if (result.success) {
        setPosts(prev => prev.filter(post => post.id !== id));
        return true;
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete post');
      return false;
    }
  }, []);

  const getPost = useCallback(async (id: string): Promise<BlogPost | null> => {
    try {
      const response = await fetch(`/api/admin/posts/${id}`);
      const result = await response.json();
      
      if (result.success) {
        return result.post;
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch post');
      return null;
    }
  }, []);

  const uploadImage = useCallback(async (file: File, postId?: string): Promise<string> => {
    try {
      const result: ImageUploadResult = await uploadPostImage(file, postId);
      return result.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload image');
      throw err;
    }
  }, []);

  // Fetch statistics
  const fetchStats = useCallback(async (): Promise<BlogStats | null> => {
    try {
      setStatsLoading(true);
      const response = await fetch('/api/admin/posts/stats');
      const result = await response.json();
      
      if (result.success) {
        setStats(result.stats);
        return result.stats;
      } else {
        setError(result.error || 'Failed to fetch statistics');
        return null;
      }
    } catch (err) {
      setError('Failed to fetch statistics');
      return null;
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // Bulk operations
  const bulkOperation = useCallback(async (
    action: 'updateStatus' | 'delete' | 'updatePriority' | 'toggleFeatured' | 'updateCategories',
    postIds: string[],
    data?: BulkOperationData
  ): Promise<boolean> => {
    try {
      const response = await fetch('/api/admin/posts/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, postIds, data }),
      });

      const result = await response.json();
      if (result.success) {
        // Refresh posts after bulk operation
        await fetchPosts();
        return true;
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to perform bulk operation');
      return false;
    }
  }, [fetchPosts]);

  // Duplicate post
  const duplicatePost = useCallback(async (postId: string): Promise<BlogPost | null> => {
    try {
      const originalPost = await getPost(postId);
      if (!originalPost) {
        throw new Error('Post not found');
      }

      const duplicatedPost = {
        ...originalPost,
        title: `${originalPost.title} (Copy)`,
        slug: `${originalPost.slug}-copy`,
        status: 'draft' as const,
        publishedAt: undefined,
        scheduledAt: undefined,
        scheduledFor: undefined,
        views: 0,
        likes: 0,
        comments: 0,
        tags: originalPost.tags || [],
        categories: originalPost.categories || [],
      };

      return createPost(duplicatedPost.content, duplicatedPost);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to duplicate post');
      return null;
    }
  }, [getPost, createPost]);

  // Advanced search with multiple filters
  const searchPosts = useCallback(async (filters: {
    query?: string;
    status?: string;
    author?: string;
    tags?: string[];
    categories?: string[];
    dateFrom?: Date;
    dateTo?: Date;
    featured?: boolean;
    priority?: string;
  }): Promise<BlogPost[]> => {
    try {
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (Array.isArray(value)) {
            value.forEach(item => params.append(`${key}[]`, item));
          } else if (value instanceof Date) {
            params.append(key, value.toISOString());
          } else {
            params.append(key, value.toString());
          }
        }
      });

      const response = await fetch(`/api/admin/posts/search?${params.toString()}`);
      const result = await response.json();
      
      if (result.success) {
        return result.posts;
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search posts');
      return [];
    }
  }, []);

  const savePost = useCallback(async (
    content: string, 
    metadata: PostMetadata, 
    postId?: string
  ): Promise<BlogPost | null> => {
    if (postId) {
      return updatePost(postId, content, metadata);
    } else if (content.trim() || metadata.title) {
      return createPost(content, metadata);
    }
    return null;
  }, [createPost, updatePost]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  return {
    posts,
    loading,
    error,
    stats,
    statsLoading,
    fetchPosts,
    createPost,
    updatePost,
    deletePost,
    getPost,
    uploadImage,
    savePost,
    fetchStats,
    bulkOperation,
    duplicatePost,
    searchPosts,
    clearError: () => setError(null),
  };
}