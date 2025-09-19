import { NextRequest, NextResponse } from 'next/server';
import { collection, doc, setDoc, getDoc, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { VotingSession, DailyPost } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const { postId } = await request.json();
    
    if (!postId) {
      return NextResponse.json(
        { success: false, error: 'Post ID is required' },
        { status: 400 }
      );
    }

    // Get the post to verify it exists and has a matchup
    const postRef = doc(db, 'dailyPosts', postId);
    const postDoc = await getDoc(postRef);
    
    if (!postDoc.exists()) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      );
    }

    const post = postDoc.data() as DailyPost;
    if (!post.matchup || !post.matchup.saint1Id || !post.matchup.saint2Id) {
      return NextResponse.json(
        { success: false, error: 'Post does not have a valid matchup' },
        { status: 400 }
      );
    }

    // Check if voting session already exists for this post
    const sessionsCollection = collection(db, 'votingSessions');
    const existingSessionQuery = query(
      sessionsCollection,
      where('postId', '==', postId)
    );
    const existingSessions = await getDocs(existingSessionQuery);
    
    if (!existingSessions.empty) {
      const existingSession = existingSessions.docs[0];
      return NextResponse.json({
        success: true,
        data: {
          id: existingSession.id,
          ...existingSession.data(),
          opensAt: existingSession.data().opensAt?.toDate(),
          closesAt: existingSession.data().closesAt?.toDate()
        },
        message: 'Voting session already exists'
      });
    }

    // Create new voting session
    const sessionId = `${postId}-session`;
    const now = new Date();
    const opensAt = now;
    // Set voting to close at midnight Central Time (next day)
    const closesAt = new Date();
    closesAt.setDate(closesAt.getDate() + 1);
    closesAt.setHours(0, 0, 0, 0); // Midnight Central Time (simplified for now)

    const votingSession: Omit<VotingSession, 'id'> = {
      postId,
      pollId: sessionId, // Using same ID for simplicity
      opensAt,
      closesAt,
      isActive: true,
      totalVotes: 0,
      results: {
        saint1Votes: 0,
        saint2Votes: 0,
        saint1Percentage: 0,
        saint2Percentage: 0,
        winnerId: ''
      }
    };

    const sessionRef = doc(db, 'votingSessions', sessionId);
    await setDoc(sessionRef, {
      ...votingSession,
      opensAt: Timestamp.fromDate(opensAt),
      closesAt: Timestamp.fromDate(closesAt)
    });

    return NextResponse.json({
      success: true,
      data: {
        id: sessionId,
        ...votingSession
      },
      message: 'Voting session created successfully'
    });

  } catch (error) {
    console.error('Error creating voting session:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create voting session',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('postId');
    
    if (!postId) {
      return NextResponse.json(
        { success: false, error: 'Post ID is required' },
        { status: 400 }
      );
    }

    // Find voting session for this post
    const sessionsCollection = collection(db, 'votingSessions');
    const sessionQuery = query(
      sessionsCollection,
      where('postId', '==', postId)
    );
    const sessionSnapshot = await getDocs(sessionQuery);
    
    if (sessionSnapshot.empty) {
      return NextResponse.json(
        { success: false, error: 'Voting session not found' },
        { status: 404 }
      );
    }

    const sessionDoc = sessionSnapshot.docs[0];
    const sessionData = sessionDoc.data();

    return NextResponse.json({
      success: true,
      data: {
        id: sessionDoc.id,
        ...sessionData,
        opensAt: sessionData.opensAt?.toDate(),
        closesAt: sessionData.closesAt?.toDate()
      }
    });

  } catch (error) {
    console.error('Error fetching voting session:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch voting session',
      },
      { status: 500 }
    );
  }
}