'use client';

import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  VStack,
  Text,
  Progress,
  Box,
  Spinner,
  Circle,
  HStack
} from '@chakra-ui/react';
import { CheckCircle, Download, FileText, Image } from 'lucide-react';

export interface ProgressStage {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
}

interface ProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStage: string;
  progress: number;
  error?: string | null;
  success?: boolean;
}

const stages: ProgressStage[] = [
  {
    id: 'preparing',
    label: 'Preparing',
    description: 'Preparing bracket for capture...',
    icon: <FileText size={20} />
  },
  {
    id: 'capturing',
    label: 'Capturing',
    description: 'Capturing bracket image...',
    icon: <Image size={20} />
  },
  {
    id: 'generating',
    label: 'Generating',
    description: 'Generating PDF document...',
    icon: <FileText size={20} />
  },
  {
    id: 'finalizing',
    label: 'Finalizing',
    description: 'Finalizing download...',
    icon: <Download size={20} />
  }
];

export default function ProgressModal({
  isOpen,
  onClose,
  currentStage,
  progress,
  error,
  success = false
}: ProgressModalProps) {
  const currentStageIndex = stages.findIndex(stage => stage.id === currentStage);
  const currentStageData = stages[currentStageIndex];

  return (
    <Modal isOpen={isOpen} onClose={onClose} closeOnOverlayClick={false} closeOnEsc={false}>
      <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(4px)" />
      <ModalContent maxW="md" mx={4}>
        <ModalBody py={8} px={6}>
          <VStack spacing={6} align="center">
            {/* Header */}
            <VStack spacing={2} textAlign="center">
              <Text
                fontSize="xl"
                fontWeight="600"
                fontFamily="var(--font-sorts-mill)"
                color="gray.800"
              >
                {success ? 'Download Complete!' : error ? 'Download Failed' : 'Generating PDF'}
              </Text>
              {!success && !error && (
                <Text
                  fontSize="sm"
                  color="gray.600"
                  fontFamily="var(--font-cormorant)"
                >
                  This may take a few moments...
                </Text>
              )}
            </VStack>

            {/* Progress Section */}
            {!error && !success && (
              <VStack spacing={4} w="full">
                {/* Current Stage Indicator */}
                <HStack spacing={3} w="full" justify="center">
                  <Circle size="10" bg="saintfest.500" color="white">
                    {currentStageData?.icon || <Spinner size="sm" />}
                  </Circle>
                  <VStack spacing={0} align="flex-start" flex={1}>
                    <Text
                      fontSize="md"
                      fontWeight="600"
                      color="gray.800"
                      fontFamily="var(--font-league-spartan)"
                    >
                      {currentStageData?.label || 'Processing'}
                    </Text>
                    <Text
                      fontSize="sm"
                      color="gray.600"
                      fontFamily="var(--font-cormorant)"
                    >
                      {currentStageData?.description || 'Please wait...'}
                    </Text>
                  </VStack>
                </HStack>

                {/* Progress Bar */}
                <VStack spacing={2} w="full">
                  <Progress
                    value={progress}
                    size="lg"
                    colorScheme="green"
                    bg="gray.100"
                    borderRadius="full"
                    w="full"
                    sx={{
                      '& > div': {
                        bg: 'linear-gradient(90deg, #8FBC8F 0%, #7ba87b 100%)',
                      }
                    }}
                  />
                  <HStack justify="space-between" w="full">
                    <Text fontSize="xs" color="gray.500">
                      {Math.round(progress)}% complete
                    </Text>
                    <Text fontSize="xs" color="gray.500">
                      Stage {currentStageIndex + 1} of {stages.length}
                    </Text>
                  </HStack>
                </VStack>

                {/* Stage Indicators */}
                <HStack spacing={2} justify="center">
                  {stages.map((stage, index) => (
                    <Circle
                      key={stage.id}
                      size="3"
                      bg={
                        index < currentStageIndex
                          ? 'saintfest.500'
                          : index === currentStageIndex
                          ? 'saintfest.300'
                          : 'gray.200'
                      }
                      transition="all 0.3s ease"
                    />
                  ))}
                </HStack>
              </VStack>
            )}

            {/* Success State */}
            {success && (
              <VStack spacing={4}>
                <Circle size="16" bg="green.100" color="green.500">
                  <CheckCircle size={32} />
                </Circle>
                <VStack spacing={1} textAlign="center">
                  <Text
                    fontSize="lg"
                    fontWeight="600"
                    color="green.600"
                    fontFamily="var(--font-league-spartan)"
                  >
                    PDF Generated Successfully!
                  </Text>
                  <Text
                    fontSize="sm"
                    color="gray.600"
                    fontFamily="var(--font-cormorant)"
                  >
                    Your bracket PDF has been downloaded to your device.
                  </Text>
                </VStack>
              </VStack>
            )}

            {/* Error State */}
            {error && (
              <VStack spacing={4}>
                <Circle size="16" bg="red.100" color="red.500">
                  <Text fontSize="2xl">⚠️</Text>
                </Circle>
                <VStack spacing={1} textAlign="center">
                  <Text
                    fontSize="lg"
                    fontWeight="600"
                    color="red.600"
                    fontFamily="var(--font-league-spartan)"
                  >
                    Download Failed
                  </Text>
                  <Text
                    fontSize="sm"
                    color="gray.600"
                    fontFamily="var(--font-cormorant)"
                    maxW="xs"
                  >
                    {error}
                  </Text>
                </VStack>
              </VStack>
            )}
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}