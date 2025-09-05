'use client';

import { useState, useEffect, useCallback } from 'react';
import { uploadPostImage, ImageUploadResult } from '@/lib/storage';
import { BlogPost } from '@/app/api/admin/posts/route';

interface PostMetadata {
  title: string;
  slug: string;
  status: 'draft' | 'published' | 'scheduled';
  publishedAt?: Date;
  scheduledFor?: Date;
  excerpt?: string;
  tags: string[];
  featuredImage?: string;
}

export function usePosts() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      const response = await fetch('/api/admin/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: metadata.title,
          slug: metadata.slug,
          content,
          status: metadata.status,
          tags: metadata.tags,
          excerpt: metadata.excerpt,
          featuredImage: metadata.featuredImage,
          scheduledFor: metadata.scheduledFor,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setPosts(prev => [result.post, ...prev]);
        return result.post;
      } else {
        throw new Error(result.error);
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
          excerpt: metadata.excerpt,
          featuredImage: metadata.featuredImage,
          scheduledFor: metadata.scheduledFor,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setPosts(prev => prev.map(post => post.id === id ? result.post : post));
        return result.post;
      } else {
        throw new Error(result.error);
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
    fetchPosts,
    createPost,
    updatePost,
    deletePost,
    getPost,
    uploadImage,
    savePost,
    clearError: () => setError(null),
  };
}