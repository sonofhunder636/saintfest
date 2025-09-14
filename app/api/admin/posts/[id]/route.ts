import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { BlogPost } from '../route';

// Prevent this route from being executed during build
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET - Get single post
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check Firebase connection
    if (!db) {
      return NextResponse.json({
        success: false,
        error: 'Database connection not available'
      }, { status: 503 });
    }

    const { id } = await params;
    const docRef = doc(db, 'posts', id);
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
      scheduledAt: docSnap.data()?.scheduledAt?.toDate(),
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check Firebase connection
    if (!db) {
      return NextResponse.json({
        success: false,
        error: 'Database connection not available'
      }, { status: 503 });
    }

    const { id } = await params;
    const body = await request.json();
    console.log('PUT /api/admin/posts/[id] - Received body for ID:', id, JSON.stringify(body, null, 2));
    
    const { 
      title, 
      slug, 
      content, 
      status, 
      tags = [], 
      categories = [],
      excerpt, 
      featuredImage, 
      scheduledFor,
      scheduledAt,
      featured,
      priority,
      seoTitle,
      seoDescription
    } = body;

    // Validate that we have at least title or content for updates
    if (title !== undefined && (!title || title.trim() === '')) {
      console.log('Validation failed: Empty title provided');
      return NextResponse.json(
        { success: false, error: 'Title cannot be empty' },
        { status: 400 }
      );
    }

    if (content !== undefined && (!content || content.trim() === '')) {
      console.log('Validation failed: Empty content provided');
      return NextResponse.json(
        { success: false, error: 'Content cannot be empty' },
        { status: 400 }
      );
    }

    const docRef = doc(db, 'posts', id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      console.log('Post not found for ID:', id);
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
      ...(categories !== undefined && { categories: Array.isArray(categories) ? categories : [] }),
      ...(excerpt !== undefined && { excerpt }),
      ...(featuredImage !== undefined && { featuredImage }),
      ...(scheduledFor !== undefined && { scheduledFor: scheduledFor ? new Date(scheduledFor) : undefined }),
      ...(scheduledAt !== undefined && { scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined }),
      ...(featured !== undefined && { featured: Boolean(featured) }),
      ...(priority !== undefined && { priority: (priority as 'low' | 'medium' | 'high') || 'medium' }),
      ...(seoTitle !== undefined && { seoTitle: seoTitle || title }),
      ...(seoDescription !== undefined && { seoDescription: seoDescription || excerpt }),
      updatedAt: new Date(),
      readTime,
      wordCount,
      images,
      // Legacy metadata for backward compatibility
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

    console.log('Updating post with data:', {
      id: id,
      title: updateData.title,
      slug: updateData.slug,
      status: updateData.status,
      hasScheduledFor: !!updateData.scheduledFor,
      hasScheduledAt: !!updateData.scheduledAt
    });

    await updateDoc(docRef, updateData);
    console.log('Post updated successfully:', id);
    
    // Get updated document
    const updatedDoc = await getDoc(docRef);
    const post = {
      id: updatedDoc.id,
      ...updatedDoc.data(),
      createdAt: updatedDoc.data()?.createdAt?.toDate(),
      updatedAt: updatedDoc.data()?.updatedAt?.toDate(),
      publishedAt: updatedDoc.data()?.publishedAt?.toDate(),
      scheduledFor: updatedDoc.data()?.scheduledFor?.toDate(),
      scheduledAt: updatedDoc.data()?.scheduledAt?.toDate(),
    } as BlogPost;

    console.log('Returning updated post:', post.id);
    return NextResponse.json({
      success: true,
      post
    });

  } catch (error: any) {
    const { id: postId } = await params;
    console.error('Error updating post - Full error details:', {
      postId: postId,
      message: error.message,
      code: error.code,
      stack: error.stack,
      name: error.name
    });
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update post' },
      { status: 500 }
    );
  }
}

// DELETE - Delete post
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check Firebase connection
    if (!db) {
      return NextResponse.json({
        success: false,
        error: 'Database connection not available'
      }, { status: 503 });
    }

    const { id } = await params;
    const docRef = doc(db, 'posts', id);
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