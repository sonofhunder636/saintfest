import {
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  writeBatch,
  query,
  where,
  getDocs,
  Timestamp
} from 'firebase/firestore';
import { assertFirestore } from './firebase';
import {
  Tournament,
  PublishedBracket,
  TournamentArchive,
  PublishedMatch,
  PublishedCategory,
  PublishedDimensions,
  PublishedConnection,
  PublishedCenterOverlay
} from '@/types';

export interface PublishTournamentResult {
  success: boolean;
  publishedBracketId?: string;
  archiveId?: string;
  error?: string;
}

/**
 * Recursively remove undefined values from an object to make it Firestore-compatible
 */
function sanitizeForFirestore(obj: any): any {
  if (obj === null || obj === undefined) {
    return null;
  }

  if (Array.isArray(obj)) {
    // Preserve all array items, just sanitize them
    return obj.map(item => sanitizeForFirestore(item));
  }

  if (obj instanceof Date) {
    return obj;
  }

  if (typeof obj === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      // Convert undefined to null for Firestore, preserve all fields
      sanitized[key] = value === undefined ? null : sanitizeForFirestore(value);
    }
    return sanitized;
  }

  return obj;
}

/**
 * Transform Tournament data into PublishedBracket format for optimized display
 */
function transformTournamentToPublishedBracket(
  tournament: Tournament,
  publishedBy: string
): Omit<PublishedBracket, 'id' | 'archiveId'> {
  console.log('transformTournamentToPublishedBracket: Input tournament:', tournament);
  console.log('transformTournamentToPublishedBracket: Tournament rounds:', tournament.rounds);
  console.log('transformTournamentToPublishedBracket: Rounds count:', tournament.rounds?.length);

  // Transform matches with flattened saint data
  const publishedMatches: PublishedMatch[] = tournament.rounds.flatMap(round => {
    console.log('transformTournamentToPublishedBracket: Processing round:', round);
    console.log('transformTournamentToPublishedBracket: Round matches:', round.matches);
    console.log('transformTournamentToPublishedBracket: Round matches count:', round.matches?.length);

    return round.matches.map(match => ({
      id: match.id,
      roundNumber: match.roundNumber,
      matchNumber: match.matchNumber,
      saint1Name: match.saint1?.name || null,
      saint2Name: match.saint2?.name || null,
      saint1Seed: match.saint1?.seed,
      saint2Seed: match.saint2?.seed,
      votesForSaint1: match.votesForSaint1,
      votesForSaint2: match.votesForSaint2,
      winnerId: match.winner?.id,
      winnerName: match.winner?.name,
      position: {
        x: match.position.x,
        y: match.position.y,
        width: match.position.width,
        height: match.position.height
      },
      categoryAffiliation: match.categoryAffiliation,
      isLeftSide: match.isLeftSide || false,
      isChampionship: match.isChampionship || false
    }))
  });

  console.log('transformTournamentToPublishedBracket: Final publishedMatches:', publishedMatches);
  console.log('transformTournamentToPublishedBracket: PublishedMatches count:', publishedMatches.length);

  // Transform categories with pre-calculated positioning
  const publishedCategories: PublishedCategory[] = tournament.categories.map(category => ({
    id: category.id,
    name: category.name,
    color: category.color,
    position: category.position,
    labelPosition: {
      x: 0, // Will be calculated based on position
      y: 0,
      centerY: 0,
      quadrantHeight: tournament.metadata.bracketDimensions.totalHeight / 2
    },
    saints: category.saints.map(saint => ({
      name: saint.displayName,
      seed: saint.seed
    }))
  }));

  // Set up responsive scaling
  const publishedDimensions: PublishedDimensions = {
    totalWidth: tournament.metadata.bracketDimensions.totalWidth,
    totalHeight: tournament.metadata.bracketDimensions.totalHeight,
    scales: {
      desktop: 1.0,
      tablet: 0.75,
      mobile: 0.5
    },
    breakpoints: {
      desktop: 1200,
      tablet: 768,
      mobile: 480
    }
  };

  // Generate basic connection lines (can be enhanced later)
  const publishedConnections: PublishedConnection[] = [];

  // Create center overlay
  const centerOverlay: PublishedCenterOverlay = {
    text: ['Blessed', 'Intercessor'],
    x: tournament.metadata.bracketDimensions.totalWidth / 2,
    y: tournament.metadata.bracketDimensions.totalHeight / 2,
    fontSize: 48,
    fontFamily: 'var(--font-sorts-mill)',
    color: tournament.colorPalette.text,
    opacity: 0.1
  };

  return {
    year: tournament.year,
    title: tournament.title,
    publishedAt: new Date(),
    publishedBy,
    matches: publishedMatches,
    categories: publishedCategories,
    dimensions: publishedDimensions,
    connections: publishedConnections,
    colorPalette: tournament.colorPalette,
    centerOverlay,
    isActive: true
  };
}

/**
 * Deactivate any previously published brackets for the same year
 */
async function deactivatePreviousBrackets(year: number): Promise<void> {
  const db = assertFirestore();
  const publishedBracketsRef = collection(db, 'publishedBrackets');

  // Find all active brackets for this year
  const q = query(
    publishedBracketsRef,
    where('year', '==', year),
    where('isActive', '==', true)
  );

  const querySnapshot = await getDocs(q);

  // Use batch to deactivate all previous brackets
  const batch = writeBatch(db);
  querySnapshot.docs.forEach(doc => {
    batch.update(doc.ref, { isActive: false });
  });

  await batch.commit();
}

