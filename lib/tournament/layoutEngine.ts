// lib/tournament/layoutEngine.ts
import { 
  Tournament, 
  TournamentMatch, 
  TournamentRound, 
  MatchPosition, 
  BracketLayout, 
  TextMeasurement 
} from '@/types';
import { measureText } from './textMeasurement';

// Layout constants for professional bracket appearance
const LAYOUT_CONSTANTS = {
  // Spacing
  ROUND_SPACING: 320, // Horizontal space between rounds (increased for full bracket)
  MATCH_SPACING: 50, // Vertical space between matches in same round (reduced to fit all)
  CATEGORY_SPACING: 30, // Space between categories in round 1 (reduced)
  TITLE_HEIGHT: 120, // Space for title at top
  
  // Margins
  MARGIN_LEFT: 40, // Reduced to fit more content
  MARGIN_RIGHT: 40,
  MARGIN_TOP: 40,
  MARGIN_BOTTOM: 40,
  
  // Match dimensions
  MATCH_WIDTH: 180, // Slightly smaller to fit more matches
  MATCH_HEIGHT: 50, // Reduced height to fit all matches
  SAINT_HEIGHT: 22, // Height of each saint name within match
  
  // Line styling
  LINE_THICKNESS: 2,
  CONNECTION_LENGTH: 35, // Length of horizontal connecting lines
  
  // Text styling
  FONT_FAMILY: 'var(--font-sorts-mill)', // Updated to Sorts Mill Goudy
  FONT_SIZE: 12, // Slightly smaller to fit better
  LINE_HEIGHT: 1.2,
  MAX_TEXT_WIDTH: 160, // Maximum width for saint names
};

export class TournamentLayoutEngine {
  private tournament: Tournament;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;

  constructor(tournament: Tournament) {
    this.tournament = tournament;
    this.initializeCanvas();
  }

  /**
   * Initialize canvas for text measurement
   */
  private initializeCanvas(): void {
    if (typeof window !== 'undefined') {
      this.canvas = document.createElement('canvas');
      this.ctx = this.canvas.getContext('2d');
      if (this.ctx) {
        this.ctx.font = `${LAYOUT_CONSTANTS.FONT_SIZE}px ${LAYOUT_CONSTANTS.FONT_FAMILY}`;
      }
    }
  }

  /**
   * Calculate complete bracket layout with perfect positioning
   */
  calculateLayout(): {
    matches: TournamentMatch[];
    layout: BracketLayout;
    connections: LineConnection[];
  } {
    // First pass: measure all text to determine optimal dimensions
    const textMeasurements = this.measureAllText();
    
    // Calculate optimal match dimensions based on text
    const matchDimensions = this.calculateMatchDimensions(textMeasurements);
    
    // Generate matches with positions
    const matches = this.generateMatches(matchDimensions);
    
    // Calculate bracket layout
    const layout = this.calculateBracketLayout(matches, matchDimensions);
    
    // Generate Round 2 connection lines
    const connections = this.generateRound2ConnectionLines(matches);
    
    // Update tournament metadata
    this.updateTournamentMetadata(layout, textMeasurements);
    
    return {
      matches,
      layout,
      connections
    };
  }

  /**
   * Measure all saint names to determine optimal sizing
   */
  private measureAllText(): Map<string, TextMeasurement> {
    const measurements = new Map<string, TextMeasurement>();
    
    this.tournament.categories.forEach(category => {
      category.saints.forEach(saint => {
        const measurement = measureText(
          saint.displayName,
          LAYOUT_CONSTANTS.FONT_SIZE,
          LAYOUT_CONSTANTS.FONT_FAMILY,
          this.ctx
        );
        measurements.set(saint.id, measurement);
      });
    });
    
    return measurements;
  }

  /**
   * Calculate optimal match dimensions based on text measurements
   */
  private calculateMatchDimensions(measurements: Map<string, TextMeasurement>): {
    width: number;
    height: number;
    saintHeight: number;
  } {
    let maxWidth = LAYOUT_CONSTANTS.MATCH_WIDTH;
    let maxHeight = LAYOUT_CONSTANTS.SAINT_HEIGHT;
    
    // Find the longest text
    measurements.forEach(measurement => {
      // Add padding to text width
      const neededWidth = measurement.width + 20; // 10px padding each side
      if (neededWidth > maxWidth) {
        maxWidth = Math.min(neededWidth, LAYOUT_CONSTANTS.MAX_TEXT_WIDTH + 20);
      }
      
      if (measurement.height > maxHeight) {
        maxHeight = measurement.height;
      }
    });
    
    return {
      width: maxWidth,
      height: maxHeight * 2 + 8, // Two saints plus padding
      saintHeight: maxHeight
    };
  }

