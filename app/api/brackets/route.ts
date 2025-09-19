import { NextRequest, NextResponse } from 'next/server';
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Bracket } from '@/types';

export async function GET(request: NextRequest) {
  try {
    // Check Firebase connection
    if (!db) {
      return NextResponse.json({
        success: false,
        error: 'Database connection not available'
      }, { status: 503 });
    }

    const bracketsCollection = collection(db, 'brackets');
    const bracketsQuery = query(bracketsCollection, orderBy('year', 'desc'));
    
    const snapshot = await getDocs(bracketsQuery);
    const brackets: Bracket[] = [];
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      brackets.push({
        ...data,
        id: doc.id,
        createdAt: data.createdAt?.toDate() || new Date(),
      } as Bracket);
    });

    return NextResponse.json({
      success: true,
      data: brackets,
      count: brackets.length,
    });

  } catch (error) {
    console.error('Error fetching brackets:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch brackets',
      },
      { status: 500 }
    );
  }
}