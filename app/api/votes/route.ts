import { NextRequest, NextResponse } from 'next/server';
import { collection, doc, setDoc, getDocs, query, where, orderBy, updateDoc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { SimpleVote, VotingSession } from '@/types';
import crypto from 'crypto';

// Removed dynamic export as it's not needed without output: 'export'"

// Helper function to create voter hash for basic deduplication
function createVoterHash(ip: string, userAgent: string): string {
  return crypto.createHash('sha256').update(`${ip}-${userAgent}`).digest('hex');
}

// Helper function to check if voting is within allowed time (midnight to midnight CT)
function isWithinVotingHours(): boolean {
  const now = new Date();
  const centralTime = new Date(now.toLocaleString("en-US", {timeZone: "America/Chicago"}));
  return true; // For now, allow voting at any time. Can add time restrictions later.
}

export async function POST(request: NextRequest) {
  try {
    if (!isWithinVotingHours()) {
      return NextResponse.json(
        { success: false, error: 'Voting is only allowed between midnight and midnight Central Time' },
        { status: 403 }
      );
    }

    const { sessionId, saintId } = await request.json();
    
    if (!sessionId || !saintId) {
      return NextResponse.json(
        { success: false, error: 'Session ID and Saint ID are required' },
        { status: 400 }
      );
    }

    // Get voter info for deduplication
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const voterHash = createVoterHash(ip, userAgent);

    // Check if this voter has already voted in this session
    const votesCollection = collection(db, 'votes');
    const existingVoteQuery = query(
      votesCollection,
      where('sessionId', '==', sessionId),
      where('voterHash', '==', voterHash)
    );
    
    const existingVotes = await getDocs(existingVoteQuery);
    if (!existingVotes.empty) {
      return NextResponse.json(
        { success: false, error: 'You have already voted in this matchup' },
        { status: 409 }
      );
    }

    // Verify the voting session exists and is active
    const sessionRef = doc(db, 'votingSessions', sessionId);
    const sessionDoc = await getDoc(sessionRef);
    
    if (!sessionDoc.exists()) {
      return NextResponse.json(
        { success: false, error: 'Voting session not found' },
        { status: 404 }
      );
    }

    const session = sessionDoc.data() as VotingSession;
    if (!session.isActive) {
      return NextResponse.json(
        { success: false, error: 'Voting session is not active' },
        { status: 403 }
      );
    }

    // Create the vote
    const voteId = `${sessionId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const vote: SimpleVote = {
      id: voteId,
      sessionId,
      saintId,
      voterHash,
      timestamp: new Date(),
    };

    const voteRef = doc(db, 'votes', voteId);
    await setDoc(voteRef, {
      ...vote,
      timestamp: Timestamp.fromDate(vote.timestamp)
    });

    // Update vote count in the session
    const sessionVotesQuery = query(
      votesCollection,
      where('sessionId', '==', sessionId)
    );
    const allSessionVotes = await getDocs(sessionVotesQuery);
    const totalVotes = allSessionVotes.size;

    await updateDoc(sessionRef, {
      totalVotes: totalVotes,
      updatedAt: Timestamp.now()
    });

    // Get current vote counts for both saints
    const saint1Votes = allSessionVotes.docs.filter(doc => 
      doc.data().saintId === session.results?.saint1Votes ? 'saint1' : 'saint2'
    ).length;

    return NextResponse.json({
      success: true,
      message: 'Vote recorded successfully',
      data: {
        voteId,
        totalVotes,
        hasVoted: true
      }
    });

  } catch (error) {
    console.error('Error recording vote:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to record vote',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    
    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Get all votes for this session (simplified query to avoid index requirement)
    const votesCollection = collection(db, 'votes');
    const sessionVotesQuery = query(
      votesCollection,
      where('sessionId', '==', sessionId)
    );
    
    const votesSnapshot = await getDocs(sessionVotesQuery);
    const votes = votesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate() || new Date()
    }));

    // Get session info
    const sessionRef = doc(db, 'votingSessions', sessionId);
    const sessionDoc = await getDoc(sessionRef);
    
    if (!sessionDoc.exists()) {
      return NextResponse.json(
        { success: false, error: 'Voting session not found' },
        { status: 404 }
      );
    }

    const session = sessionDoc.data();

    return NextResponse.json({
      success: true,
      data: {
        votes,
        totalVotes: votes.length,
        session: {
          ...session,
          opensAt: session.opensAt?.toDate(),
          closesAt: session.closesAt?.toDate()
        }
      }
    });

  } catch (error) {
    console.error('Error fetching votes:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch votes',
      },
      { status: 500 }
    );
  }
}