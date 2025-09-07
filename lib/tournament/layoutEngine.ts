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
  ROUND_SPACING: 280, // Horizontal space between rounds (optimized for 5 rounds)
  MATCH_SPACING: 50, // Vertical space between matches in same round
  CATEGORY_SPACING: 30, // Space between categories in round 1
  TITLE_HEIGHT: 120, // Space for title at top
  
  // Margins
  MARGIN_LEFT: 40,
  MARGIN_RIGHT: 40,
  MARGIN_TOP: 40,
  MARGIN_BOTTOM: 40,
  
  // Match dimensions
  MATCH_WIDTH: 180,
  MATCH_HEIGHT: 50,
  SAINT_HEIGHT: 22,
  
  // Line styling
  LINE_THICKNESS: 2,
  CONNECTION_LENGTH: 35, // Length of horizontal connecting lines
  JUNCTION_LENGTH: 20, // Length from match to junction point
  SHORT_APPROACH_DISTANCE: 40, // Distance from match edge for short connections (Rounds 2→3, 3→4)
  
  // Round 4 positioning offsets
  ROUND_4_OFFSET: {
    LEFT_SIDE: -15,  // Left side slightly higher
    RIGHT_SIDE: 15   // Right side slightly lower  
  },
  
  // Championship positioning
  CHAMPIONSHIP_CENTER_OFFSET: 100, // Distance from center for championship match
  
  // Text styling
  FONT_FAMILY: 'var(--font-sorts-mill)',
  FONT_SIZE: 12,
  LINE_HEIGHT: 1.2,
  MAX_TEXT_WIDTH: 160,
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
   * Generate all tournament rounds with cascade-based positioning
   */
  private generateMatches(matchDimensions: { width: number; height: number }): TournamentMatch[] {
    // Generate all rounds using cascade-based positioning
    return this.generateAllRounds(matchDimensions);
  }

  /**
   * Generate all tournament rounds using cascade-based positioning (4 rounds only)
   */
  private generateAllRounds(matchDimensions: { width: number; height: number }): TournamentMatch[] {
    const allMatches: TournamentMatch[] = [];
    
    // Round 1: Base positioning (16 matches)
    const round1Matches = this.generateRound1Matches(matchDimensions);
    allMatches.push(...round1Matches);
    
    // Round 2: 8 matches positioned at centers of Round 1 pairs
    const round2Matches = this.generateCascadeRound(round1Matches, 2, 8, matchDimensions);
    allMatches.push(...round2Matches);
    
    // Round 3: 4 matches positioned at centers of Round 2 pairs
    const round3Matches = this.generateCascadeRound(round2Matches, 3, 4, matchDimensions);
    allMatches.push(...round3Matches);
    
    // Round 4: 2 matches positioned at centers of Round 3 pairs (FINAL ROUND)
    const round4Matches = this.generateCascadeRound(round3Matches, 4, 2, matchDimensions);
    allMatches.push(...round4Matches);
    
    return allMatches;
  }

  /**
   * Generate Round 1 matches with base positioning
   */
  private generateRound1Matches(matchDimensions: { width: number; height: number }): TournamentMatch[] {
    const matches: TournamentMatch[] = [];
    let matchNumber = 1;
    
    // Calculate bracket dimensions for full 5-round layout
    const totalWidth = this.calculateFullBracketWidth(matchDimensions);
    const leftSideX = LAYOUT_CONSTANTS.MARGIN_LEFT;
    const rightSideX = totalWidth - LAYOUT_CONSTANTS.MARGIN_RIGHT - matchDimensions.width;
    
    // Calculate vertical spacing - distribute all 16 matches evenly
    const totalHeight = this.calculateTotalBracketHeight();
    const availableHeight = totalHeight - LAYOUT_CONSTANTS.TITLE_HEIGHT - LAYOUT_CONSTANTS.MARGIN_BOTTOM;
    const matchSpacing = availableHeight / 9; // 9 sections for 8 matches per side
    
    this.tournament.categories.forEach((category) => {
      // Create 4 matches per category (8 saints / 2 = 4 matches)
      for (let i = 0; i < category.saints.length; i += 2) {
        const saint1 = category.saints[i];
        const saint2 = category.saints[i + 1];
        
        // Determine positioning: first 8 matches on left, next 8 on right
        const isLeftSide = matchNumber <= 8;
        const matchX = isLeftSide ? leftSideX : rightSideX;
        
        // Calculate Y position based on match position within its side
        const sideMatchIndex = isLeftSide ? matchNumber - 1 : matchNumber - 9;
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
            lineLength: 0
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
   * Generate cascade round - positions matches at vertical centers of previous round pairs
   */
  private generateCascadeRound(
    previousRoundMatches: TournamentMatch[], 
    roundNumber: number, 
    matchCount: number, 
    matchDimensions: { width: number; height: number }
  ): TournamentMatch[] {
    const matches: TournamentMatch[] = [];
    const totalWidth = this.calculateFullBracketWidth(matchDimensions);
    
    // Calculate horizontal position for this round
    const roundX = this.calculateRoundXPosition(roundNumber, matchDimensions, totalWidth);
    
    // Process previous round matches in pairs
    for (let i = 0; i < previousRoundMatches.length; i += 2) {
      const match1 = previousRoundMatches[i];
      const match2 = previousRoundMatches[i + 1];
      
      if (match1 && match2) {
        // Calculate vertical center of the pair
        const match1CenterY = match1.position.y + (match1.position.height / 2);
        const match2CenterY = match2.position.y + (match2.position.height / 2);
        const pairCenterY = (match1CenterY + match2CenterY) / 2;
        
        // Position new match at the center, adjusted for match height
        let matchY = pairCenterY - (matchDimensions.height / 2);
        
        // Apply Round 4 vertical offsets
        if (roundNumber === 4) {
          const offset = match1.isLeftSide ? LAYOUT_CONSTANTS.ROUND_4_OFFSET.LEFT_SIDE : LAYOUT_CONSTANTS.ROUND_4_OFFSET.RIGHT_SIDE;
          matchY += offset;
        }
        
        // Determine which side this match is on
        const isLeftSide = match1.isLeftSide;
        const matchNumber = Math.floor(i / 2) + 1;
        
        // Calculate correct X position based on side
        const correctRoundX = this.calculateRoundXPositionForSide(roundNumber, matchDimensions, totalWidth, isLeftSide);
        
        const match: TournamentMatch = {
          id: `R${roundNumber}-M${matchNumber}`,
          roundNumber,
          matchNumber,
          saint1: null,
          saint2: null,
          votesForSaint1: 0,
          votesForSaint2: 0,
          totalVotes: 0,
          position: {
            x: correctRoundX,
            y: matchY,
            width: matchDimensions.width,
            height: matchDimensions.height,
            lineLength: 0
          },
          isLeftSide,
          previousMatch1Id: match1.id,
          previousMatch2Id: match2.id
        };
        
        matches.push(match);
      }
    }
    
    return matches;
  }

  /**
   * Calculate X position for a specific round (legacy - for left side)
   */
  private calculateRoundXPosition(roundNumber: number, matchDimensions: { width: number; height: number }, totalWidth: number): number {
    return this.calculateRoundXPositionForSide(roundNumber, matchDimensions, totalWidth, true);
  }

  /**
   * Calculate X position for a specific round and side (4 rounds only)
   */
  private calculateRoundXPositionForSide(roundNumber: number, matchDimensions: { width: number; height: number }, totalWidth: number, isLeftSide: boolean): number {
    const centerX = totalWidth / 2;
    
    switch (roundNumber) {
      case 1:
        // Round 1 positions are already handled in generateRound1Matches
        return isLeftSide ? LAYOUT_CONSTANTS.MARGIN_LEFT : totalWidth - LAYOUT_CONSTANTS.MARGIN_RIGHT - matchDimensions.width;
      
      case 2:
        // Position inward from Round 1
        const round1LeftX = LAYOUT_CONSTANTS.MARGIN_LEFT;
        const round1RightX = totalWidth - LAYOUT_CONSTANTS.MARGIN_RIGHT - matchDimensions.width;
        const connectionOffset = LAYOUT_CONSTANTS.JUNCTION_LENGTH + LAYOUT_CONSTANTS.CONNECTION_LENGTH;
        
        return isLeftSide 
          ? round1LeftX + matchDimensions.width + connectionOffset
          : round1RightX - connectionOffset - matchDimensions.width;
      
      case 3:
        // Position inward from Round 2
        const round2LeftX = this.calculateRoundXPositionForSide(2, matchDimensions, totalWidth, true);
        const round2RightX = this.calculateRoundXPositionForSide(2, matchDimensions, totalWidth, false);
        
        return isLeftSide 
          ? round2LeftX + matchDimensions.width + LAYOUT_CONSTANTS.ROUND_SPACING
          : round2RightX - LAYOUT_CONSTANTS.ROUND_SPACING - matchDimensions.width;
      
      case 4:
        // Final round - position inward from Round 3 (BRACKET TERMINATES HERE)
        const round3LeftX = this.calculateRoundXPositionForSide(3, matchDimensions, totalWidth, true);
        const round3RightX = this.calculateRoundXPositionForSide(3, matchDimensions, totalWidth, false);
        
        return isLeftSide 
          ? round3LeftX + matchDimensions.width + LAYOUT_CONSTANTS.ROUND_SPACING
          : round3RightX - LAYOUT_CONSTANTS.ROUND_SPACING - matchDimensions.width;
      
      default:
        return centerX;
    }
  }

  /**
   * Calculate total bracket width for 4 rounds (no championship)
   */
  private calculateFullBracketWidth(matchDimensions: { width: number; height: number }): number {
    return LAYOUT_CONSTANTS.MARGIN_LEFT + 
           matchDimensions.width + // Round 1 left
           LAYOUT_CONSTANTS.ROUND_SPACING + // Space to Round 2
           matchDimensions.width + // Round 2 left
           LAYOUT_CONSTANTS.ROUND_SPACING + // Space to Round 3
           matchDimensions.width + // Round 3 left
           LAYOUT_CONSTANTS.ROUND_SPACING + // Space to Round 4
           matchDimensions.width + // Round 4 left
           LAYOUT_CONSTANTS.ROUND_SPACING + // Space between sides (minimum)
           matchDimensions.width + // Round 4 right
           LAYOUT_CONSTANTS.ROUND_SPACING + // Space to Round 3 right
           matchDimensions.width + // Round 3 right
           LAYOUT_CONSTANTS.ROUND_SPACING + // Space to Round 2 right
           matchDimensions.width + // Round 2 right
           LAYOUT_CONSTANTS.ROUND_SPACING + // Space to Round 1 right
           matchDimensions.width + // Round 1 right
           LAYOUT_CONSTANTS.MARGIN_RIGHT;
  }


  /**
   * Generate all connection lines for the complete tournament bracket
   */
  private generateRound2ConnectionLines(matches: TournamentMatch[]): LineConnection[] {
    return this.generateAllConnections(matches);
  }

  /**
   * Generate connection lines for rounds 1-3 only (terminate after Round 4)
   */
  private generateAllConnections(matches: TournamentMatch[]): LineConnection[] {
    const connections: LineConnection[] = [];
    
    // Group matches by round
    const matchesByRound = new Map<number, TournamentMatch[]>();
    matches.forEach(match => {
      if (!matchesByRound.has(match.roundNumber)) {
        matchesByRound.set(match.roundNumber, []);
      }
      matchesByRound.get(match.roundNumber)!.push(match);
    });
    
    // Generate connections for round transitions (1->2, 2->3, 3->4) 
    // Round 4 terminates the bracket
    for (let round = 1; round <= 3; round++) {
      const currentRoundMatches = matchesByRound.get(round) || [];
      const nextRoundMatches = matchesByRound.get(round + 1) || [];
      
      connections.push(...this.generateRoundConnections(currentRoundMatches, nextRoundMatches, round));
    }
    
    return connections;
  }

  /**
   * Generate connection lines between two specific rounds
   */
  private generateRoundConnections(
    currentRoundMatches: TournamentMatch[], 
    nextRoundMatches: TournamentMatch[], 
    roundNumber: number
  ): LineConnection[] {
    const connections: LineConnection[] = [];
    
    // Process matches in pairs
    for (let i = 0; i < currentRoundMatches.length; i += 2) {
      const match1 = currentRoundMatches[i];
      const match2 = currentRoundMatches[i + 1];
      const nextMatch = nextRoundMatches[Math.floor(i / 2)];
      
      if (match1 && match2 && nextMatch) {
        const isLeftSide = match1.isLeftSide;
        
        // Calculate connection points
        const match1CenterY = match1.position.y + (match1.position.height / 2);
        const match2CenterY = match2.position.y + (match2.position.height / 2);
        const nextMatchCenterY = nextMatch.position.y + (nextMatch.position.height / 2);
        
        if (isLeftSide) {
          // Left side: lines extend to the right
          const match1ExitX = match1.position.x + match1.position.width;
          const match2ExitX = match2.position.x + match2.position.width;
          const junctionX = match1ExitX + LAYOUT_CONSTANTS.JUNCTION_LENGTH;
          const nextMatchEntryX = nextMatch.position.x;
          
          // Horizontal lines from matches to junction
          connections.push({
            id: `R${roundNumber}-pair-${Math.floor(i/2)+1}-match1-horizontal`,
            type: 'horizontal',
            x1: match1ExitX,
            y1: match1CenterY,
            x2: junctionX,
            y2: match1CenterY,
            strokeWidth: LAYOUT_CONSTANTS.LINE_THICKNESS
          });
          
          connections.push({
            id: `R${roundNumber}-pair-${Math.floor(i/2)+1}-match2-horizontal`,
            type: 'horizontal',
            x1: match2ExitX,
            y1: match2CenterY,
            x2: junctionX,
            y2: match2CenterY,
            strokeWidth: LAYOUT_CONSTANTS.LINE_THICKNESS
          });
          
          // Vertical connecting line
          connections.push({
            id: `R${roundNumber}-pair-${Math.floor(i/2)+1}-vertical`,
            type: 'vertical',
            x1: junctionX,
            y1: Math.min(match1CenterY, match2CenterY),
            x2: junctionX,
            y2: Math.max(match1CenterY, match2CenterY),
            strokeWidth: LAYOUT_CONSTANTS.LINE_THICKNESS
          });
          
          // Horizontal line to next round match (short approach for Rounds 2→3 and 3→4)
          const leftEndX = (roundNumber >= 2) 
            ? nextMatchEntryX - LAYOUT_CONSTANTS.SHORT_APPROACH_DISTANCE 
            : nextMatchEntryX;
          
          connections.push({
            id: `R${roundNumber}-pair-${Math.floor(i/2)+1}-to-next`,
            type: 'horizontal',
            x1: junctionX,
            y1: nextMatchCenterY,
            x2: leftEndX,
            y2: nextMatchCenterY,
            strokeWidth: LAYOUT_CONSTANTS.LINE_THICKNESS
          });
        } else {
          // Right side: lines extend to the left
          const match1ExitX = match1.position.x;
          const match2ExitX = match2.position.x;
          const junctionX = match1ExitX - LAYOUT_CONSTANTS.JUNCTION_LENGTH;
          const nextMatchEntryX = nextMatch.position.x + nextMatch.position.width;
          
          // Horizontal lines from matches to junction
          connections.push({
            id: `R${roundNumber}-pair-${Math.floor(i/2)+1}-match1-horizontal`,
            type: 'horizontal',
            x1: match1ExitX,
            y1: match1CenterY,
            x2: junctionX,
            y2: match1CenterY,
            strokeWidth: LAYOUT_CONSTANTS.LINE_THICKNESS
          });
          
          connections.push({
            id: `R${roundNumber}-pair-${Math.floor(i/2)+1}-match2-horizontal`,
            type: 'horizontal',
            x1: match2ExitX,
            y1: match2CenterY,
            x2: junctionX,
            y2: match2CenterY,
            strokeWidth: LAYOUT_CONSTANTS.LINE_THICKNESS
          });
          
          // Vertical connecting line
          connections.push({
            id: `R${roundNumber}-pair-${Math.floor(i/2)+1}-vertical`,
            type: 'vertical',
            x1: junctionX,
            y1: Math.min(match1CenterY, match2CenterY),
            x2: junctionX,
            y2: Math.max(match1CenterY, match2CenterY),
            strokeWidth: LAYOUT_CONSTANTS.LINE_THICKNESS
          });
          
          // Horizontal line to next round match (short approach for Rounds 2→3 and 3→4)
          const rightEndX = (roundNumber >= 2) 
            ? nextMatchEntryX + LAYOUT_CONSTANTS.SHORT_APPROACH_DISTANCE 
            : nextMatchEntryX;
          
          connections.push({
            id: `R${roundNumber}-pair-${Math.floor(i/2)+1}-to-next`,
            type: 'horizontal',
            x1: junctionX,
            y1: nextMatchCenterY,
            x2: rightEndX,
            y2: nextMatchCenterY,
            strokeWidth: LAYOUT_CONSTANTS.LINE_THICKNESS
          });
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
   * Calculate complete bracket layout for all 5 rounds
   */
  private calculateBracketLayout(
    matches: TournamentMatch[], 
    matchDimensions: { width: number; height: number }
  ): BracketLayout {
    const totalWidth = this.calculateFullBracketWidth(matchDimensions);
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