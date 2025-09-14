import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, doc, addDoc, updateDoc, getDocs, getDoc, query, where, orderBy, limit, startAfter, deleteDoc } from 'firebase/firestore';
import { headers } from 'next/headers';

// Prevent this route from being executed during build
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export interface BlogPost {
  id?: string;
  title: string;
  slug: string;
  author: string;
  authorId: string;
  status: 'draft' | 'published' | 'archived' | 'scheduled';
  featured: boolean;
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  scheduledAt?: Date;
  content: string;
  excerpt: string;
  tags: string[];
  categories: string[];
  readTime: number;
  views: number;
  likes: number;
  comments: number;
  seoTitle: string;
  seoDescription: string;
  wordCount: number;
  images: string[];
  priority: 'low' | 'medium' | 'high';
  featuredImage?: string;
  // Legacy fields for backward compatibility
  scheduledFor?: Date;
  metadata?: {
    readTime?: number;
    wordCount?: number;
    images?: string[];
  };
}

// GET - List posts
export async function GET(request: NextRequest) {
  try {
    // Build-time safety checks
    const isBuildTime = (
      !request ||
      typeof request.json !== 'function' ||
      !globalThis.fetch
    );

    if (isBuildTime) {
      return NextResponse.json({
        success: false,
        error: 'API not available during build time',
        buildTime: true
      }, { status: 503 });
    }

    // Firebase availability check
    if (!db) {
      return NextResponse.json({
        success: false,
        error: 'Database connection not available'
      }, { status: 503 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const slug = searchParams.get('slug');
    const limitNum = parseInt(searchParams.get('limit') || '10');
    const lastDoc = searchParams.get('lastDoc');

    // Return empty array if posts collection doesn't exist yet
    try {

    let postsQuery = query(
      collection(db, 'posts'),
      orderBy('updatedAt', 'desc'),
      limit(limitNum)
    );

    // Filter by slug if provided (for slug validation)
    if (slug) {
      postsQuery = query(
        collection(db, 'posts'),
        where('slug', '==', slug),
        limit(1)
      );
    }
    // Filter by status if provided (without orderBy to avoid index requirement)
    else if (status && ['draft', 'published', 'scheduled'].includes(status)) {
      postsQuery = query(
        collection(db, 'posts'),
        where('status', '==', status),
        limit(limitNum)
      );
    }

    // Add pagination if lastDoc provided and we're not filtering by status or slug
    if (lastDoc && !status && !slug) {
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
    console.log('POST /api/admin/posts - Received body:', JSON.stringify(body, null, 2));
    const { 
      title, 
      slug, 
      content, 
      status = 'draft', 
      tags = [], 
      categories = [],
      excerpt, 
      featuredImage, 
      scheduledFor, 
      scheduledAt,
      featured = false,
      priority = 'medium',
      seoTitle,
      seoDescription
    } = body;

    // Validate required fields
    if (!title || !content) {
      console.log('Validation failed: Missing required fields', { 
        hasTitle: !!title, 
        hasContent: !!content,
        titleLength: title?.length || 0,
        contentLength: content?.length || 0
      });
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
    console.log('Checking slug uniqueness:', { finalSlug });
    try {
      const slugQuery = query(collection(db, 'posts'), where('slug', '==', finalSlug));
      const slugSnapshot = await getDocs(slugQuery);
      
      if (!slugSnapshot.empty) {
        console.log('Slug validation failed: Duplicate slug found', { finalSlug });
        return NextResponse.json(
          { success: false, error: 'A post with this slug already exists' },
          { status: 400 }
        );
      }
    } catch (slugError: any) {
      // Handle Firestore collection not existing yet
      console.log('Slug check failed (collection may not exist yet):', slugError.code);
      if (slugError.code !== 'not-found' && slugError.code !== 'failed-precondition') {
        throw slugError; // Re-throw if it's a real error
      }
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
      status: status as 'draft' | 'published' | 'archived' | 'scheduled',
      tags: Array.isArray(tags) ? tags : [],
      categories: Array.isArray(categories) ? categories : [],
      author: 'admin', // TODO: Get from auth context
      authorId: 'admin-id', // TODO: Get from auth context
      featured: Boolean(featured),
      priority: (priority as 'low' | 'medium' | 'high') || 'medium',
      createdAt: now,
      updatedAt: now,
      readTime,
      wordCount,
      views: 0,
      likes: 0,
      comments: 0,
      seoTitle: seoTitle || title,
      seoDescription: seoDescription || (excerpt || content.substring(0, 160)),
      images,
      // Legacy metadata for backward compatibility
      metadata: {
        readTime,
        wordCount,
        images
      },
      // Only include fields if they have values (Firebase doesn't accept undefined)
      ...(featuredImage && { featuredImage }),
      ...(status === 'published' && { publishedAt: now }),
      ...(scheduledFor && { scheduledFor: new Date(scheduledFor) }),
      ...(scheduledAt && { scheduledAt: new Date(scheduledAt) })
    };

    console.log('Creating post with data:', { 
      title: postData.title, 
      slug: postData.slug, 
      status: postData.status,
      hasScheduledFor: !!postData.scheduledFor,
      hasScheduledAt: !!postData.scheduledAt
    });

    const docRef = await addDoc(collection(db, 'posts'), postData);
    console.log('Post created successfully with ID:', docRef.id);
    
    // Create response with safely serialized dates
    const responsePost = {
      id: docRef.id,
      ...postData,
      createdAt: postData.createdAt.toISOString(),
      updatedAt: postData.updatedAt.toISOString(),
      publishedAt: postData.publishedAt ? postData.publishedAt.toISOString() : undefined,
      scheduledFor: postData.scheduledFor ? postData.scheduledFor.toISOString() : undefined,
      scheduledAt: postData.scheduledAt ? postData.scheduledAt.toISOString() : undefined
    };
    
    console.log('Returning successful response with post ID:', responsePost.id);
    return NextResponse.json({
      success: true,
      post: responsePost
    });

  } catch (error: any) {
    console.error('Error creating post - Full error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack,
      name: error.name
    });
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create post' },
      { status: 500 }
    );
  }
}