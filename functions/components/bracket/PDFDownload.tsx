'use client';

import { useState } from 'react';
import { Bracket } from '@/types';

interface PDFDownloadProps {
  bracket: Bracket;
  className?: string;
}

export default function PDFDownload({ bracket, className = '' }: PDFDownloadProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(bracket.downloadUrl || null);

  const generatePDF = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/bracket/pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bracketId: bracket.id }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      // The response contains the PDF blob
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      // Create download link
      const link = document.createElement('a');
      link.href = url;
      link.download = `${bracket.title.replace(/\s+/g, '_')}_Bracket.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      window.URL.revokeObjectURL(url);
      
      // Update download URL state
      setDownloadUrl(url);

    } catch (err) {
      console.error('PDF generation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate PDF');
    } finally {
      setIsGenerating(false);
    }
  };

  const checkExistingPDF = async () => {
    try {
      const response = await fetch(`/api/bracket/pdf?bracketId=${bracket.id}`);
      const data = await response.json();
      
      if (data.downloadUrl) {
        setDownloadUrl(data.downloadUrl);
      }
    } catch (err) {
      console.error('Error checking existing PDF:', err);
    }
  };

  // Check for existing PDF on mount
  useState(() => {
    if (!downloadUrl) {
      checkExistingPDF();
    }
  });

  return (
    <div className={`pdf-download ${className}`}>
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={generatePDF}
          disabled={isGenerating}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isGenerating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Generating PDF...
            </>
          ) : (
            <>
              <span className="text-lg">📄</span>
              Generate PDF
            </>
          )}
        </button>

        {downloadUrl && !isGenerating && (
          <a
            href={downloadUrl}
            download={`${bracket.title.replace(/\s+/g, '_')}_Bracket.pdf`}
            className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 flex items-center gap-2"
          >
            <span className="text-lg">⬇️</span>
            Download PDF
          </a>
        )}
      </div>

      <p className="text-sm text-gray-600 mt-2">
        PDF will be formatted for letter size paper in landscape orientation, perfect for printing.
      </p>
    </div>
  );
}

// Utility hook for managing PDF operations
export function usePDFGeneration(bracket: Bracket) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(bracket.downloadUrl || null);

  const generatePDF = async (): Promise<string | null> => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/bracket/pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bracketId: bracket.id }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      setDownloadUrl(url);
      return url;

    } catch (err) {
      console.error('PDF generation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate PDF');
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadPDF = (filename?: string) => {
    if (!downloadUrl) return;

    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename || `${bracket.title.replace(/\s+/g, '_')}_Bracket.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return {
    isGenerating,
    error,
    downloadUrl,
    generatePDF,
    downloadPDF
  };
}