import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { BlogPost } from '../route';

// GET - Get single post
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const docRef = doc(db, 'posts', params.id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      );
    }

    const post = {
      id: docSnap.id,
      ...docSnap.data(),
      createdAt: docSnap.data()?.createdAt?.toDate(),
      updatedAt: docSnap.data()?.updatedAt?.toDate(),
      publishedAt: docSnap.data()?.publishedAt?.toDate(),
      scheduledFor: docSnap.data()?.scheduledFor?.toDate(),
    } as BlogPost;

    return NextResponse.json({
      success: true,
      post
    });

  } catch (error) {
    console.error('Error fetching post:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch post' },
      { status: 500 }
    );
  }
}

// PUT - Update post
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { title, slug, content, status, tags = [], excerpt, featuredImage, scheduledFor } = body;

    const docRef = doc(db, 'posts', params.id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      );
    }

    // Calculate metadata
    const wordCount = content ? content.split(/\s+/).filter(Boolean).length : docSnap.data()?.metadata?.wordCount || 0;
    const readTime = Math.max(1, Math.ceil(wordCount / 200));
    const images = content ? 
      (content.match(/!\[.*?\]\((.*?)\)/g)?.map((match: string) => {
        const urlMatch = match.match(/\((.*?)\)/);
        return urlMatch ? urlMatch[1] : '';
      }).filter(Boolean) || []) :
      docSnap.data()?.metadata?.images || [];

    const updateData: Partial<BlogPost> = {
      ...(title !== undefined && { title }),
      ...(slug !== undefined && { slug }),
      ...(content !== undefined && { content }),
      ...(status !== undefined && { status }),
      ...(tags !== undefined && { tags: Array.isArray(tags) ? tags : [] }),
      ...(excerpt !== undefined && { excerpt }),
      ...(featuredImage !== undefined && { featuredImage }),
      ...(scheduledFor !== undefined && { scheduledFor: scheduledFor ? new Date(scheduledFor) : undefined }),
      updatedAt: new Date(),
      metadata: {
        ...docSnap.data()?.metadata,
        readTime,
        wordCount,
        images
      }
    };

    // Set publishedAt if status changed to published
    if (status === 'published' && docSnap.data()?.status !== 'published') {
      updateData.publishedAt = new Date();
    }

    await updateDoc(docRef, updateData);
    
    // Get updated document
    const updatedDoc = await getDoc(docRef);
    const post = {
      id: updatedDoc.id,
      ...updatedDoc.data(),
      createdAt: updatedDoc.data()?.createdAt?.toDate(),
      updatedAt: updatedDoc.data()?.updatedAt?.toDate(),
      publishedAt: updatedDoc.data()?.publishedAt?.toDate(),
      scheduledFor: updatedDoc.data()?.scheduledFor?.toDate(),
    } as BlogPost;

    return NextResponse.json({
      success: true,
      post
    });

  } catch (error) {
    console.error('Error updating post:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update post' },
      { status: 500 }
    );
  }
}

// DELETE - Delete post
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const docRef = doc(db, 'posts', params.id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      );
    }

    await deleteDoc(docRef);
    
    return NextResponse.json({
      success: true,
      message: 'Post deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting post:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete post' },
      { status: 500 }
    );
  }
}