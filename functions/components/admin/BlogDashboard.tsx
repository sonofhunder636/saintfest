'use client';

import { useState, useEffect } from 'react';
import { usePosts } from '@/hooks/usePosts';
import { 
  Grid, 
  GridItem, 
  Box, 
  Stat, 
  StatLabel, 
  StatNumber, 
  StatHelpText,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Text,
  useColorModeValue,
  SimpleGrid,
  Progress,
  VStack,
  HStack,
  Badge,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Skeleton,
  SkeletonText
} from '@chakra-ui/react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { 
  FileText, 
  Eye, 
  Heart, 
  MessageCircle, 
  TrendingUp, 
  Clock,
  Star,
  Archive,
  Calendar
} from 'lucide-react';

const COLORS = ['#8FBC8F', '#DDA0DD', '#F0E68C', '#FFA07A', '#98FB98', '#87CEEB'];

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color?: string;
  helpText?: string;
}

function StatCard({ title, value, icon, color = 'green', helpText }: StatCardProps) {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  return (
    <Card bg={bgColor} borderColor={borderColor} borderWidth="1px">
      <CardBody>
        <HStack spacing={4}>
          <Box color={`${color}.500`} fontSize="2xl">
            {icon}
          </Box>
          <Box flex="1">
            <Stat>
              <StatLabel fontSize="sm" color="gray.500" fontWeight="medium">
                {title}
              </StatLabel>
              <StatNumber fontSize="2xl" fontWeight="bold">
                {value.toLocaleString()}
              </StatNumber>
              {helpText && (
                <StatHelpText fontSize="xs" color="gray.400">
                  {helpText}
                </StatHelpText>
              )}
            </Stat>
          </Box>
        </HStack>
      </CardBody>
    </Card>
  );
}

interface BlogDashboardProps {
  onNavigateToEditor?: () => void;
  onNavigateToList?: () => void;
}

