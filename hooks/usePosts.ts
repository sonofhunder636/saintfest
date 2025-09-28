'use client';

import { useState, useEffect, useCallback } from 'react';
import { uploadPostImage, ImageUploadResult } from '@/lib/storage';
import { BlogPost } from '@/types';
import { assertFirestore } from '@/lib/firebase';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  serverTimestamp,
  writeBatch,
  Timestamp
} from 'firebase/firestore';

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

// Helper function to generate a unique slug
async function generateUniqueSlug(baseSlug: string, excludeId?: string): Promise<string> {
  try {
    const db = assertFirestore();
    const postsRef = collection(db, 'posts');

    let uniqueSlug = baseSlug;
    let counter = 1;

    while (true) {
      try {
        const existingPostQuery = query(postsRef, where('slug', '==', uniqueSlug));
        const existingPostSnapshot = await getDocs(existingPostQuery);

        // Check if slug exists and is not the current post being updated
        const conflictingPost = existingPostSnapshot.docs.find(doc =>
          excludeId ? doc.id !== excludeId : true
        );

        if (!conflictingPost) {
          return uniqueSlug;
        }

        // Generate next candidate slug
        uniqueSlug = `${baseSlug}-${counter}`;
        counter++;

        // Prevent infinite loops
        if (counter > 100) {
          throw new Error('Unable to generate unique slug after 100 attempts');
        }
      } catch (firestoreError) {
        console.error('Firestore error while checking slug uniqueness:', firestoreError);

        // If it's a network or permission error, fall back to timestamp-based slug
        if (counter === 1) {
          const timestamp = Date.now();
          return `${baseSlug}-${timestamp}`;
        }
        throw firestoreError;
      }
    }
  } catch (error) {
    console.error('Error in generateUniqueSlug:', error);
    // Fallback to timestamp-based slug if all else fails
    const timestamp = Date.now();
    return `${baseSlug}-${timestamp}`;
  }
}

