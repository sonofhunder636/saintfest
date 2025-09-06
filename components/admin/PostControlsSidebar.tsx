'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Box, VStack, Heading, HStack, Text, Flex, Badge } from '@chakra-ui/layout';
import { FormControl, FormLabel } from '@chakra-ui/form-control';
import { Input, InputGroup, InputLeftElement } from '@chakra-ui/input';
import { Select } from '@chakra-ui/select';
import { Textarea } from '@chakra-ui/textarea';
import { Button } from '@chakra-ui/button';
import { Tag, TagLabel, TagCloseButton } from '@chakra-ui/tag';
import { Alert, AlertIcon, AlertDescription } from '@chakra-ui/alert';
import { Divider, Switch, useColorModeValue, Accordion, AccordionItem, AccordionButton, AccordionPanel, AccordionIcon, Spinner } from '@chakra-ui/react';
import { Calendar, Clock, Save, Eye, Upload, Tag as TagIcon, Star, AlertTriangle, Search, Zap, CheckCircle, Plus, X } from 'lucide-react';

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

interface PostControlsSidebarProps {
  metadata: PostMetadata;
  onMetadataChange: (metadata: PostMetadata) => void;
  onSave?: () => Promise<void>;
  isEditMode?: boolean;
  isSaving?: boolean;
  lastSaved?: Date;
  wordCount?: number;
  readingTime?: number;
  saveSuccess?: {
    show: boolean;
    message: string;
    postId?: string;
    status?: string;
    timestamp?: Date;
  };
  onCreateNew?: () => void;
  onViewPost?: (slug: string) => void;
  onDismissSuccess?: () => void;
}

