// lib/tournament/textMeasurement.ts
import { TextMeasurement } from '@/types';

// Canvas for text measurement (client-side only)
let measurementCanvas: HTMLCanvasElement | null = null;
let measurementContext: CanvasRenderingContext2D | null = null;

/**
 * Initialize canvas for text measurement
 */
function initializeMeasurementCanvas(): void {
  if (typeof window === 'undefined') return; // Server-side rendering
  
  if (!measurementCanvas) {
    measurementCanvas = document.createElement('canvas');
    measurementContext = measurementCanvas.getContext('2d');
  }
}

/**
 * Measure text dimensions using Canvas API
 */
export function measureText(
  text: string,
  fontSize: number,
  fontFamily: string,
  context?: CanvasRenderingContext2D | null
): TextMeasurement {
  // Use provided context or initialize our own
  const ctx = context || (initializeMeasurementCanvas(), measurementContext);
  
  if (!ctx) {
    // Fallback for server-side rendering
    return {
      width: text.length * (fontSize * 0.6), // Approximate width
      height: fontSize * 1.2,
      fontSize,
      fontFamily,
      lineHeight: fontSize * 1.2
    };
  }
  
  // Set font for measurement
  ctx.font = `${fontSize}px ${fontFamily}`;
  
  // Measure text
  const metrics = ctx.measureText(text);
  const width = metrics.width;
  
  // Calculate height from font metrics or estimate
  let height = fontSize;
  if (metrics.actualBoundingBoxAscent && metrics.actualBoundingBoxDescent) {
    height = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
  } else {
    // Fallback estimation
    height = fontSize * 1.2;
  }
  
  return {
    width,
    height,
    fontSize,
    fontFamily,
    lineHeight: height * 1.2
  };
}

/**
 * Measure text with word wrapping
 */