  /**
   * Generate Round 1 and Round 2 matches
   */
  private generateMatches(matchDimensions: { width: number; height: number }): TournamentMatch[] {
    // Generate Round 1 matches
    const round1Matches = this.generateRound1Matches(matchDimensions);
    
    // Generate Round 2 matches
    const round2Matches = this.generateRound2Matches(matchDimensions);
    
    return [...round1Matches, ...round2Matches];
  }

  /**
   * Generate Round 1 matches - Simple left/right positioning
   */
  private generateRound1Matches(matchDimensions: { width: number; height: number }): TournamentMatch[] {
    const matches: TournamentMatch[] = [];
    let matchNumber = 1;
    
    // Calculate bracket dimensions
    const totalWidth = this.calculateBracketLayout([], matchDimensions).totalWidth;
    const leftSideX = LAYOUT_CONSTANTS.MARGIN_LEFT;
    const rightSideX = totalWidth - LAYOUT_CONSTANTS.MARGIN_RIGHT - matchDimensions.width;
    
    // Calculate vertical spacing - distribute all 16 matches evenly
    const totalHeight = this.calculateTotalBracketHeight();
    const availableHeight = totalHeight - LAYOUT_CONSTANTS.TITLE_HEIGHT - LAYOUT_CONSTANTS.MARGIN_BOTTOM;
    const matchSpacing = availableHeight / 9; // 9 sections for 8 matches per side
    
    this.tournament.categories.forEach((category, categoryIndex) => {
      // Create 4 matches per category (8 saints / 2 = 4 matches)
      for (let i = 0; i < category.saints.length; i += 2) {
        const saint1 = category.saints[i];
        const saint2 = category.saints[i + 1];
        
        // Determine positioning: first 8 matches on left, next 8 on right
        const isLeftSide = matchNumber <= 8;
        const matchX = isLeftSide ? leftSideX : rightSideX;
        
        // Calculate Y position based on match position within its side
        const sideMatchIndex = isLeftSide ? matchNumber - 1 : matchNumber - 9; // 0-7 for each side
        const matchY = LAYOUT_CONSTANTS.TITLE_HEIGHT + ((sideMatchIndex + 1) * matchSpacing) - (matchDimensions.height / 2);
        
        const match: TournamentMatch = {
          id: `R1-M${matchNumber}`,
          roundNumber: 1,
          matchNumber,
          saint1,
          saint2,
          votesForSaint1: 0,
          votesForSaint2: 0,
          totalVotes: 0,
          position: {
            x: matchX,
            y: matchY,
            width: matchDimensions.width,
            height: matchDimensions.height,
            lineLength: 0 // No connection lines for now
          },
          categoryAffiliation: category.id,
          isLeftSide
        };
        
        matches.push(match);
        matchNumber++;
      }
    });
    
    return matches;
  }

  /**
   * Generate Round 2 matches - positioned for connections
   */
  private generateRound2Matches(matchDimensions: { width: number; height: number }): TournamentMatch[] {
    const matches: TournamentMatch[] = [];
    
    // Calculate positioning for 8 Round 2 matches (4 left, 4 right)
    const totalWidth = this.calculateBracketLayout([], matchDimensions).totalWidth;
    const horizontalOffset = 60; // Distance from Round 1 matches plus connection lines
    
    const leftSideX = LAYOUT_CONSTANTS.MARGIN_LEFT + matchDimensions.width + horizontalOffset;
    const rightSideX = totalWidth - LAYOUT_CONSTANTS.MARGIN_RIGHT - matchDimensions.width - horizontalOffset;
    
    // Calculate vertical spacing for 4 matches per side
    const totalHeight = this.calculateTotalBracketHeight();
    const availableHeight = totalHeight - LAYOUT_CONSTANTS.TITLE_HEIGHT - LAYOUT_CONSTANTS.MARGIN_BOTTOM;
    const matchSpacing = availableHeight / 5; // 5 sections for 4 matches per side
    
    // Generate 8 Round 2 matches
    for (let i = 1; i <= 8; i++) {
      const isLeftSide = i <= 4;
      const matchX = isLeftSide ? leftSideX : rightSideX;
      
      // Calculate Y position based on match position within its side
      const sideMatchIndex = isLeftSide ? i - 1 : i - 5; // 0-3 for each side
      const matchY = LAYOUT_CONSTANTS.TITLE_HEIGHT + ((sideMatchIndex + 1) * matchSpacing) - (matchDimensions.height / 2);
      
      const match: TournamentMatch = {
        id: `R2-M${i}`,
        roundNumber: 2,
        matchNumber: i,
        saint1: null, // Empty - no TBD
        saint2: null,
        votesForSaint1: 0,
        votesForSaint2: 0,
        totalVotes: 0,
        position: {
          x: matchX,
          y: matchY,
          width: matchDimensions.width,
          height: matchDimensions.height,
          lineLength: 0
        },
        isLeftSide
      };
      
      matches.push(match);
    }
    
    return matches;
  }

