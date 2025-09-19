import { NextRequest, NextResponse } from 'next/server';
import { Tournament, PublishedBracket, TournamentArchive, PublishedMatch, PublishedCategory, PublishedDimensions, PublishedConnection, PublishedCenterOverlay } from '@/types';
import { calculateTournamentLayout } from '@/lib/tournament/layoutEngine';
import fs from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tournament, publishedBy }: { tournament: Tournament; publishedBy: string } = body;

    // Validate input
    if (!tournament || !publishedBy) {
      return NextResponse.json({
        success: false,
        error: 'Tournament data and publishedBy are required'
      }, { status: 400 });
    }

    // Generate unique IDs
    const publishedBracketId = `published_${tournament.year}_${Date.now()}`;
    const archiveId = `archive_${tournament.id}_${Date.now()}`;

    // Step 1: Create tournament archive (backup)
    const archive: TournamentArchive = {
      id: archiveId,
      originalTournamentId: tournament.id,
      archivedAt: new Date(),
      archivedBy: publishedBy,
      tournamentData: tournament,
      reason: 'published',
      publishedBracketId: publishedBracketId
    };

    // Save archive to file system
    await saveArchive(archive);

    // Step 2: Flatten tournament data for public display
    const publishedBracket = await flattenTournament(tournament, publishedBracketId, archiveId, publishedBy);

    // Step 3: Save published bracket (this would be database in production)
    await savePublishedBracket(publishedBracket);

    return NextResponse.json({
      success: true,
      publishedBracketId: publishedBracketId,
      archiveId: archiveId,
      message: 'Tournament published successfully'
    });

  } catch (error) {
    console.error('Failed to publish tournament:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to publish tournament'
    }, { status: 500 });
  }
}

/**
 * Flatten Tournament data into PublishedBracket format
 */
