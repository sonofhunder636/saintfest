import { NextRequest, NextResponse } from 'next/server';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Saint } from '@/types';
import { validateAdminAccess } from '@/lib/auth-middleware';

// Prevent this route from being executed during build
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
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

    console.log(`Admin ${authResult.userEmail} fetching saints`);

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