  /**
   * Generate Round 2 connection lines including horizontal lines to Round 2 matches
   */
  private generateRound2ConnectionLines(matches: TournamentMatch[]): LineConnection[] {
    const connections: LineConnection[] = [];
    
    // Separate Round 1 and Round 2 matches
    const round1Matches = matches.filter(m => m.roundNumber === 1);
    const round2Matches = matches.filter(m => m.roundNumber === 2);
    
    // Process Round 1 matches in pairs: 1-2, 3-4, 5-6, 7-8, 9-10, 11-12, 13-14, 15-16
    for (let i = 0; i < round1Matches.length; i += 2) {
      const match1 = round1Matches[i];
      const match2 = round1Matches[i + 1];
      
      if (match1 && match2) {
        const isLeftSide = match1.isLeftSide;
        
        // Calculate connection points
        const match1Y = match1.position.y + (match1.position.height / 2);
        const match2Y = match2.position.y + (match2.position.height / 2);
        const verticalCenterY = (match1Y + match2Y) / 2;
        
        // Horizontal lines extending from matches
        const horizontalLength = 30;
        
        if (isLeftSide) {
          // Left side: lines extend to the right
          const match1ExitX = match1.position.x + match1.position.width;
          const match2ExitX = match2.position.x + match2.position.width;
          const junctionX = match1ExitX + horizontalLength;
          
          // Horizontal line from match 1
          connections.push({
            id: `pair-${Math.floor(i/2)+1}-match1-horizontal`,
            type: 'horizontal',
            x1: match1ExitX,
            y1: match1Y,
            x2: junctionX,
            y2: match1Y,
            strokeWidth: LAYOUT_CONSTANTS.LINE_THICKNESS
          });
          
          // Horizontal line from match 2
          connections.push({
            id: `pair-${Math.floor(i/2)+1}-match2-horizontal`,
            type: 'horizontal',
            x1: match2ExitX,
            y1: match2Y,
            x2: junctionX,
            y2: match2Y,
            strokeWidth: LAYOUT_CONSTANTS.LINE_THICKNESS
          });
          
          // Vertical connecting line
          connections.push({
            id: `pair-${Math.floor(i/2)+1}-vertical`,
            type: 'vertical',
            x1: junctionX,
            y1: Math.min(match1Y, match2Y),
            x2: junctionX,
            y2: Math.max(match1Y, match2Y),
            strokeWidth: LAYOUT_CONSTANTS.LINE_THICKNESS
          });
          
          // Horizontal line from center of vertical to Round 2 match
          const round2Match = round2Matches[Math.floor(i/2)];
          if (round2Match) {
            const round2EntryX = round2Match.position.x;
            connections.push({
              id: `pair-${Math.floor(i/2)+1}-to-round2`,
              type: 'horizontal',
              x1: junctionX,
              y1: verticalCenterY,
              x2: round2EntryX,
              y2: verticalCenterY,
              strokeWidth: LAYOUT_CONSTANTS.LINE_THICKNESS
            });
          }
        } else {
          // Right side: lines extend to the left
          const match1ExitX = match1.position.x;
          const match2ExitX = match2.position.x;
          const junctionX = match1ExitX - horizontalLength;
          
          // Horizontal line from match 1
          connections.push({
            id: `pair-${Math.floor(i/2)+1}-match1-horizontal`,
            type: 'horizontal',
            x1: match1ExitX,
            y1: match1Y,
            x2: junctionX,
            y2: match1Y,
            strokeWidth: LAYOUT_CONSTANTS.LINE_THICKNESS
          });
          
          // Horizontal line from match 2
          connections.push({
            id: `pair-${Math.floor(i/2)+1}-match2-horizontal`,
            type: 'horizontal',
            x1: match2ExitX,
            y1: match2Y,
            x2: junctionX,
            y2: match2Y,
            strokeWidth: LAYOUT_CONSTANTS.LINE_THICKNESS
          });
          
          // Vertical connecting line
          connections.push({
            id: `pair-${Math.floor(i/2)+1}-vertical`,
            type: 'vertical',
            x1: junctionX,
            y1: Math.min(match1Y, match2Y),
            x2: junctionX,
            y2: Math.max(match1Y, match2Y),
            strokeWidth: LAYOUT_CONSTANTS.LINE_THICKNESS
          });
          
          // Horizontal line from center of vertical to Round 2 match
          const round2Match = round2Matches[Math.floor(i/2) + 4]; // Right side Round 2 matches
          if (round2Match) {
            const round2EntryX = round2Match.position.x + round2Match.position.width;
            connections.push({
              id: `pair-${Math.floor(i/2)+1}-to-round2`,
              type: 'horizontal',
              x1: junctionX,
              y1: verticalCenterY,
              x2: round2EntryX,
              y2: verticalCenterY,
              strokeWidth: LAYOUT_CONSTANTS.LINE_THICKNESS
            });
          }
        }
      }
    }
    
    return connections;
  }