/**
 * Archive the complete tournament data for backup/recovery
 */
async function archiveTournament(
  tournament: Tournament,
  publishedBy: string,
  publishedBracketId: string
): Promise<string> {
  const db = assertFirestore();
  const archivesRef = collection(db, 'tournamentArchives');

  const archiveData: Omit<TournamentArchive, 'id'> = {
    originalTournamentId: tournament.id,
    archivedAt: new Date(),
    archivedBy: publishedBy,
    tournamentData: tournament,
    reason: 'published',
    publishedBracketId
  };

  // Sanitize the archive data to remove undefined values
  const sanitizedArchiveData = sanitizeForFirestore({
    ...archiveData,
    archivedAt: Timestamp.fromDate(archiveData.archivedAt)
  });

  const docRef = await addDoc(archivesRef, sanitizedArchiveData);

  return docRef.id;
}

/**
 * Main function to publish a tournament to Firestore
 */
export async function publishTournament(
  tournament: Tournament,
  publishedBy: string
): Promise<PublishTournamentResult> {
  try {
    const db = assertFirestore();

    // Start a batch operation for atomic writes
    const batch = writeBatch(db);

    // 1. Deactivate any previous brackets for this year
    await deactivatePreviousBrackets(tournament.year);

    // 2. Transform tournament data for published format
    const publishedBracketData = transformTournamentToPublishedBracket(tournament, publishedBy);

    // 3. Create published bracket document
    const publishedBracketsRef = collection(db, 'publishedBrackets');
    const publishedBracketRef = doc(publishedBracketsRef);
    const publishedBracketId = publishedBracketRef.id;

    // Sanitize the published bracket data to remove undefined values
    const sanitizedPublishedData = sanitizeForFirestore({
      ...publishedBracketData,
      id: publishedBracketId,
      publishedAt: Timestamp.fromDate(publishedBracketData.publishedAt),
      archiveId: '' // Will be updated after archive is created
    });

    batch.set(publishedBracketRef, sanitizedPublishedData);

    // Commit the published bracket first
    await batch.commit();

    // 4. Archive the complete tournament data
    const archiveId = await archiveTournament(tournament, publishedBy, publishedBracketId);

    // 5. Update published bracket with archive reference
    await updateDoc(publishedBracketRef, {
      archiveId
    });

    console.log('Tournament published successfully:', {
      publishedBracketId,
      archiveId,
      year: tournament.year,
      title: tournament.title
    });

    return {
      success: true,
      publishedBracketId,
      archiveId
    };

  } catch (error) {
    console.error('Error publishing tournament:', error);

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Get the currently active published bracket for a given year
 */
export async function getActivePublishedBracket(year: number): Promise<PublishedBracket | null> {
  try {
    console.log('getActivePublishedBracket: Starting query for year', year);
    const db = assertFirestore();
    const publishedBracketsRef = collection(db, 'publishedBrackets');

    const q = query(
      publishedBracketsRef,
      where('year', '==', year),
      where('isActive', '==', true)
    );

    console.log('getActivePublishedBracket: Executing Firestore query...');
    const querySnapshot = await getDocs(q);

    console.log('getActivePublishedBracket: Query result count:', querySnapshot.docs.length);

    if (querySnapshot.empty) {
      console.log('getActivePublishedBracket: No documents found');
      return null;
    }

    // There should only be one active bracket per year
    const doc = querySnapshot.docs[0];
    const data = doc.data();

    console.log('getActivePublishedBracket: Raw Firestore data:', data);
    console.log('getActivePublishedBracket: Document ID:', doc.id);
    console.log('getActivePublishedBracket: Data keys:', Object.keys(data));
    console.log('getActivePublishedBracket: Matches field:', data.matches);
    console.log('getActivePublishedBracket: Categories field:', data.categories);

    // Handle multiple possible states of publishedAt field
    const publishedAt = (() => {
      if (!data.publishedAt) {
        console.warn('publishedAt field is missing, using current date');
        return new Date();
      }

      if (typeof data.publishedAt.toDate === 'function') {
        // It's a Firestore Timestamp
        return data.publishedAt.toDate();
      }

      if (data.publishedAt instanceof Date) {
        // It's already a JavaScript Date
        return data.publishedAt;
      }

      // Try to parse as date string/number
      const fallbackDate = new Date(data.publishedAt);
      return isNaN(fallbackDate.getTime()) ? new Date() : fallbackDate;
    })();

    return {
      ...data,
      id: doc.id,
      publishedAt,
    } as PublishedBracket;

  } catch (error) {
    console.error('Error fetching active published bracket:', error);
    return null;
  }
}

/**
 * Get tournament archive by ID
 */
export async function getTournamentArchive(archiveId: string): Promise<TournamentArchive | null> {
  try {
    const db = assertFirestore();
    const archiveRef = doc(db, 'tournamentArchives', archiveId);
    const archiveDoc = await getDocs(query(collection(db, 'tournamentArchives'), where('__name__', '==', archiveId)));

    if (archiveDoc.empty) {
      return null;
    }

    const data = archiveDoc.docs[0].data();
    return {
      ...data,
      id: archiveDoc.docs[0].id,
      archivedAt: data.archivedAt.toDate(),
    } as TournamentArchive;

  } catch (error) {
    console.error('Error fetching tournament archive:', error);
    return null;
  }
}