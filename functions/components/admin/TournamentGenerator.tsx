'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Button,
  Text,
  Select,
  FormControl,
  FormLabel,
  Checkbox,
  Badge,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Divider,
  SimpleGrid,
  Card,
  CardBody,
  CardHeader,
  Progress,
  Spinner,
  useToast,
  useColorModeValue
} from '@chakra-ui/react';
import {
  Shuffle,
  Download,
  Eye,
  Upload,
  RefreshCw,
  Settings,
  Crown,
  Users,
  Calendar,
  Trophy
} from 'lucide-react';
import { 
  Tournament, 
  Saint, 
  TournamentConfig, 
  TournamentCategory 
} from '@/types';
import { 
  generateTournament, 
  regenerateCategory,
  TournamentSelectionEngine 
} from '@/lib/tournament/selectionEngine';
import TournamentBracket from '@/components/tournament/TournamentBracket';

interface TournamentGeneratorProps {
  onTournamentGenerated?: (tournament: Tournament) => void;
  onTournamentSaved?: (tournament: Tournament) => void;
  initialTournament?: Tournament;
}

type GenerationStep = 'idle' | 'loading-saints' | 'selecting-categories' | 'selecting-saints' | 'calculating-layout' | 'complete';

export default function TournamentGenerator({
  onTournamentGenerated,
  onTournamentSaved,
  initialTournament
}: TournamentGeneratorProps) {
  const [tournament, setTournament] = useState<Tournament | null>(initialTournament || null);
  const [config, setConfig] = useState<TournamentConfig>(() => 
    TournamentSelectionEngine.createDefaultConfig(new Date().getFullYear())
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState<GenerationStep>('idle');
  const [availableCategories] = useState(() => TournamentSelectionEngine.getAvailableCategories());
  const [showPreview, setShowPreview] = useState(false);
  const [selectedCategoryToRegenerate, setSelectedCategoryToRegenerate] = useState<string | null>(null);
  
  const toast = useToast();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.800', 'gray.100');

  // Update config when year changes
  useEffect(() => {
    if (config.year !== new Date().getFullYear()) {
      setConfig(prev => ({ ...prev, year: new Date().getFullYear() }));
    }
  }, []);

  /**
   * Generate a new tournament
   */
  const handleGenerateTournament = async () => {
    setIsGenerating(true);
    setGenerationStep('loading-saints');
    
    try {
      // Simulate progress steps for better UX
      await new Promise(resolve => setTimeout(resolve, 500));
      setGenerationStep('selecting-categories');
      
      await new Promise(resolve => setTimeout(resolve, 300));
      setGenerationStep('selecting-saints');
      
      await new Promise(resolve => setTimeout(resolve, 800));
      setGenerationStep('calculating-layout');
      
      // Generate the actual tournament
      const newTournament = await generateTournament(config);
      
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setTournament(newTournament);
      setGenerationStep('complete');
      
      toast({
        title: 'Tournament Generated!',
        description: `Successfully created ${newTournament.title} with ${newTournament.metadata.totalSaints} saints`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      onTournamentGenerated?.(newTournament);
      
    } catch (error) {
      console.error('Tournament generation failed:', error);
      
      toast({
        title: 'Generation Failed',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      
      setGenerationStep('idle');
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Regenerate a specific category
   */
  const handleRegenerateCategory = async (categoryId: string) => {
    if (!tournament) return;
    
    setIsGenerating(true);
    
    try {
      const newCategory = await regenerateCategory(tournament, categoryId);
      
      setTournament(prev => {
        if (!prev) return prev;
        
        return {
          ...prev,
          categories: prev.categories.map(cat => 
            cat.id === categoryId ? newCategory : cat
          )
        };
      });
      
      toast({
        title: 'Category Regenerated',
        description: `Successfully regenerated ${newCategory.name} category`,
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
      
    } catch (error) {
      toast({
        title: 'Regeneration Failed',
        description: error instanceof Error ? error.message : 'Failed to regenerate category',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsGenerating(false);
      setSelectedCategoryToRegenerate(null);
    }
  };

  /**
   * Handle config changes
   */
  const handleConfigChange = (key: keyof TournamentConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  /**
   * Handle forced category selection
   */
  const handleForcedCategoryChange = (index: number, categoryKey: keyof Saint) => {
    const newForcedCategories = [...(config.forcedCategories || [])];
    newForcedCategories[index] = categoryKey;
    
    // Ensure we have exactly 4 categories
    while (newForcedCategories.length < 4) {
      newForcedCategories.push('martyrs' as keyof Saint);
    }
    
    handleConfigChange('forcedCategories', newForcedCategories.slice(0, 4));
  };

  /**
   * Clear forced categories (use random selection)
   */
  const handleClearForcedCategories = () => {
    setConfig(prev => ({
      ...prev,
      forcedCategories: undefined
    }));
  };

  return (
    <VStack spacing={6} align="stretch" w="full">
      {/* Header */}
      <Box textAlign="center" py={4}>
        <HStack justify="center" spacing={3} mb={2}>
          <Trophy size={32} color="teal.500" />
          <Text fontSize="3xl" fontWeight="bold" color={textColor}>
            Tournament Generator
          </Text>
        </HStack>
        <Text color="gray.500" fontSize="lg">
          Create a new Saintfest tournament bracket
        </Text>
      </Box>

      {/* Configuration Panel */}
      <Card>
        <CardHeader>
          <HStack spacing={2}>
            <Settings size={20} />
            <Text fontSize="lg" fontWeight="semibold">Configuration</Text>
          </HStack>
        </CardHeader>
        <CardBody>
          <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
            
            {/* Basic Settings */}
            <VStack spacing={4} align="stretch">
              <FormControl>
                <FormLabel>Tournament Year</FormLabel>
                <Select
                  value={config.year}
                  onChange={(e) => handleConfigChange('year', parseInt(e.target.value))}
                >
                  {[...Array(5)].map((_, i) => {
                    const year = new Date().getFullYear() + i - 2;
                    return (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    );
                  })}
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>Selection Method</FormLabel>
                <Select
                  value={config.selectionWeighting}
                  onChange={(e) => handleConfigChange('selectionWeighting', e.target.value)}
                >
                  <option value="balanced">Balanced (Mix of Popular & Lesser Known)</option>
                  <option value="popularity">Popularity Weighted</option>
                  <option value="random">Pure Random</option>
                </Select>
              </FormControl>

              <HStack>
                <Checkbox
                  isChecked={config.excludeRecentlyUsed}
                  onChange={(e) => handleConfigChange('excludeRecentlyUsed', e.target.checked)}
                >
                  Exclude recently used saints
                </Checkbox>
                {config.excludeRecentlyUsed && (
                  <Select
                    size="sm"
                    width="auto"
                    value={config.yearsToExclude}
                    onChange={(e) => handleConfigChange('yearsToExclude', parseInt(e.target.value))}
                  >
                    <option value={1}>1 year</option>
                    <option value={2}>2 years</option>
                    <option value={3}>3 years</option>
                  </Select>
                )}
              </HStack>
            </VStack>

            {/* Category Override */}
            <VStack spacing={4} align="stretch">
              <HStack justify="space-between">
                <Text fontWeight="semibold">Category Selection</Text>
                {config.forcedCategories && (
                  <Button size="sm" variant="ghost" onClick={handleClearForcedCategories}>
                    Use Random
                  </Button>
                )}
              </HStack>
              
              {config.forcedCategories ? (
                <VStack spacing={3}>
                  {config.forcedCategories.map((categoryKey, index) => (
                    <FormControl key={index}>
                      <FormLabel fontSize="sm">Category {index + 1}</FormLabel>
                      <Select
                        value={categoryKey}
                        onChange={(e) => handleForcedCategoryChange(index, e.target.value as keyof Saint)}
                      >
                        {availableCategories.map(cat => (
                          <option key={cat.key} value={cat.key}>
                            {cat.name}
                          </option>
                        ))}
                      </Select>
                    </FormControl>
                  ))}
                </VStack>
              ) : (
                <Box>
                  <Text fontSize="sm" color="gray.500" mb={2}>
                    Categories will be selected randomly
                  </Text>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleConfigChange('forcedCategories', ['martyrs', 'confessors', 'doctorsofthechurch', 'mystic'])}
                  >
                    Override Categories
                  </Button>
                </Box>
              )}
            </VStack>
          </SimpleGrid>
        </CardBody>
      </Card>

      {/* Generation Controls */}
      <Card>
        <CardBody>
          <HStack justify="space-between" wrap="wrap" spacing={4}>
            <Button
              leftIcon={<Shuffle />}
              colorScheme="teal"
              size="lg"
              onClick={handleGenerateTournament}
              isLoading={isGenerating}
              loadingText="Generating..."
              isDisabled={isGenerating}
            >
              Generate New Tournament
            </Button>

            {tournament && !isGenerating && (
              <HStack spacing={3}>
                <Button
                  leftIcon={<Eye />}
                  variant="outline"
                  onClick={() => setShowPreview(!showPreview)}
                >
                  {showPreview ? 'Hide' : 'Show'} Preview
                </Button>
                
                <Button
                  leftIcon={<Upload />}
                  colorScheme="green"
                  onClick={() => {
                    if (window.confirm(
                      'Are you sure you want to publish this tournament?\n\n' +
                      'This will:\n' +
                      '• Make the bracket visible on the public 2025 Saintfest Bracket page\n' +
                      '• Create an archive backup of the current tournament\n' +
                      '• Replace any previously published bracket\n\n' +
                      'Click OK to proceed with publishing.'
                    )) {
                      onTournamentSaved?.(tournament);
                    }
                  }}
                >
                  Publish Tournament
                </Button>
              </HStack>
            )}
          </HStack>
        </CardBody>
      </Card>

      {/* Generation Progress */}
      {isGenerating && (
        <Card>
          <CardBody>
            <VStack spacing={4}>
              <HStack spacing={3}>
                <Spinner size="sm" color="teal.500" />
                <Text fontWeight="semibold">
                  {getStepMessage(generationStep)}
                </Text>
              </HStack>
              
              <Progress
                value={getStepProgress(generationStep)}
                colorScheme="teal"
                size="lg"
                w="full"
                hasStripe
                isAnimated
              />
            </VStack>
          </CardBody>
        </Card>
      )}

      {/* Tournament Stats */}
      {tournament && !isGenerating && (
        <TournamentStats tournament={tournament} onRegenerateCategory={handleRegenerateCategory} />
      )}

      {/* Tournament Preview */}
      {tournament && showPreview && !isGenerating && (
        <Card>
          <CardHeader>
            <Text fontSize="lg" fontWeight="semibold">Tournament Preview</Text>
          </CardHeader>
          <CardBody>
            <TournamentBracket tournament={tournament} />
          </CardBody>
        </Card>
      )}
    </VStack>
  );
}

// Tournament Statistics Component
function TournamentStats({ 
  tournament, 
  onRegenerateCategory 
}: { 
  tournament: Tournament;
  onRegenerateCategory: (categoryId: string) => void;
}) {
  const cardBg = useColorModeValue('gray.50', 'gray.700');
  
  return (
    <Card>
      <CardHeader>
        <HStack spacing={2}>
          <Users size={20} />
          <Text fontSize="lg" fontWeight="semibold">Tournament Statistics</Text>
        </HStack>
      </CardHeader>
      <CardBody>
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4} mb={6}>
          <StatCard
            label="Total Saints"
            value={tournament.metadata.totalSaints}
            icon={<Users size={16} />}
          />
          <StatCard
            label="Categories"
            value={tournament.categories.length}
            icon={<Crown size={16} />}
          />
          <StatCard
            label="Generation Time"
            value={`${tournament.metadata.generationTime}ms`}
            icon={<RefreshCw size={16} />}
          />
          <StatCard
            label="Year"
            value={tournament.year}
            icon={<Calendar size={16} />}
          />
        </SimpleGrid>

        <Divider mb={6} />

        <VStack spacing={4} align="stretch">
          <Text fontWeight="semibold" fontSize="lg">Categories & Saints</Text>
          
          <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={4}>
            {tournament.categories.map((category) => (
              <CategoryCard
                key={category.id}
                category={category}
                onRegenerate={() => onRegenerateCategory(category.id)}
              />
            ))}
          </SimpleGrid>
        </VStack>
      </CardBody>
    </Card>
  );
}

// Stat Card Component
function StatCard({ 
  label, 
  value, 
  icon 
}: { 
  label: string; 
  value: string | number; 
  icon: React.ReactNode; 
}) {
  const cardBg = useColorModeValue('white', 'gray.600');
  
  return (
    <Box bg={cardBg} p={4} borderRadius="md" border="1px" borderColor="gray.200">
      <HStack justify="space-between">
        <VStack align="start" spacing={1}>
          <Text fontSize="sm" color="gray.500">{label}</Text>
          <Text fontSize="2xl" fontWeight="bold">{value}</Text>
        </VStack>
        <Box color="teal.500">{icon}</Box>
      </HStack>
    </Box>
  );
}

// Category Card Component
function CategoryCard({ 
  category, 
  onRegenerate 
}: { 
  category: TournamentCategory;
  onRegenerate: () => void;
}) {
  const cardBg = useColorModeValue('white', 'gray.600');
  
  return (
    <Box
      bg={cardBg}
      p={4}
      borderRadius="md"
      border="1px"
      borderColor="gray.200"
      borderLeft="4px solid"
      borderLeftColor={category.color}
    >
      <HStack justify="space-between" mb={3}>
        <Text fontWeight="semibold" color={category.color}>
          {category.name}
        </Text>
        <Button
          size="xs"
          variant="ghost"
          leftIcon={<RefreshCw size={12} />}
          onClick={onRegenerate}
        >
          Regenerate
        </Button>
      </HStack>
      
      <VStack align="start" spacing={1}>
        {category.saints.map((saint, index) => (
          <HStack key={saint.id} spacing={2} w="full">
            <Badge size="sm" colorScheme="gray">
              {saint.seed}
            </Badge>
            <Text fontSize="sm" isTruncated flex={1}>
              {saint.displayName}
            </Text>
          </HStack>
        ))}
      </VStack>
    </Box>
  );
}

// Helper functions
function getStepMessage(step: GenerationStep): string {
  switch (step) {
    case 'loading-saints': return 'Loading saints database...';
    case 'selecting-categories': return 'Selecting tournament categories...';
    case 'selecting-saints': return 'Choosing saints for each category...';
    case 'calculating-layout': return 'Calculating bracket layout...';
    case 'complete': return 'Tournament generation complete!';
    default: return 'Preparing to generate tournament...';
  }
}

function getStepProgress(step: GenerationStep): number {
  switch (step) {
    case 'loading-saints': return 20;
    case 'selecting-categories': return 40;
    case 'selecting-saints': return 70;
    case 'calculating-layout': return 90;
    case 'complete': return 100;
    default: return 0;
  }
}