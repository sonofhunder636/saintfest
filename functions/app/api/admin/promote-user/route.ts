import { NextRequest, NextResponse } from 'next/server';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { validateAdminAccess } from '@/lib/auth-middleware';

// SECURITY: This endpoint is now protected and should only be used in emergencies
// Regular admin access is controlled through the email whitelist in AuthContext.tsx
export async function POST(request: NextRequest) {
  try {
    // Validate admin authentication first
    const authResult = await validateAdminAccess(request);
    if (!authResult.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: authResult.error || 'Admin authentication required',
          requiresAuth: true,
          note: 'Only andrewfisher1024@gmail.com can use this endpoint'
        },
        { status: 401 }
      );
    }

    console.log(`Admin ${authResult.userEmail} attempting to promote user`);

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

    const userData = userDoc.data();

    // Additional security: Log the promotion attempt
    console.log(`ADMIN ACTION: ${authResult.userEmail} promoting user ${userId} (${userData.email}) to admin`);

    await updateDoc(userRef, {
      role: 'admin',
      updatedAt: new Date(),
      promotedBy: authResult.userEmail,
      promotedAt: new Date()
    });

    return NextResponse.json({
      success: true,
      message: `User ${userData.email} promoted to admin successfully`,
      promotedBy: authResult.userEmail
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