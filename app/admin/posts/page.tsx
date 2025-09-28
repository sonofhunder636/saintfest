'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { usePosts } from '@/hooks/usePosts';
import { 
  ChakraProvider, 
  Grid, 
  GridItem, 
  Box, 
  Flex, 
  useToast,
  Button,
  HStack,
  VStack,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  useColorModeValue,
  Container
} from '@chakra-ui/react';
import { saintfestTheme } from '@/lib/chakra-theme';
import { BarChart3, Plus, Settings } from 'lucide-react';
import dynamic from 'next/dynamic';

// Dynamic imports for better performance
const BlogDashboard = dynamic(() => import('@/components/admin/BlogDashboard'), { ssr: false });
const AdvancedPostsTable = dynamic(() => import('@/components/admin/AdvancedPostsTable'), { ssr: false });
const MarkdownEditor = dynamic(() => import('@/components/admin/MarkdownEditor'), { ssr: false });
const PostControlsSidebar = dynamic(() => import('@/components/admin/PostControlsSidebar'), { ssr: false });

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
  votingPost?: boolean;
  selectedMatchId?: string;
  priority?: 'low' | 'medium' | 'high';
  seoTitle?: string;
  seoDescription?: string;
}

type ViewType = 'dashboard' | 'list' | 'editor';

