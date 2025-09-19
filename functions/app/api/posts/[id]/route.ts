import { NextRequest, NextResponse } from 'next/server';
import { doc, getDoc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { assertFirestore } from '@/lib/firebase';
import { DailyPost } from '@/types';

// Removed dynamic export as it's not needed without output: 'export'"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const db = assertFirestore();
    const { id } = await params;
    const postId = id;
    
    const postRef = doc(db, 'dailyPosts', postId);
    const postDoc = await getDoc(postRef);
    
    if (!postDoc.exists()) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      );
    }

    const data = postDoc.data();
    const post: DailyPost = {
      id: postDoc.id,
      title: data.title,
      content: data.content,
      publishDate: data.publishDate?.toDate() || new Date(),
      isPublished: data.isPublished || false,
      matchup: data.matchup,
      pollId: data.pollId,
      previousWinner: data.previousWinner,
      createdBy: data.createdBy,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
      scheduledFor: data.scheduledFor?.toDate(),
      bracketRound: data.bracketRound,
      dayNumber: data.dayNumber,
    };

    return NextResponse.json({
      success: true,
      data: post,
    });

  } catch (error) {
    console.error('Error fetching post:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch post',
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
    const postId = id;
    const updateData = await request.json();
    
    // TODO: Add admin authentication check
    
    const postRef = doc(db, 'dailyPosts', postId);
    const postDoc = await getDoc(postRef);
    
    if (!postDoc.exists()) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updates: any = {
      updatedAt: Timestamp.now(),
    };

    // Only update provided fields
    if (updateData.title !== undefined) updates.title = updateData.title;
    if (updateData.content !== undefined) updates.content = updateData.content;
    if (updateData.isPublished !== undefined) updates.isPublished = updateData.isPublished;
    if (updateData.matchup !== undefined) updates.matchup = updateData.matchup;
    if (updateData.previousWinner !== undefined) updates.previousWinner = updateData.previousWinner;
    if (updateData.publishDate !== undefined) {
      updates.publishDate = Timestamp.fromDate(new Date(updateData.publishDate));
    }
    if (updateData.scheduledFor !== undefined) {
      updates.scheduledFor = updateData.scheduledFor ? 
        Timestamp.fromDate(new Date(updateData.scheduledFor)) : null;
    }
    if (updateData.bracketRound !== undefined) updates.bracketRound = updateData.bracketRound;

    await updateDoc(postRef, updates);

    // Return updated post
    const updatedDoc = await getDoc(postRef);
    const data = updatedDoc.data();
    const updatedPost: DailyPost = {
      id: updatedDoc.id,
      title: data!.title,
      content: data!.content,
      publishDate: data!.publishDate?.toDate() || new Date(),
      isPublished: data!.isPublished || false,
      matchup: data!.matchup,
      pollId: data!.pollId,
      previousWinner: data!.previousWinner,
      createdBy: data!.createdBy,
      createdAt: data!.createdAt?.toDate() || new Date(),
      updatedAt: data!.updatedAt?.toDate() || new Date(),
      scheduledFor: data!.scheduledFor?.toDate(),
      bracketRound: data!.bracketRound,
      dayNumber: data!.dayNumber,
    };

    return NextResponse.json({
      success: true,
      data: updatedPost,
      message: 'Post updated successfully',
    });

  } catch (error) {
    console.error('Error updating post:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update post',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const db = assertFirestore();
    const { id } = await params;
    const postId = id;
    
    // TODO: Add admin authentication check
    
    const postRef = doc(db, 'dailyPosts', postId);
    const postDoc = await getDoc(postRef);
    
    if (!postDoc.exists()) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      );
    }

    await deleteDoc(postRef);

    return NextResponse.json({
      success: true,
      message: 'Post deleted successfully',
    });

  } catch (error) {
    console.error('Error deleting post:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete post',
      },
      { status: 500 }
    );
  }
}