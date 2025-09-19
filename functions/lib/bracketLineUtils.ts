import { Bracket, BracketMatch } from '@/types';

export interface TextDimensions {
  width: number;
  height: number;
}

export interface BracketLineConfig {
  uniformLineLength: number;
  totalWidth: number;
  totalHeight: number;
}

/**
 * Simple Canvas-based text measurement (reliable and fast)
 */
export function calculateTextDimensions(
  text: string, 
  maxWidth: number,
  fontSize: number = 14, 
  fontFamily: string = 'Arial'
): TextDimensions {
  // Create a temporary canvas for text measurement
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    // Fallback to character estimation
    return {
      width: Math.min(text.length * fontSize * 0.6, maxWidth),
      height: fontSize * 1.2
    };
  }
  
  ctx.font = `${fontSize}px ${fontFamily}`;
  const metrics = ctx.measureText(text);
  
  return {
    width: Math.min(metrics.width, maxWidth),
    height: fontSize * 1.2 // Standard line height
  };
}

/**
 * Simple text width calculation using Canvas
 */
export function calculateTextWidth(text: string, fontSize: number = 14): number {
  const dims = calculateTextDimensions(text, 999, fontSize);
  return dims.width;
}

/**
 * Basic bracket configuration for uniform line lengths
 */
export function calculateBracketLineConfig(bracket: Bracket): BracketLineConfig {
  // Find the longest saint name across all matches
  let maxLineLength = 180; // Minimum
  
  bracket.rounds.forEach(round => {
    round.matches.forEach(match => {
      const name1 = match.saint1Name || 'TBD';
      const name2 = match.saint2Name || 'TBD';
      
      const width1 = calculateTextWidth(name1);
      const width2 = calculateTextWidth(name2);
      
      // Add padding for percentage display and margins
      const requiredLength = Math.max(width1, width2) + 80;
      maxLineLength = Math.max(maxLineLength, requiredLength);
    });
  });
  
  // Round up to nearest 20 for clean layout
  const uniformLineLength = Math.ceil(maxLineLength / 20) * 20;
  
  return {
    uniformLineLength,
    totalWidth: 1200, // Standard tournament width
    totalHeight: 800  // Standard tournament height
  };
}