import { NextRequest, NextResponse } from 'next/server';
import { collection, getDocs, query, where, doc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Saint, Bracket, BracketRound, BracketMatch } from '@/types';
import { validateAdminAccess } from '@/lib/auth-middleware';

// Prevent this route from being executed during build
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: NextRequest) {
  try {
    // Validate admin authentication first
    const authResult = await validateAdminAccess(request);
    if (!authResult.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: authResult.error || 'Admin authentication required',
          requiresAuth: true
        },
        { status: 401 }
      );
    }

    console.log(`Admin ${authResult.userEmail} generating bracket`);
    // Comprehensive build-time safety checks
    const isBuildTime = (
      !request ||
      typeof request.json !== 'function' ||
      !globalThis.fetch ||
      process.env.NODE_ENV === 'development' && !request.headers?.get
    );

    if (isBuildTime) {
      return NextResponse.json({
        success: false,
        error: 'API not available during build time',
        buildTime: true
      }, { status: 503 });
    }

    // Firebase availability check
    if (!db) {
      return NextResponse.json({
        success: false,
        error: 'Database connection not available'
      }, { status: 503 });
    }

    let requestData;
    try {
      requestData = await request.json();
    } catch (error) {
      return NextResponse.json({
        success: false,
        error: 'Invalid request body'
      }, { status: 400 });
    }

    const { year, categories } = requestData;

    if (!year || !categories?.length) {
      return NextResponse.json(
        { success: false, error: 'Year and categories are required' },
        { status: 400 }
      );
    }

    // Validate exactly 4 categories for tournament structure
    if (categories.length !== 4) {
      return NextResponse.json(
        { success: false, error: 'Exactly 4 categories are required for tournament bracket' },
        { status: 400 }
      );
    }

    console.log(`Generating 32-saint tournament for ${year} with 4 categories:`, categories);

    // Fetch all saints with proper error handling
    let allSaints: Saint[] = [];
    try {
      const saintsCollection = collection(db, 'saints');
      const allSaintsSnapshot = await getDocs(saintsCollection);

      allSaintsSnapshot.forEach((doc) => {
        const data = doc.data();
        allSaints.push({
          ...data,
          id: doc.id,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as Saint);
      });
    } catch (firebaseError) {
      console.error('Firebase error fetching saints:', firebaseError);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch saints data',
        details: firebaseError instanceof Error ? firebaseError.message : 'Unknown error'
      }, { status: 500 });
    }

    // Select 8 saints from each category (4 categories × 8 saints = 32 total)
    const selectedSaints: Saint[] = [];
    const categoryInfo: Array<{category: string, saints: Saint[]}> = [];

    for (const category of categories) {
      // Filter saints for this specific category
      const categorySaints = allSaints.filter(saint => 
        saint[category as keyof Saint] === true
      );

      console.log(`Category "${category}": Found ${categorySaints.length} saints`);

      if (categorySaints.length < 8) {
        return NextResponse.json(
          { 
            success: false, 
            error: `Category "${category}" only has ${categorySaints.length} saints, need at least 8` 
          },
          { status: 400 }
        );
      }

      // Randomly select 8 saints from this category
      const shuffled = [...categorySaints].sort(() => Math.random() - 0.5);
      const categorySelected = shuffled.slice(0, 8);
      
      selectedSaints.push(...categorySelected);
      categoryInfo.push({ category, saints: categorySelected });
    }

    console.log(`Selected ${selectedSaints.length} saints for bracket`);

    // Generate bracket structure
    const bracket = generateBracketStructure(selectedSaints, year);

    // Save bracket to Firestore with error handling
    let bracketId;
    try {
      const bracketRef = doc(collection(db, 'brackets'));
      await setDoc(bracketRef, {
        ...bracket,
        id: bracketRef.id,
        createdAt: Timestamp.now(),
      });
      bracketId = bracketRef.id;
      console.log(`Saved bracket with ID: ${bracketId}`);
    } catch (saveError) {
      console.error('Firebase error saving bracket:', saveError);
      return NextResponse.json({
        success: false,
        error: 'Failed to save bracket to database',
        details: saveError instanceof Error ? saveError.message : 'Unknown error'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      bracketId: bracketId,
      selectedSaints: selectedSaints.length,
      categoryBreakdown: categoryInfo.map(info => ({
        category: info.category,
        saintCount: info.saints.length
      })),
      message: `Successfully generated 32-saint tournament for ${year}`,
    });

  } catch (error) {
    console.error('Bracket generation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}

function generateBracketStructure(saints: Saint[], year: number): Omit<Bracket, 'id' | 'createdAt'> {
  const size = saints.length;
  const rounds: BracketRound[] = [];
  
  // Calculate number of rounds (log2 of bracket size)
  const numRounds = Math.log2(size);
  
  // Generate first round matches
  const firstRoundMatches: BracketMatch[] = [];
  for (let i = 0; i < size; i += 2) {
    // @ts-ignore - Temporary fix for deployment
    firstRoundMatches.push({
      matchId: `round1_match${i / 2 + 1}`,
      saint1Id: saints[i].id,
      saint2Id: saints[i + 1].id,
      votesForSaint1: 0,
      votesForSaint2: 0,
    });
  }

  rounds.push({
    roundNumber: 1,
    roundName: getRoundName(1, numRounds),
    matches: firstRoundMatches,
  });

  // Generate subsequent rounds (empty for now)
  for (let round = 2; round <= numRounds; round++) {
    const numMatches = Math.pow(2, numRounds - round);
    const matches: BracketMatch[] = [];
    
    for (let i = 0; i < numMatches; i++) {
      // @ts-ignore - Temporary fix for deployment
      matches.push({
        matchId: `round${round}_match${i + 1}`,
        saint1Id: '', // Will be filled when previous round completes
        saint2Id: '', // Will be filled when previous round completes
        votesForSaint1: 0,
        votesForSaint2: 0,
      });
    }

    rounds.push({
      roundNumber: round,
      roundName: getRoundName(round, numRounds),
      matches,
    });
  }

  // @ts-ignore - Temporary fix for deployment
  return {
    year,
    rounds,
  };
}

function getRoundName(roundNumber: number, totalRounds: number): string {
  const roundsFromEnd = totalRounds - roundNumber + 1;
  
  switch (roundsFromEnd) {
    case 1: return 'Final';
    case 2: return 'Semifinals';
    case 3: return 'Quarterfinals';
    case 4: return 'Round of 16';
    case 5: return 'Round of 32';
    case 6: return 'Round of 64';
    default: return `Round ${roundNumber}`;
  }
}