export default function PostControlsSidebar({
  metadata,
  onMetadataChange,
  onSave,
  isEditMode = false,
  isSaving = false,
  lastSaved,
  wordCount = 0,
  readingTime = 1,
  saveSuccess,
  onCreateNew,
  onViewPost,
  onDismissSuccess,
}: PostControlsSidebarProps) {
  const [newTag, setNewTag] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [slugValidation, setSlugValidation] = useState<{
    isChecking: boolean;
    isAvailable?: boolean;
    message?: string;
  }>({ isChecking: false });
  
  const slugTimeoutRef = useRef<NodeJS.Timeout>();
  
  // Theme colors
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // Auto-generate slug from title
  const generateSlug = useCallback((title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }, []);

  // Check if slug is available
  const checkSlugAvailability = useCallback(async (slug: string) => {
    if (!slug.trim()) {
      setSlugValidation({ isChecking: false });
      return;
    }

    setSlugValidation({ isChecking: true });

    try {
      const response = await fetch(`/api/admin/posts?slug=${encodeURIComponent(slug)}`);
      const result = await response.json();
      
      if (result.success) {
        const isDuplicate = result.posts && result.posts.length > 0;
        setSlugValidation({
          isChecking: false,
          isAvailable: !isDuplicate,
          message: isDuplicate ? 'This URL slug is already taken' : 'URL slug is available'
        });
      }
    } catch (error) {
      setSlugValidation({
        isChecking: false,
        isAvailable: undefined,
        message: 'Unable to check slug availability'
      });
    }
  }, []);

  const handleTitleChange = (title: string) => {
    const newMetadata = {
      ...metadata,
      title,
      slug: metadata.slug || generateSlug(title),
    };
    onMetadataChange(newMetadata);
  };

  const handleSlugChange = (slug: string) => {
    const cleanSlug = slug.toLowerCase();
    onMetadataChange({ ...metadata, slug: cleanSlug });
    
    // Clear existing timeout
    if (slugTimeoutRef.current) {
      clearTimeout(slugTimeoutRef.current);
    }
    
    // Debounce slug validation check
    slugTimeoutRef.current = setTimeout(() => {
      if (cleanSlug) {
        checkSlugAvailability(cleanSlug);
      } else {
        setSlugValidation({ isChecking: false });
      }
    }, 500);
  };

  const handleStatusChange = (status: string) => {
    const newMetadata = {
      ...metadata,
      status: status as 'draft' | 'published' | 'scheduled',
    };
    
    // Set publishedAt when status changes to published
    if (status === 'published' && metadata.status !== 'published') {
      newMetadata.publishedAt = new Date();
    }
    
    onMetadataChange(newMetadata);
  };

  const handleAddTag = () => {
    if (newTag.trim() && !metadata.tags.includes(newTag.trim())) {
      onMetadataChange({
        ...metadata,
        tags: [...metadata.tags, newTag.trim()],
      });
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onMetadataChange({
      ...metadata,
      tags: metadata.tags.filter(tag => tag !== tagToRemove),
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleScheduledDateChange = (dateValue: string) => {
    const scheduledFor = dateValue ? new Date(dateValue) : undefined;
    const scheduledAt = scheduledFor; // Use same date for both fields
    onMetadataChange({
      ...metadata,
      scheduledFor,
      scheduledAt,
    });
  };

  // Category handlers
  const handleAddCategory = () => {
    if (newCategory.trim() && !(metadata.categories || []).includes(newCategory.trim())) {
      onMetadataChange({
        ...metadata,
        categories: [...(metadata.categories || []), newCategory.trim()],
      });
      setNewCategory('');
    }
  };

  const handleRemoveCategory = (categoryToRemove: string) => {
    onMetadataChange({
      ...metadata,
      categories: (metadata.categories || []).filter(category => category !== categoryToRemove),
    });
  };

  const handleCategoryKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddCategory();
    }
  };

  // Priority handler
  const handlePriorityChange = (priority: string) => {
    onMetadataChange({
      ...metadata,
      priority: priority as 'low' | 'medium' | 'high',
    });
  };

  // Featured toggle handler
  const handleFeaturedToggle = () => {
    onMetadataChange({
      ...metadata,
      featured: !metadata.featured,
    });
  };

  // SEO handlers
  const handleSEOTitleChange = (seoTitle: string) => {
    onMetadataChange({
      ...metadata,
      seoTitle,
    });
  };

  const handleSEODescriptionChange = (seoDescription: string) => {
    onMetadataChange({
      ...metadata,
      seoDescription,
    });
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <Box
      w="full"
      h="full"
      bg="white"
      borderWidth="1px"
      borderColor="gray.200"
      borderRadius="lg"
      p={6}
      shadow="sm"
    >
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Box>
          <Heading size="lg" mb={2} color="gray.800">
            {isEditMode ? 'Edit Post' : 'New Post'}
          </Heading>
          <Text fontSize="sm" color="gray.600">
            Manage your post settings and metadata
          </Text>
        </Box>

        <Divider />

        {/* Post Title */}
        <FormControl>
          <FormLabel>Post Title</FormLabel>
          <Input
            placeholder="Enter your post title..."
            value={metadata.title}
            onChange={(e) => handleTitleChange(e.target.value)}
            size="lg"
          />
        </FormControl>

        {/* Post Slug */}
        <FormControl>
          <FormLabel>URL Slug</FormLabel>
          <InputGroup>
            <InputLeftElement>
              <Text fontSize="sm" color="gray.500">
                /
              </Text>
            </InputLeftElement>
            <Input
              placeholder="post-url-slug"
              value={metadata.slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              borderColor={
                slugValidation.isAvailable === false ? 'red.300' : 
                slugValidation.isAvailable === true ? 'green.300' : 
                borderColor
              }
              _focus={{
                borderColor: slugValidation.isAvailable === false ? 'red.500' : 
                           slugValidation.isAvailable === true ? 'green.500' : 
                           'blue.500'
              }}
            />
            {slugValidation.isChecking && (
              <InputGroup>
                <Spinner size="sm" color="blue.500" position="absolute" right="8px" top="50%" transform="translateY(-50%)" />
              </InputGroup>
            )}
          </InputGroup>
          <HStack justify="space-between" mt={1}>
            <Text fontSize="xs" color="gray.500">
              Auto-generated from title
            </Text>
            {slugValidation.message && (
              <Text 
                fontSize="xs" 
                color={
                  slugValidation.isAvailable === false ? 'red.500' : 
                  slugValidation.isAvailable === true ? 'green.500' : 
                  'gray.500'
                }
              >
                {slugValidation.message}
              </Text>
            )}
          </HStack>
        </FormControl>

        {/* Post Status */}
        <FormControl>
          <FormLabel>Status</FormLabel>
          <Select
            value={metadata.status}
            onChange={(e) => handleStatusChange(e.target.value)}
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="scheduled">Scheduled</option>
            <option value="archived">Archived</option>
          </Select>
          
          {/* Scheduled Date Picker */}
          {metadata.status === 'scheduled' && (
            <Box mt={3}>
              <FormLabel fontSize="sm">Publish Date & Time</FormLabel>
              <Input
                type="datetime-local"
                value={
                  metadata.scheduledFor
                    ? new Date(metadata.scheduledFor.getTime() - metadata.scheduledFor.getTimezoneOffset() * 60000)
                        .toISOString()
                        .slice(0, 16)
                    : ''
                }
                onChange={(e) => handleScheduledDateChange(e.target.value)}
              />
            </Box>
          )}
        </FormControl>

        {/* Tags */}
        <FormControl>
          <FormLabel>Tags</FormLabel>
          <VStack spacing={3} align="stretch">
            <InputGroup>
              <InputLeftElement>
                <TagIcon size={14} />
              </InputLeftElement>
              <Input
                placeholder="Add a tag..."
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={handleKeyPress}
              />
              <Button
                ml={2}
                size="sm"
                onClick={handleAddTag}
                isDisabled={!newTag.trim()}
              >
                Add
              </Button>
            </InputGroup>
            
            {metadata.tags.length > 0 && (
              <Flex wrap="wrap" gap={2}>
                {metadata.tags.map((tag) => (
                  <Tag key={tag} size="md" variant="subtle">
                    <TagLabel>{tag}</TagLabel>
                    <TagCloseButton onClick={() => handleRemoveTag(tag)} />
                  </Tag>
                ))}
              </Flex>
            )}
          </VStack>
        </FormControl>

        {/* Categories */}
        <FormControl>
          <FormLabel>Categories</FormLabel>
          <VStack spacing={3} align="stretch">
            <InputGroup>
              <InputLeftElement>
                <TagIcon size={14} />
              </InputLeftElement>
              <Input
                placeholder="Add a category..."
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                onKeyPress={handleCategoryKeyPress}
              />
              <Button
                ml={2}
                size="sm"
                onClick={handleAddCategory}
                isDisabled={!newCategory.trim()}
              >
                Add
              </Button>
            </InputGroup>
            
            {(metadata.categories || []).length > 0 && (
              <Flex wrap="wrap" gap={2}>
                {(metadata.categories || []).map((category) => (
                  <Tag key={category} size="md" variant="solid" colorScheme="blue">
                    <TagLabel>{category}</TagLabel>
                    <TagCloseButton onClick={() => handleRemoveCategory(category)} />
                  </Tag>
                ))}
              </Flex>
            )}
          </VStack>
        </FormControl>

        {/* Priority and Featured Row */}
        <HStack spacing={4} align="start">
          <FormControl flex={1}>
            <FormLabel>Priority</FormLabel>
            <Select
              value={metadata.priority || 'medium'}
              onChange={(e) => handlePriorityChange(e.target.value)}
            >
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
            </Select>
          </FormControl>
          
          <FormControl>
            <FormLabel>Featured Post</FormLabel>
            <HStack>
              <Switch
                isChecked={metadata.featured || false}
                onChange={handleFeaturedToggle}
                colorScheme="green"
              />
              <Star size={16} color={metadata.featured ? "#FFD700" : "#CBD5E0"} />
            </HStack>
          </FormControl>
        </HStack>

        {/* Post Excerpt */}
        <FormControl>
          <FormLabel>Excerpt</FormLabel>
          <Textarea
            placeholder="Brief description of your post..."
            value={metadata.excerpt || ''}
            onChange={(e) => onMetadataChange({ ...metadata, excerpt: e.target.value })}
            resize="vertical"
            minH="80px"
          />
          <Text fontSize="xs" color="gray.500" mt={1}>
            Optional. Used for post previews and SEO.
          </Text>
        </FormControl>

        <Divider />

        {/* SEO Section */}
        <Accordion allowToggle>
          <AccordionItem>
            <AccordionButton>
              <HStack flex="1" textAlign="left">
                <Search size={16} />
                <Text fontWeight="semibold">SEO Settings</Text>
              </HStack>
              <AccordionIcon />
            </AccordionButton>
            <AccordionPanel pb={4}>
              <VStack spacing={4} align="stretch">
                <FormControl>
                  <FormLabel>SEO Title</FormLabel>
                  <Input
                    placeholder={metadata.title || "Enter SEO title..."}
                    value={metadata.seoTitle || ''}
                    onChange={(e) => handleSEOTitleChange(e.target.value)}
                  />
                  <Text fontSize="xs" color="gray.500" mt={1}>
                    {(metadata.seoTitle || metadata.title || '').length}/60 characters
                  </Text>
                </FormControl>

                <FormControl>
                  <FormLabel>SEO Description</FormLabel>
                  <Textarea
                    placeholder={metadata.excerpt || "Enter SEO description..."}
                    value={metadata.seoDescription || ''}
                    onChange={(e) => handleSEODescriptionChange(e.target.value)}
                    resize="vertical"
                    minH="80px"
                  />
                  <Text fontSize="xs" color="gray.500" mt={1}>
                    {(metadata.seoDescription || metadata.excerpt || '').length}/160 characters
                  </Text>
                </FormControl>
              </VStack>
            </AccordionPanel>
          </AccordionItem>
        </Accordion>

        <Divider />

        {/* Post Statistics */}
        <Box>
          <Text fontSize="sm" fontWeight="semibold" mb={3} color="gray.700">
            Post Statistics
          </Text>
          <VStack spacing={2} align="stretch">
            <HStack justify="space-between">
              <Text fontSize="sm" color="gray.600">Word Count:</Text>
              <Badge variant="outline">{wordCount.toLocaleString()}</Badge>
            </HStack>
            <HStack justify="space-between">
              <Text fontSize="sm" color="gray.600">Reading Time:</Text>
              <Badge variant="outline">{readingTime} min</Badge>
            </HStack>
            {lastSaved && (
              <HStack justify="space-between">
                <Text fontSize="sm" color="gray.600">Last Saved:</Text>
                <Text fontSize="xs" color="gray.500">
                  {formatDate(lastSaved)}
                </Text>
              </HStack>
            )}
          </VStack>
        </Box>

        {/* Save Status */}
        {isSaving && (
          <Alert status="info" size="sm">
            <AlertIcon />
            <AlertDescription fontSize="sm">Saving changes...</AlertDescription>
          </Alert>
        )}

        {/* Save Button Section - Completely Rebuilt */}
        <VStack spacing={4} align="stretch">
          {/* Success Status Display */}
          {saveSuccess?.show && (
            <Alert status="success" borderRadius="lg" variant="subtle">
              <AlertIcon />
              <Box flex="1">
                <Text fontSize="sm" fontWeight="semibold" color="green.800">
                  {saveSuccess.message}
                </Text>
                {saveSuccess.timestamp && (
                  <Text fontSize="xs" color="green.600" mt={1}>
                    {formatDate(saveSuccess.timestamp)}
                  </Text>
                )}
              </Box>
              {onDismissSuccess && (
                <IconButton
                  aria-label="Dismiss"
                  icon={<X size={12} />}
                  size="xs"
                  variant="ghost"
                  onClick={onDismissSuccess}
                />
              )}
            </Alert>
          )}

          {/* Action Buttons Row */}
          {saveSuccess?.show && saveSuccess.status === 'published' && metadata.slug && onViewPost ? (
            <HStack spacing={2}>
              <Button
                flex={1}
                leftIcon={<Eye size={14} />}
                onClick={() => onViewPost(metadata.slug)}
                variant="outline"
                colorScheme="blue"
                size="sm"
              >
                View Live Post
              </Button>
              {onCreateNew && (
                <Button
                  flex={1}
                  leftIcon={<Plus size={14} />}
                  onClick={onCreateNew}
                  variant="outline"
                  size="sm"
                >
                  New Post
                </Button>
              )}
            </HStack>
          ) : saveSuccess?.show && onCreateNew ? (
            <Button
              leftIcon={<Plus size={14} />}
              onClick={onCreateNew}
              variant="outline"
              size="sm"
              w="full"
            >
              Create New Post
            </Button>
          ) : null}

          {/* Main Save Button */}
          <Button
            leftIcon={<Save size={16} />}
            onClick={onSave}
            isLoading={isSaving}
            loadingText="Saving..."
            colorScheme="green"
            size="lg"
            w="full"
            isDisabled={!metadata.title?.trim()}
          >
            {metadata.status === 'published' ? 'Update & Publish' :
             metadata.status === 'scheduled' ? 'Schedule Post' :
             metadata.status === 'archived' ? 'Archive Post' :
             'Save as Draft'}
          </Button>

          {/* Preview Button for Published Posts */}
          {metadata.status === 'published' && metadata.slug && (
            <Button
              leftIcon={<Eye size={14} />}
              as="a"
              href={`/posts/${metadata.slug}`}
              target="_blank"
              variant="ghost"
              size="sm"
              w="full"
            >
              Preview Published Post
            </Button>
          )}
        </VStack>
      </VStack>
    </Box>
  );
}