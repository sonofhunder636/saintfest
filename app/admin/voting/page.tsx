'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import {
  ChakraProvider,
  Box,
  Container,
  Heading,
  VStack,
  HStack,
  Button,
  Text,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Select,
  Input,
  FormControl,
  FormLabel,
  useColorModeValue,
  Alert,
  AlertIcon,
  Badge,
} from '@chakra-ui/react';
import { saintfestTheme } from '@/lib/chakra-theme';
import { BarChart3, Calendar, Download, Filter, RefreshCw } from 'lucide-react';
import VotingResults from '@/components/voting/VotingResults';

function VotingDashboardContent() {
  const router = useRouter();
  const { currentUser, loading } = useRequireAuth();
  const [selectedPost, setSelectedPost] = useState<string>('');
  const [dateRange, setDateRange] = useState<{
    start: string;
    end: string;
  }>({
    start: '',
    end: ''
  });
  const [refreshKey, setRefreshKey] = useState(0);

  // UI Colors
  const bgColor = useColorModeValue('#fffbeb', 'gray.900');
  const headerBg = useColorModeValue('#8FBC8F', 'gray.800');

  // Default date range (last 30 days)
  useEffect(() => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));

    setDateRange({
      start: thirtyDaysAgo.toISOString().split('T')[0],
      end: now.toISOString().split('T')[0]
    });
  }, []);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const parseDateRange = () => {
    if (!dateRange.start || !dateRange.end) return undefined;

    return {
      start: new Date(dateRange.start),
      end: new Date(dateRange.end + 'T23:59:59')
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{backgroundColor: '#fffbeb'}}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4" style={{borderBottomColor: '#8FBC8F'}}></div>
          <p style={{fontFamily: 'var(--font-cormorant)', fontSize: '1.125rem', color: '#6b7280'}}>Loading voting dashboard...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
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
          <HStack justify="space-between" align="center">
            <VStack align="start" spacing={1}>
              <Heading
                size="lg"
                fontFamily="var(--font-sorts-mill)"
                color="white"
                fontWeight="600"
              >
                Voting Dashboard
              </Heading>
              <Text
                fontSize="sm"
                color="whiteAlpha.800"
                fontFamily="var(--font-league-spartan)"
                textTransform="uppercase"
                letterSpacing="0.05em"
              >
                Saint voting analytics and results
              </Text>
            </VStack>

            <HStack spacing={4}>
              <Button
                leftIcon={<RefreshCw size={16} />}
                onClick={handleRefresh}
                bg="whiteAlpha.200"
                color="white"
                size="sm"
                _hover={{ bg: 'whiteAlpha.300' }}
              >
                Refresh
              </Button>
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
          </HStack>
        </Container>
      </Box>

      {/* Main Content */}
      <Container maxW="7xl" py={8}>
        <VStack spacing={6} align="stretch">
          {/* Info Alert */}
          <Alert status="info" borderRadius="md">
            <AlertIcon />
            <Box>
              <Text fontSize="sm" fontWeight="semibold">
                Saint Voting Analytics
              </Text>
              <Text fontSize="sm">
                View and analyze voting results from blog post saint competitions.
                Vote totals and detailed analytics are only visible to authenticated administrators.
              </Text>
            </Box>
          </Alert>

          {/* Filters */}
          <Box
            p={6}
            bg="white"
            borderWidth="1px"
            borderColor="gray.200"
            borderRadius="lg"
            shadow="sm"
          >
            <VStack spacing={4} align="stretch">
              <HStack align="center" spacing={2}>
                <Filter size={20} color="#8FBC8F" />
                <Heading size="md" fontFamily="var(--font-sorts-mill)">
                  Filters
                </Heading>
              </HStack>

              <HStack spacing={4} align="end">
                <FormControl flex="1">
                  <FormLabel fontSize="sm">Post Filter</FormLabel>
                  <Select
                    placeholder="All posts"
                    value={selectedPost}
                    onChange={(e) => setSelectedPost(e.target.value)}
                    size="sm"
                  >
                    <option value="help-wanted-blessed-intercessor">Help Wanted: Blessed Intercessor</option>
                    <option value="casting-lots">Casting Lots</option>
                    <option value="o-beauty-ever-ancient-ever-new">O Beauty Ever Ancient, Ever New</option>
                  </Select>
                </FormControl>

                <FormControl maxW="150px">
                  <FormLabel fontSize="sm">Start Date</FormLabel>
                  <Input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                    size="sm"
                  />
                </FormControl>

                <FormControl maxW="150px">
                  <FormLabel fontSize="sm">End Date</FormLabel>
                  <Input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                    size="sm"
                  />
                </FormControl>

                <Button
                  leftIcon={<Calendar size={14} />}
                  onClick={() => {
                    setSelectedPost('');
                    const now = new Date();
                    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
                    setDateRange({
                      start: thirtyDaysAgo.toISOString().split('T')[0],
                      end: now.toISOString().split('T')[0]
                    });
                    setRefreshKey(prev => prev + 1);
                  }}
                  size="sm"
                  variant="outline"
                >
                  Reset
                </Button>
              </HStack>
            </VStack>
          </Box>

          {/* Results */}
          <Box
            p={6}
            bg="white"
            borderWidth="1px"
            borderColor="gray.200"
            borderRadius="lg"
            shadow="sm"
          >
            <VotingResults
              key={refreshKey}
              postSlug={selectedPost || undefined}
              dateRange={parseDateRange()}
            />
          </Box>

          {/* Feature Notice */}
          <Alert status="success" borderRadius="md">
            <AlertIcon />
            <Box>
              <Text fontSize="sm" fontWeight="semibold">
                Real-time Updates
              </Text>
              <Text fontSize="sm">
                Voting results update in real-time as users cast their votes.
                Use the refresh button to manually update the data or wait for automatic updates.
              </Text>
            </Box>
          </Alert>

          {/* Legend */}
          <Box
            p={4}
            bg="gray.50"
            borderRadius="md"
            borderWidth="1px"
            borderColor="gray.200"
          >
            <VStack spacing={3} align="stretch">
              <Heading size="sm" fontFamily="var(--font-sorts-mill)">
                Legend
              </Heading>
              <HStack spacing={6} wrap="wrap">
                <HStack spacing={2}>
                  <Badge colorScheme="green" size="sm">Active</Badge>
                  <Text fontSize="xs">Voting session is currently accepting votes</Text>
                </HStack>
                <HStack spacing={2}>
                  <Badge colorScheme="gray" size="sm">Ended</Badge>
                  <Text fontSize="xs">Voting session has closed (after 11:59 PM)</Text>
                </HStack>
                <HStack spacing={2}>
                  <Badge colorScheme="orange" size="sm">Tie</Badge>
                  <Text fontSize="xs">Both saints have equal votes</Text>
                </HStack>
              </HStack>
            </VStack>
          </Box>
        </VStack>
      </Container>
    </Box>
  );
}

// Main wrapper component that provides Chakra UI context
export default function VotingDashboardPage() {
  return (
    <ChakraProvider theme={saintfestTheme}>
      <VotingDashboardContent />
    </ChakraProvider>
  );
}