function PostsManagementPageContent() {
  const router = useRouter();
  const { currentUser, loading } = useRequireAuth();
  const { savePost, uploadImage, getPost } = usePosts();
  const toast = useToast();
  
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [content, setContent] = useState<string>('');
  const [metadata, setMetadata] = useState<PostMetadata>({
    title: '',
    slug: '',
    status: 'draft',
    tags: [],
    categories: [],
    priority: 'medium',
    featured: false,
    votingPost: false,
    selectedMatchId: undefined,
  });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isManualSaving, setIsManualSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<{
    show: boolean;
    message: string;
    postId?: string;
    status?: string;
    timestamp?: Date;
  }>({ show: false, message: '' });
  
  // UI Colors
  const bgColor = useColorModeValue('#fffbeb', 'gray.900');
  const headerBg = useColorModeValue('#8FBC8F', 'gray.800');

  // Auto-save functionality with debouncing
  useEffect(() => {
    const timer = setTimeout(() => {
      // Only auto-save if we have both title AND content (API requirements)
      if (metadata.title.trim() && content.trim() && currentView === 'editor' && !isManualSaving) {
        handleAutoSave();
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [content, metadata, isManualSaving]);

  const handleAutoSave = useCallback(async () => {
    // Double-check we have both required fields before attempting save
    if (!content.trim() || !metadata.title.trim()) return;

    try {
      setIsSaving(true);
      const result = await savePost(content, metadata, editingPostId || undefined);
      if (result) {
        // If this was a new post creation, set the editing ID for future saves
        if (!editingPostId && result.id) {
          setEditingPostId(result.id);
        }
        setLastSaved(new Date());
        // Don't navigate during auto-save, only update last saved time
      }
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
              scheduledAt: post.scheduledAt,
              excerpt: post.excerpt,
              tags: post.tags || [],
              categories: post.categories || [],
              featuredImage: post.featuredImage,
              featured: post.featured || false,
              votingPost: post.votingPost || false,
              selectedMatchId: post.selectedMatchId || undefined,
              priority: post.priority || 'medium',
              seoTitle: post.seoTitle,
              seoDescription: post.seoDescription,
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
          status: 'draft',
          tags: [],
          categories: [],
          priority: 'medium',
          featured: false,
          votingPost: false,
        });
      }
    };

    loadPostForEditing();
  }, [editingPostId, currentView, getPost]);

  // Auto-hide success message after 5 seconds
  useEffect(() => {
    if (saveSuccess.show) {
      const timer = setTimeout(() => {
        setSaveSuccess({ show: false, message: '' });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [saveSuccess.show]);

  const handleCreateNew = () => {
    setEditingPostId(null);
    setContent('');
    setMetadata({
      title: '',
      slug: '',
      status: 'draft',
      tags: [],
      categories: [],
      priority: 'medium',
      featured: false,
      votingPost: false,
    });
    setSaveSuccess({ show: false, message: '' });
    setCurrentView('editor');
  };

  const handleEditPost = (postId: string) => {
    setEditingPostId(postId);
    setSaveSuccess({ show: false, message: '' });
    setCurrentView('editor');
  };

  const handleBackToList = () => {
    setCurrentView('list');
    setEditingPostId(null);
    setContent('');
    setMetadata({
      title: '',
      slug: '',
      status: 'draft',
      tags: [],
      categories: [],
      priority: 'medium',
      featured: false,
      votingPost: false,
    });
    setSaveSuccess({ show: false, message: '' });
  };

  const handleNavigateToDashboard = () => {
    setCurrentView('dashboard');
  };

  const handleViewPost = (slug: string) => {
    // Open published post in new tab
    window.open(`/posts/${slug}`, '_blank');
  };

  const handleSavePost = async () => {
    setIsManualSaving(true);
    setIsSaving(true);

    try {
      // Validate required fields - throw errors instead of early returns
      if (!metadata.title.trim()) {
        throw new Error('Please enter a title for your post.');
      }
      
      if (!content.trim()) {
        throw new Error('Please write some content for your post.');
      }
      
      console.log('Attempting to save post:', { title: metadata.title, status: metadata.status });
      
      const result = await savePost(content, metadata, editingPostId || undefined);
      
      if (!result) {
        throw new Error('Failed to save post - no result returned from server.');
      }

      console.log('Post saved successfully!');

      // If this was a new post creation, set the editing ID for future saves
      if (!editingPostId && result.id) {
        setEditingPostId(result.id);
      }

      // Update last saved time
      setLastSaved(new Date());

      // Set success state for in-place feedback
      const actionMessage = metadata.status === 'published' ? 'published' :
                           metadata.status === 'scheduled' ? 'scheduled' :
                           metadata.status === 'archived' ? 'archived' : 'saved as draft';

      setSaveSuccess({
        show: true,
        message: `Post ${actionMessage} successfully!`,
        postId: result.id,
        status: metadata.status,
        timestamp: new Date()
      });
      
      // Also show toast for immediate feedback
      toast({
        title: 'Post saved!',
        description: `"${metadata.title}" has been ${actionMessage}.`,
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
      
      // Keep user in editor - no clearing, no redirection
      console.log('Save completed - staying in editor.');
      
    } catch (error) {
      console.error('Save operation failed:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      // Provide specific guidance based on error type
      let title = 'Save failed';
      let description = errorMessage;
      
      if (errorMessage.includes('slug already exists') || errorMessage.includes('slug') && errorMessage.includes('taken')) {
        title = 'Duplicate URL Slug';
        description = `${errorMessage}. Please change the URL slug to something unique, or leave it empty to auto-generate one.`;
      } else if (errorMessage.includes('Title and content are required')) {
        title = 'Missing Required Fields';
        description = 'Both title and content are required. Please fill in both fields before saving.';
      } else if (errorMessage.includes('Validation failed')) {
        title = 'Validation Error';
        description = `${errorMessage}. Please check your post data and try again.`;
      }
      
      // Show error notification with specific guidance
      toast({
        title,
        description,
        status: 'error',
        duration: 7000,
        isClosable: true,
      });
    } finally {
      // Always reset loading states
      console.log('Resetting loading states...');
      setIsSaving(false);
      setIsManualSaving(false);
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
    <Box minH="100vh" bg={bgColor}>
      {/* Header */}
      <Box
        position="sticky"
        top={0}
        zIndex={1000}
        w="full"
        bg={headerBg}
        py={4}
        mb={0}
        shadow="sm"
      >
        <Container maxW="7xl">
          <Flex justify="space-between" align="center">
            <HStack spacing={4}>
              <Box>
                <Box
                  fontSize="2xl"
                  fontFamily="var(--font-sorts-mill)"
                  color="white"
                  fontWeight="600"
                  textShadow="0 1px 2px rgba(0,0,0,0.1)"
                >
                  Blog Management System
                </Box>
              </Box>
              {currentView === 'editor' && (
                <Button
                  onClick={handleBackToList}
                  variant="ghost"
                  color="white"
                  size="sm"
                  fontFamily="var(--font-league-spartan)"
                  _hover={{ bg: 'whiteAlpha.200' }}
                >
                  ← Back to Posts
                </Button>
              )}
            </HStack>
            
            <HStack spacing={4}>
              {currentView !== 'editor' && (
                <Button
                  leftIcon={<Plus size={16} />}
                  onClick={handleCreateNew}
                  bg="whiteAlpha.200"
                  color="white"
                  size="sm"
                  _hover={{ bg: 'whiteAlpha.300' }}
                >
                  New Post
                </Button>
              )}
              <Button
                as="a"
                href="/admin"
                variant="ghost"
                color="white"
                size="sm"
                fontFamily="var(--font-league-spartan)"
                textTransform="uppercase"
                letterSpacing="0.05em"
                _hover={{ bg: 'whiteAlpha.200' }}
              >
                Admin Dashboard
              </Button>
            </HStack>
          </Flex>
        </Container>
      </Box>

      {/* Main Content */}
      <Container maxW="7xl" py={8}>
        {currentView === 'dashboard' && (
          <VStack spacing={6} align="stretch">
            {/* Navigation Tabs */}
            <Tabs 
              index={0}
              onChange={(index) => {
                if (index === 1) setCurrentView('list');
                else if (index === 0) setCurrentView('dashboard');
              }}
            >
              <TabList>
                <Tab>
                  <HStack spacing={2}>
                    <BarChart3 size={16} />
                    <span>Dashboard</span>
                  </HStack>
                </Tab>
                <Tab>
                  <HStack spacing={2}>
                    <Settings size={16} />
                    <span>Manage Posts</span>
                  </HStack>
                </Tab>
              </TabList>
            </Tabs>
            <BlogDashboard 
              onNavigateToEditor={handleCreateNew}
              onNavigateToList={() => setCurrentView('list')}
            />
          </VStack>
        )}

        {currentView === 'list' && (
          <VStack spacing={6} align="stretch">
            {/* Navigation Tabs */}
            <Tabs 
              index={1}
              onChange={(index) => {
                if (index === 0) setCurrentView('dashboard');
                else if (index === 1) setCurrentView('list');
              }}
            >
              <TabList>
                <Tab>
                  <HStack spacing={2}>
                    <BarChart3 size={16} />
                    <span>Dashboard</span>
                  </HStack>
                </Tab>
                <Tab>
                  <HStack spacing={2}>
                    <Settings size={16} />
                    <span>Manage Posts</span>
                  </HStack>
                </Tab>
              </TabList>
            </Tabs>
            <AdvancedPostsTable 
              onCreateNew={handleCreateNew}
              onEditPost={handleEditPost}
            />
          </VStack>
        )}

        {currentView === 'editor' && (
          <Grid
            templateColumns={{ base: '1fr', lg: '350px 1fr' }}
            gap={8}
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
                  saveSuccess={saveSuccess}
                  onCreateNew={handleCreateNew}
                  onViewPost={handleViewPost}
                  onDismissSuccess={() => setSaveSuccess({ show: false, message: '' })}
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
      </Container>
    </Box>
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