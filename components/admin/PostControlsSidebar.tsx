'use client';

import { useState, useCallback, useEffect } from 'react';
import { Box, VStack, Heading, HStack, Text, Flex, Badge } from '@chakra-ui/layout';
import { FormControl, FormLabel } from '@chakra-ui/form-control';
import { Input, InputGroup, InputLeftElement } from '@chakra-ui/input';
import { Select } from '@chakra-ui/select';
import { Textarea } from '@chakra-ui/textarea';
import { Button } from '@chakra-ui/button';
import { Tag, TagLabel, TagCloseButton } from '@chakra-ui/tag';
import { Alert, AlertIcon, AlertDescription } from '@chakra-ui/alert';
import { Divider, Switch } from '@chakra-ui/react';
import { Calendar, Clock, Save, Eye, Upload, Tag as TagIcon } from 'lucide-react';

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

interface PostControlsSidebarProps {
  metadata: PostMetadata;
  onMetadataChange: (metadata: PostMetadata) => void;
  onSave?: () => Promise<void>;
  isEditMode?: boolean;
  isSaving?: boolean;
  lastSaved?: Date;
  wordCount?: number;
  readingTime?: number;
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
}: PostControlsSidebarProps) {
  const [newTag, setNewTag] = useState('');

  // Auto-generate slug from title
  const generateSlug = useCallback((title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
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
    onMetadataChange({ ...metadata, slug: slug.toLowerCase() });
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
    onMetadataChange({
      ...metadata,
      scheduledFor,
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
            />
          </InputGroup>
          <Text fontSize="xs" color="gray.500" mt={1}>
            Auto-generated from title
          </Text>
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

        {/* Action Buttons */}
        <VStack spacing={3}>
          {metadata.status === 'published' && (
            <Button
              variant="outline"
              leftIcon={<Eye size={16} />}
              size="sm"
              w="full"
              as="a"
              href={`/posts/${metadata.slug}`}
              target="_blank"
            >
              Preview Post
            </Button>
          )}
          
          <Button
            leftIcon={<Save size={16} />}
            onClick={onSave}
            isLoading={isSaving}
            loadingText="Saving..."
            w="full"
            size="lg"
          >
            Save Post
          </Button>
        </VStack>
      </VStack>
    </Box>
  );
}