  /**
   * Calculate Y position for category start
   */
  private calculateCategoryStartY(categoryIndex: number): number {
    const matchesPerCategory = 4;
    const totalMatchHeight = matchesPerCategory * LAYOUT_CONSTANTS.MATCH_HEIGHT;
    const totalSpacing = (matchesPerCategory - 1) * LAYOUT_CONSTANTS.MATCH_SPACING;
    const totalCategoryHeight = totalMatchHeight + totalSpacing;
    
    return LAYOUT_CONSTANTS.TITLE_HEIGHT + 
           LAYOUT_CONSTANTS.MARGIN_TOP + 
           (categoryIndex * (totalCategoryHeight + LAYOUT_CONSTANTS.CATEGORY_SPACING));
  }

  /**
   * Calculate total bracket height
   */
  private calculateTotalBracketHeight(): number {
    // Calculate total height needed for all categories
    const matchesPerCategory = 4;
    const totalMatchHeight = matchesPerCategory * LAYOUT_CONSTANTS.MATCH_HEIGHT;
    const totalSpacing = (matchesPerCategory - 1) * LAYOUT_CONSTANTS.MATCH_SPACING;
    const totalCategoryHeight = totalMatchHeight + totalSpacing;
    
    // 4 categories with spacing between them
    const allCategoriesHeight = 4 * totalCategoryHeight;
    const categorySpacing = 3 * LAYOUT_CONSTANTS.CATEGORY_SPACING;
    
    return LAYOUT_CONSTANTS.TITLE_HEIGHT + 
           LAYOUT_CONSTANTS.MARGIN_TOP + 
           allCategoriesHeight + 
           categorySpacing + 
           LAYOUT_CONSTANTS.MARGIN_BOTTOM;
  }

  /**
   * Calculate simple bracket layout for left/right matches only
   */
  private calculateBracketLayout(
    matches: TournamentMatch[], 
    matchDimensions: { width: number; height: number }
  ): BracketLayout {
    // Simple width: left margin + match + spacing + match + right margin
    const totalWidth = LAYOUT_CONSTANTS.MARGIN_LEFT + 
                      matchDimensions.width + // Left match
                      (4 * LAYOUT_CONSTANTS.ROUND_SPACING) + // Space between sides
                      matchDimensions.width + // Right match
                      LAYOUT_CONSTANTS.MARGIN_RIGHT;
    
    const totalHeight = this.calculateTotalBracketHeight();
    
    return {
      totalWidth,
      totalHeight,
      roundSpacing: LAYOUT_CONSTANTS.ROUND_SPACING,
      matchSpacing: LAYOUT_CONSTANTS.MATCH_SPACING,
      categorySpacing: LAYOUT_CONSTANTS.CATEGORY_SPACING,
      marginTop: LAYOUT_CONSTANTS.MARGIN_TOP,
      marginBottom: LAYOUT_CONSTANTS.MARGIN_BOTTOM,
      marginLeft: LAYOUT_CONSTANTS.MARGIN_LEFT,
      marginRight: LAYOUT_CONSTANTS.MARGIN_RIGHT
    };
  }


  /**
   * Update tournament metadata with calculated dimensions
   */
  private updateTournamentMetadata(layout: BracketLayout, measurements: Map<string, TextMeasurement>): void {
    let longestName = '';
    let maxWidth = 0;
    let maxHeight = 0;
    
    measurements.forEach((measurement, saintId) => {
      if (measurement.width > maxWidth) {
        maxWidth = measurement.width;
        longestName = this.tournament.categories
          .flatMap(c => c.saints)
          .find(s => s.id === saintId)?.displayName || '';
      }
      if (measurement.height > maxHeight) {
        maxHeight = measurement.height;
      }
    });
    
    this.tournament.metadata.textMeasurements = {
      longestName,
      maxTextWidth: maxWidth,
      maxTextHeight: maxHeight
    };
    
    this.tournament.metadata.bracketDimensions = {
      totalWidth: layout.totalWidth,
      totalHeight: layout.totalHeight,
      scaleFactor: 1
    };
  }
}

// Supporting interfaces
interface LineConnection {
  id: string;
  type: 'horizontal' | 'vertical';
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  strokeWidth: number;
}

/**
 * Main function to calculate tournament layout
 */
export function calculateTournamentLayout(tournament: Tournament) {
  const engine = new TournamentLayoutEngine(tournament);
  return engine.calculateLayout();
}

/**
 * Utility function to get layout constants for other components
 */
export function getLayoutConstants() {
  return LAYOUT_CONSTANTS;
}