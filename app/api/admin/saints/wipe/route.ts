import { NextRequest, NextResponse } from 'next/server';
import { collection, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { validateAdminAccess } from '@/lib/auth-middleware';

export async function DELETE(request: NextRequest) {
  try {
    // CRITICAL: Validate admin authentication first
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

    console.log(`CRITICAL: Admin ${authResult.userEmail} attempting to wipe saints database at ${new Date().toISOString()}`);
    console.log('Starting saints database wipe...');
    
    const saintsCollection = collection(db, 'saints');
    const snapshot = await getDocs(saintsCollection);
    
    if (snapshot.empty) {
      return NextResponse.json({
        success: true,
        message: 'Database is already empty',
        deletedCount: 0,
      });
    }

    // Use batched writes for efficient deletion
    const batchSize = 500; // Firestore batch limit
    const batches = [];
    let currentBatch = writeBatch(db);
    let operationCount = 0;
    let totalDeleted = 0;

    snapshot.docs.forEach((doc) => {
      currentBatch.delete(doc.ref);
      operationCount++;
      totalDeleted++;

      // Create new batch if current batch is full
      if (operationCount === batchSize) {
        batches.push(currentBatch);
        currentBatch = writeBatch(db);
        operationCount = 0;
      }
    });

    // Add the final batch if it has operations
    if (operationCount > 0) {
      batches.push(currentBatch);
    }

    // Execute all batches
    console.log(`Executing ${batches.length} batches to delete ${totalDeleted} documents...`);
    
    for (let i = 0; i < batches.length; i++) {
      await batches[i].commit();
      console.log(`Batch ${i + 1}/${batches.length} completed`);
    }

    console.log('Saints database wipe completed successfully');

    return NextResponse.json({
      success: true,
      message: 'All saints deleted successfully',
      deletedCount: totalDeleted,
      batchesExecuted: batches.length,
    });

  } catch (error) {
    console.error('Error wiping saints database:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to wipe saints database',
      },
      { status: 500 }
    );
  }
}