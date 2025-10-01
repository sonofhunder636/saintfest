import PostClient from './PostClient';


// Generate static params for posts from Firestore
export async function generateStaticParams() {
  console.log('Build time: generating static params for posts from Firestore');

  try {
    // Use Firebase config from lib/firebase.ts
    const { assertFirestore } = await import('@/lib/firebase');
    const { collection, query, where, getDocs } = await import('firebase/firestore');

    const db = assertFirestore();
    if (!db) {
      console.log('Firebase not initialized during build, returning empty array');
      return [];
    }

    // Query for published posts
    const postsQuery = query(
      collection(db, 'posts'),
      where('status', '==', 'published')
    );

    const snapshot = await getDocs(postsQuery);
    const params = snapshot.docs.map(doc => {
      const data = doc.data();
      return { slug: data.slug };
    }).filter(param => param.slug); // Only include posts with valid slugs

    console.log(`Generated static params for ${params.length} posts from Firestore`);

    return params;

  } catch (error) {
    console.log('Failed to fetch posts during build, returning empty array:', error);
    return [];
  }
}

interface PostPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;

  // All posts come from Firestore, use PostClient for dynamic loading
  return <PostClient slug={slug} />;
}

