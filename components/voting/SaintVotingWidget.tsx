'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  VStack,
  HStack,
  Text,
  Heading,
  useToast,
  Spinner,
  Progress,
  Badge
} from '@chakra-ui/react';
import { doc, onSnapshot, collection, addDoc, query, where, getDocs, updateDoc, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { VotingWidget, VotingSession, VotingResults, SaintVote } from '@/types';

interface SaintVotingWidgetProps {
  widget: VotingWidget;
  postSlug: string;
  isPreview?: boolean; // For markdown preview
}

export default function SaintVotingWidget({ widget, postSlug, isPreview = false }: SaintVotingWidgetProps) {
  const [votingResults, setVotingResults] = useState<VotingResults | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isVoting, setIsVoting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [votedFor, setVotedFor] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const toast = useToast();

  // Generate a browser fingerprint for vote deduplication
  const getBrowserFingerprint = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx!.textBaseline = 'top';
    ctx!.font = '14px Arial';
    ctx!.fillText('Browser fingerprint', 2, 2);

    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      canvas.toDataURL()
    ].join('|');

    // Simple hash function
    let hash = 0;
    for (let i = 0; i < fingerprint.length; i++) {
      const char = fingerprint.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString();
  };

  // Check if user has already voted today
  const checkVoteStatus = () => {
    const voteKey = `vote_${widget.id}_${new Date().toDateString()}`;
    const storedVote = localStorage.getItem(voteKey);
    if (storedVote) {
      setHasVoted(true);
      setVotedFor(storedVote);
      return true;
    }
    return false;
  };

  // Calculate time remaining until voting ends
  const calculateTimeRemaining = (closesAt: Date) => {
    const now = new Date().getTime();
    const closes = closesAt.getTime();
    const remaining = closes - now;
    return Math.max(0, remaining);
  };

  // Format time remaining
  const formatTimeRemaining = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    }
    return `${minutes}m remaining`;
  };

  // Load voting session and results
  useEffect(() => {
    if (isPreview) {
      // Show mock data for preview
      setVotingResults({
        sessionId: 'preview',
        saint1Name: widget.saint1Name,
        saint2Name: widget.saint2Name,
        saint1Votes: 0,
        saint2Votes: 0,
        saint1Percentage: 50,
        saint2Percentage: 50,
        totalVotes: 0,
        userHasVoted: false,
        votingEnded: false,
      });
      setIsLoading(false);
      return;
    }

    const loadVotingSession = async () => {
      try {
        // Check if user has voted
        const userVoted = checkVoteStatus();

        // Check if db is available
        if (!db) {
          throw new Error('Firebase not initialized');
        }

        // Query for existing voting session
        const sessionsRef = collection(db, 'votingSessions');
        const sessionQuery = query(sessionsRef, where('widgetId', '==', widget.id));
        const sessionSnapshot = await getDocs(sessionQuery);

        let sessionDoc;
        if (sessionSnapshot.empty) {
          // Create new voting session
          const now = new Date();
          const closesAt = new Date(now);
          closesAt.setHours(23, 59, 59, 999); // End at 11:59:59 PM

          const newSession = {
            widgetId: widget.id,
            postSlug: postSlug,
            opensAt: now,
            closesAt: closesAt,
            isActive: true,
            saint1Votes: 0,
            saint2Votes: 0,
            totalVotes: 0,
            lastUpdated: now,
          };

          const docRef = await addDoc(sessionsRef, newSession);
          sessionDoc = { id: docRef.id, ...newSession };
        } else {
          sessionDoc = { id: sessionSnapshot.docs[0].id, ...sessionSnapshot.docs[0].data() };
        }

        // Set up real-time listener
        const unsubscribe = onSnapshot(doc(db, 'votingSessions', sessionDoc.id), (doc) => {
          if (doc.exists()) {
            const data = doc.data();
            const closesAt = data.closesAt.toDate();
            const remaining = calculateTimeRemaining(closesAt);
            const votingEnded = remaining <= 0;

            setVotingResults({
              sessionId: doc.id,
              saint1Name: widget.saint1Name,
              saint2Name: widget.saint2Name,
              saint1Votes: data.saint1Votes,
              saint2Votes: data.saint2Votes,
              saint1Percentage: data.totalVotes > 0 ? Math.round((data.saint1Votes / data.totalVotes) * 100) : 50,
              saint2Percentage: data.totalVotes > 0 ? Math.round((data.saint2Votes / data.totalVotes) * 100) : 50,
              totalVotes: data.totalVotes,
              userHasVoted: userVoted,
              userVotedFor: votedFor || undefined,
              votingEnded: votingEnded,
              timeRemaining: remaining,
            });

            setTimeRemaining(remaining);
          }
        });

        setIsLoading(false);
        return unsubscribe;
      } catch (error) {
        console.error('Error loading voting session:', error);
        toast({
          title: 'Error loading voting',
          description: 'Failed to load voting data. Please refresh the page.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        setIsLoading(false);
      }
    };

    const unsubscribe = loadVotingSession();
    return () => {
      if (unsubscribe instanceof Promise) {
        unsubscribe.then(fn => fn && fn());
      }
    };
  }, [widget.id, postSlug, isPreview]);

  // Update time remaining every minute
  useEffect(() => {
    if (!votingResults?.votingEnded && timeRemaining !== null) {
      const interval = setInterval(() => {
        const newTimeRemaining = timeRemaining - 60000; // Subtract 1 minute
        setTimeRemaining(Math.max(0, newTimeRemaining));

        if (newTimeRemaining <= 0) {
          setVotingResults(prev => prev ? { ...prev, votingEnded: true } : null);
        }
      }, 60000);

      return () => clearInterval(interval);
    }
  }, [timeRemaining, votingResults?.votingEnded]);

  // Handle vote submission
  const handleVote = async (saintChoice: 'saint1' | 'saint2') => {
    if (isPreview) {
      toast({
        title: 'Preview Mode',
        description: 'Voting is disabled in preview mode.',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!votingResults || votingResults.votingEnded || hasVoted) return;

    setIsVoting(true);
    try {
      // Check if db is available
      if (!db) {
        throw new Error('Firebase not initialized');
      }

      const browserFingerprint = getBrowserFingerprint();

      // Check for duplicate votes by fingerprint
      const votesRef = collection(db, 'saintVotes');
      const voteQuery = query(
        votesRef,
        where('sessionId', '==', votingResults.sessionId),
        where('voterHash', '==', browserFingerprint)
      );
      const existingVotes = await getDocs(voteQuery);

      if (!existingVotes.empty) {
        toast({
          title: 'Already Voted',
          description: 'You have already voted in this poll today.',
          status: 'warning',
          duration: 5000,
          isClosable: true,
        });
        setIsVoting(false);
        return;
      }

      // Submit vote
      await addDoc(votesRef, {
        sessionId: votingResults.sessionId,
        widgetId: widget.id,
        saintId: saintChoice,
        voterHash: browserFingerprint,
        timestamp: new Date(),
      });

      // Update vote counts
      const sessionRef = doc(db, 'votingSessions', votingResults.sessionId);
      const updateField = saintChoice === 'saint1' ? 'saint1Votes' : 'saint2Votes';

      await updateDoc(sessionRef, {
        [updateField]: increment(1),
        totalVotes: increment(1),
        lastUpdated: new Date(),
      });

      // Store vote in localStorage
      const voteKey = `vote_${widget.id}_${new Date().toDateString()}`;
      localStorage.setItem(voteKey, saintChoice);

      setHasVoted(true);
      setVotedFor(saintChoice);

      toast({
        title: 'Vote Recorded!',
        description: `Your vote for ${saintChoice === 'saint1' ? widget.saint1Name : widget.saint2Name} has been recorded.`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

    } catch (error) {
      console.error('Error submitting vote:', error);
      toast({
        title: 'Vote Failed',
        description: 'Failed to record your vote. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsVoting(false);
    }
  };

  if (isLoading) {
    return (
      <Box
        p={6}
        borderWidth="2px"
        borderColor="saintfest.200"
        borderRadius="lg"
        bg="white"
        textAlign="center"
      >
        <Spinner size="md" color="saintfest.500" />
        <Text mt={2} fontSize="sm" color="gray.600">Loading voting...</Text>
      </Box>
    );
  }

  if (!votingResults) {
    return (
      <Box
        p={6}
        borderWidth="2px"
        borderColor="red.200"
        borderRadius="lg"
        bg="white"
        textAlign="center"
      >
        <Text color="red.600">Failed to load voting data.</Text>
      </Box>
    );
  }

  const showResults = hasVoted || votingResults.votingEnded;

  return (
    <Box
      p={6}
      borderWidth="2px"
      borderColor="saintfest.300"
      borderRadius="lg"
      bg="white"
      shadow="md"
      maxW="500px"
      mx="auto"
      my={6}
    >
      <VStack spacing={4} align="stretch">
        {/* Header */}
        <VStack spacing={2}>
          <Heading
            size="md"
            textAlign="center"
            fontFamily="var(--font-sorts-mill)"
            color="gray.800"
          >
            Saint Voting
          </Heading>
          <Text
            fontSize="sm"
            color="gray.600"
            textAlign="center"
            fontFamily="var(--font-league-spartan)"
            textTransform="uppercase"
            letterSpacing="0.05em"
          >
            Choose your preferred saint
          </Text>
        </VStack>

        {/* Time Remaining */}
        {!votingResults.votingEnded && timeRemaining !== null && (
          <Box textAlign="center">
            <Badge colorScheme="orange" fontSize="xs">
              {formatTimeRemaining(timeRemaining)}
            </Badge>
          </Box>
        )}

        {/* Voting Ended Message */}
        {votingResults.votingEnded && (
          <Box textAlign="center">
            <Badge colorScheme="red" fontSize="xs">
              Voting has ended
            </Badge>
          </Box>
        )}

        {/* Voting Buttons or Results */}
        {!showResults ? (
          <VStack spacing={3}>
            <Button
              size="lg"
              w="full"
              bg="saintfest.500"
              color="white"
              _hover={{ bg: 'saintfest.600' }}
              _active={{ bg: 'saintfest.700' }}
              onClick={() => handleVote('saint1')}
              isLoading={isVoting}
              isDisabled={votingResults.votingEnded}
              fontFamily="var(--font-cormorant)"
              fontSize="lg"
              fontWeight="600"
              py={6}
            >
              {widget.saint1Name}
            </Button>

            <Text
              fontSize="sm"
              color="gray.500"
              textAlign="center"
              fontFamily="var(--font-league-spartan)"
              textTransform="uppercase"
              letterSpacing="0.05em"
            >
              VS
            </Text>

            <Button
              size="lg"
              w="full"
              bg="saintfest.500"
              color="white"
              _hover={{ bg: 'saintfest.600' }}
              _active={{ bg: 'saintfest.700' }}
              onClick={() => handleVote('saint2')}
              isLoading={isVoting}
              isDisabled={votingResults.votingEnded}
              fontFamily="var(--font-cormorant)"
              fontSize="lg"
              fontWeight="600"
              py={6}
            >
              {widget.saint2Name}
            </Button>
          </VStack>
        ) : (
          <VStack spacing={4}>
            {/* Results Header */}
            <Text
              fontSize="sm"
              color="gray.600"
              textAlign="center"
              fontFamily="var(--font-league-spartan)"
              textTransform="uppercase"
              letterSpacing="0.05em"
            >
              Voting Results
            </Text>

            {/* Saint 1 Results */}
            <Box w="full">
              <HStack justify="space-between" mb={2}>
                <Text
                  fontWeight="semibold"
                  fontFamily="var(--font-cormorant)"
                  color={votedFor === 'saint1' ? 'saintfest.700' : 'gray.700'}
                >
                  {widget.saint1Name}
                  {votedFor === 'saint1' && (
                    <Badge ml={2} colorScheme="green" size="sm">Your Vote</Badge>
                  )}
                </Text>
                <Text fontWeight="bold" color="saintfest.600">
                  {votingResults.saint1Percentage}%
                </Text>
              </HStack>
              <Progress
                value={votingResults.saint1Percentage}
                colorScheme="green"
                size="md"
                borderRadius="md"
              />
              <Text fontSize="xs" color="gray.500" mt={1}>
                {votingResults.saint1Votes} votes
              </Text>
            </Box>

            {/* Saint 2 Results */}
            <Box w="full">
              <HStack justify="space-between" mb={2}>
                <Text
                  fontWeight="semibold"
                  fontFamily="var(--font-cormorant)"
                  color={votedFor === 'saint2' ? 'saintfest.700' : 'gray.700'}
                >
                  {widget.saint2Name}
                  {votedFor === 'saint2' && (
                    <Badge ml={2} colorScheme="green" size="sm">Your Vote</Badge>
                  )}
                </Text>
                <Text fontWeight="bold" color="saintfest.600">
                  {votingResults.saint2Percentage}%
                </Text>
              </HStack>
              <Progress
                value={votingResults.saint2Percentage}
                colorScheme="green"
                size="md"
                borderRadius="md"
              />
              <Text fontSize="xs" color="gray.500" mt={1}>
                {votingResults.saint2Votes} votes
              </Text>
            </Box>

            {/* Total Votes */}
            <Text
              fontSize="sm"
              color="gray.600"
              textAlign="center"
              fontFamily="var(--font-league-spartan)"
              textTransform="uppercase"
              letterSpacing="0.05em"
            >
              Total Votes: {votingResults.totalVotes}
            </Text>
          </VStack>
        )}
      </VStack>
    </Box>
  );
}