'use client';

import Link from "next/link";
import Navigation from "@/components/Navigation";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useState, useEffect } from 'react';
import { BlogPost, BlogPost as BlogPostType } from '@/types';
import { assertFirestore } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import CommentInput from '@/components/posts/CommentInput';
import CommentsSection from '@/components/posts/CommentsSection';

interface PostClientProps {
  slug: string;
}

export default function PostClient({ slug }: PostClientProps) {
  const [post, setPost] = useState<BlogPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDynamicPost = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const db = assertFirestore();
        const postsQuery = query(
          collection(db, 'posts'),
          where('slug', '==', slug),
          where('status', '==', 'published')
        );

        const snapshot = await getDocs(postsQuery);

        if (!snapshot.empty) {
          const doc = snapshot.docs[0];
          const data = doc.data() as BlogPostType;

          // Convert Firestore post to BlogPost format
          const dynamicPost: BlogPost = {
            id: doc.id,
            title: data.title,
            date: data.createdAt ? (data.createdAt instanceof Date ? data.createdAt.toISOString() : new Date((data.createdAt as any).toDate()).toISOString()) : new Date().toISOString(),
            excerpt: data.excerpt || data.content.substring(0, 200) + (data.content.length > 200 ? '...' : ''),
            content: data.content,
            slug: data.slug || doc.id,
            votingPost: data.votingPost || false,
            votingWidgets: data.votingWidgets || [],
            multipleVoting: data.multipleVoting || false
          };

          setPost(dynamicPost);
        } else {
          setError('Post not found');
        }
      } catch (firestoreError) {
        console.error('Error fetching post:', firestoreError);
        setError('Failed to load post from database');
      } finally {
        setIsLoading(false);
      }
    };

    loadDynamicPost();
  }, [slug]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Function to format text with basic markdown-style formatting
  const formatTextContent = (text: string) => {
    return text
      // Bold text: **text** -> <strong>text</strong>
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Italic text: *text* -> <em>text</em>
      .replace(/(?<!\*)\*(?!\*)([^*]+?)\*(?!\*)/g, '<em>$1</em>')
      // Underlined text: _text_ -> <u>text</u>
      .replace(/_(.*?)_/g, '<u>$1</u>');
  };

  // Loading state
  if (isLoading) {
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
            <Navigation />
          </div>
        </header>

        <main style={{maxWidth: '48rem', margin: '0 auto', padding: '3rem 1.5rem', textAlign: 'center'}}>
          <div style={{
            fontSize: '1.125rem',
            color: '#6b7280',
            fontFamily: 'var(--font-cormorant)'
          }}>
            Loading post...
          </div>
        </main>
      </div>
    );
  }

  // Error state or post not found
  if (error || !post) {
    return (
      <div style={{minHeight: '100vh', backgroundColor: '#fffbeb', textAlign: 'center'}}>
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
            <Navigation />
          </div>
        </header>

        <main style={{maxWidth: '48rem', margin: '0 auto', padding: '3rem 1.5rem', textAlign: 'center'}}>
          <h1 style={{
            fontSize: '2rem',
            fontFamily: 'var(--font-sorts-mill)',
            color: '#374151',
            marginBottom: '1rem'
          }}>
            Post Not Found
          </h1>
          <p style={{
            fontSize: '1.125rem',
            color: '#6b7280',
            fontFamily: 'var(--font-cormorant)',
            marginBottom: '2rem'
          }}>
            {error || 'The post you are looking for could not be found.'}
          </p>
          <a href="/posts/" style={{
            fontSize: '0.875rem',
            fontFamily: 'var(--font-league-spartan)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: '#8FBC8F',
            textDecoration: 'none',
            fontWeight: '500'
          }}>
            ← Back to All Posts
          </a>
        </main>
      </div>
    );
  }

  // Successful post display
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
        {/* Back Link */}
        <div style={{textAlign: 'left', marginBottom: '2rem'}}>
          <a href="/posts/" style={{
            fontSize: '0.875rem',
            fontFamily: 'var(--font-league-spartan)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: '#8FBC8F',
            textDecoration: 'none',
            fontWeight: '500',
            transition: 'color 0.2s'
          }}>
            ← Back to Posts
          </a>
        </div>

        {/* Post Header */}
        <article style={{textAlign: 'left'}}>
          <header style={{marginBottom: '3rem'}}>
            <h1 style={{
              fontSize: '3rem',
              fontFamily: 'var(--font-sorts-mill)',
              color: '#374151',
              marginBottom: '1rem',
              fontWeight: '600',
              lineHeight: '1.2'
            }}>
              {post.title}
            </h1>

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

            <div style={{
              width: '6rem',
              height: '1px',
              backgroundColor: '#d1d5db'
            }}></div>
          </header>

          {/* Post Content */}
          <div style={{
            fontFamily: 'var(--font-cormorant)',
            fontSize: '1.25rem',
            lineHeight: '1.8',
            color: '#374151',
            marginBottom: '3rem'
          }}>
            {/* Check if content looks like Markdown (contains # or **) */}
            {post.content.includes('#') || post.content.includes('**') || post.content.includes('*') ? (
              <div className="prose prose-lg prose-green max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                >
                  {post.content}
                </ReactMarkdown>
              </div>
            ) : (
              /* Legacy plain text content with basic formatting */
              post.content.split('\n').map((paragraph, index) => (
                <p
                  key={index}
                  style={{marginBottom: '1.5rem'}}
                  dangerouslySetInnerHTML={{
                    __html: formatTextContent(paragraph)
                  }}
                />
              ))
            )}
          </div>

          {/* Voting Widgets - Auto-inserted after content */}
          {post.votingPost && post.votingWidgets && post.votingWidgets.length > 0 && (
            <div style={{ marginBottom: '3rem' }}>
              <div style={{
                padding: '1.5rem',
                border: '2px solid #cbd5e0',
                borderRadius: '0.5rem',
                backgroundColor: 'white',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                maxWidth: '500px',
                margin: '0 auto',
                textAlign: 'center'
              }}>
                <h3 style={{
                  fontSize: '1.25rem',
                  fontFamily: 'var(--font-sorts-mill)',
                  color: '#374151',
                  marginBottom: '1rem',
                  fontWeight: '600'
                }}>
                  Saint Voting
                </h3>
                <p style={{
                  fontSize: '0.875rem',
                  color: '#6b7280',
                  fontFamily: 'var(--font-league-spartan)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '1.5rem'
                }}>
                  Post with interactive voting
                </p>
                <div style={{
                  padding: '1rem',
                  backgroundColor: '#f3f4f6',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  color: '#4b5563'
                }}>
                  <strong>{post.votingWidgets[0]?.saint1Name}</strong> vs <strong>{post.votingWidgets[0]?.saint2Name}</strong>
                </div>
              </div>
            </div>
          )}

          {/* Comment Input Section */}
          <CommentInput
            placeholder="Share your thoughts about this post..."
            postSlug={post.slug}
          />

          {/* Comments Section */}
          <CommentsSection postSlug={post.slug} />

          {/* Navigation */}
          <footer style={{
            borderTop: '1px solid #f3f4f6',
            paddingTop: '2rem',
            marginTop: '3rem'
          }}>
            <a href="/posts/" style={{
              fontSize: '0.875rem',
              fontFamily: 'var(--font-league-spartan)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: '#8FBC8F',
              textDecoration: 'none',
              fontWeight: '500',
              transition: 'color 0.2s'
            }}>
              ← Back to All Posts
            </a>
          </footer>
        </article>
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