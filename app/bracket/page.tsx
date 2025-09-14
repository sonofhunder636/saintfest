'use client';

import { useState, useEffect } from 'react';
import {
  ChakraProvider,
  Box,
  Flex,
  Heading,
  Text,
  Button,
  Spinner,
  Alert,
  AlertIcon,
  VStack
} from '@chakra-ui/react';
import { PublishedBracket } from '@/types';
import { saintfestTheme } from '@/lib/chakra-theme';
import Navigation from '@/components/Navigation';
import PublishedBracketDisplay from '@/components/bracket/PublishedBracketDisplay';

export default function PublicBracketPage() {
  const [publishedBracket, setPublishedBracket] = useState<PublishedBracket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadPublishedBracket();
  }, []);

  const loadPublishedBracket = async () => {
    try {
      const response = await fetch('/api/bracket/current');
      const result = await response.json();

      if (result.success) {
        setPublishedBracket(result.bracket);
      } else {
        setError(result.error || 'Failed to load bracket');
      }
    } catch (err) {
      console.error('Failed to load published bracket:', err);
      setError('Failed to load bracket data');
    } finally {
      setLoading(false);
    }
  };

  const downloadBracket = async () => {
    if (!publishedBracket) return;
    try {
      const response = await fetch(`/api/bracket/published-pdf`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `saintfest-${publishedBracket.year}-bracket.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Failed to download bracket:', error);
      alert('Failed to download bracket. Please try again.');
    }
  };

  const shareBracket = async () => {
    if (!publishedBracket) return;
    const url = `${window.location.origin}/bracket`;
    try {
      await navigator.share({
        title: `Saintfest ${publishedBracket.year} Bracket`,
        text: 'Check out this March Madness style saint tournament!',
        url: url,
      });
    } catch (error) {
      // Fallback to copying to clipboard
      navigator.clipboard.writeText(url);
      alert('Bracket URL copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <ChakraProvider theme={saintfestTheme}>
        <Box minH="100vh" bg="cream.50" display="flex" alignItems="center" justifyContent="center">
          <VStack spacing={4}>
            <Spinner size="xl" color="saintfest.500" thickness="4px" />
            <Text fontFamily="var(--font-cormorant)" fontSize="lg" color="gray.600">
              Loading bracket...
            </Text>
          </VStack>
        </Box>
      </ChakraProvider>
    );
  }

  if (error) {
    return (
      <ChakraProvider theme={saintfestTheme}>
        <Box minH="100vh" bg="cream.50" display="flex" alignItems="center" justifyContent="center" p={6}>
          <Alert status="error" maxW="md" borderRadius="lg">
            <AlertIcon />
            <Text>{error}</Text>
          </Alert>
        </Box>
      </ChakraProvider>
    );
  }

  return (
    <ChakraProvider theme={saintfestTheme}>
      <Box minH="100vh" bg="cream.50">
        {/* Header */}
        <Box
          as="header"
          position="sticky"
          top={0}
          zIndex={1000}
          w="100%"
          bg="saintfest.500"
          py={4}
          mb={8}
          boxShadow="sm"
        >
          <Box maxW="64rem" mx="auto" px={6}>
            <Flex justify="space-between" align="center">
              <Heading
                as="a"
                href="/"
                fontSize="4xl"
                fontFamily="var(--font-sorts-mill)"
                color="white"
                textDecoration="none"
                fontWeight="600"
                textShadow="0 1px 2px rgba(0,0,0,0.1)"
                _hover={{ textDecoration: 'none' }}
              >
                Saintfest
              </Heading>

              <Navigation />
            </Flex>
          </Box>
        </Box>

        <Box as="main">
          {publishedBracket ? (
            <VStack spacing={8}>
              {/* Clean Bracket Display */}
              <PublishedBracketDisplay bracket={publishedBracket} />

              {/* Download PDF Button */}
              <Box textAlign="center" py={8}>
                <Button
                  onClick={downloadBracket}
                  size="lg"
                  bg="saintfest.500"
                  color="white"
                  px={8}
                  py={4}
                  fontSize="lg"
                  fontFamily="var(--font-league-spartan)"
                  textTransform="uppercase"
                  letterSpacing="wide"
                  fontWeight="600"
                  borderRadius="lg"
                  boxShadow="lg"
                  _hover={{
                    bg: 'saintfest.600',
                    transform: 'translateY(-2px)',
                    boxShadow: 'xl'
                  }}
                  _active={{
                    transform: 'translateY(0)'
                  }}
                  transition="all 0.2s"
                >
                  📄 Download Printable Bracket PDF
                </Button>
                <Text
                  mt={3}
                  fontSize="sm"
                  color="gray.500"
                  fontFamily="var(--font-cormorant)"
                >
                  Perfect for printing and filling out your predictions!
                </Text>
              </Box>
            </VStack>
          ) : (
            /* Coming Soon Message */
            <Box textAlign="center" maxW="48rem" mx="auto" px={6} py={12}>
              <VStack spacing={12}>
                <VStack spacing={6}>
                  <Heading
                    fontSize="5xl"
                    fontFamily="var(--font-sorts-mill)"
                    color="gray.700"
                    fontWeight="600"
                  >
                    2025 Saintfest Bracket
                  </Heading>
                  <Box w="24" h="1px" bg="gray.300" />
                </VStack>

                <VStack spacing={6}>
                  <Heading
                    fontSize="3xl"
                    fontFamily="var(--font-sorts-mill)"
                    color="gray.700"
                    fontWeight="600"
                  >
                    Announcement Coming Soon!
                  </Heading>
                  <Text
                    fontFamily="var(--font-cormorant)"
                    fontSize="lg"
                    lineHeight="tall"
                    color="gray.500"
                    maxW="32rem"
                  >
                    The 2025 Saintfest bracket will be announced soon.
                    <br />
                    Until then, explore our community posts and learn about past tournaments!
                  </Text>
                </VStack>

                <Button
                  as="a"
                  href="/posts/"
                  bg="saintfest.500"
                  color="white"
                  px={6}
                  py={3}
                  borderRadius="md"
                  fontFamily="var(--font-league-spartan)"
                  textTransform="uppercase"
                  letterSpacing="wide"
                  fontWeight="600"
                  fontSize="sm"
                  _hover={{
                    bg: 'saintfest.600',
                    textDecoration: 'none'
                  }}
                >
                  Read Latest Posts
                </Button>
              </VStack>
            </Box>
          )}
        </Box>

        <Box
          as="footer"
          borderTop="1px solid"
          borderColor="gray.200"
          py={16}
          mt={16}
        >
          <Box maxW="48rem" mx="auto" px={6} textAlign="center">
            <Text
              fontSize="xs"
              fontFamily="var(--font-league-spartan)"
              textTransform="uppercase"
              letterSpacing="wide"
              color="gray.400"
            >
              © 2024 Saintfest · A celebration of saints through community
            </Text>
          </Box>
        </Box>
      </Box>
    </ChakraProvider>
  );
}