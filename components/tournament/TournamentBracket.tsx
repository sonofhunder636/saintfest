'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Box, 
  Text, 
  Flex, 
  VStack, 
  HStack, 
  Badge, 
  Tooltip,
  useColorModeValue,
  Image,
  Skeleton,
  Container
} from '@chakra-ui/react';
import { Tournament, TournamentMatch, TournamentSaint } from '@/types';
import { calculateTournamentLayout } from '@/lib/tournament/layoutEngine';
import { Crown, Star } from 'lucide-react';

interface TournamentBracketProps {
  tournament: Tournament;
  interactive?: boolean;
  showVoting?: boolean;
  onMatchClick?: (match: TournamentMatch) => void;
  onSaintClick?: (saint: TournamentSaint) => void;
}

interface LayoutData {
  matches: TournamentMatch[];
  layout: any;
  connections: any[];
}

export default function TournamentBracket({
  tournament,
  interactive = false,
  showVoting = false,
  onMatchClick,
  onSaintClick
}: TournamentBracketProps) {
  const [layoutData, setLayoutData] = useState<LayoutData | null>(null);
  const [isCalculating, setIsCalculating] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState<string | null>(null);

  // Theme colors
  const bgColor = useColorModeValue('white', 'gray.900');
  const textColor = useColorModeValue('gray.800', 'gray.100');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const hoverBg = useColorModeValue('gray.50', 'gray.800');

  // Calculate layout on mount
  useEffect(() => {
    setIsCalculating(true);
    
    // Use setTimeout to allow UI to show loading state
    setTimeout(() => {
      try {
        const layout = calculateTournamentLayout(tournament);
        setLayoutData(layout);
      } catch (error) {
        console.error('Error calculating tournament layout:', error);
      } finally {
        setIsCalculating(false);
      }
    }, 100);
  }, [tournament]);

  // Memoized bracket container dimensions
  const containerStyle = useMemo(() => {
    if (!layoutData) return {};
    
    return {
      width: `${layoutData.layout.totalWidth}px`,
      height: `${layoutData.layout.totalHeight}px`,
      minWidth: '1200px', // Ensure minimum readability
    };
  }, [layoutData]);

  if (isCalculating) {
    return (
      <Container maxW="full" centerContent py={8}>
        <VStack spacing={6}>
          <Text fontSize="xl" color={textColor}>
            Calculating tournament bracket...
          </Text>
          <Skeleton height="600px" width="1200px" />
        </VStack>
      </Container>
    );
  }

  if (!layoutData) {
    return (
      <Container maxW="full" centerContent py={8}>
        <Text fontSize="lg" color="red.500">
          Unable to calculate bracket layout
        </Text>
      </Container>
    );
  }

  return (
    <Box w="full" bg={bgColor}>
      {/* Scrollable Bracket Container */}
      <Box w="full" overflow="auto">
        <Box position="relative" mx="auto" p={4}>
          <Box position="relative" style={containerStyle}>
          
          {/* SVG Connection Lines */}
          <BracketLines 
            connections={layoutData.connections}
            color={tournament.colorPalette.lines}
          />
          
          {/* Tournament Matches */}
          {layoutData.matches.map((match) => (
            <MatchDisplay
              key={match.id}
              match={match}
              tournament={tournament}
              interactive={interactive}
              selected={selectedMatch === match.id}
              onMatchClick={() => {
                if (interactive && onMatchClick) {
                  onMatchClick(match);
                  setSelectedMatch(match.id);
                }
              }}
              onSaintClick={onSaintClick}
            />
          ))}
          
          {/* Tournament Title - 700px above center */}
          <Box
            position="absolute"
            top="50%"
            left="50%"
            transform="translate(-50%, -50%)"
            marginTop="-700px"
            zIndex={15}
            pointerEvents="none"
            textAlign="center"
          >
            <Text 
              fontSize="8xl" 
              fontWeight="600" 
              color={textColor}
              fontFamily="var(--font-sorts-mill)"
              textShadow="0 1px 2px rgba(0,0,0,0.1)"
            >
              {tournament.title}
            </Text>
            
            {tournament.status === 'active' && (
              <Badge colorScheme="green" fontSize="sm" px={3} py={1} mt={1}>
                Tournament Active
              </Badge>
            )}
          </Box>

          {/* Overlay Text - Blessed Intercessor at precise bracket center */}
          <Box
            position="absolute"
            top="50%"
            left="50%"
            transform="translate(-50%, -50%)"
            zIndex={15}
            pointerEvents="none"
            textAlign="center"
          >
            <VStack spacing={-2}>
              <Text
                fontSize="6xl"
                fontWeight="700"
                fontFamily="var(--font-sorts-mill)"
                color="rgba(139, 69, 19, 0.15)"
                textShadow="0 2px 4px rgba(0,0,0,0.1)"
                letterSpacing="0.05em"
                userSelect="none"
                lineHeight="0.9"
              >
                Blessed
              </Text>
              <Text
                fontSize="6xl"
                fontWeight="700"
                fontFamily="var(--font-sorts-mill)"
                color="rgba(139, 69, 19, 0.15)"
                textShadow="0 2px 4px rgba(0,0,0,0.1)"
                letterSpacing="0.05em"
                userSelect="none"
                lineHeight="0.9"
              >
                Intercessor
              </Text>
            </VStack>
          </Box>
          
          </Box>
        </Box>
      </Box>

    </Box>
  );
}


