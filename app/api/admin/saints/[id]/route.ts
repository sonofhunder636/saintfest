import { NextRequest, NextResponse } from 'next/server';
import { doc, deleteDoc, getDoc, updateDoc } from 'firebase/firestore';
import { assertFirestore } from '@/lib/firebase';

// Prevent this route from being executed during build
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const db = assertFirestore();
    const { id } = await params;
    const saintRef = doc(db, 'saints', id);
    
    // Check if saint exists
    const saintDoc = await getDoc(saintRef);
    if (!saintDoc.exists()) {
      return NextResponse.json(
        { success: false, error: 'Saint not found' },
        { status: 404 }
      );
    }

    await deleteDoc(saintRef);

    return NextResponse.json({
      success: true,
      message: 'Saint deleted successfully',
    });

  } catch (error) {
    console.error('Error deleting saint:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete saint',
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const db = assertFirestore();
    const { id } = await params;
    const updates = await request.json();

    const saintRef = doc(db, 'saints', id);
    
    // Check if saint exists
    const saintDoc = await getDoc(saintRef);
    if (!saintDoc.exists()) {
      return NextResponse.json(
        { success: false, error: 'Saint not found' },
        { status: 404 }
      );
    }

    await updateDoc(saintRef, {
      ...updates,
      updatedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: 'Saint updated successfully',
    });

  } catch (error) {
    console.error('Error updating saint:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update saint',
      },
      { status: 500 }
    );
  }
}