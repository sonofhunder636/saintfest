'use client';

import { useState, RefObject } from 'react';
import {
  Button,
  VStack,
  Text,
  Box,
  Alert,
  AlertIcon,
  useDisclosure
} from '@chakra-ui/react';
import { Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import ProgressModal from '@/components/ui/progress-modal';

interface PDFDownloadProps {
  targetRef: RefObject<HTMLElement>;
  filename?: string;
  className?: string;
}

type ProgressStage = 'preparing' | 'capturing' | 'generating' | 'finalizing';

export default function PDFDownload({ targetRef, filename = 'bracket', className = '' }: PDFDownloadProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStage, setCurrentStage] = useState<ProgressStage>('preparing');
  const [progress, setProgress] = useState(0);
  const [success, setSuccess] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();

  const updateProgress = (stage: ProgressStage, progressValue: number) => {
    setCurrentStage(stage);
    setProgress(progressValue);
  };

  const generatePDF = async () => {
    if (!targetRef.current) {
      setError('Target element not found');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setSuccess(false);
    onOpen();

    try {
      // Stage 1: Preparing
      updateProgress('preparing', 10);
      await new Promise(resolve => setTimeout(resolve, 500));

      // Stage 2: Capturing
      updateProgress('capturing', 25);

      // Calculate optimal DPI for printing (150 DPI target)
      const printDPI = 150;
      const screenDPI = 96;
      const dpiScale = printDPI / screenDPI;
      const targetScale = Math.min(dpiScale, 1.2); // Cap at 1.2x for file size control

      const canvas = await html2canvas(targetRef.current, {
        scale: targetScale,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: targetRef.current.scrollWidth,
        height: targetRef.current.scrollHeight,
        scrollX: 0,
        scrollY: 0,
        removeContainer: true,
        foreignObjectRendering: false,
        imageTimeout: 5000,
        ignoreElements: (element) => {
          return element.classList.contains('no-print');
        },
        onclone: () => {
          updateProgress('capturing', 50);
        }
      });

      updateProgress('capturing', 70);

      // Stage 3: Generating PDF
      updateProgress('generating', 75);

      const imgWidth = canvas.width;
      const imgHeight = canvas.height;

      // Use standard Letter size for tournament brackets
      const pdfWidth = 279; // Letter width in mm (landscape - 11 inches)
      const pdfHeight = 216; // Letter height in mm (landscape - 8.5 inches)

      const scaleX = pdfWidth / (imgWidth * 0.264583);
      const scaleY = pdfHeight / (imgHeight * 0.264583);
      const scale = Math.min(scaleX, scaleY, 1);

      const finalWidth = (imgWidth * 0.264583) * scale;
      const finalHeight = (imgHeight * 0.264583) * scale;

      const offsetX = (pdfWidth - finalWidth) / 2;
      const offsetY = (pdfHeight - finalHeight) / 2;

      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'letter',
        compress: true,
        putOnlyUsedFonts: true
      });

      updateProgress('generating', 85);

      const imgData = canvas.toDataURL('image/jpeg', 0.6);
      pdf.addImage(imgData, 'JPEG', offsetX, offsetY, finalWidth, finalHeight);

      // Stage 4: Finalizing
      updateProgress('finalizing', 95);
      await new Promise(resolve => setTimeout(resolve, 300));

      const downloadFilename = filename || `saintfest-bracket-${new Date().getFullYear()}`;
      pdf.save(`${downloadFilename}.pdf`);

      updateProgress('finalizing', 100);
      setSuccess(true);

      // Show success for 2 seconds, then close
      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 2000);

    } catch (err) {
      console.error('PDF generation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate PDF');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Box className={className}>
      <VStack spacing={4} align="center">
        {/* Error Alert */}
        {error && !isOpen && (
          <Alert status="error" borderRadius="lg" maxW="md">
            <AlertIcon />
            <VStack spacing={1} align="flex-start">
              <Text fontSize="sm" fontWeight="600">
                Download Failed
              </Text>
              <Text fontSize="xs" color="red.600">
                {error}
              </Text>
            </VStack>
          </Alert>
        )}

        {/* Enhanced Download Button */}
        <Button
          onClick={generatePDF}
          isDisabled={isGenerating}
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
          leftIcon={<Download size={20} />}
          _hover={{
            bg: 'saintfest.600',
            transform: 'translateY(-2px)',
            boxShadow: 'xl'
          }}
          _active={{
            transform: 'translateY(0)'
          }}
          _disabled={{
            opacity: 0.6,
            cursor: 'not-allowed',
            transform: 'none',
            _hover: {
              transform: 'none',
              bg: 'saintfest.500'
            }
          }}
          transition="all 0.2s ease"
        >
          Download Printable Bracket PDF
        </Button>

        {/* Description Text */}
        <Text
          fontSize="sm"
          color="gray.500"
          fontFamily="var(--font-cormorant)"
          textAlign="center"
          maxW="sm"
        >
          Perfect for printing and filling out your predictions! High-quality PDF formatted in landscape orientation.
        </Text>
      </VStack>

      {/* Progress Modal */}
      <ProgressModal
        isOpen={isOpen}
        onClose={onClose}
        currentStage={currentStage}
        progress={progress}
        error={error}
        success={success}
      />
    </Box>
  );
}

// Enhanced hook for client-side PDF generation
export function usePDFGeneration(targetRef: RefObject<HTMLElement>, filename?: string) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generatePDF = async (): Promise<boolean> => {
    if (!targetRef.current) {
      setError('Target element not found');
      return false;
    }

    setIsGenerating(true);
    setError(null);

    try {
      // Calculate optimal DPI for printing (150 DPI target)
      const printDPI = 150;
      const screenDPI = 96;
      const dpiScale = printDPI / screenDPI;
      const targetScale = Math.min(dpiScale, 1.2); // Cap at 1.2x for file size control

      // Capture the element as canvas with optimized settings for tournament brackets
      const canvas = await html2canvas(targetRef.current, {
        scale: targetScale,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: targetRef.current.scrollWidth,
        height: targetRef.current.scrollHeight,
        scrollX: 0,
        scrollY: 0,
        removeContainer: true,
        foreignObjectRendering: false,
        imageTimeout: 5000,
        // Optimizations for complex layouts
        ignoreElements: (element) => {
          // Skip elements that might cause issues
          return element.classList.contains('no-print');
        }
      });

      // Calculate optimal PDF sizing
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;

      // Use standard Letter size for tournament brackets
      const pdfWidth = 279; // Letter width in mm (landscape - 11 inches)
      const pdfHeight = 216; // Letter height in mm (landscape - 8.5 inches)

      const scaleX = pdfWidth / (imgWidth * 0.264583);
      const scaleY = pdfHeight / (imgHeight * 0.264583);
      const scale = Math.min(scaleX, scaleY, 1);

      const finalWidth = (imgWidth * 0.264583) * scale;
      const finalHeight = (imgHeight * 0.264583) * scale;

      const offsetX = (pdfWidth - finalWidth) / 2;
      const offsetY = (pdfHeight - finalHeight) / 2;

      // Create PDF with tournament bracket optimizations
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'letter', // Standard format for printing
        compress: true,
        putOnlyUsedFonts: true
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.6);
      pdf.addImage(imgData, 'JPEG', offsetX, offsetY, finalWidth, finalHeight);

      // Download with descriptive filename
      const downloadFilename = filename || `saintfest-bracket-${new Date().getFullYear()}`;
      pdf.save(`${downloadFilename}.pdf`);

      return true;

    } catch (err) {
      console.error('PDF generation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate PDF');
      return false;
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    isGenerating,
    error,
    generatePDF
  };
}