import { NextRequest, NextResponse } from 'next/server';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Bracket } from '@/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const bracketRef = doc(db, 'brackets', id);
    const bracketDoc = await getDoc(bracketRef);

    if (!bracketDoc.exists()) {
      return NextResponse.json(
        { success: false, error: 'Bracket not found' },
        { status: 404 }
      );
    }

    const bracketData = bracketDoc.data();
    const bracket: Bracket = {
      ...bracketData,
      id: bracketDoc.id,
      createdAt: bracketData.createdAt?.toDate() || new Date(),
    } as Bracket;

    return NextResponse.json({
      success: true,
      data: bracket,
    });

  } catch (error) {
    console.error('Error fetching bracket:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch bracket',
      },
      { status: 500 }
    );
  }
}