export function measureWrappedText(
  text: string,
  fontSize: number,
  fontFamily: string,
  maxWidth: number,
  context?: CanvasRenderingContext2D | null
): {
  lines: string[];
  totalWidth: number;
  totalHeight: number;
  measurement: TextMeasurement;
} {
  const ctx = context || (initializeMeasurementCanvas(), measurementContext);
  
  if (!ctx) {
    // Fallback for server-side rendering
    const lines = wrapTextSimple(text, maxWidth / (fontSize * 0.6));
    return {
      lines,
      totalWidth: Math.min(maxWidth, text.length * (fontSize * 0.6)),
      totalHeight: lines.length * fontSize * 1.2,
      measurement: {
        width: Math.min(maxWidth, text.length * (fontSize * 0.6)),
        height: lines.length * fontSize * 1.2,
        fontSize,
        fontFamily,
        lineHeight: fontSize * 1.2
      }
    };
  }
  
  ctx.font = `${fontSize}px ${fontFamily}`;
  
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  let maxLineWidth = 0;
  
  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const testWidth = ctx.measureText(testLine).width;
    
    if (testWidth > maxWidth && currentLine) {
      lines.push(currentLine);
      maxLineWidth = Math.max(maxLineWidth, ctx.measureText(currentLine).width);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  
  if (currentLine) {
    lines.push(currentLine);
    maxLineWidth = Math.max(maxLineWidth, ctx.measureText(currentLine).width);
  }
  
  const lineHeight = fontSize * 1.2;
  const totalHeight = lines.length * lineHeight;
  
  return {
    lines,
    totalWidth: maxLineWidth,
    totalHeight,
    measurement: {
      width: maxLineWidth,
      height: totalHeight,
      fontSize,
      fontFamily,
      lineHeight
    }
  };
}

/**
 * Simple text wrapping fallback (no canvas)
 */
function wrapTextSimple(text: string, maxCharacters: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  
  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    
    if (testLine.length > maxCharacters && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  
  if (currentLine) {
    lines.push(currentLine);
  }
  
  return lines;
}

/**
 * Optimize text for bracket display
 */
export function optimizeTextForBracket(
  text: string,
  maxWidth: number,
  fontSize: number,
  fontFamily: string
): string {
  const measurement = measureText(text, fontSize, fontFamily);
  
  if (measurement.width <= maxWidth) {
    return text; // Text fits as-is
  }
  
  // Try removing common prefixes
  let optimized = text.replace(/^(Saint|St\.|St)\s+/i, '');
  let optimizedMeasurement = measureText(optimized, fontSize, fontFamily);
  
  if (optimizedMeasurement.width <= maxWidth) {
    return optimized; // Fits after removing prefix
  }
  
  // Try using first name and last name only
  const parts = optimized.split(' ');
  if (parts.length > 2) {
    optimized = `${parts[0]} ${parts[parts.length - 1]}`;
    optimizedMeasurement = measureText(optimized, fontSize, fontFamily);
    
    if (optimizedMeasurement.width <= maxWidth) {
      return optimized;
    }
  }
  
  // Last resort: truncate with ellipsis
  const ellipsis = '...';
  const ellipsisWidth = measureText(ellipsis, fontSize, fontFamily).width;
  const availableWidth = maxWidth - ellipsisWidth;
  
  let truncated = optimized;
  while (truncated.length > 1) {
    truncated = truncated.slice(0, -1);
    const truncatedWidth = measureText(truncated, fontSize, fontFamily).width;
    
    if (truncatedWidth <= availableWidth) {
      return truncated + ellipsis;
    }
  }
  
  return truncated || '...'; // Fallback
}

/**
 * Calculate optimal font size to fit text in given dimensions
 */
export function calculateOptimalFontSize(
  text: string,
  maxWidth: number,
  maxHeight: number,
  fontFamily: string,
  minSize: number = 10,
  maxSize: number = 24
): number {
  let fontSize = maxSize;
  
  while (fontSize >= minSize) {
    const measurement = measureText(text, fontSize, fontFamily);
    
    if (measurement.width <= maxWidth && measurement.height <= maxHeight) {
      return fontSize;
    }
    
    fontSize -= 1;
  }
  
  return minSize; // Fallback to minimum size
}

/**
 * Get text baseline and positioning information
 */
export function getTextBaseline(
  fontSize: number,
  fontFamily: string,
  context?: CanvasRenderingContext2D | null
): {
  ascent: number;
  descent: number;
  baseline: number;
} {
  const ctx = context || (initializeMeasurementCanvas(), measurementContext);
  
  if (!ctx) {
    // Fallback estimates
    const ascent = fontSize * 0.8;
    const descent = fontSize * 0.2;
    return {
      ascent,
      descent,
      baseline: ascent
    };
  }
  
  ctx.font = `${fontSize}px ${fontFamily}`;
  
  // Measure a test string to get metrics
  const metrics = ctx.measureText('Mg'); // Characters with ascenders and descenders
  
  const ascent = metrics.actualBoundingBoxAscent || fontSize * 0.8;
  const descent = metrics.actualBoundingBoxDescent || fontSize * 0.2;
  
  return {
    ascent,
    descent,
    baseline: ascent
  };
}

/**
 * Batch text measurement for performance
 */
export function batchMeasureText(
  texts: Array<{ text: string; fontSize: number; fontFamily: string }>,
  context?: CanvasRenderingContext2D | null
): Map<string, TextMeasurement> {
  const ctx = context || (initializeMeasurementCanvas(), measurementContext);
  const measurements = new Map<string, TextMeasurement>();
  
  if (!ctx) {
    // Fallback for server-side
    texts.forEach(({ text, fontSize, fontFamily }) => {
      measurements.set(text, {
        width: text.length * (fontSize * 0.6),
        height: fontSize * 1.2,
        fontSize,
        fontFamily,
        lineHeight: fontSize * 1.2
      });
    });
    return measurements;
  }
  
  // Group by font to minimize context switches
  const fontGroups = new Map<string, Array<{ text: string; fontSize: number; fontFamily: string }>>();
  
  texts.forEach(item => {
    const fontKey = `${item.fontSize}px ${item.fontFamily}`;
    if (!fontGroups.has(fontKey)) {
      fontGroups.set(fontKey, []);
    }
    fontGroups.get(fontKey)!.push(item);
  });
  
  // Measure each group
  fontGroups.forEach((items, fontKey) => {
    ctx.font = fontKey;
    
    items.forEach(({ text, fontSize, fontFamily }) => {
      const metrics = ctx.measureText(text);
      const width = metrics.width;
      let height = fontSize;
      
      if (metrics.actualBoundingBoxAscent && metrics.actualBoundingBoxDescent) {
        height = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
      } else {
        height = fontSize * 1.2;
      }
      
      measurements.set(text, {
        width,
        height,
        fontSize,
        fontFamily,
        lineHeight: height * 1.2
      });
    });
  });
  
  return measurements;
}

/**
 * Cleanup measurement canvas
 */
export function cleanupMeasurementCanvas(): void {
  measurementCanvas = null;
  measurementContext = null;
}