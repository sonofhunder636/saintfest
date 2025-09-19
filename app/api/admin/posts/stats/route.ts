import { NextRequest, NextResponse } from 'next/server';
import { assertFirestore } from '@/lib/firebase';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { BlogPost } from '../route';

// GET - Get blog statistics and metrics
export async function GET(request: NextRequest) {
  try {
    const db = assertFirestore();
    // Get all posts for statistics
    const postsRef = collection(db, 'posts');
    const postsSnapshot = await getDocs(postsRef);
    
    if (postsSnapshot.empty) {
      return NextResponse.json({
        success: true,
        stats: {
          totalPosts: 0,
          publishedPosts: 0,
          draftPosts: 0,
          scheduledPosts: 0,
          archivedPosts: 0,
          featuredPosts: 0,
          totalViews: 0,
          totalLikes: 0,
          totalComments: 0,
          avgWordsPerPost: 0,
          avgReadTime: 0,
          topTags: [],
          topCategories: [],
          recentActivity: [],
          priorityDistribution: { low: 0, medium: 0, high: 0 },
          statusDistribution: { draft: 0, published: 0, scheduled: 0, archived: 0 }
        }
      });
    }
    
    const posts = postsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
      publishedAt: doc.data().publishedAt?.toDate(),
      scheduledAt: doc.data().scheduledAt?.toDate(),
      scheduledFor: doc.data().scheduledFor?.toDate(),
    })) as BlogPost[];
    
    // Calculate statistics
    const stats = {
      totalPosts: posts.length,
      publishedPosts: posts.filter(p => p.status === 'published').length,
      draftPosts: posts.filter(p => p.status === 'draft').length,
      scheduledPosts: posts.filter(p => p.status === 'scheduled').length,
      archivedPosts: posts.filter(p => p.status === 'archived').length,
      featuredPosts: posts.filter(p => p.featured).length,
      totalViews: posts.reduce((sum, p) => sum + (p.views || 0), 0),
      totalLikes: posts.reduce((sum, p) => sum + (p.likes || 0), 0),
      totalComments: posts.reduce((sum, p) => sum + (p.comments || 0), 0),
      avgWordsPerPost: Math.round(posts.reduce((sum, p) => sum + (p.wordCount || 0), 0) / posts.length),
      avgReadTime: Math.round(posts.reduce((sum, p) => sum + (p.readTime || 0), 0) / posts.length),
    };
    
    // Calculate tag frequency
    const tagCounts: { [key: string]: number } = {};
    posts.forEach(post => {
      (post.tags || []).forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });
    
    const topTags = Object.entries(tagCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count }));
    
    // Calculate category frequency
    const categoryCounts: { [key: string]: number } = {};
    posts.forEach(post => {
      (post.categories || []).forEach(category => {
        categoryCounts[category] = (categoryCounts[category] || 0) + 1;
      });
    });
    
    const topCategories = Object.entries(categoryCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([category, count]) => ({ category, count }));
    
    // Recent activity (last 10 posts by update date)
    const recentActivity = posts
      .sort((a, b) => (b.updatedAt?.getTime() || 0) - (a.updatedAt?.getTime() || 0))
      .slice(0, 10)
      .map(post => ({
        id: post.id,
        title: post.title,
        status: post.status,
        updatedAt: post.updatedAt,
        author: post.author
      }));
    
    // Priority distribution
    const priorityDistribution = {
      low: posts.filter(p => p.priority === 'low').length,
      medium: posts.filter(p => p.priority === 'medium').length,
      high: posts.filter(p => p.priority === 'high').length
    };
    
    // Status distribution
    const statusDistribution = {
      draft: stats.draftPosts,
      published: stats.publishedPosts,
      scheduled: stats.scheduledPosts,
      archived: stats.archivedPosts
    };
    
    // Monthly post creation trends (last 12 months)
    const now = new Date();
    const monthlyTrends = [];
    for (let i = 11; i >= 0; i--) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      
      const postsInMonth = posts.filter(post => {
        const createdAt = post.createdAt;
        return createdAt && createdAt >= month && createdAt < nextMonth;
      }).length;
      
      monthlyTrends.push({
        month: month.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        posts: postsInMonth
      });
    }
    
    return NextResponse.json({
      success: true,
      stats: {
        ...stats,
        topTags,
        topCategories,
        recentActivity,
        priorityDistribution,
        statusDistribution,
        monthlyTrends
      }
    });
    
  } catch (error) {
    console.error('Error fetching blog statistics:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}