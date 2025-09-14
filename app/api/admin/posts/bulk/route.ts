import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, doc, getDoc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';

// POST - Bulk operations (update status, delete multiple posts)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, postIds, data } = body;
    
    if (!action || !Array.isArray(postIds) || postIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Action and post IDs are required' },
        { status: 400 }
      );
    }
    
    const batch = writeBatch(db);
    const results = [];
    
    switch (action) {
      case 'updateStatus':
        if (!data.status) {
          return NextResponse.json(
            { success: false, error: 'Status is required for update operation' },
            { status: 400 }
          );
        }
        
        for (const postId of postIds) {
          const docRef = doc(db, 'posts', postId);
          const updateData: any = {
            status: data.status,
            updatedAt: new Date()
          };
          
          // Set publishedAt if changing to published status
          if (data.status === 'published') {
            updateData.publishedAt = new Date();
          }
          
          batch.update(docRef, updateData);
          results.push({ id: postId, action: 'updated' });
        }
        break;
        
      case 'delete':
        for (const postId of postIds) {
          const docRef = doc(db, 'posts', postId);
          batch.delete(docRef);
          results.push({ id: postId, action: 'deleted' });
        }
        break;
        
      case 'updatePriority':
        if (!data.priority) {
          return NextResponse.json(
            { success: false, error: 'Priority is required for priority update operation' },
            { status: 400 }
          );
        }
        
        for (const postId of postIds) {
          const docRef = doc(db, 'posts', postId);
          batch.update(docRef, {
            priority: data.priority,
            updatedAt: new Date()
          });
          results.push({ id: postId, action: 'priority_updated' });
        }
        break;
        
      case 'toggleFeatured':
        for (const postId of postIds) {
          const docRef = doc(db, 'posts', postId);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            const currentFeatured = docSnap.data().featured || false;
            batch.update(docRef, {
              featured: !currentFeatured,
              updatedAt: new Date()
            });
            results.push({ id: postId, action: 'featured_toggled' });
          }
        }
        break;
        
      case 'updateCategories':
        if (!Array.isArray(data.categories)) {
          return NextResponse.json(
            { success: false, error: 'Categories array is required for category update operation' },
            { status: 400 }
          );
        }
        
        for (const postId of postIds) {
          const docRef = doc(db, 'posts', postId);
          batch.update(docRef, {
            categories: data.categories,
            updatedAt: new Date()
          });
          results.push({ id: postId, action: 'categories_updated' });
        }
        break;
        
      default:
        return NextResponse.json(
          { success: false, error: 'Unsupported action' },
          { status: 400 }
        );
    }
    
    await batch.commit();
    
    return NextResponse.json({
      success: true,
      action,
      results,
      processedCount: results.length
    });
    
  } catch (error) {
    console.error('Error performing bulk operation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to perform bulk operation' },
      { status: 500 }
    );
  }
}