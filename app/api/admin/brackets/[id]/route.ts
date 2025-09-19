import { NextRequest, NextResponse } from 'next/server';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Bracket } from '@/types';

// Prevent this route from being executed during build
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Build-time safety checks
    const isBuildTime = (
      !request ||
      typeof request.json !== 'function' ||
      !globalThis.fetch
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