// SVG Bracket Lines Component
function BracketLines({ 
  connections, 
  color 
}: { 
  connections: any[]; 
  color: string; 
}) {
  return (
    <svg
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1
      }}
    >
      <defs>
        <style>
          {`.bracket-line { 
            stroke: ${color}; 
            stroke-width: 2; 
            fill: none; 
            stroke-linecap: round;
            stroke-linejoin: round;
          }`}
        </style>
      </defs>
      
      {connections.map((connection, index) => (
        <line
          key={`${connection.id}-${index}`}
          x1={connection.x1}
          y1={connection.y1}
          x2={connection.x2}
          y2={connection.y2}
          className="bracket-line"
        />
      ))}
    </svg>
  );
}

// Individual Match Display Component
function MatchDisplay({
  match,
  tournament,
  interactive,
  selected,
  onMatchClick,
  onSaintClick
}: {
  match: TournamentMatch;
  tournament: Tournament;
  interactive: boolean;
  selected: boolean;
  onMatchClick?: () => void;
  onSaintClick?: (saint: TournamentSaint) => void;
}) {
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const hoverBg = useColorModeValue('gray.50', 'gray.800');
  const selectedBorder = tournament.colorPalette.primary;

  return (
    <Box
      position="absolute"
      left={`${match.position.x}px`}
      top={`${match.position.y}px`}
      width={`${match.position.width}px`}
      height={`${match.position.height}px`}
      zIndex={10}
    >
      <Box
        w="full"
        h="full"
        bg="white"
        border="2px solid"
        borderColor={selected ? selectedBorder : borderColor}
        borderRadius="md"
        shadow={selected ? 'lg' : 'sm'}
        cursor={interactive ? 'pointer' : 'default'}
        transition="all 0.2s ease"
        _hover={interactive ? {
          bg: hoverBg,
          shadow: 'md',
          borderColor: selectedBorder
        } : {}}
        onClick={onMatchClick}
      >
        {/* Match Content */}
        {match.isChampionship ? (
          // Championship bracket: single saint, no divider, centered display
          <Box h="full" display="flex" alignItems="center" justifyContent="center" p={2}>
            {match.saint1 ? (
              <SaintMatchupDisplay 
                saint={match.saint1} 
                isWinner={match.winner?.id === match.saint1.id}
                votes={match.votesForSaint1}
                totalVotes={match.totalVotes}
                tournament={tournament}
                interactive={interactive}
                onClick={() => onSaintClick?.(match.saint1!)}
              />
            ) : (
              <Box display="flex" alignItems="center" justifyContent="center">
                {/* Empty championship slot */}
              </Box>
            )}
          </Box>
        ) : (
          // Normal bracket: two saints with divider
          <VStack spacing={0} h="full" justify="center">
            {match.saint1 ? (
              <SaintMatchupDisplay 
                saint={match.saint1} 
                isWinner={match.winner?.id === match.saint1.id}
                votes={match.votesForSaint1}
                totalVotes={match.totalVotes}
                tournament={tournament}
                interactive={interactive}
                onClick={() => onSaintClick?.(match.saint1!)}
              />
            ) : (
              <Box h="50%" display="flex" alignItems="center" justifyContent="center">
                {/* Empty - no TBD text */}
              </Box>
            )}
            
            <Box w="full" h="1px" bg={borderColor} />
            
            {match.saint2 ? (
              <SaintMatchupDisplay 
                saint={match.saint2} 
                isWinner={match.winner?.id === match.saint2.id}
                votes={match.votesForSaint2}
                totalVotes={match.totalVotes}
                tournament={tournament}
                interactive={interactive}
                onClick={() => onSaintClick?.(match.saint2!)}
              />
            ) : (
              <Box h="50%" display="flex" alignItems="center" justifyContent="center">
                {/* Empty - no TBD text */}
              </Box>
            )}
          </VStack>
        )}
      </Box>
    </Box>
  );
}

// Saint Matchup Display Component  
function SaintMatchupDisplay({
  saint,
  isWinner,
  votes,
  totalVotes,
  tournament,
  interactive,
  onClick
}: {
  saint: TournamentSaint;
  isWinner: boolean;
  votes: number;
  totalVotes: number;
  tournament: Tournament;
  interactive: boolean;
  onClick?: () => void;
}) {
  const textColor = useColorModeValue('gray.800', 'gray.100');
  const winnerColor = tournament.colorPalette.primary;
  
  const votePercentage = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;

  return (
    <Tooltip
      label={`${saint.name}${saint.feastDay ? ` (${saint.feastDay})` : ''}${saint.shortBio ? ` - ${saint.shortBio}` : ''}`}
      placement="top"
      hasArrow
      isDisabled={!interactive}
    >
      <Box
        h="50%"
        w="full"
        p={2}
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        cursor={interactive ? 'pointer' : 'default'}
        onClick={onClick}
        position="relative"
        bg={isWinner ? `${winnerColor}10` : 'transparent'}
      >
        <HStack spacing={2} flex={1} minW={0}>
          {saint.imageUrl && (
            <Image
              src={saint.imageUrl}
              alt={saint.name}
              boxSize="20px"
              borderRadius="full"
              objectFit="cover"
            />
          )}
          
          <Text
            fontSize="17px"
            fontWeight={isWinner ? 'bold' : 'medium'}
            color={isWinner ? winnerColor : textColor}
            isTruncated
            flex={1}
          >
            {saint.displayName}
          </Text>
        </HStack>
        
        {totalVotes > 0 && (
          <VStack spacing={0} alignItems="flex-end" ml={2}>
            <Text fontSize="xs" fontWeight="bold" color={textColor}>
              {votePercentage}%
            </Text>
            <Text fontSize="xs" color="gray.500">
              {votes}
            </Text>
          </VStack>
        )}
        
        {isWinner && (
          <Box position="absolute" right="2px" top="2px">
            <Crown size={14} color={winnerColor} />
          </Box>
        )}
      </Box>
    </Tooltip>
  );
}


