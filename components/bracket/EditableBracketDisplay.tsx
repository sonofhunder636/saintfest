'use client';

import { Bracket, BracketCategory, Saint } from '@/types';
import type { BracketMatch } from '@/types';
import { useState } from 'react';
import { useBracketDimensions } from '@/hooks/useBracketDimensions';

interface EditableBracketDisplayProps {
  bracket: Bracket;
  availableCategories: Array<{ key: keyof Saint; name: string }>;
  onSwapCategory: (categoryId: string, newCategoryKey: keyof Saint) => void;
  onSwapSaint: (categoryId: string, saintId: string, newSaintId: string) => void;
  onRegenerateCategory: (categoryId: string) => void;
  onSelectCategory: (categoryId: string, categoryKey: keyof Saint) => void;
  selectedCategory: string | null;
  availableSaints: Saint[];
  loading: boolean;
}

export default function EditableBracketDisplay({
  bracket,
  availableCategories,
  onSwapCategory,
  onSwapSaint,
  onRegenerateCategory,
  onSelectCategory,
  selectedCategory,
  availableSaints,
  loading
}: EditableBracketDisplayProps) {
  const { config, totalWidth, totalHeight } = useBracketDimensions(bracket);
  const [isCalculating] = useState(false);

  // Mock connections for now - this should be implemented based on bracket structure
  const connections: Array<{x1: number, y1: number, x2: number, y2: number, type: string}> = [];

  if (isCalculating) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg text-gray-600">Calculating bracket layout...</div>
      </div>
    );
  }

  return (
    <div className="w-full bg-white">
      {/* Title */}
      <div className="text-center py-6">
        <h1 className="text-5xl font-bold text-gray-800 mb-2" style={{ fontFamily: 'League Spartan, sans-serif' }}>
          {bracket.title}
        </h1>
        <div className="w-24 h-1 bg-green-500 mx-auto mb-4"></div>
      </div>

      {/* Bracket Container */}
      <div className="flex justify-center">
        <div className="relative" style={{ width: `${totalWidth}px`, height: `${totalHeight}px` }}>
          
          {/* Dynamic SVG Lines */}
          <svg className="absolute inset-0 w-full h-full" style={{ zIndex: -10 }}>
            <defs>
              <style>
                {`.bracket-line { stroke: #8FBC8F; stroke-width: 2; fill: none; }`}
                {`.bracket-line-thick { stroke: #6b9f6b; stroke-width: 3; fill: none; }`}
              </style>
            </defs>
            
            {/* Dynamic connecting lines */}
            {connections.map((connection, index) => (
              <line
                key={index}
                x1={connection.x1}
                y1={connection.y1}
                x2={connection.x2}
                y2={connection.y2}
                className={connection.type === 'horizontal' ? 'bracket-line-thick' : 'bracket-line'}
              />
            ))}
          </svg>
          
          {/* All Matches Positioned Dynamically */}
          {bracket.rounds.map(round => 
            round.matches.map(match => {
              // Create a mock position based on match data
              const position = {
                x: 100,
                y: 100,
                lineLength: config.uniformLineLength,
                matchHeight: 100
              };
              if (!position) return null;
              
              return (
                <div
                  key={match.matchId}
                  className="absolute"
                  style={{
                    left: `${position.x}px`,
                    top: `${position.y}px`,
                    width: `${position.lineLength}px`,
                    height: `${position.matchHeight}px`,
                    zIndex: 10
                  }}
                >
                  <EditableMatchDisplay 
                    match={match}
                    position={position}
                    onSwapSaint={onSwapSaint}
                    availableSaints={availableSaints}
                    isSelected={selectedCategory === match.matchId}
                    loading={loading}
                  />
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

interface EditableMatchDisplayProps {
  match: BracketMatch;
  position: {
    x: number;
    y: number;
    lineLength: number;
    matchHeight: number;
  };
  onSwapSaint: (categoryId: string, saintId: string, newSaintId: string) => void;
  availableSaints: Saint[];
  isSelected: boolean;
  loading: boolean;
}

function EditableMatchDisplay({ 
  match, 
  position, 
  onSwapSaint, 
  availableSaints, 
  isSelected, 
  loading 
}: EditableMatchDisplayProps) {
  const name1 = match.saint1Name || 'TBD';
  const name2 = match.saint2Name || 'TBD';
  
  // Simple text wrapping implementation
  const wrapText = (text: string, maxWidth: number) => {
    if (text.length * 8 <= maxWidth) return [text];
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      if (testLine.length * 8 <= maxWidth) {
        currentLine = testLine;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) lines.push(currentLine);
    return lines;
  };

  const lines1 = wrapText(name1, position.lineLength - 80);
  const lines2 = wrapText(name2, position.lineLength - 80);
  
  const isComplete = match.winnerId !== undefined;
  const totalVotes = match.votesForSaint1 + match.votesForSaint2;
  
  return (
    <div 
      className={`bg-white rounded-lg border-2 shadow-sm p-3 h-full transition-all ${
        isSelected ? 'border-green-500 shadow-lg' : 'border-gray-300'
      } ${loading ? 'opacity-50' : ''}`}
      style={{ 
        width: `${position.lineLength}px`,
        height: `${position.matchHeight}px`,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between'
      }}
    >
      {/* Saint 1 */}
      <div className={`flex items-center justify-between ${
        isComplete && match.winnerId === match.saint1Id ? 'font-bold text-green-700' : ''
      }`}>
        <div className="flex-1 pr-2">
          {lines1.map((line, index) => (
            <div key={index} className="text-sm leading-tight">
              {line}
            </div>
          ))}
        </div>
        <div className="text-sm shrink-0">
          {totalVotes > 0 ? `${Math.round((match.votesForSaint1 / totalVotes) * 100)}%` : '0%'}
        </div>
      </div>

      <div className="border-b border-gray-200 my-2"></div>

      {/* Saint 2 */}
      <div className={`flex items-center justify-between ${
        isComplete && match.winnerId === match.saint2Id ? 'font-bold text-green-700' : ''
      }`}>
        <div className="flex-1 pr-2">
          {lines2.map((line, index) => (
            <div key={index} className="text-sm leading-tight">
              {line}
            </div>
          ))}
        </div>
        <div className="text-sm shrink-0">
          {totalVotes > 0 ? `${Math.round((match.votesForSaint2 / totalVotes) * 100)}%` : '0%'}
        </div>
      </div>

      {/* Edit Controls */}
      {isSelected && (
        <div className="mt-2 space-y-1">
          <button 
            className="w-full text-xs bg-blue-500 text-white py-1 px-2 rounded hover:bg-blue-600 disabled:opacity-50"
            disabled={loading}
          >
            Edit Saint 1
          </button>
          <button 
            className="w-full text-xs bg-blue-500 text-white py-1 px-2 rounded hover:bg-blue-600 disabled:opacity-50"
            disabled={loading}
          >
            Edit Saint 2
          </button>
        </div>
      )}
    </div>
  );
}