export default function BlogDashboard({ onNavigateToEditor, onNavigateToList }: BlogDashboardProps) {
  const { stats, statsLoading, fetchStats, error } = usePosts();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (statsLoading) {
    return (
      <Box p={6}>
        <VStack spacing={6} align="stretch">
          <Box>
            <Skeleton height="40px" width="300px" mb={2} />
            <SkeletonText mt={4} noOfLines={2} spacing={4} />
          </Box>
          
          <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
            {Array(4).fill(0).map((_, i) => (
              <Skeleton key={i} height="120px" />
            ))}
          </SimpleGrid>
          
          <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
            <Skeleton height="300px" />
            <Skeleton height="300px" />
          </SimpleGrid>
        </VStack>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert status="error" borderRadius="md">
        <AlertIcon />
        <AlertTitle>Error loading dashboard!</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!stats) {
    return (
      <Alert status="info" borderRadius="md">
        <AlertIcon />
        <AlertTitle>No data available</AlertTitle>
        <AlertDescription>
          Start by creating your first blog post to see analytics.
        </AlertDescription>
      </Alert>
    );
  }

  // Prepare chart data
  const statusData = Object.entries(stats.statusDistribution).map(([status, count]) => ({
    name: status.charAt(0).toUpperCase() + status.slice(1),
    value: count,
    color: status === 'published' ? '#8FBC8F' : 
           status === 'draft' ? '#DDA0DD' : 
           status === 'scheduled' ? '#F0E68C' : '#FFA07A'
  }));

  const priorityData = Object.entries(stats.priorityDistribution).map(([priority, count]) => ({
    name: priority.charAt(0).toUpperCase() + priority.slice(1),
    value: count
  }));

  return (
    <Box p={6}>
      <VStack spacing={8} align="stretch">
        {/* Header */}
        <Box>
          <Heading size="lg" mb={2} fontFamily="var(--font-sorts-mill)">
            Blog Dashboard
          </Heading>
          <Text color="gray.600" fontSize="md">
            Overview of your blog performance and statistics
          </Text>
        </Box>

        {/* Key Stats */}
        <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} spacing={6}>
          <StatCard
            title="Total Posts"
            value={stats.totalPosts}
            icon={<FileText />}
            color="blue"
            helpText="All posts in system"
          />
          <StatCard
            title="Published"
            value={stats.publishedPosts}
            icon={<Eye />}
            color="green"
            helpText="Live on your site"
          />
          <StatCard
            title="Total Views"
            value={stats.totalViews}
            icon={<TrendingUp />}
            color="purple"
            helpText="Across all posts"
          />
          <StatCard
            title="Total Engagement"
            value={stats.totalLikes + stats.totalComments}
            icon={<Heart />}
            color="red"
            helpText="Likes + Comments"
          />
        </SimpleGrid>

        {/* Secondary Stats */}
        <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} spacing={6}>
          <StatCard
            title="Drafts"
            value={stats.draftPosts}
            icon={<FileText />}
            color="yellow"
            helpText="Work in progress"
          />
          <StatCard
            title="Scheduled"
            value={stats.scheduledPosts}
            icon={<Clock />}
            color="orange"
            helpText="Future publishing"
          />
          <StatCard
            title="Featured"
            value={stats.featuredPosts}
            icon={<Star />}
            color="purple"
            helpText="Highlighted content"
          />
          <StatCard
            title="Archived"
            value={stats.archivedPosts}
            icon={<Archive />}
            color="gray"
            helpText="No longer active"
          />
        </SimpleGrid>

        {/* Charts Row */}
        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={8}>
          {/* Post Status Distribution */}
          <Card bg={bgColor} borderColor={borderColor} borderWidth="1px">
            <CardHeader>
              <Heading size="md" fontWeight="semibold">
                Post Status Distribution
              </Heading>
            </CardHeader>
            <CardBody>
              <Box height="300px">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </CardBody>
          </Card>

          {/* Monthly Trends */}
          <Card bg={bgColor} borderColor={borderColor} borderWidth="1px">
            <CardHeader>
              <Heading size="md" fontWeight="semibold">
                Monthly Publishing Trends
              </Heading>
            </CardHeader>
            <CardBody>
              <Box height="300px">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.monthlyTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="posts"
                      stroke="#8FBC8F"
                      fill="#8FBC8F"
                      fillOpacity={0.6}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Content Analytics */}
        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={8}>
          {/* Priority Distribution */}
          <Card bg={bgColor} borderColor={borderColor} borderWidth="1px">
            <CardHeader>
              <Heading size="md" fontWeight="semibold">
                Priority Distribution
              </Heading>
            </CardHeader>
            <CardBody>
              <VStack spacing={4} align="stretch">
                {priorityData.map((item, index) => (
                  <Box key={item.name}>
                    <HStack justify="space-between" mb={2}>
                      <Text fontSize="sm" fontWeight="medium">
                        {item.name} Priority
                      </Text>
                      <Text fontSize="sm" color="gray.500">
                        {item.value} posts
                      </Text>
                    </HStack>
                    <Progress
                      value={(item.value / stats.totalPosts) * 100}
                      colorScheme={item.name === 'High' ? 'red' : item.name === 'Medium' ? 'orange' : 'gray'}
                      size="sm"
                      borderRadius="md"
                    />
                  </Box>
                ))}
              </VStack>
            </CardBody>
          </Card>

          {/* Content Metrics */}
          <Card bg={bgColor} borderColor={borderColor} borderWidth="1px">
            <CardHeader>
              <Heading size="md" fontWeight="semibold">
                Content Metrics
              </Heading>
            </CardHeader>
            <CardBody>
              <VStack spacing={4} align="stretch">
                <HStack justify="space-between">
                  <Text fontSize="sm" color="gray.600">
                    Average words per post
                  </Text>
                  <Text fontSize="lg" fontWeight="semibold">
                    {stats.avgWordsPerPost}
                  </Text>
                </HStack>
                <HStack justify="space-between">
                  <Text fontSize="sm" color="gray.600">
                    Average reading time
                  </Text>
                  <Text fontSize="lg" fontWeight="semibold">
                    {stats.avgReadTime} min
                  </Text>
                </HStack>
                <HStack justify="space-between">
                  <Text fontSize="sm" color="gray.600">
                    Total comments
                  </Text>
                  <Text fontSize="lg" fontWeight="semibold">
                    {stats.totalComments}
                  </Text>
                </HStack>
                <HStack justify="space-between">
                  <Text fontSize="sm" color="gray.600">
                    Total likes
                  </Text>
                  <Text fontSize="lg" fontWeight="semibold">
                    {stats.totalLikes}
                  </Text>
                </HStack>
              </VStack>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Top Tags and Categories */}
        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={8}>
          {/* Top Tags */}
          <Card bg={bgColor} borderColor={borderColor} borderWidth="1px">
            <CardHeader>
              <Heading size="md" fontWeight="semibold">
                Top Tags
              </Heading>
            </CardHeader>
            <CardBody>
              <VStack align="stretch" spacing={3}>
                {stats.topTags.length > 0 ? (
                  stats.topTags.slice(0, 8).map((tag) => (
                    <HStack key={tag.tag} justify="space-between">
                      <Badge colorScheme="green" variant="subtle">
                        {tag.tag}
                      </Badge>
                      <Text fontSize="sm" color="gray.500">
                        {tag.count} posts
                      </Text>
                    </HStack>
                  ))
                ) : (
                  <Text color="gray.500" fontStyle="italic">
                    No tags used yet
                  </Text>
                )}
              </VStack>
            </CardBody>
          </Card>

          {/* Recent Activity */}
          <Card bg={bgColor} borderColor={borderColor} borderWidth="1px">
            <CardHeader>
              <Heading size="md" fontWeight="semibold">
                Recent Activity
              </Heading>
            </CardHeader>
            <CardBody>
              <VStack align="stretch" spacing={3}>
                {stats.recentActivity.length > 0 ? (
                  stats.recentActivity.slice(0, 6).map((activity) => (
                    <HStack key={activity.id} justify="space-between">
                      <VStack align="start" spacing={0}>
                        <Text fontSize="sm" fontWeight="medium" noOfLines={1}>
                          {activity.title}
                        </Text>
                        <HStack spacing={2}>
                          <Badge
                            size="sm"
                            colorScheme={
                              activity.status === 'published' ? 'green' :
                              activity.status === 'draft' ? 'gray' :
                              activity.status === 'scheduled' ? 'orange' : 'red'
                            }
                          >
                            {activity.status}
                          </Badge>
                          <Text fontSize="xs" color="gray.500">
                            {new Date(activity.updatedAt).toLocaleDateString()}
                          </Text>
                        </HStack>
                      </VStack>
                    </HStack>
                  ))
                ) : (
                  <Text color="gray.500" fontStyle="italic">
                    No recent activity
                  </Text>
                )}
              </VStack>
            </CardBody>
          </Card>
        </SimpleGrid>
      </VStack>
    </Box>
  );
}