// Helper function to sanitize and format slug
function formatSlug(title: string, customSlug?: string): string {
  if (customSlug && customSlug.trim()) {
    return customSlug.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  }
  return title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
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

      const db = assertFirestore();
      const postsRef = collection(db, 'posts');

      let q = query(postsRef, orderBy('createdAt', 'desc'));

      if (status) {
        q = query(postsRef, where('status', '==', status), orderBy('createdAt', 'desc'));
      }

      if (limit > 0) {
        q = query(q, firestoreLimit(limit));
      }

      const querySnapshot = await getDocs(q);
      const fetchedPosts = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          // Convert Firestore Timestamps to Dates
          createdAt: data.createdAt?.toDate?.() || new Date(),
          updatedAt: data.updatedAt?.toDate?.() || new Date(),
          publishedAt: data.publishedAt?.toDate?.() || undefined,
          scheduledAt: data.scheduledAt?.toDate?.() || undefined,
          scheduledFor: data.scheduledFor?.toDate?.() || undefined,
        } as BlogPost;
      });

      setPosts(fetchedPosts);
    } catch (err) {
      console.error('Error fetching posts from Firestore:', err);
      setError('Failed to fetch posts');
    } finally {
      setLoading(false);
    }
  }, []);

  const createPost = useCallback(async (content: string, metadata: PostMetadata): Promise<BlogPost | null> => {
    try {
      const db = assertFirestore();
      const postsRef = collection(db, 'posts');

      // Generate and ensure unique slug
      const baseSlug = formatSlug(metadata.title, metadata.slug);
      const uniqueSlug = await generateUniqueSlug(baseSlug);

      const postData = {
        title: metadata.title,
        slug: uniqueSlug,
        content,
        status: metadata.status,
        tags: metadata.tags || [],
        categories: metadata.categories || [],
        excerpt: metadata.excerpt || null,
        featuredImage: metadata.featuredImage || null,
        scheduledFor: metadata.scheduledFor ? Timestamp.fromDate(metadata.scheduledFor) : null,
        scheduledAt: metadata.scheduledAt ? Timestamp.fromDate(metadata.scheduledAt) : null,
        featured: metadata.featured || false,
        priority: metadata.priority || 'medium',
        seoTitle: metadata.seoTitle || null,
        seoDescription: metadata.seoDescription || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        publishedAt: metadata.status === 'published' ? serverTimestamp() : null,
        views: 0,
        likes: 0,
        comments: 0
      };

      console.log('Creating post with data:', postData);

      const docRef = await addDoc(postsRef, postData);

      // Fetch the created post to return with proper timestamps
      const createdPostDoc = await getDoc(docRef);
      if (!createdPostDoc.exists()) {
        throw new Error('Failed to retrieve created post');
      }

      const createdPostData = createdPostDoc.data();
      const newPost: BlogPost = {
        ...createdPostData,
        id: docRef.id,
        createdAt: createdPostData.createdAt?.toDate?.() || new Date(),
        updatedAt: createdPostData.updatedAt?.toDate?.() || new Date(),
        publishedAt: createdPostData.publishedAt?.toDate?.() || undefined,
        scheduledAt: createdPostData.scheduledAt?.toDate?.() || undefined,
        scheduledFor: createdPostData.scheduledFor?.toDate?.() || undefined,
      } as BlogPost;

      setPosts(prev => [newPost, ...prev]);
      return newPost;
    } catch (err) {
      console.error('Error creating post in Firestore:', err);

      let errorMessage = 'Failed to create post';

      if (err instanceof Error) {
        // Handle specific Firestore errors
        if (err.message.includes('permission-denied')) {
          errorMessage = 'Permission denied. Please check your authentication status.';
        } else if (err.message.includes('network-request-failed') || err.message.includes('Failed to fetch')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else if (err.message.includes('invalid-argument')) {
          errorMessage = 'Invalid data format. Please check your post content.';
        } else if (err.message.includes('quota-exceeded')) {
          errorMessage = 'Database quota exceeded. Please try again later.';
        } else {
          errorMessage = err.message;
        }
      }

      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const updatePost = useCallback(async (id: string, content: string, metadata: PostMetadata): Promise<BlogPost | null> => {
    try {
      const db = assertFirestore();
      const postRef = doc(db, 'posts', id);

      // Generate and ensure unique slug (excluding current post)
      const baseSlug = formatSlug(metadata.title, metadata.slug);
      const uniqueSlug = await generateUniqueSlug(baseSlug, id);

      const updateData = {
        title: metadata.title,
        slug: uniqueSlug,
        content,
        status: metadata.status,
        tags: metadata.tags || [],
        categories: metadata.categories || [],
        excerpt: metadata.excerpt || null,
        featuredImage: metadata.featuredImage || null,
        scheduledFor: metadata.scheduledFor ? Timestamp.fromDate(metadata.scheduledFor) : null,
        scheduledAt: metadata.scheduledAt ? Timestamp.fromDate(metadata.scheduledAt) : null,
        featured: metadata.featured || false,
        priority: metadata.priority || 'medium',
        seoTitle: metadata.seoTitle || null,
        seoDescription: metadata.seoDescription || null,
        updatedAt: serverTimestamp(),
        publishedAt: metadata.status === 'published' ? (metadata.publishedAt ? Timestamp.fromDate(metadata.publishedAt) : serverTimestamp()) : null,
      };

      await updateDoc(postRef, updateData);

      // Fetch the updated post
      const updatedPostDoc = await getDoc(postRef);
      if (!updatedPostDoc.exists()) {
        throw new Error('Failed to retrieve updated post');
      }

      const updatedPostData = updatedPostDoc.data();
      const updatedPost: BlogPost = {
        ...updatedPostData,
        id: updatedPostDoc.id,
        createdAt: updatedPostData.createdAt?.toDate?.() || new Date(),
        updatedAt: updatedPostData.updatedAt?.toDate?.() || new Date(),
        publishedAt: updatedPostData.publishedAt?.toDate?.() || undefined,
        scheduledAt: updatedPostData.scheduledAt?.toDate?.() || undefined,
        scheduledFor: updatedPostData.scheduledFor?.toDate?.() || undefined,
      } as BlogPost;

      setPosts(prev => prev.map(post => post.id === id ? updatedPost : post));
      return updatedPost;
    } catch (err) {
      console.error('Error updating post in Firestore:', err);

      let errorMessage = 'Failed to update post';

      if (err instanceof Error) {
        // Handle specific Firestore errors
        if (err.message.includes('permission-denied')) {
          errorMessage = 'Permission denied. Please check your authentication status.';
        } else if (err.message.includes('network-request-failed') || err.message.includes('Failed to fetch')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else if (err.message.includes('invalid-argument')) {
          errorMessage = 'Invalid data format. Please check your post content.';
        } else if (err.message.includes('quota-exceeded')) {
          errorMessage = 'Database quota exceeded. Please try again later.';
        } else if (err.message.includes('not-found')) {
          errorMessage = 'Post not found. It may have been deleted.';
        } else {
          errorMessage = err.message;
        }
      }

      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const deletePost = useCallback(async (id: string): Promise<boolean> => {
    try {
      const db = assertFirestore();
      const postRef = doc(db, 'posts', id);

      await deleteDoc(postRef);
      setPosts(prev => prev.filter(post => post.id !== id));
      return true;
    } catch (err) {
      console.error('Error deleting post from Firestore:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete post');
      return false;
    }
  }, []);

  const getPost = useCallback(async (id: string): Promise<BlogPost | null> => {
    try {
      const db = assertFirestore();
      const postRef = doc(db, 'posts', id);
      const postDoc = await getDoc(postRef);

      if (!postDoc.exists()) {
        throw new Error('Post not found');
      }

      const postData = postDoc.data();
      return {
        ...postData,
        id: postDoc.id,
        createdAt: postData.createdAt?.toDate?.() || new Date(),
        updatedAt: postData.updatedAt?.toDate?.() || new Date(),
        publishedAt: postData.publishedAt?.toDate?.() || undefined,
        scheduledAt: postData.scheduledAt?.toDate?.() || undefined,
        scheduledFor: postData.scheduledFor?.toDate?.() || undefined,
      } as BlogPost;
    } catch (err) {
      console.error('Error fetching post from Firestore:', err);
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

      const db = assertFirestore();
      const postsRef = collection(db, 'posts');

      // Fetch all posts for statistics calculation
      const allPostsSnapshot = await getDocs(postsRef);
      const allPosts = allPostsSnapshot.docs.map(doc => doc.data());

      // Calculate statistics
      const totalPosts = allPosts.length;
      const publishedPosts = allPosts.filter(p => p.status === 'published').length;
      const draftPosts = allPosts.filter(p => p.status === 'draft').length;
      const scheduledPosts = allPosts.filter(p => p.status === 'scheduled').length;
      const archivedPosts = allPosts.filter(p => p.status === 'archived').length;
      const featuredPosts = allPosts.filter(p => p.featured).length;

      const totalViews = allPosts.reduce((sum, p) => sum + (p.views || 0), 0);
      const totalLikes = allPosts.reduce((sum, p) => sum + (p.likes || 0), 0);
      const totalComments = allPosts.reduce((sum, p) => sum + (p.comments || 0), 0);

      // Calculate tag and category counts
      const tagCounts: { [key: string]: number } = {};
      const categoryCounts: { [key: string]: number } = {};

      allPosts.forEach(post => {
        (post.tags || []).forEach((tag: string) => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
        (post.categories || []).forEach((category: string) => {
          categoryCounts[category] = (categoryCounts[category] || 0) + 1;
        });
      });

      const topTags = Object.entries(tagCounts)
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      const topCategories = Object.entries(categoryCounts)
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      const stats: BlogStats = {
        totalPosts,
        publishedPosts,
        draftPosts,
        scheduledPosts,
        archivedPosts,
        featuredPosts,
        totalViews,
        totalLikes,
        totalComments,
        avgWordsPerPost: 0, // Would need to calculate from content
        avgReadTime: 0, // Would need to calculate from content
        topTags,
        topCategories,
        recentActivity: [], // Would need more complex query
        priorityDistribution: {
          low: allPosts.filter(p => p.priority === 'low').length,
          medium: allPosts.filter(p => p.priority === 'medium').length,
          high: allPosts.filter(p => p.priority === 'high').length
        },
        statusDistribution: {
          draft: draftPosts,
          published: publishedPosts,
          scheduled: scheduledPosts,
          archived: archivedPosts
        },
        monthlyTrends: [] // Would need aggregation query
      };

      setStats(stats);
      return stats;
    } catch (err) {
      console.error('Error fetching stats from Firestore:', err);
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
      const db = assertFirestore();
      const batch = writeBatch(db);

      for (const postId of postIds) {
        const postRef = doc(db, 'posts', postId);

        if (action === 'delete') {
          batch.delete(postRef);
        } else {
          const updateData: any = { updatedAt: serverTimestamp() };

          switch (action) {
            case 'updateStatus':
              updateData.status = data?.status;
              if (data?.status === 'published') {
                updateData.publishedAt = serverTimestamp();
              }
              break;
            case 'updatePriority':
              updateData.priority = data?.priority;
              break;
            case 'toggleFeatured':
              // We'll need to fetch current value to toggle
              const postDoc = await getDoc(postRef);
              if (postDoc.exists()) {
                updateData.featured = !postDoc.data().featured;
              }
              break;
            case 'updateCategories':
              updateData.categories = data?.categories || [];
              break;
          }

          batch.update(postRef, updateData);
        }
      }

      await batch.commit();

      // Refresh posts after bulk operation
      await fetchPosts();
      return true;
    } catch (err) {
      console.error('Error performing bulk operation in Firestore:', err);
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
      const db = assertFirestore();
      const postsRef = collection(db, 'posts');

      let q = query(postsRef, orderBy('createdAt', 'desc'));

      // Apply filters
      if (filters.status) {
        q = query(q, where('status', '==', filters.status));
      }

      if (filters.featured !== undefined) {
        q = query(q, where('featured', '==', filters.featured));
      }

      if (filters.priority) {
        q = query(q, where('priority', '==', filters.priority));
      }

      // For array fields like tags and categories, we'll need to use array-contains
      // Note: Firestore has limitations with multiple array-contains queries
      if (filters.tags && filters.tags.length > 0) {
        q = query(q, where('tags', 'array-contains-any', filters.tags));
      }

      if (filters.categories && filters.categories.length > 0) {
        q = query(q, where('categories', 'array-contains-any', filters.categories));
      }

      const querySnapshot = await getDocs(q);
      let searchResults = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          createdAt: data.createdAt?.toDate?.() || new Date(),
          updatedAt: data.updatedAt?.toDate?.() || new Date(),
          publishedAt: data.publishedAt?.toDate?.() || undefined,
          scheduledAt: data.scheduledAt?.toDate?.() || undefined,
          scheduledFor: data.scheduledFor?.toDate?.() || undefined,
        } as BlogPost;
      });

      // Client-side filtering for text search and date ranges
      if (filters.query) {
        const searchTerm = filters.query.toLowerCase();
        searchResults = searchResults.filter(post =>
          post.title.toLowerCase().includes(searchTerm) ||
          post.content.toLowerCase().includes(searchTerm) ||
          (post.excerpt && post.excerpt.toLowerCase().includes(searchTerm))
        );
      }

      if (filters.dateFrom) {
        searchResults = searchResults.filter(post =>
          post.createdAt >= filters.dateFrom!
        );
      }

      if (filters.dateTo) {
        searchResults = searchResults.filter(post =>
          post.createdAt <= filters.dateTo!
        );
      }

      return searchResults;
    } catch (err) {
      console.error('Error searching posts in Firestore:', err);
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