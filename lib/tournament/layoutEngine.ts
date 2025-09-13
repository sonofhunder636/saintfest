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
  TITLE_HEIGHT: 60, // Space for title at top
  
  // Label spacing
  LABEL_SPACE: 200, // Width reserved for category labels
  LABEL_MARGIN: 10, // Spacing around labels

  // Margins (updated to account for label space)
  MARGIN_LEFT: 220, // 10px + 200px label + 10px space
  MARGIN_RIGHT: 220, // 10px space + 200px label + 10px
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
  
  // Center spacing
  CENTER_GAP: 600, // Gap for visual separation and connections
  
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
   * Generate all tournament rounds using cascade-based positioning with mirroring (4 rounds only)
   */
  private generateAllRounds(matchDimensions: { width: number; height: number }): TournamentMatch[] {
    const totalWidth = this.calculateFullBracketWidth(matchDimensions);
    
    // Generate left side only (8 matches for Round 1)
    const leftRound1Matches = this.generateLeftSideRound1Matches(matchDimensions);
    
    // Mirror to create right side matches
    const rightRound1Matches = this.mirrorMatches(leftRound1Matches, totalWidth, matchDimensions.width);
    
    const allRound1Matches = [...leftRound1Matches, ...rightRound1Matches];
    
    // Generate subsequent rounds using cascade, but only for left side first
    const leftRound2Matches = this.generateLeftSideCascadeRound(leftRound1Matches, 2, 4, matchDimensions);
    const rightRound2Matches = this.mirrorMatches(leftRound2Matches, totalWidth, matchDimensions.width);
    const allRound2Matches = [...leftRound2Matches, ...rightRound2Matches];
    
    const leftRound3Matches = this.generateLeftSideCascadeRound(leftRound2Matches, 3, 2, matchDimensions);
    const rightRound3Matches = this.mirrorMatches(leftRound3Matches, totalWidth, matchDimensions.width);
    const allRound3Matches = [...leftRound3Matches, ...rightRound3Matches];
    
    const leftRound4Matches = this.generateLeftSideCascadeRound(leftRound3Matches, 4, 1, matchDimensions);
    const rightRound4Matches = this.mirrorMatches(leftRound4Matches, totalWidth, matchDimensions.width);
    const allRound4Matches = [...leftRound4Matches, ...rightRound4Matches];
    
    // Add championship bracket slots (left side and mirrored right side)
    const leftChampionshipMatches = this.generateChampionshipMatch(leftRound4Matches, matchDimensions);
    const rightChampionshipMatches = this.mirrorMatches(leftChampionshipMatches, totalWidth, matchDimensions.width);
    const allChampionshipMatches = [...leftChampionshipMatches, ...rightChampionshipMatches];
    
    return [...allRound1Matches, ...allRound2Matches, ...allRound3Matches, ...allRound4Matches, ...allChampionshipMatches];
  }

  /**
   * Generate championship match (half-height bracket slot)
   */
  private generateChampionshipMatch(leftRound4Matches: TournamentMatch[], matchDimensions: { width: number; height: number }): TournamentMatch[] {
    if (leftRound4Matches.length === 0) return [];
    
    const leftRound4Match = leftRound4Matches[0];
    const matchCenterY = leftRound4Match.position.y + (leftRound4Match.position.height / 2);
    const matchExitX = leftRound4Match.position.x + leftRound4Match.position.width;
    const lineLength = LAYOUT_CONSTANTS.JUNCTION_LENGTH + LAYOUT_CONSTANTS.CONNECTION_LENGTH;
    const verticalLineLength = 180;
    
    // Position at end of top horizontal line
    const championshipX = matchExitX + lineLength + lineLength; // End of top horizontal line
    const championshipY = matchCenterY - verticalLineLength - (matchDimensions.height / 2); // Center the full-height bracket on the line
    
    const championshipMatch: TournamentMatch = {
      id: 'L-CHAMPIONSHIP',
      roundNumber: 5,
      matchNumber: 1,
      saint1: null, // Will be populated with winner
      saint2: null, // Single saint only - no divider line needed
      votesForSaint1: 0,
      votesForSaint2: 0,
      totalVotes: 0,
      position: {
        x: championshipX,
        y: championshipY,
        width: matchDimensions.width,
        height: matchDimensions.height, // Full height!
        lineLength: 0
      },
      isLeftSide: true,
      previousMatch1Id: leftRound4Match.id,
      isChampionship: true // Special flag to indicate this is a championship bracket
    };
    
    return [championshipMatch];
  }

  /**
   * Mirror matches from left side to create right side
   */
  private mirrorMatches(leftMatches: TournamentMatch[], totalWidth: number, matchWidth: number): TournamentMatch[] {
    return leftMatches.map((match, index) => {
      // Allow championship match to be mirrored (no exclusion)
      
      // Calculate mirrored match number based on round
      let mirroredMatchNumber = match.matchNumber;
      if (match.roundNumber === 1) {
        mirroredMatchNumber = match.matchNumber + 8; // Right side Round 1: 9-16
      } else if (match.roundNumber === 2) {
        mirroredMatchNumber = match.matchNumber + 4; // Right side Round 2: 5-8
      } else if (match.roundNumber === 3) {
        mirroredMatchNumber = match.matchNumber + 2; // Right side Round 3: 3-4
      } else if (match.roundNumber === 4) {
        mirroredMatchNumber = match.matchNumber + 1; // Right side Round 4: 2
      } else if (match.roundNumber === 5) {
        mirroredMatchNumber = match.matchNumber + 1; // Right side Round 5: 2 (right championship)
      }

      // Special Y positioning for championship bracket (Round 5)
      let mirroredY = match.position.y;
      if (match.roundNumber === 5 && match.id === 'L-CHAMPIONSHIP') {
        // Left championship connects to TOP: y = matchCenterY - 180 - (height/2)
        // Right championship should connect to BOTTOM: y = matchCenterY + 180 - (height/2)
        // Calculate the offset: difference = (matchCenterY + 180) - (matchCenterY - 180) = 360
        const verticalLineLength = 180;
        const offset = verticalLineLength * 2; // 360px difference between top and bottom connections
        mirroredY = match.position.y + offset;
      }

      return {
        ...match,
        id: match.id.replace('L-', 'R-'),
        matchNumber: mirroredMatchNumber,
        isLeftSide: false,
        position: {
          ...match.position,
          x: totalWidth - match.position.x - matchWidth,
          y: mirroredY
        },
        // For Round 1, populate with right-side saints; for other rounds, keep null
        saint1: match.roundNumber === 1 && match.saint1 ? this.getRightSideSaint(match.saint1, match.matchNumber) : null,
        saint2: match.roundNumber === 1 && match.saint2 ? this.getRightSideSaint(match.saint2, match.matchNumber) : null,
        categoryAffiliation: match.categoryAffiliation,
        // Update previous match IDs to point to right-side matches
        previousMatch1Id: match.previousMatch1Id?.replace('L-', 'R-'),
        previousMatch2Id: match.previousMatch2Id?.replace('L-', 'R-')
      };
    });
  }

  /**
   * Get corresponding right-side saint from the remaining categories
   */
  private getRightSideSaint(leftSaint: any, leftMatchNumber: number): any {
    // Right side uses categories 3-4 (indices 2-3)
    const rightCategories = this.tournament.categories.slice(2, 4);
    
    // Find the saint in the same relative position but from right-side categories
    let saintIndex = 0;
    let categoryOffset = 0;
    
    // Determine which saint this is based on the match number
    for (let i = 0; i < 2; i++) { // First 2 categories (left side)
      const category = this.tournament.categories[i];
      if (category.saints.includes(leftSaint)) {
        const saintIndexInCategory = category.saints.indexOf(leftSaint);
        const rightCategoryIndex = i + 2; // Corresponding right category
        if (rightCategoryIndex < this.tournament.categories.length) {
          const rightCategory = this.tournament.categories[rightCategoryIndex];
          return rightCategory.saints[saintIndexInCategory] || leftSaint;
        }
      }
    }
    
    // Fallback to original saint if mapping fails
    return leftSaint;
  }

  /**
   * Generate left side Round 1 matches only (8 matches)
   */
  private generateLeftSideRound1Matches(matchDimensions: { width: number; height: number }): TournamentMatch[] {
    const matches: TournamentMatch[] = [];
    let matchNumber = 1;
    
    // Only generate left side matches
    const leftSideX = LAYOUT_CONSTANTS.MARGIN_LEFT;
    
    // Calculate vertical spacing - distribute 8 matches evenly on left side
    const totalHeight = this.calculateTotalBracketHeight();
    const availableHeight = totalHeight - LAYOUT_CONSTANTS.TITLE_HEIGHT - LAYOUT_CONSTANTS.MARGIN_BOTTOM;
    const matchSpacing = availableHeight / 9; // 9 sections for 8 matches on left side
    
    // Take first 2 categories for left side (8 saints = 4 matches per category)
    const leftCategories = this.tournament.categories.slice(0, 2);
    
    leftCategories.forEach((category) => {
      // Create 4 matches per category (8 saints / 2 = 4 matches)
      for (let i = 0; i < category.saints.length; i += 2) {
        const saint1 = category.saints[i];
        const saint2 = category.saints[i + 1];
        
        // Calculate Y position for left side matches
        const sideMatchIndex = matchNumber - 1;
        const matchY = LAYOUT_CONSTANTS.TITLE_HEIGHT + ((sideMatchIndex + 1) * matchSpacing) - (matchDimensions.height / 2);
        
        const match: TournamentMatch = {
          id: `L-R1-M${matchNumber}`,
          roundNumber: 1,
          matchNumber,
          saint1,
          saint2,
          votesForSaint1: 0,
          votesForSaint2: 0,
          totalVotes: 0,
          position: {
            x: leftSideX,
            y: matchY,
            width: matchDimensions.width,
            height: matchDimensions.height,
            lineLength: 0
          },
          categoryAffiliation: category.id,
          isLeftSide: true
        };
        
        matches.push(match);
        matchNumber++;
      }
    });
    
    return matches;
  }

  /**
   * Generate left side cascade round - positions matches at vertical centers of previous round pairs
   */
  private generateLeftSideCascadeRound(
    previousRoundMatches: TournamentMatch[], 
    roundNumber: number, 
    matchCount: number, 
    matchDimensions: { width: number; height: number }
  ): TournamentMatch[] {
    const matches: TournamentMatch[] = [];
    const totalWidth = this.calculateFullBracketWidth(matchDimensions);
    
    // Calculate horizontal position for this round (left side only)
    const roundX = this.calculateRoundXPositionForSide(roundNumber, matchDimensions, totalWidth, true);
    
    // Process previous round matches in pairs (left side only)
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
        
        // Apply Round 4 vertical offsets to bracket positioning (left side only)
        if (roundNumber === 4) {
          const offset = LAYOUT_CONSTANTS.ROUND_4_OFFSET.LEFT_SIDE;
          matchY += offset;
        }
        
        const matchNumber = Math.floor(i / 2) + 1;
        
        const match: TournamentMatch = {
          id: `L-R${roundNumber}-M${matchNumber}`,
          roundNumber,
          matchNumber,
          saint1: null,
          saint2: null,
          votesForSaint1: 0,
          votesForSaint2: 0,
          totalVotes: 0,
          position: {
            x: roundX,
            y: matchY,
            width: matchDimensions.width,
            height: matchDimensions.height,
            lineLength: 0
          },
          isLeftSide: true,
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
        // Position inward from Round 2, aligned with vertical lines
        const round2LeftX = this.calculateRoundXPositionForSide(2, matchDimensions, totalWidth, true);
        const round2RightX = this.calculateRoundXPositionForSide(2, matchDimensions, totalWidth, false);
        
        // Position so that horizontal lines (which subtract SHORT_APPROACH_DISTANCE) end up at the right distance from junctions
        // Junction is at: round2X + matchWidth + JUNCTION_LENGTH
        // Horizontal line goes to: Round3Position - SHORT_APPROACH_DISTANCE
        // We want: Round3Position - SHORT_APPROACH_DISTANCE = junction + CONNECTION_LENGTH
        // So: Round3Position = junction + CONNECTION_LENGTH + SHORT_APPROACH_DISTANCE
        const fullConnectionLength = LAYOUT_CONSTANTS.CONNECTION_LENGTH + LAYOUT_CONSTANTS.SHORT_APPROACH_DISTANCE;
        
        return isLeftSide 
          ? round2LeftX + matchDimensions.width + LAYOUT_CONSTANTS.JUNCTION_LENGTH + fullConnectionLength - LAYOUT_CONSTANTS.SHORT_APPROACH_DISTANCE
          : round2RightX - LAYOUT_CONSTANTS.JUNCTION_LENGTH - fullConnectionLength + LAYOUT_CONSTANTS.SHORT_APPROACH_DISTANCE;
      
      case 4:
        // Round 4 - simple connection-based positioning
        const round3LeftX = this.calculateRoundXPositionForSide(3, matchDimensions, totalWidth, true);
        const round3RightX = this.calculateRoundXPositionForSide(3, matchDimensions, totalWidth, false);
        
        // Simple alignment with Round 3 connections (same pattern as other rounds)
        const round4ConnectionOffset = LAYOUT_CONSTANTS.JUNCTION_LENGTH + LAYOUT_CONSTANTS.CONNECTION_LENGTH;
        
        return isLeftSide 
          ? round3LeftX + matchDimensions.width + round4ConnectionOffset
          : round3RightX - round4ConnectionOffset - matchDimensions.width;
      
      default:
        return centerX;
    }
  }

  /**
   * Calculate total bracket width for 4 rounds with center gap after horizontal lines
   */
  private calculateFullBracketWidth(matchDimensions: { width: number; height: number }): number {
    // Convergent layout: single progression to center, then mirror with center gap
    const singleSideWidth = LAYOUT_CONSTANTS.MARGIN_LEFT + 
                            matchDimensions.width + // Round 1
                            LAYOUT_CONSTANTS.ROUND_SPACING + // Space to Round 2
                            matchDimensions.width + // Round 2
                            LAYOUT_CONSTANTS.ROUND_SPACING + // Space to Round 3
                            matchDimensions.width + // Round 3
                            LAYOUT_CONSTANTS.ROUND_SPACING + // Space to Round 4
                            matchDimensions.width; // Round 4
    
    // Total width: left side + center gap (after horizontal lines) + right side
    return singleSideWidth + LAYOUT_CONSTANTS.CENTER_GAP + matchDimensions.width + LAYOUT_CONSTANTS.MARGIN_RIGHT;
  }


  /**
   * Generate all connection lines using mirroring approach
   */
  private generateRound2ConnectionLines(matches: TournamentMatch[]): LineConnection[] {
    return this.generateAllConnectionsWithMirroring(matches);
  }

  /**
   * Generate connection lines using mirroring (generate left side, then mirror to right)
   */
  private generateAllConnectionsWithMirroring(matches: TournamentMatch[]): LineConnection[] {
    const totalWidth = this.calculateFullBracketWidth({ width: 180, height: 50 }); // Use standard match dimensions
    
    // Separate left and right side matches
    const leftMatches = matches.filter(match => match.isLeftSide);
    const rightMatches = matches.filter(match => !match.isLeftSide);
    
    // Group left side matches by round
    const leftMatchesByRound = new Map<number, TournamentMatch[]>();
    leftMatches.forEach(match => {
      if (!leftMatchesByRound.has(match.roundNumber)) {
        leftMatchesByRound.set(match.roundNumber, []);
      }
      leftMatchesByRound.get(match.roundNumber)!.push(match);
    });
    
    // Generate connections for left side only (1->2, 2->3, 3->4) 
    // Round 4 terminates the bracket
    const leftConnections: LineConnection[] = [];
    for (let round = 1; round <= 3; round++) {
      const currentRoundMatches = leftMatchesByRound.get(round) || [];
      const nextRoundMatches = leftMatchesByRound.get(round + 1) || [];
      
      leftConnections.push(...this.generateLeftSideRoundConnections(currentRoundMatches, nextRoundMatches, round));
    }
    
    // Add horizontal line from left Round 4 bracket edge
    const leftRound4Matches = leftMatchesByRound.get(4) || [];
    if (leftRound4Matches.length > 0) {
      const leftRound4Match = leftRound4Matches[0];
      const matchCenterY = leftRound4Match.position.y + (leftRound4Match.position.height / 2);
      const matchExitX = leftRound4Match.position.x + leftRound4Match.position.width;
      const lineLength = LAYOUT_CONSTANTS.JUNCTION_LENGTH + LAYOUT_CONSTANTS.CONNECTION_LENGTH;
      const horizontalLineEndX = matchExitX + lineLength;
      
      // Horizontal line extending from left Round 4 bracket
      leftConnections.push({
        id: 'L-R4-result-line',
        type: 'horizontal',
        x1: matchExitX,
        y1: matchCenterY,
        x2: horizontalLineEndX,
        y2: matchCenterY,
        strokeWidth: LAYOUT_CONSTANTS.LINE_THICKNESS
      });
      
      // Vertical line going upward from end of horizontal line (make it much longer and very prominent)
      const verticalLineLength = 180; // 3x longer vertical line for maximum visibility
      const topOfVerticalY = matchCenterY - verticalLineLength;
      
      leftConnections.push({
        id: 'L-R4-vertical-line',
        type: 'vertical',
        x1: horizontalLineEndX,
        y1: matchCenterY,
        x2: horizontalLineEndX,
        y2: topOfVerticalY, // Goes upward
        strokeWidth: LAYOUT_CONSTANTS.LINE_THICKNESS
      });
      
      // Horizontal line from top of vertical line running to the right
      leftConnections.push({
        id: 'L-R4-top-horizontal-line',
        type: 'horizontal',
        x1: horizontalLineEndX,
        y1: topOfVerticalY,
        x2: horizontalLineEndX + lineLength, // Same length as other horizontal lines
        y2: topOfVerticalY,
        strokeWidth: LAYOUT_CONSTANTS.LINE_THICKNESS
      });
    }
    
    // Mirror left connections to create right connections
    const rightConnections = this.mirrorConnections(leftConnections, totalWidth);
    
    return [...leftConnections, ...rightConnections];
  }

  /**
   * Mirror connection lines from left to right side
   */
  private mirrorConnections(leftConnections: LineConnection[], totalWidth: number): LineConnection[] {
    return leftConnections
      .map(connection => {
        const mirroredConnection = {
          ...connection,
          id: connection.id.replace('L-', 'R-').replace('-L', '-R'),
          x1: totalWidth - connection.x1,
          x2: totalWidth - connection.x2
        };

        // Special handling for Round 4 vertical line: make right side go DOWN instead of UP
        if (connection.id === 'L-R4-vertical-line') {
          const originalY1 = connection.y1; // Starting point (matchCenterY)
          const originalY2 = connection.y2; // End point (goes up: matchCenterY - 180)
          const lineLength = Math.abs(originalY2 - originalY1); // Should be 180
          
          // Keep same starting point, but go DOWN instead of UP
          mirroredConnection.y1 = originalY1; // Same starting point
          mirroredConnection.y2 = originalY1 + lineLength; // Go DOWN instead of UP
        }
        
        // Special handling for Round 4 horizontal line: connect to BOTTOM of downward vertical
        if (connection.id === 'L-R4-top-horizontal-line') {
          const originalY1 = connection.y1; // Top of upward vertical (matchCenterY - 180)
          const matchCenterY = originalY1 + 180; // Reverse calculate matchCenterY
          const bottomOfVerticalY = matchCenterY + 180; // Bottom of downward vertical
          
          // Connect to bottom of downward vertical instead of top
          mirroredConnection.y1 = bottomOfVerticalY;
          mirroredConnection.y2 = bottomOfVerticalY;
        }

        return mirroredConnection;
      });
  }

  /**
   * Generate connection lines for left side only
   */
  private generateLeftSideRoundConnections(
    currentRoundMatches: TournamentMatch[], 
    nextRoundMatches: TournamentMatch[], 
    roundNumber: number
  ): LineConnection[] {
    const connections: LineConnection[] = [];
    
    // Process matches in pairs (left side only)
    for (let i = 0; i < currentRoundMatches.length; i += 2) {
      const match1 = currentRoundMatches[i];
      const match2 = currentRoundMatches[i + 1];
      const nextMatch = nextRoundMatches[Math.floor(i / 2)];
      
      if (match1 && match2 && nextMatch) {
        // Calculate connection points
        const match1CenterY = match1.position.y + (match1.position.height / 2);
        const match2CenterY = match2.position.y + (match2.position.height / 2);
        const verticalLineCenterY = (match1CenterY + match2CenterY) / 2;
        
        // Left side: lines extend to the right
        const match1ExitX = match1.position.x + match1.position.width;
        const match2ExitX = match2.position.x + match2.position.width;
        const junctionX = match1ExitX + LAYOUT_CONSTANTS.JUNCTION_LENGTH;
        const nextMatchEntryX = nextMatch.position.x;
        
        // Horizontal lines from matches to junction
        connections.push({
          id: `L-R${roundNumber}-pair-${Math.floor(i/2)+1}-match1-horizontal`,
          type: 'horizontal',
          x1: match1ExitX,
          y1: match1CenterY,
          x2: junctionX,
          y2: match1CenterY,
          strokeWidth: LAYOUT_CONSTANTS.LINE_THICKNESS
        });
        
        connections.push({
          id: `L-R${roundNumber}-pair-${Math.floor(i/2)+1}-match2-horizontal`,
          type: 'horizontal',
          x1: match2ExitX,
          y1: match2CenterY,
          x2: junctionX,
          y2: match2CenterY,
          strokeWidth: LAYOUT_CONSTANTS.LINE_THICKNESS
        });
        
        // Vertical connecting line
        connections.push({
          id: `L-R${roundNumber}-pair-${Math.floor(i/2)+1}-vertical`,
          type: 'vertical',
          x1: junctionX,
          y1: Math.min(match1CenterY, match2CenterY),
          x2: junctionX,
          y2: Math.max(match1CenterY, match2CenterY),
          strokeWidth: LAYOUT_CONSTANTS.LINE_THICKNESS
        });
        
        // Horizontal line to next round match
        let horizontalLineY = verticalLineCenterY;
        if (roundNumber === 3) { // Round 3→4 connections
          horizontalLineY += LAYOUT_CONSTANTS.ROUND_4_OFFSET.LEFT_SIDE;
        }
        
        connections.push({
          id: `L-R${roundNumber}-pair-${Math.floor(i/2)+1}-to-next`,
          type: 'horizontal',
          x1: junctionX,
          y1: horizontalLineY,
          x2: nextMatchEntryX,
          y2: horizontalLineY,
          strokeWidth: LAYOUT_CONSTANTS.LINE_THICKNESS
        });
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