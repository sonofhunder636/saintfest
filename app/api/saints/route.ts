import { NextRequest, NextResponse } from 'next/server';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Saint } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const saintsCollection = collection(db, 'saints');
    const saintsQuery = query(saintsCollection, orderBy('name'));
    
    const snapshot = await getDocs(saintsQuery);
    const saints: Saint[] = [];
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      // Only return essential data for public API
      saints.push({
        id: doc.id,
        name: data.name,
        saintfestAppearance: data.saintfestAppearance,
        hagiography: data.hagiography,
        birthYear: data.birthYear,
        deathYear: data.deathYear,
        origin: data.origin,
        locationOfLabor: data.locationOfLabor,
        tags: data.tags,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
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