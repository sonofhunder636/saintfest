'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  Text,
  Spinner,
  Alert,
  AlertIcon,
  ChakraProvider
} from '@chakra-ui/react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { PostComment } from '@/types';
import { saintfestTheme } from '@/lib/chakra-theme';

interface CommentsSectionProps {
  postSlug: string;
}

function CommentsSectionComponent({ postSlug }: CommentsSectionProps) {
  const [comments, setComments] = useState<PostComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!db) {
      setError('Database not available');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const commentsRef = collection(db, 'comments');
      const commentsQuery = query(
        commentsRef,
        where('postSlug', '==', postSlug),
        where('status', '==', 'approved'),
        orderBy('timestamp', 'asc')
      );

      const unsubscribe = onSnapshot(commentsQuery, (snapshot) => {
        const commentsData: PostComment[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          commentsData.push({
            id: doc.id,
            postSlug: data.postSlug,
            content: data.content,
            timestamp: data.timestamp?.toDate() || new Date(),
            status: data.status
          });
        });

        setComments(commentsData);
        setIsLoading(false);
      }, (error) => {
        console.error('Error fetching comments:', error);
        setError('Failed to load comments');
        setIsLoading(false);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error('Error setting up comments listener:', error);
      setError('Failed to load comments');
      setIsLoading(false);
    }
  }, [postSlug]);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <Box
        p={6}
        bg="white"
        borderRadius="lg"
        boxShadow="sm"
        border="1px solid"
        borderColor="gray.200"
        mb={6}
        maxW="600px"
        mx="auto"
        textAlign="center"
      >
        <Spinner size="md" color="saintfest.500" mb={2} />
        <Text fontSize="sm" color="gray.600">Loading comments...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        p={6}
        bg="white"
        borderRadius="lg"
        boxShadow="sm"
        border="1px solid"
        borderColor="gray.200"
        mb={6}
        maxW="600px"
        mx="auto"
      >
        <Alert status="error">
          <AlertIcon />
          {error}
        </Alert>
      </Box>
    );
  }

  if (comments.length === 0) {
    return (
      <Box
        p={6}
        bg="white"
        borderRadius="lg"
        boxShadow="sm"
        border="1px solid"
        borderColor="gray.200"
        mb={6}
        maxW="600px"
        mx="auto"
        textAlign="center"
      >
        <Text fontSize="md" color="gray.500">
          No comments yet. Be the first to share your thoughts!
        </Text>
      </Box>
    );
  }

  return (
    <Box
      p={6}
      bg="white"
      borderRadius="lg"
      boxShadow="sm"
      border="1px solid"
      borderColor="gray.200"
      mb={6}
      maxW="600px"
      mx="auto"
    >
      <Text
        fontSize="lg"
        fontWeight="semibold"
        mb={4}
        color="gray.700"
        borderBottom="1px solid"
        borderColor="gray.100"
        pb={2}
      >
        Comments ({comments.length})
      </Text>

      <VStack spacing={4} align="stretch">
        {comments.map((comment) => (
          <Box
            key={comment.id}
            p={4}
            bg="gray.50"
            borderRadius="md"
            border="1px solid"
            borderColor="gray.100"
          >
            <Text
              fontSize="md"
              color="gray.800"
              mb={2}
              lineHeight="1.6"
            >
              {comment.content}
            </Text>
            <Text
              fontSize="xs"
              color="gray.500"
              textAlign="right"
            >
              {formatDate(comment.timestamp)}
            </Text>
          </Box>
        ))}
      </VStack>
    </Box>
  );
}

export default function CommentsSection(props: CommentsSectionProps) {
  return (
    <ChakraProvider theme={saintfestTheme}>
      <CommentsSectionComponent {...props} />
    </ChakraProvider>
  );
}