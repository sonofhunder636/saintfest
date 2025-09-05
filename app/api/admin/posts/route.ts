import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, doc, addDoc, updateDoc, getDocs, getDoc, query, where, orderBy, limit, startAfter, deleteDoc } from 'firebase/firestore';
import { headers } from 'next/headers';

export interface BlogPost {
  id?: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  status: 'draft' | 'published' | 'scheduled';
  publishedAt?: Date;
  scheduledFor?: Date;
  tags: string[];
  featuredImage?: string;
  author: string;
  createdAt: Date;
  updatedAt: Date;
  metadata?: {
    readTime?: number;
    wordCount?: number;
    images?: string[];
  };
}

// GET - List posts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limitNum = parseInt(searchParams.get('limit') || '10');
    const lastDoc = searchParams.get('lastDoc');

    // Return empty array if posts collection doesn't exist yet
    try {

    let postsQuery = query(
      collection(db, 'posts'),
      orderBy('updatedAt', 'desc'),
      limit(limitNum)
    );

    // Filter by status if provided (without orderBy to avoid index requirement)
    if (status && ['draft', 'published', 'scheduled'].includes(status)) {
      postsQuery = query(
        collection(db, 'posts'),
        where('status', '==', status),
        limit(limitNum)
      );
    }

    // Add pagination if lastDoc provided and we're not filtering by status
    if (lastDoc && !status) {
      const lastDocRef = doc(db, 'posts', lastDoc);
      const lastDocSnap = await getDoc(lastDocRef);
      if (lastDocSnap.exists()) {
        postsQuery = query(postsQuery, startAfter(lastDocSnap));
      }
    }

    const snapshot = await getDocs(postsQuery);
    const posts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
      publishedAt: doc.data().publishedAt?.toDate(),
      scheduledFor: doc.data().scheduledFor?.toDate(),
    })) as BlogPost[];

    // Sort by updatedAt descending (most recent first)
    posts.sort((a, b) => {
      const dateA = a.updatedAt || a.createdAt;
      const dateB = b.updatedAt || b.createdAt;
      return (dateB?.getTime() || 0) - (dateA?.getTime() || 0);
    });

    return NextResponse.json({
      success: true,
      posts,
      hasMore: snapshot.docs.length === limitNum
    });

    } catch (firestoreError: any) {
      // If it's a Firebase index error or collection doesn't exist, return empty array
      if (firestoreError.code === 'failed-precondition' || firestoreError.code === 'not-found') {
        console.log('Posts collection not available, returning empty array:', firestoreError.code);
        return NextResponse.json({
          success: true,
          posts: [],
          hasMore: false
        });
      }
      throw firestoreError; // Re-throw other Firebase errors
    }

  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch posts' },
      { status: 500 }
    );
  }
}

// POST - Create new post
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, slug, content, status = 'draft', tags = [], excerpt, featuredImage, scheduledFor } = body;

    // Validate required fields
    if (!title || !content) {
      return NextResponse.json(
        { success: false, error: 'Title and content are required' },
        { status: 400 }
      );
    }

    // Generate slug if not provided
    const finalSlug = slug || title
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();

    // Check if slug already exists
    const slugQuery = query(collection(db, 'posts'), where('slug', '==', finalSlug));
    const slugSnapshot = await getDocs(slugQuery);
    
    if (!slugSnapshot.empty) {
      return NextResponse.json(
        { success: false, error: 'A post with this slug already exists' },
        { status: 400 }
      );
    }

    // Calculate metadata
    const wordCount = content.split(/\s+/).filter(Boolean).length;
    const readTime = Math.max(1, Math.ceil(wordCount / 200)); // Average reading speed: 200 words per minute
    const images = content.match(/!\[.*?\]\((.*?)\)/g)?.map((match: string) => {
      const urlMatch = match.match(/\((.*?)\)/);
      return urlMatch ? urlMatch[1] : '';
    }).filter(Boolean) || [];

    const now = new Date();
    const postData: Omit<BlogPost, 'id'> = {
      title,
      slug: finalSlug,
      content,
      excerpt: excerpt || content.substring(0, 150) + (content.length > 150 ? '...' : ''),
      status: status as 'draft' | 'published' | 'scheduled',
      tags: Array.isArray(tags) ? tags : [],
      featuredImage,
      author: 'admin', // TODO: Get from auth context
      createdAt: now,
      updatedAt: now,
      publishedAt: status === 'published' ? now : undefined,
      scheduledFor: scheduledFor ? new Date(scheduledFor) : undefined,
      metadata: {
        readTime,
        wordCount,
        images
      }
    };

    const docRef = await addDoc(collection(db, 'posts'), postData);
    
    return NextResponse.json({
      success: true,
      post: { id: docRef.id, ...postData }
    });

  } catch (error) {
    console.error('Error creating post:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create post' },
      { status: 500 }
    );
  }
}