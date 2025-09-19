import { NextRequest, NextResponse } from 'next/server';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { assertFirestore } from '@/lib/firebase';
import { Saint } from '@/types';

// Prevent this route from being executed during build
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
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

    // Initialize Firestore with runtime assertion
    const db = assertFirestore();

    const saintsCollection = collection(db, 'saints');
    const saintsQuery = query(saintsCollection, orderBy('name'));
    
    const snapshot = await getDocs(saintsQuery);
    const saints: Saint[] = [];
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      saints.push({
        ...data,
        id: doc.id,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt || new Date()),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : (data.updatedAt || new Date()),
      } as Saint);
    });

    return NextResponse.json({
      success: true,
      data: saints,
      count: saints.length,
    });

  } catch (error) {
    console.error('Error fetching saints:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch saints',
      },
      { status: 500 }
    );
  }
}