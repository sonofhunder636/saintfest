import { NextRequest, NextResponse } from 'next/server';
import { collection, getDocs, doc, setDoc, query, orderBy, where, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { DailyPost } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const published = searchParams.get('published');
    const year = searchParams.get('year') || new Date().getFullYear().toString();
    
    const postsCollection = collection(db, 'dailyPosts');
    let postsQuery;
    
    if (published === 'true') {
      // Only published posts for public viewing - simplified query to avoid index requirement
      postsQuery = query(
        postsCollection, 
        where('isPublished', '==', true)
      );
    } else {
      // All posts for admin
      postsQuery = query(postsCollection, orderBy('dayNumber', 'asc'));
    }
    
    const snapshot = await getDocs(postsQuery);
    const posts: DailyPost[] = [];
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      posts.push({
        id: doc.id,
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
      } as DailyPost);
    });

    // Sort posts by publishDate descending if this is for public viewing
    if (published === 'true') {
      posts.sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime());
    }

    return NextResponse.json({
      success: true,
      data: posts,
      count: posts.length,
    });

  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch posts',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const postData = await request.json();
    
    // TODO: Add admin authentication check
    // For now, we'll use a placeholder user ID
    const adminUserId = 'admin-user';
    
    // Generate post ID based on day number and year
    const year = new Date().getFullYear();
    const postId = `${year}-day-${postData.dayNumber.toString().padStart(2, '0')}`;
    
    const firestoreDoc: any = {
      title: postData.title,
      content: postData.content,
      publishDate: postData.publishDate ? Timestamp.fromDate(new Date(postData.publishDate)) : Timestamp.now(),
      isPublished: postData.isPublished || false,
      matchup: postData.matchup,
      createdBy: adminUserId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      bracketRound: postData.bracketRound,
      dayNumber: postData.dayNumber,
    };

    // Only add optional fields if they have values
    if (postData.previousWinner && postData.previousWinner.saintId) {
      firestoreDoc.previousWinner = postData.previousWinner;
    }
    if (postData.scheduledFor) {
      firestoreDoc.scheduledFor = Timestamp.fromDate(new Date(postData.scheduledFor));
    }

    const postRef = doc(db, 'dailyPosts', postId);
    await setDoc(postRef, firestoreDoc);

    // Convert back to DailyPost format for response
    const responsePost: DailyPost = {
      id: postId,
      title: postData.title,
      content: postData.content,
      publishDate: firestoreDoc.publishDate.toDate(),
      isPublished: postData.isPublished || false,
      matchup: postData.matchup,
      pollId: undefined,
      previousWinner: postData.previousWinner?.saintId ? postData.previousWinner : undefined,
      createdBy: adminUserId,
      createdAt: firestoreDoc.createdAt.toDate(),
      updatedAt: firestoreDoc.updatedAt.toDate(),
      scheduledFor: firestoreDoc.scheduledFor?.toDate(),
      bracketRound: postData.bracketRound,
      dayNumber: postData.dayNumber,
    };

    return NextResponse.json({
      success: true,
      data: responsePost,
      message: 'Post created successfully',
    });

  } catch (error) {
    console.error('Error creating post:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create post',
      },
      { status: 500 }
    );
  }
}