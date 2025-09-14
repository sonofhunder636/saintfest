'use client';

import { useState, useEffect } from 'react';
import { ChakraProvider, Box, Text, VStack } from '@chakra-ui/react';
import { saintfestTheme } from '@/lib/chakra-theme';
import { PublishedBracket } from '@/types';

interface PublishedBracketDisplayProps {
  bracket: PublishedBracket;
}

export default function PublishedBracketDisplay({ bracket }: PublishedBracketDisplayProps) {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const updateScale = () => {
      const container = document.getElementById('bracket-container');
      if (!container) return;

      const containerWidth = container.offsetWidth;
      const bracketWidth = bracket.dimensions.totalWidth;

      // Calculate appropriate scale based on container width
      let newScale = 1;
      if (containerWidth <= bracket.dimensions.breakpoints.mobile) {
        newScale = bracket.dimensions.scales.mobile;
      } else if (containerWidth <= bracket.dimensions.breakpoints.tablet) {
        newScale = bracket.dimensions.scales.tablet;
      } else if (containerWidth < bracketWidth) {
        // Custom scale if container is smaller than bracket
        newScale = Math.max(0.8, (containerWidth - 40) / bracketWidth); // Min 80% scale for readability
      }

      setScale(Math.min(newScale, 1)); // Never scale above 100%
    };

    // Initial calculation
    setTimeout(updateScale, 100); // Delay to ensure container is rendered

    // Update on window resize
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [bracket.dimensions]);

  if (!bracket || !bracket.matches || bracket.matches.length === 0) {
    return (
      <ChakraProvider theme={saintfestTheme}>
        <Box minH="100vh" display="flex" alignItems="center" justifyContent="center">
          <VStack spacing={4}>
            <Text fontSize="lg" color="gray.600" fontFamily="var(--font-cormorant)">
              No bracket data available
            </Text>
          </VStack>
        </Box>
      </ChakraProvider>
    );
  }

  return (
    <ChakraProvider theme={saintfestTheme}>
      <Box id="bracket-container" w="100%" minH="100vh" bg="cream.50">
        {/* Bracket Container */}
        <Box position="relative" mx="auto" overflowX="auto" p={8}>
          <Box
            position="relative"
            width={`${bracket.dimensions.totalWidth * scale}px`}
            height={`${bracket.dimensions.totalHeight * scale}px`}
            bg="cream.50"
          >
          {/* Connection Lines */}
          <svg
            position="absolute"
            width={`${bracket.dimensions.totalWidth * scale}px`}
            height={`${bracket.dimensions.totalHeight * scale}px`}
            style={{ position: 'absolute', top: 0, left: 0, zIndex: 5, pointerEvents: 'none' }}
          >
            {bracket.connections && bracket.connections.map((connection) => (
              <line
                key={connection.id}
                x1={connection.x1 * scale}
                y1={connection.y1 * scale}
                x2={connection.x2 * scale}
                y2={connection.y2 * scale}
                stroke={connection.color || bracket.colorPalette?.lines || '#9CA3AF'}
                strokeWidth={connection.strokeWidth * scale}
                opacity={0.8}
              />
            ))}
          </svg>

          {/* Tournament Matches */}
          {bracket.matches.map((match) => (
            <Box
              key={match.id}
              position="absolute"
              bg="white"
              border="1px solid"
              borderColor="gray.300"
              borderRadius="md"
              boxShadow="sm"
              left={`${match.position.x * scale}px`}
              top={`${match.position.y * scale}px`}
              width={`${match.position.width * scale}px`}
              height={`${match.position.height * scale}px`}
              zIndex={10}
              _hover={{
                boxShadow: 'md',
                borderColor: 'saintfest.300'
              }}
            >
              <VStack h="100%" spacing={0}>
                <Box
                  h="50%"
                  w="100%"
                  p={1}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  {match.saint1Name ? (
                    <Text
                      fontWeight="medium"
                      color="gray.800"
                      fontSize={`${12 * scale}px`}
                      fontFamily="var(--font-cormorant)"
                    >
                      {match.saint1Name}
                    </Text>
                  ) : (
                    <Box />
                  )}
                </Box>

                <Box w="full" h="1px" bg="gray.200" />

                <Box
                  h="50%"
                  w="100%"
                  p={1}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  {match.saint2Name ? (
                    <Text
                      fontWeight="medium"
                      color="gray.800"
                      fontSize={`${12 * scale}px`}
                      fontFamily="var(--font-cormorant)"
                    >
                      {match.saint2Name}
                    </Text>
                  ) : (
                    <Box />
                  )}
                </Box>
              </VStack>
            </Box>
          ))}

          {/* Category Labels */}
          {bracket.categories.map((category) => {
            if (!category.labelPosition || category.labelPosition.y === undefined) return null;

            return (
              <Box
                key={category.id}
                position="absolute"
                left={`${category.labelPosition.x * scale}px`}
                top={`${category.labelPosition.y * scale}px`}
                width={`${200 * scale}px`}
                height={`${200 * scale}px`}
                zIndex={8}
                display="flex"
                alignItems="center"
                justifyContent="center"
                bg={category.color || 'rgba(255, 255, 255, 0.9)'}
                border="1px solid"
                borderColor="gray.300"
                borderRadius="md"
                boxShadow="sm"
              >
                <Text
                  fontWeight="bold"
                  textAlign="center"
                  fontSize={`${16 * scale}px`}
                  fontFamily="var(--font-sorts-mill)"
                  color="gray.800"
                >
                  {category.name}
                </Text>
              </Box>
            );
          })}

          {/* Center Overlay - Blessed Intercessor */}
          {bracket.centerOverlay && (
            <Box
              position="absolute"
              left={`${bracket.centerOverlay.x * scale}px`}
              top={`${bracket.centerOverlay.y * scale}px`}
              transform="translate(-50%, -50%)"
              zIndex={6}
              textAlign="center"
              pointerEvents="none"
            >
              {bracket.centerOverlay.text.map((line, index) => (
                <Text
                  key={index}
                  fontWeight="bold"
                  fontSize={`${bracket.centerOverlay.fontSize * scale}px`}
                  fontFamily={bracket.centerOverlay.fontFamily}
                  color={bracket.centerOverlay.color}
                  opacity={bracket.centerOverlay.opacity}
                  lineHeight="1.1"
                >
                  {line}
                </Text>
              ))}
            </Box>
          )}

          {/* Title Overlay */}
          <Box
            position="absolute"
            left="50%"
            top={`${50 * scale}px`}
            transform="translateX(-50%)"
            zIndex={15}
            textAlign="center"
          >
            <Text
              fontWeight="bold"
              fontSize={`${48 * scale}px`}
              fontFamily="var(--font-sorts-mill)"
              color="gray.700"
              opacity={0.8}
            >
              {bracket.title}
            </Text>
          </Box>
          </Box>
        </Box>
      </Box>
    </ChakraProvider>
  );
}

