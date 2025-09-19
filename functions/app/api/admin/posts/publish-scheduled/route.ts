import { NextRequest, NextResponse } from 'next/server';
import { assertFirestore } from '@/lib/firebase';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    const db = assertFirestore();
    // Find all posts that are scheduled and should be published now
    const now = new Date();
    
    // Handle case where posts collection doesn't exist yet
    try {
      const postsQuery = query(
        collection(db, 'posts'),
        where('status', '==', 'scheduled')
      );

    const snapshot = await getDocs(postsQuery);
    const postsToPublish = [];
    
    // Filter posts where scheduledFor <= now
    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      const scheduledFor = data.scheduledFor?.toDate();
      
      if (scheduledFor && scheduledFor <= now) {
        postsToPublish.push({
          id: docSnap.id,
          title: data.title,
          scheduledFor
        });
      }
    }

    // Update each post to published status
    const publishPromises = postsToPublish.map(async (post) => {
      const docRef = doc(db, 'posts', post.id);
      await updateDoc(docRef, {
        status: 'published',
        publishedAt: now,
        updatedAt: now
      });
      return post;
    });

    const publishedPosts = await Promise.all(publishPromises);

    return NextResponse.json({
      success: true,
      publishedCount: publishedPosts.length,
      publishedPosts: publishedPosts.map(p => ({
        id: p.id,
        title: p.title,
        scheduledFor: p.scheduledFor.toISOString(),
        publishedAt: now.toISOString()
      }))
    });

    } catch (firestoreError: any) {
      // If posts collection doesn't exist or has index issues, return success with 0 published
      if (firestoreError.code === 'failed-precondition' || firestoreError.code === 'not-found') {
        console.log('Posts collection not available for scheduling, returning success:', firestoreError.code);
        return NextResponse.json({
          success: true,
          publishedCount: 0,
          publishedPosts: []
        });
      }
      throw firestoreError;
    }

  } catch (error) {
    console.error('Error publishing scheduled posts:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to publish scheduled posts' },
      { status: 500 }
    );
  }
}