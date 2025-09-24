'use client';

import { useState, useEffect, useMemo } from 'react';
import { usePosts } from '@/hooks/usePosts';
import { BlogPost } from '@/types';
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Checkbox,
  Button,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Badge,
  Text,
  HStack,
  VStack,
  Input,
  Select,
  InputGroup,
  InputLeftElement,
  Flex,
  useToast,
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
  useDisclosure,
  Tooltip,
  Card,
  CardHeader,
  CardBody,
  Heading,
  SimpleGrid,
  Skeleton,
  useColorModeValue
} from '@chakra-ui/react';
import {
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Copy,
  Star,
  Calendar,
  Filter,
  ChevronUp,
  ChevronDown,
  RefreshCw
} from 'lucide-react';
import Link from 'next/link';
import { useRef } from 'react';

type SortField = 'title' | 'author' | 'status' | 'createdAt' | 'updatedAt' | 'views' | 'priority';
type SortDirection = 'asc' | 'desc';

interface AdvancedPostsTableProps {
  onEditPost?: (postId: string) => void;
  onCreateNew?: () => void;
}

export default function AdvancedPostsTable({ onEditPost, onCreateNew }: AdvancedPostsTableProps) {
  const { 
    posts, 
    loading, 
    error, 
    fetchPosts, 
    deletePost, 
    bulkOperation, 
    duplicatePost,
    clearError 
  } = usePosts();
  
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = useRef<HTMLButtonElement>(null);
  
  // State
  const [selectedPosts, setSelectedPosts] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('updatedAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [postToDelete, setPostToDelete] = useState<BlogPost | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);

  // Colors
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');

  // Filtered and sorted posts
  const filteredPosts = useMemo(() => {
    let filtered = posts;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(post =>
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.author?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (post.tags || []).some((tag: string) => tag.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (post.categories || []).some((cat: string) => cat.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(post => post.status === statusFilter);
    }

    // Priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(post => post.priority === priorityFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      // Handle dates
      if (aValue instanceof Date && bValue instanceof Date) {
        aValue = aValue.getTime();
        bValue = bValue.getTime();
      }

      // Handle strings
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      // Handle undefined/null
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return sortDirection === 'asc' ? -1 : 1;
      if (bValue == null) return sortDirection === 'asc' ? 1 : -1;

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [posts, searchTerm, statusFilter, priorityFilter, sortField, sortDirection]);

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedPosts(filteredPosts.map(post => post.id!));
    } else {
      setSelectedPosts([]);
    }
  };

  const handleSelectPost = (postId: string, checked: boolean) => {
    if (checked) {
      setSelectedPosts(prev => [...prev, postId]);
    } else {
      setSelectedPosts(prev => prev.filter(id => id !== postId));
    }
  };

  // Sort handlers
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Action handlers
  const handleDeletePost = async (post: BlogPost) => {
    const success = await deletePost(post.id!);
    if (success) {
      toast({
        title: 'Post deleted',
        description: `"${post.title}" has been deleted successfully.`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      setSelectedPosts(prev => prev.filter(id => id !== post.id));
    }
    onClose();
    setPostToDelete(null);
  };

  const handleDuplicatePost = async (postId: string) => {
    const duplicated = await duplicatePost(postId);
    if (duplicated) {
      toast({
        title: 'Post duplicated',
        description: 'The post has been duplicated successfully.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedPosts.length === 0) return;

    setBulkLoading(true);
    let success = false;
    let actionData: any = {};

    switch (action) {
      case 'delete':
        success = await bulkOperation('delete', selectedPosts);
        break;
      case 'publish':
        actionData = { status: 'published' };
        success = await bulkOperation('updateStatus', selectedPosts, actionData);
        break;
      case 'draft':
        actionData = { status: 'draft' };
        success = await bulkOperation('updateStatus', selectedPosts, actionData);
        break;
      case 'archive':
        actionData = { status: 'archived' };
        success = await bulkOperation('updateStatus', selectedPosts, actionData);
        break;
      case 'high-priority':
        actionData = { priority: 'high' };
        success = await bulkOperation('updatePriority', selectedPosts, actionData);
        break;
      case 'toggle-featured':
        success = await bulkOperation('toggleFeatured', selectedPosts);
        break;
    }

    if (success) {
      toast({
        title: 'Bulk action completed',
        description: `Successfully processed ${selectedPosts.length} posts.`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      setSelectedPosts([]);
    }
    setBulkLoading(false);
  };

  // Utility functions
  const getStatusBadge = (status: string) => {
    const colorScheme = {
      draft: 'gray',
      published: 'green',
      scheduled: 'orange',
      archived: 'red'
    }[status] || 'gray';

    return (
      <Badge colorScheme={colorScheme} variant="subtle">
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const colorScheme = {
      low: 'gray',
      medium: 'blue',
      high: 'red'
    }[priority] || 'gray';

    return (
      <Badge colorScheme={colorScheme} variant="outline" size="sm">
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </Badge>
    );
  };

  const formatDate = (date?: Date) => {
    if (!date) return 'N/A';
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  if (loading) {
    return (
      <Card bg={bgColor}>
        <CardHeader>
          <Skeleton height="32px" width="200px" />
        </CardHeader>
        <CardBody>
          <VStack spacing={4}>
            <Skeleton height="40px" width="100%" />
            {Array(5).fill(0).map((_, i) => (
              <Skeleton key={i} height="60px" width="100%" />
            ))}
          </VStack>
        </CardBody>
      </Card>
    );
  }

  return (
    <Box>
      {/* Header and Filters */}
      <Card bg={bgColor} mb={6}>
        <CardHeader>
          <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
            <Box>
              <Heading size="lg" mb={1}>
                Posts Management
              </Heading>
              <Text color="gray.600">
                {filteredPosts.length} of {posts.length} posts
              </Text>
            </Box>
            <HStack spacing={3}>
              <Tooltip label="Refresh posts">
                <IconButton
                  aria-label="Refresh"
                  icon={<RefreshCw size={16} />}
                  variant="outline"
                  onClick={() => fetchPosts()}
                  size="sm"
                />
              </Tooltip>
              <Button
                leftIcon={<Search size={16} />}
                onClick={onCreateNew}
                colorScheme="green"
                size="sm"
              >
                New Post
              </Button>
            </HStack>
          </Flex>
        </CardHeader>
        
        <CardBody pt={0}>
          {/* Filters */}
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mb={4}>
            <InputGroup>
              <InputLeftElement>
                <Search size={16} color="gray.400" />
              </InputLeftElement>
              <Input
                placeholder="Search posts, authors, tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </InputGroup>
            
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              placeholder="All Statuses"
            >
              <option value="all">All Statuses</option>
              <option value="published">Published</option>
              <option value="draft">Drafts</option>
              <option value="scheduled">Scheduled</option>
              <option value="archived">Archived</option>
            </Select>
            
            <Select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              placeholder="All Priorities"
            >
              <option value="all">All Priorities</option>
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </Select>
          </SimpleGrid>

          {/* Bulk Actions */}
          {selectedPosts.length > 0 && (
            <HStack spacing={3} mb={4} p={3} bg={hoverBg} borderRadius="md">
              <Text fontSize="sm" fontWeight="medium">
                {selectedPosts.length} selected
              </Text>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBulkAction('publish')}
                isLoading={bulkLoading}
              >
                Publish
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBulkAction('draft')}
                isLoading={bulkLoading}
              >
                Move to Draft
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBulkAction('archive')}
                isLoading={bulkLoading}
              >
                Archive
              </Button>
              <Button
                size="sm"
                variant="outline"
                colorScheme="red"
                onClick={() => handleBulkAction('delete')}
                isLoading={bulkLoading}
              >
                Delete
              </Button>
            </HStack>
          )}
        </CardBody>
      </Card>

      {/* Table */}
      <Card bg={bgColor}>
        <Box overflowX="auto">
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th p={3}>
                  <Checkbox
                    isChecked={selectedPosts.length === filteredPosts.length && filteredPosts.length > 0}
                    isIndeterminate={selectedPosts.length > 0 && selectedPosts.length < filteredPosts.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                </Th>
                <Th 
                  cursor="pointer" 
                  onClick={() => handleSort('title')}
                  _hover={{ bg: hoverBg }}
                >
                  <HStack spacing={1}>
                    <Text>Title</Text>
                    {sortField === 'title' && (
                      sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                    )}
                  </HStack>
                </Th>
                <Th>Status</Th>
                <Th>Priority</Th>
                <Th 
                  cursor="pointer"
                  onClick={() => handleSort('author')}
                  _hover={{ bg: hoverBg }}
                >
                  <HStack spacing={1}>
                    <Text>Author</Text>
                    {sortField === 'author' && (
                      sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                    )}
                  </HStack>
                </Th>
                <Th 
                  cursor="pointer"
                  onClick={() => handleSort('views')}
                  _hover={{ bg: hoverBg }}
                >
                  <HStack spacing={1}>
                    <Text>Views</Text>
                    {sortField === 'views' && (
                      sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                    )}
                  </HStack>
                </Th>
                <Th 
                  cursor="pointer"
                  onClick={() => handleSort('updatedAt')}
                  _hover={{ bg: hoverBg }}
                >
                  <HStack spacing={1}>
                    <Text>Updated</Text>
                    {sortField === 'updatedAt' && (
                      sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                    )}
                  </HStack>
                </Th>
                <Th width="80px">Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {filteredPosts.map((post) => (
                <Tr key={post.id} _hover={{ bg: hoverBg }}>
                  <Td p={3}>
                    <Checkbox
                      isChecked={selectedPosts.includes(post.id!)}
                      onChange={(e) => handleSelectPost(post.id!, e.target.checked)}
                    />
                  </Td>
                  <Td>
                    <VStack align="start" spacing={1}>
                      <HStack>
                        {post.featured && <Star size={14} color="#FFD700" />}
                        <Text fontWeight="medium" noOfLines={1} maxW="300px">
                          {post.title}
                        </Text>
                      </HStack>
                      <Text fontSize="xs" color="gray.500" noOfLines={1}>
                        {post.excerpt || post.content.substring(0, 80) + '...'}
                      </Text>
                    </VStack>
                  </Td>
                  <Td>{getStatusBadge(post.status || 'draft')}</Td>
                  <Td>{getPriorityBadge(post.priority || 'medium')}</Td>
                  <Td>
                    <Text fontSize="sm">{post.author || 'Unknown'}</Text>
                  </Td>
                  <Td>
                    <Text fontSize="sm">{(post.views || 0).toLocaleString()}</Text>
                  </Td>
                  <Td>
                    <Text fontSize="sm">{formatDate(post.updatedAt)}</Text>
                  </Td>
                  <Td>
                    <Menu>
                      <MenuButton
                        as={IconButton}
                        icon={<MoreHorizontal size={16} />}
                        variant="ghost"
                        size="sm"
                      />
                      <MenuList>
                        <MenuItem
                          icon={<Edit size={14} />}
                          onClick={() => onEditPost?.(post.id!)}
                        >
                          Edit
                        </MenuItem>
                        {post.status === 'published' && (
                          <MenuItem
                            as={Link}
                            href={`/posts/${post.slug}`}
                            target="_blank"
                            icon={<Eye size={14} />}
                          >
                            View Live
                          </MenuItem>
                        )}
                        <MenuItem
                          icon={<Copy size={14} />}
                          onClick={() => handleDuplicatePost(post.id!)}
                        >
                          Duplicate
                        </MenuItem>
                        <MenuItem
                          icon={<Trash2 size={14} />}
                          color="red.500"
                          onClick={() => {
                            setPostToDelete(post);
                            onOpen();
                          }}
                        >
                          Delete
                        </MenuItem>
                      </MenuList>
                    </Menu>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
          
          {filteredPosts.length === 0 && (
            <Box textAlign="center" py={10}>
              <Text color="gray.500" fontSize="lg" mb={2}>
                No posts found
              </Text>
              <Text color="gray.400" fontSize="sm">
                {posts.length === 0 
                  ? 'Create your first blog post to get started'
                  : 'Try adjusting your search criteria'}
              </Text>
              {posts.length === 0 && (
                <Button mt={4} onClick={onCreateNew} colorScheme="green">
                  Create First Post
                </Button>
              )}
            </Box>
          )}
        </Box>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={onClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete Post
            </AlertDialogHeader>
            <AlertDialogBody>
              Are you sure you want to delete "{postToDelete?.title}"? This action cannot be undone.
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose}>
                Cancel
              </Button>
              <Button 
                colorScheme="red" 
                onClick={() => postToDelete && handleDeletePost(postToDelete)}
                ml={3}
              >
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
}