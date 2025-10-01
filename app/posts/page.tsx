'use client';

import Link from "next/link";
import { useState, useMemo, useEffect } from "react";
import { BlogPost, BlogPost as BlogPostType } from "@/types";
import Navigation from "@/components/Navigation";
import { assertFirestore } from "@/lib/firebase";
import { collection, query, where, orderBy, onSnapshot, QueryDocumentSnapshot } from "firebase/firestore";


export default function PostsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [postsToShow, setPostsToShow] = useState(10);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [firestoreError, setFirestoreError] = useState<string | null>(null);

  // Fetch posts from Firestore
  useEffect(() => {
    try {
      const db = assertFirestore();

      if (!db) {
        setFirestoreError('Firebase not initialized');
        setIsLoading(false);
        return;
      }

      console.log('Attempting to fetch posts from Firestore...');

      const unsubscribers: (() => void)[] = [];

      // Query published posts from the posts collection
      const postsQuery = query(
        collection(db, 'posts'),
        where('status', '==', 'published'),
        orderBy('createdAt', 'desc')
      );

      let postsData: BlogPost[] = [];

      const checkLoadingComplete = () => {
        setPosts(postsData);
        setIsLoading(false);
      };

      // Subscribe to published posts
      const unsubscribePosts = onSnapshot(
        postsQuery,
        (snapshot) => {
          postsData = snapshot.docs.map((doc: QueryDocumentSnapshot) => {
            const data = doc.data() as BlogPostType;
            return {
              id: doc.id,
              title: data.title,
              date: data.createdAt ? (data.createdAt instanceof Date ? data.createdAt.toISOString() : new Date((data.createdAt as any).toDate()).toISOString()) : new Date().toISOString(),
              excerpt: data.excerpt || data.content.substring(0, 200) + (data.content.length > 200 ? '...' : ''),
              content: data.content,
              slug: data.slug || doc.id
            };
          });
          checkLoadingComplete();
        },
        (error) => {
          console.error('Error fetching posts from Firestore:', error);
          setFirestoreError(error.message);
          checkLoadingComplete();
        }
      );

      unsubscribers.push(unsubscribePosts);

      // Cleanup function
      return () => {
        unsubscribers.forEach(unsubscribe => unsubscribe());
      };

    } catch (error) {
      console.error('Error setting up Firestore listeners:', error);
      setFirestoreError(error instanceof Error ? error.message : 'Failed to connect to Firestore');
      setIsLoading(false);
    }
  }, []);

  // Filter and sort posts
  const filteredAndSortedPosts = useMemo(() => {
    let filtered = posts;

    // Filter by search term
    if (searchTerm) {
      filtered = posts.filter(
        post =>
          post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
          post.excerpt.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort by date
    return filtered.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return sortOrder === "newest" ? dateB.getTime() - dateA.getTime() : dateA.getTime() - dateB.getTime();
    });
  }, [searchTerm, sortOrder, posts]);

  // Get posts to display (with pagination)
  const displayedPosts = filteredAndSortedPosts.slice(0, postsToShow);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div style={{minHeight: '100vh', backgroundColor: '#fffbeb', textAlign: 'center'}}>
      {/* Green Header Banner */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        width: '100%',
        backgroundColor: '#8FBC8F',
        padding: '1rem 0',
        marginBottom: '2rem'
      }}>
        <div style={{
          maxWidth: '64rem',
          margin: '0 auto',
          padding: '0 1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          {/* Site Title */}
          <Link href="/" style={{
            fontSize: '2.5rem',
            fontFamily: 'var(--font-sorts-mill)',
            color: 'white',
            textDecoration: 'none',
            fontWeight: '600',
            textShadow: '0 1px 2px rgba(0,0,0,0.1)'
          }}>
            Saintfest
          </Link>
          
          {/* Navigation */}
          <Navigation />
        </div>
      </header>

      {/* Main Content */}
      <main style={{maxWidth: '48rem', margin: '0 auto', padding: '3rem 1.5rem'}}>
        {/* Page Title */}
        <div style={{textAlign: 'center', marginBottom: '3rem'}}>
          <h1 style={{
            fontSize: '3rem',
            fontFamily: 'var(--font-sorts-mill)',
            color: '#374151',
            marginBottom: '1rem',
            fontWeight: '600'
          }}>
            Posts
          </h1>
          <div style={{
            width: '6rem',
            height: '1px',
            backgroundColor: '#d1d5db',
            margin: '0 auto'
          }}></div>
        </div>

        {/* Search and Sort Controls */}
        <div style={{
          display: 'flex',
          gap: '4rem',
          marginBottom: '3rem',
          alignItems: 'flex-end',
          justifyContent: 'flex-start',
          flexWrap: 'wrap',
          maxWidth: '42rem',
          margin: '0 auto 3rem auto'
        }}>
          {/* Search Bar */}
          <div style={{flex: '1', maxWidth: '20rem', minWidth: '16rem'}}>
            <input
              type="text"
              placeholder="Search posts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: '1rem',
                fontFamily: 'var(--font-cormorant)',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => (e.target as HTMLInputElement).style.borderColor = '#8FBC8F'}
              onBlur={(e) => (e.target as HTMLInputElement).style.borderColor = '#d1d5db'}
            />
          </div>

          {/* Sort Dropdown */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            minWidth: '12rem'
          }}>
            <label style={{
              fontSize: '0.75rem',
              fontFamily: 'var(--font-league-spartan)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: '#6b7280',
              whiteSpace: 'nowrap'
            }}>
              Sort By
            </label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as "newest" | "oldest")}
              style={{
                padding: '0.75rem 1rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                fontFamily: 'var(--font-league-spartan)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                backgroundColor: 'white',
                outline: 'none',
                cursor: 'pointer',
                minWidth: '8rem'
              }}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>


        {/* Loading indicator */}
        {isLoading && (
          <div style={{
            textAlign: 'center',
            padding: '1rem',
            color: '#6b7280',
            fontFamily: 'var(--font-cormorant)',
            fontSize: '0.875rem'
          }}>
            Loading posts...
          </div>
        )}


        {/* Error indicator for Firestore issues */}
        {firestoreError && (
          <div style={{
            textAlign: 'center',
            padding: '1rem',
            color: '#dc2626',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '0.375rem',
            margin: '1rem 0',
            fontFamily: 'var(--font-cormorant)',
            fontSize: '0.875rem'
          }}>
            Unable to load posts: {firestoreError}
          </div>
        )}

        {/* Blog Posts */}
        <div style={{textAlign: 'left'}}>
          {filteredAndSortedPosts.length === 0 && !isLoading ? (
            <div style={{
              textAlign: 'center',
              padding: '3rem',
              color: '#6b7280',
              fontFamily: 'var(--font-cormorant)',
              fontSize: '1.125rem'
            }}>
              No posts found matching your search.
            </div>
          ) : (
            displayedPosts.map((post) => (
              <article key={post.id} style={{
                borderBottom: '1px solid #f3f4f6',
                paddingBottom: '3rem',
                marginBottom: '3rem'
              }}>
                <h2 style={{
                  fontSize: '2rem',
                  fontFamily: 'var(--font-sorts-mill)',
                  color: '#374151',
                  marginBottom: '1rem',
                  fontWeight: '600',
                  lineHeight: '1.2'
                }}>
                  <a href={`/posts/${post.slug}/`} style={{
                    color: '#374151',
                    textDecoration: 'none',
                    transition: 'color 0.2s'
                  }}
                  onMouseEnter={(e) => (e.target as HTMLAnchorElement).style.color = '#8FBC8F'}
                  onMouseLeave={(e) => (e.target as HTMLAnchorElement).style.color = '#374151'}
                  >
                    {post.title}
                  </a>
                </h2>

                <div style={{
                  fontSize: '0.875rem',
                  fontFamily: 'var(--font-league-spartan)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: '#9ca3af',
                  marginBottom: '1.5rem'
                }}>
                  {formatDate(post.date)}
                </div>

                <p style={{
                  fontFamily: 'var(--font-cormorant)',
                  fontSize: '1.125rem',
                  lineHeight: '1.75',
                  color: '#4b5563',
                  marginBottom: '1.5rem'
                }}>
                  {post.excerpt}
                </p>

                <a href={`/posts/${post.slug}/`} style={{
                  fontSize: '0.875rem',
                  fontFamily: 'var(--font-league-spartan)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: '#8FBC8F',
                  textDecoration: 'none',
                  fontWeight: '500',
                  transition: 'color 0.2s'
                }}
                onMouseEnter={(e) => (e.target as HTMLAnchorElement).style.color = '#6b7280'}
                onMouseLeave={(e) => (e.target as HTMLAnchorElement).style.color = '#8FBC8F'}
                >
                  Continue Reading →
                </a>
              </article>
            ))
          )}
        </div>

        {/* Results Info and Pagination */}
        {filteredAndSortedPosts.length > 0 && (
          <div style={{
            textAlign: 'center',
            marginTop: '3rem',
            paddingTop: '2rem',
            borderTop: '1px solid #f3f4f6'
          }}>
            <div style={{
              color: '#6b7280',
              fontFamily: 'var(--font-league-spartan)',
              fontSize: '0.875rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '1rem'
            }}>
              Showing {displayedPosts.length} of {filteredAndSortedPosts.length} {filteredAndSortedPosts.length === 1 ? 'Post' : 'Posts'}
            </div>
            
            {filteredAndSortedPosts.length > postsToShow && (
              <button
                onClick={() => setPostsToShow(prev => prev + 10)}
                style={{
                  backgroundColor: '#8FBC8F',
                  color: 'white',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.375rem',
                  border: 'none',
                  fontFamily: 'var(--font-league-spartan)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  fontWeight: '600',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#7da87d'}
                onMouseLeave={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#8FBC8F'}
              >
                Load More Posts
              </button>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid #f3f4f6',
        padding: '4rem 0',
        marginTop: '4rem'
      }}>
        <div style={{
          maxWidth: '48rem',
          margin: '0 auto',
          padding: '0 1.5rem',
          textAlign: 'center'
        }}>
          <p style={{
            fontSize: '0.75rem',
            fontFamily: 'var(--font-league-spartan)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: '#9ca3af'
          }}>
            © 2024 Saintfest · A celebration of saints through community
          </p>
        </div>
      </footer>
    </div>
  );
}