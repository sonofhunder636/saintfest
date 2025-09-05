'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { usePosts } from '@/hooks/usePosts';
import { ChakraProvider, Grid, GridItem, Box, Flex, useToast } from '@chakra-ui/react';
import { saintfestTheme } from '@/lib/chakra-theme';
import dynamic from 'next/dynamic';

const MarkdownEditor = dynamic(() => import('@/components/admin/MarkdownEditor'), { ssr: false });
const PostsList = dynamic(() => import('@/components/admin/PostsList'), { ssr: false });
const PostControlsSidebar = dynamic(() => import('@/components/admin/PostControlsSidebar'), { ssr: false });

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

function PostsManagementPageContent() {
  const router = useRouter();
  const { currentUser, loading } = useRequireAuth('admin');
  const { savePost, uploadImage, getPost } = usePosts();
  const toast = useToast();
  
  const [currentView, setCurrentView] = useState<'list' | 'editor'>('list');
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [content, setContent] = useState<string>('');
  const [metadata, setMetadata] = useState<PostMetadata>({
    title: '',
    slug: '',
    status: 'published',
    tags: [],
  });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Auto-save functionality with debouncing
  useEffect(() => {
    const timer = setTimeout(() => {
      if ((content.trim() || metadata.title) && currentView === 'editor') {
        handleAutoSave();
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [content, metadata]);

  const handleAutoSave = useCallback(async () => {
    if (!content.trim() && !metadata.title) return;
    
    try {
      setIsSaving(true);
      await savePost(content, metadata, editingPostId || undefined);
      setLastSaved(new Date());
    } catch (error) {
      console.error('Auto-save failed:', error);
    } finally {
      setIsSaving(false);
    }
  }, [content, metadata, savePost, editingPostId]);

  // Load post data when editing
  useEffect(() => {
    const loadPostForEditing = async () => {
      if (editingPostId && currentView === 'editor') {
        try {
          const post = await getPost(editingPostId);
          if (post) {
            setContent(post.content || '');
            setMetadata({
              title: post.title || '',
              slug: post.slug || '',
              status: post.status || 'draft',
              publishedAt: post.publishedAt,
              scheduledFor: post.scheduledFor,
              excerpt: post.excerpt,
              tags: post.tags || [],
              featuredImage: post.featuredImage,
            });
          }
        } catch (error) {
          console.error('Failed to load post:', error);
        }
      } else if (currentView === 'editor' && !editingPostId) {
        // Reset for new post
        setContent('');
        setMetadata({
          title: '',
          slug: '',
          status: 'published',
          tags: [],
        });
      }
    };

    loadPostForEditing();
  }, [editingPostId, currentView, getPost]);

  const handleCreateNew = () => {
    setEditingPostId(null);
    setCurrentView('editor');
  };

  const handleEditPost = (postId: string) => {
    setEditingPostId(postId);
    setCurrentView('editor');
  };

  const handleBackToList = () => {
    setCurrentView('list');
    setEditingPostId(null);
    setContent('');
    setMetadata({
      title: '',
      slug: '',
      status: 'published',
      tags: [],
    });
  };

  const handleSavePost = async () => {
    try {
      setIsSaving(true);
      const result = await savePost(content, metadata, editingPostId || undefined);
      if (result) {
        setLastSaved(new Date());
        
        // Show success notification
        toast({
          title: 'Post saved successfully!',
          description: `"${metadata.title}" has been saved as a ${metadata.status}.`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        
        // Redirect back to list view after successful save
        setTimeout(() => {
          setCurrentView('list');
        }, 1500); // Brief delay to show the success message
      }
    } catch (error) {
      console.error('Failed to save post:', error);
      
      // Show error notification
      toast({
        title: 'Save failed',
        description: 'There was an error saving your post. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = async (file: File) => {
    try {
      const imageUrl = await uploadImage(file, editingPostId || undefined);
      return imageUrl;
    } catch (error) {
      console.error('Failed to upload image:', error);
      throw error;
    }
  };

  const calculateStats = () => {
    const wordCount = content.split(/\s+/).filter(Boolean).length;
    const readingTime = Math.max(1, Math.ceil(wordCount / 200));
    return { wordCount, readingTime };
  };

  if (loading) {
    return (
      <ChakraProvider theme={saintfestTheme}>
        <div className="min-h-screen flex items-center justify-center" style={{backgroundColor: '#fffbeb'}}>
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4" style={{borderBottomColor: '#8FBC8F'}}></div>
            <p style={{fontFamily: 'var(--font-cormorant)', fontSize: '1.125rem', color: '#6b7280'}}>Loading posts management...</p>
          </div>
        </div>
      </ChakraProvider>
    );
  }

  if (!currentUser) {
    return (
      <ChakraProvider theme={saintfestTheme}>
        <div className="min-h-screen flex items-center justify-center" style={{backgroundColor: '#fffbeb'}}>
          <div className="text-center">
            <p style={{fontFamily: 'var(--font-cormorant)', fontSize: '1.125rem', color: '#ef4444'}}>Access denied. Admin privileges required.</p>
            <button 
              onClick={() => router.push('/admin/login')}
              style={{
                marginTop: '1rem',
                padding: '0.5rem 1rem',
                backgroundColor: '#8FBC8F',
                color: 'white',
                border: 'none',
                borderRadius: '0.25rem',
                cursor: 'pointer'
              }}
            >
              Go to Login
            </button>
          </div>
        </div>
      </ChakraProvider>
    );
  }

  return (
    <div className="min-h-screen" style={{backgroundColor: '#fffbeb'}}>
      {/* Header */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        width: '100%',
        backgroundColor: '#8FBC8F',
        padding: '1rem 0',
        marginBottom: '2rem',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
      }}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 style={{
                fontSize: '2.5rem',
                fontFamily: 'var(--font-sorts-mill)',
                color: 'white',
                fontWeight: '600',
                textShadow: '0 1px 2px rgba(0,0,0,0.1)'
              }}>
                Posts Management
              </h1>
              {currentView === 'editor' && (
                <button
                  onClick={handleBackToList}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    border: '1px solid rgba(255,255,255,0.3)',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    fontFamily: 'var(--font-league-spartan)',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                >
                  ← Back to Posts List
                </button>
              )}
            </div>
            <nav style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
              <a href="/admin" style={{
                fontSize: '0.875rem',
                fontFamily: 'var(--font-league-spartan)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'white',
                textDecoration: 'none',
                fontWeight: '500',
                padding: '0.5rem 1rem',
                borderRadius: '0.25rem',
                backgroundColor: 'rgba(255,255,255,0.1)'
              }}>
                Admin Dashboard
              </a>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <Box maxW="7xl" mx="auto" px={4} pb={8}>
        {currentView === 'list' && (
          <PostsList 
            onCreateNew={handleCreateNew}
            onEditPost={handleEditPost}
          />
        )}

        {currentView === 'editor' && (
          <Grid
            templateColumns={{ base: '1fr', lg: '350px 1fr' }}
            gap={6}
            h="full"
            alignItems="start"
          >
            {/* Left Sidebar - Post Controls */}
            <GridItem>
              <Box position="sticky" top="120px">
                <PostControlsSidebar
                  metadata={metadata}
                  onMetadataChange={setMetadata}
                  onSave={handleSavePost}
                  isEditMode={!!editingPostId}
                  isSaving={isSaving}
                  lastSaved={lastSaved || undefined}
                  wordCount={calculateStats().wordCount}
                  readingTime={calculateStats().readingTime}
                />
              </Box>
            </GridItem>

            {/* Right Side - Markdown Editor */}
            <GridItem>
              <Box h="full">
                <MarkdownEditor
                  key={editingPostId || 'new'}
                  content={content}
                  onContentChange={setContent}
                  onImageUpload={handleImageUpload}
                  isFullscreen={isFullscreen}
                  onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
                />
              </Box>
            </GridItem>
          </Grid>
        )}
      </Box>
    </div>
  );
}

// Main wrapper component that provides Chakra UI context
export default function PostsManagementPage() {
  return (
    <ChakraProvider theme={saintfestTheme}>
      <PostsManagementPageContent />
    </ChakraProvider>
  );
}