async function flattenTournament(
  tournament: Tournament,
  publishedBracketId: string,
  archiveId: string,
  publishedBy: string
): Promise<PublishedBracket> {

  // Calculate layout to get positioning data
  const layoutData = calculateTournamentLayout(tournament);

  // Flatten matches with pre-calculated positions
  const publishedMatches: PublishedMatch[] = layoutData.matches.map(match => ({
    id: match.id,
    roundNumber: match.roundNumber,
    matchNumber: match.matchNumber,

    // Resolve saint names (no database lookups needed)
    saint1Name: match.saint1?.displayName || null,
    saint2Name: match.saint2?.displayName || null,
    saint1Seed: match.saint1?.seed,
    saint2Seed: match.saint2?.seed,

    // Vote data
    votesForSaint1: match.votesForSaint1,
    votesForSaint2: match.votesForSaint2,
    winnerId: match.winner?.id,
    winnerName: match.winner?.displayName,

    // Pre-calculated absolute positioning
    position: {
      x: match.position.x,
      y: match.position.y,
      width: match.position.width,
      height: match.position.height,
    },

    // Display properties
    categoryAffiliation: match.categoryAffiliation,
    isLeftSide: match.isLeftSide || false,
    isChampionship: match.isChampionship || false
  }));

  // Helper function to get matches for a specific quadrant based on position (replicated from admin)
  const getMatchesForQuadrant = (position: string) => {
    switch (position) {
      case 'top-left':
        return publishedMatches.filter(
          match => match.roundNumber === 1 &&
                  match.isLeftSide === true &&
                  match.matchNumber >= 1 &&
                  match.matchNumber <= 4
        );
      case 'bottom-left':
        return publishedMatches.filter(
          match => match.roundNumber === 1 &&
                  match.isLeftSide === true &&
                  match.matchNumber >= 5 &&
                  match.matchNumber <= 8
        );
      case 'top-right':
        return publishedMatches.filter(
          match => match.roundNumber === 1 &&
                  match.isLeftSide === false &&
                  match.matchNumber >= 9 &&
                  match.matchNumber <= 12
        );
      case 'bottom-right':
        return publishedMatches.filter(
          match => match.roundNumber === 1 &&
                  match.isLeftSide === false &&
                  match.matchNumber >= 13 &&
                  match.matchNumber <= 16
        );
      default:
        return [];
    }
  };

  // Helper function to calculate full quadrant span and center (replicated from admin)
  const calculateQuadrantSpanAndCenter = (position: string) => {
    const quadrantMatches = getMatchesForQuadrant(position);

    if (quadrantMatches.length === 0) {
      return {
        centerY: layoutData.layout.totalHeight / 2,
        quadrantTop: 0,
        quadrantBottom: 0,
        quadrantHeight: 0
      };
    }

    // Calculate full span from top of first match to bottom of last match
    const quadrantTop = Math.min(...quadrantMatches.map(m => m.position.y));
    const quadrantBottom = Math.max(...quadrantMatches.map(m => m.position.y + m.position.height));
    const quadrantHeight = quadrantBottom - quadrantTop;
    const centerY = quadrantTop + (quadrantHeight / 2);

    return {
      centerY,
      quadrantTop,
      quadrantBottom,
      quadrantHeight
    };
  };

  // Flatten categories with precise label positioning (matching admin logic)
  const publishedCategories: PublishedCategory[] = tournament.categories.map(category => {
    const position = category.position;
    let labelX: number;

    // Calculate horizontal position based on category position (exactly as admin does)
    if (position === 'top-left' || position === 'bottom-left') {
      labelX = 10; // Left side: 10px from absolute left
    } else {
      labelX = layoutData.layout.totalWidth - 210; // Right side: 200px label width + 10px margin from right
    }

    // Calculate full quadrant span and center using actual match positions
    const quadrantData = calculateQuadrantSpanAndCenter(position);

    return {
      id: category.id,
      name: category.name,
      color: category.color,
      position: category.position,
      labelPosition: {
        x: labelX,
        y: quadrantData.centerY - 100, // Center the label vertically in quadrant
        centerY: quadrantData.centerY,
        quadrantHeight: quadrantData.quadrantHeight
      },
      saints: category.saints.map(saint => ({
        name: saint.displayName,
        seed: saint.seed
      }))
    };
  });

  // Calculate responsive scaling
  const dimensions: PublishedDimensions = {
    totalWidth: layoutData.layout.totalWidth,
    totalHeight: layoutData.layout.totalHeight,
    scales: {
      desktop: 1.0,
      tablet: 0.75,
      mobile: 0.5
    },
    breakpoints: {
      desktop: 1200, // When to use full scale
      tablet: 768,   // When to use tablet scale
      mobile: 480    // When to use mobile scale
    }
  };

  // Flatten connection lines
  const publishedConnections: PublishedConnection[] = layoutData.connections.map(connection => ({
    id: connection.id,
    type: connection.type,
    x1: connection.x1,
    y1: connection.y1,
    x2: connection.x2,
    y2: connection.y2,
    strokeWidth: connection.strokeWidth,
    color: undefined // Will fall back to colorPalette.lines in display
  }));

  // Create center overlay for "Blessed Intercessor"
  const centerOverlay: PublishedCenterOverlay = {
    text: ['Blessed', 'Intercessor'],
    x: dimensions.totalWidth / 2,
    y: dimensions.totalHeight / 2,
    fontSize: 48,
    fontFamily: 'var(--font-sorts-mill)',
    color: 'rgba(55, 65, 81, 0.8)',
    opacity: 0.8
  };

  return {
    id: publishedBracketId,
    year: tournament.year,
    title: tournament.title,
    publishedAt: new Date(),
    publishedBy: publishedBy,
    matches: publishedMatches,
    categories: publishedCategories,
    dimensions: dimensions,
    connections: publishedConnections,
    colorPalette: tournament.colorPalette,
    centerOverlay: centerOverlay,
    archiveId: archiveId,
    isActive: true
  };
}

/**
 * Save tournament archive to file system
 */
async function saveArchive(archive: TournamentArchive): Promise<void> {
  const archiveDir = path.join(process.cwd(), 'data', 'tournament_archives');

  // Ensure directory exists
  await fs.mkdir(archiveDir, { recursive: true });

  // Save archive as JSON file
  const archiveFile = path.join(archiveDir, `${archive.id}.json`);
  await fs.writeFile(archiveFile, JSON.stringify(archive, null, 2));
}

/**
 * Save published bracket (in production, this would be database)
 */
async function savePublishedBracket(publishedBracket: PublishedBracket): Promise<void> {
  const publishedDir = path.join(process.cwd(), 'data', 'published_brackets');

  // Ensure directory exists
  await fs.mkdir(publishedDir, { recursive: true });

  // Save current bracket
  const currentBracketFile = path.join(publishedDir, 'current.json');
  await fs.writeFile(currentBracketFile, JSON.stringify(publishedBracket, null, 2));

  // Also save with timestamp for history
  const timestampFile = path.join(publishedDir, `${publishedBracket.id}.json`);
  await fs.writeFile(timestampFile, JSON.stringify(publishedBracket, null, 2));
}