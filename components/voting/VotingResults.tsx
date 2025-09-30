'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Heading,
  Badge,
  Progress,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Spinner,
  Alert,
  AlertIcon,
  Button,
  useColorModeValue,
  Card,
  CardBody,
  CardHeader,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  SimpleGrid,
} from '@chakra-ui/react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { VotingAdminData } from '@/types';
import { Calendar, TrendingUp, Users, Vote } from 'lucide-react';

interface VotingResultsProps {
  postSlug?: string; // Filter by specific post
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export default function VotingResults({ postSlug, dateRange }: VotingResultsProps) {
  const [votingData, setVotingData] = useState<VotingAdminData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // Load voting data
  useEffect(() => {
    const loadVotingData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Check if db is available
        if (!db) {
          throw new Error('Firebase not initialized');
        }

        // Query voting sessions
        const sessionsRef = collection(db, 'votingSessions');
        let sessionQuery = query(sessionsRef, orderBy('opensAt', 'desc'));

        // Filter by post slug if provided
        if (postSlug) {
          sessionQuery = query(sessionsRef, where('postSlug', '==', postSlug), orderBy('opensAt', 'desc'));
        }

        const sessionSnapshot = await getDocs(sessionQuery);

        if (sessionSnapshot.empty) {
          setVotingData([]);
          setIsLoading(false);
          return;
        }

        const adminData: VotingAdminData[] = [];

        for (const doc of sessionSnapshot.docs) {
          const sessionData = doc.data();

          // Filter by date range if provided
          if (dateRange) {
            const opensAt = sessionData.opensAt.toDate();
            if (opensAt < dateRange.start || opensAt > dateRange.end) {
              continue;
            }
          }

          // Get vote history for this session (simplified for now)
          const voteHistory = [{
            timestamp: sessionData.lastUpdated.toDate(),
            saint1Votes: sessionData.saint1Votes,
            saint2Votes: sessionData.saint2Votes,
          }];

          adminData.push({
            sessionId: doc.id,
            widgetId: sessionData.widgetId,
            postSlug: sessionData.postSlug,
            postTitle: `Post: ${sessionData.postSlug}`, // Could be enhanced with actual post titles
            saint1Name: sessionData.saint1Name || 'Saint 1',
            saint2Name: sessionData.saint2Name || 'Saint 2',
            saint1Votes: sessionData.saint1Votes,
            saint2Votes: sessionData.saint2Votes,
            totalVotes: sessionData.totalVotes,
            opensAt: sessionData.opensAt.toDate(),
            closesAt: sessionData.closesAt.toDate(),
            isActive: sessionData.isActive,
            voteHistory,
          });
        }

        setVotingData(adminData);
      } catch (error) {
        console.error('Error loading voting data:', error);
        setError('Failed to load voting data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    loadVotingData();
  }, [postSlug, dateRange]);

  // Calculate summary statistics
  const summaryStats = {
    totalSessions: votingData.length,
    totalVotes: votingData.reduce((sum, data) => sum + data.totalVotes, 0),
    activeSessions: votingData.filter(data => data.isActive).length,
    averageVotesPerSession: votingData.length > 0
      ? Math.round(votingData.reduce((sum, data) => sum + data.totalVotes, 0) / votingData.length)
      : 0,
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getWinner = (data: VotingAdminData) => {
    if (data.totalVotes === 0) return 'No votes yet';
    if (data.saint1Votes > data.saint2Votes) return data.saint1Name;
    if (data.saint2Votes > data.saint1Votes) return data.saint2Name;
    return 'Tie';
  };

  if (isLoading) {
    return (
      <Box p={6} textAlign="center">
        <Spinner size="lg" color="saintfest.500" />
        <Text mt={4} fontSize="sm" color="gray.600">Loading voting results...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert status="error" borderRadius="md">
        <AlertIcon />
        <Text>{error}</Text>
      </Alert>
    );
  }

  return (
    <VStack spacing={6} align="stretch">
      {/* Summary Stats */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
        <Card bg={bgColor} borderColor={borderColor} borderWidth="1px">
          <CardBody>
            <Stat>
              <StatLabel fontSize="sm" color="gray.500">
                <HStack>
                  <Vote size={14} />
                  <Text>Total Sessions</Text>
                </HStack>
              </StatLabel>
              <StatNumber fontSize="2xl" color="saintfest.600">
                {summaryStats.totalSessions}
              </StatNumber>
              <StatHelpText fontSize="xs">
                Voting sessions created
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card bg={bgColor} borderColor={borderColor} borderWidth="1px">
          <CardBody>
            <Stat>
              <StatLabel fontSize="sm" color="gray.500">
                <HStack>
                  <Users size={14} />
                  <Text>Total Votes</Text>
                </HStack>
              </StatLabel>
              <StatNumber fontSize="2xl" color="saintfest.600">
                {summaryStats.totalVotes.toLocaleString()}
              </StatNumber>
              <StatHelpText fontSize="xs">
                Votes cast across all sessions
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card bg={bgColor} borderColor={borderColor} borderWidth="1px">
          <CardBody>
            <Stat>
              <StatLabel fontSize="sm" color="gray.500">
                <HStack>
                  <TrendingUp size={14} />
                  <Text>Active Sessions</Text>
                </HStack>
              </StatLabel>
              <StatNumber fontSize="2xl" color="green.600">
                {summaryStats.activeSessions}
              </StatNumber>
              <StatHelpText fontSize="xs">
                Currently accepting votes
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card bg={bgColor} borderColor={borderColor} borderWidth="1px">
          <CardBody>
            <Stat>
              <StatLabel fontSize="sm" color="gray.500">
                <HStack>
                  <Calendar size={14} />
                  <Text>Avg. Votes/Session</Text>
                </HStack>
              </StatLabel>
              <StatNumber fontSize="2xl" color="saintfest.600">
                {summaryStats.averageVotesPerSession}
              </StatNumber>
              <StatHelpText fontSize="xs">
                Average engagement per session
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* Voting Sessions Table */}
      <Card bg={bgColor} borderColor={borderColor} borderWidth="1px">
        <CardHeader>
          <Heading size="md" fontFamily="var(--font-sorts-mill)">
            Voting Sessions
          </Heading>
        </CardHeader>
        <CardBody p={0}>
          {votingData.length === 0 ? (
            <Box p={6} textAlign="center">
              <Text color="gray.500" fontSize="sm">
                No voting sessions found.
              </Text>
            </Box>
          ) : (
            <TableContainer>
              <Table variant="simple" size="sm">
                <Thead>
                  <Tr>
                    <Th fontFamily="var(--font-league-spartan)" fontSize="xs">Post</Th>
                    <Th fontFamily="var(--font-league-spartan)" fontSize="xs">Saints</Th>
                    <Th fontFamily="var(--font-league-spartan)" fontSize="xs">Votes</Th>
                    <Th fontFamily="var(--font-league-spartan)" fontSize="xs">Results</Th>
                    <Th fontFamily="var(--font-league-spartan)" fontSize="xs">Winner</Th>
                    <Th fontFamily="var(--font-league-spartan)" fontSize="xs">Status</Th>
                    <Th fontFamily="var(--font-league-spartan)" fontSize="xs">Created</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {votingData.map((data) => (
                    <Tr key={data.sessionId}>
                      <Td>
                        <VStack align="start" spacing={1}>
                          <Text fontSize="sm" fontWeight="medium" noOfLines={1}>
                            {data.postSlug}
                          </Text>
                          <Text fontSize="xs" color="gray.500">
                            {data.widgetId.split('-').slice(-3).join('-')}
                          </Text>
                        </VStack>
                      </Td>
                      <Td>
                        <VStack align="start" spacing={1}>
                          <Text fontSize="sm">
                            {data.saint1Name}
                          </Text>
                          <Text fontSize="xs" color="gray.500">vs</Text>
                          <Text fontSize="sm">
                            {data.saint2Name}
                          </Text>
                        </VStack>
                      </Td>
                      <Td>
                        <VStack align="start" spacing={1}>
                          <Text fontSize="sm" fontWeight="semibold">
                            {data.totalVotes}
                          </Text>
                          <HStack spacing={2}>
                            <Text fontSize="xs" color="gray.600">
                              {data.saint1Votes}
                            </Text>
                            <Text fontSize="xs" color="gray.400">|</Text>
                            <Text fontSize="xs" color="gray.600">
                              {data.saint2Votes}
                            </Text>
                          </HStack>
                        </VStack>
                      </Td>
                      <Td>
                        {data.totalVotes > 0 ? (
                          <VStack spacing={1} align="start">
                            <HStack spacing={2}>
                              <Text fontSize="xs" fontWeight="medium">
                                {data.saint1Name.split(' ')[1] || data.saint1Name}:
                              </Text>
                              <Text fontSize="xs" fontWeight="bold" color="saintfest.600">
                                {Math.round((data.saint1Votes / data.totalVotes) * 100)}%
                              </Text>
                            </HStack>
                            <Progress
                              value={(data.saint1Votes / data.totalVotes) * 100}
                              size="sm"
                              colorScheme="green"
                              borderRadius="sm"
                              w="80px"
                            />
                            <HStack spacing={2}>
                              <Text fontSize="xs" fontWeight="medium">
                                {data.saint2Name.split(' ')[1] || data.saint2Name}:
                              </Text>
                              <Text fontSize="xs" fontWeight="bold" color="saintfest.600">
                                {Math.round((data.saint2Votes / data.totalVotes) * 100)}%
                              </Text>
                            </HStack>
                            <Progress
                              value={(data.saint2Votes / data.totalVotes) * 100}
                              size="sm"
                              colorScheme="green"
                              borderRadius="sm"
                              w="80px"
                            />
                          </VStack>
                        ) : (
                          <Text fontSize="xs" color="gray.500">No votes yet</Text>
                        )}
                      </Td>
                      <Td>
                        <Badge
                          size="sm"
                          colorScheme={
                            getWinner(data) === 'No votes yet' ? 'gray' :
                            getWinner(data) === 'Tie' ? 'orange' : 'green'
                          }
                        >
                          {getWinner(data)}
                        </Badge>
                      </Td>
                      <Td>
                        <Badge
                          size="sm"
                          colorScheme={data.isActive ? 'green' : 'gray'}
                        >
                          {data.isActive ? 'Active' : 'Ended'}
                        </Badge>
                      </Td>
                      <Td>
                        <Text fontSize="xs" color="gray.600">
                          {formatDate(data.opensAt)}
                        </Text>
                        <Text fontSize="xs" color="gray.400">
                          to {formatDate(data.closesAt)}
                        </Text>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </TableContainer>
          )}
        </CardBody>
      </Card>
    </VStack>
  );
}