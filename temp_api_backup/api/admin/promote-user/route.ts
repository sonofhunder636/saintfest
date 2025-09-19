import { NextRequest, NextResponse } from 'next/server';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Temporary endpoint to promote the first user to admin
export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    await updateDoc(userRef, {
      role: 'admin',
      updatedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: 'User promoted to admin successfully',
    });

  } catch (error) {
    console.error('Error promoting user:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to promote user',
      },
      { status: 500 }
    );
  }
}