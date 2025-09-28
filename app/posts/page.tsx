'use client';

import Link from "next/link";
import { useState, useMemo, useEffect } from "react";
import { BlogPost as BlogPostType } from "@/types";
import Navigation from "@/components/Navigation";
import { assertFirestore } from "@/lib/firebase";
import { collection, query, where, orderBy, onSnapshot, QueryDocumentSnapshot } from "firebase/firestore";

interface BlogPost {
  id: string;
  title: string;
  date: string;
  excerpt: string;
  content: string;
  slug: string;
}

// Complete blog posts data from WordPress
const blogPosts: BlogPost[] = [
  {
    id: "1",
    title: "O Beauty Ever Ancient, Ever New.",
    date: "2025-05-28",
    excerpt: "Ours is not to see the future. Only to walk through the present. As 2024 came to a close and the new Liturgical Year began, none of us imagined the extent of the future's upheaval.",
    content: `Ours is not to see the future. Only to walk through the present.

As 2024 came to a close and the new Liturgical Year began, none of us imagined the extent of the future's upheaval. With continued conflicts in Eastern Europe, instability in Taiwan, renewed strife surrounding Jerusalem, the death of Pope Francis in April of 2025 and then followed by the rapid election of Pope Leo XIV—our Church, our world, and our personal lives have all been marked by uncertainty.

Here in the United States, inflation, tariffs, the housing market, and the broader economy do not cease to keep us on edge. Small towns are experiencing an anxiety that's hard to define but easy to feel. The global economy, once confidently humming along, now seems to move on a tightrope, where the smallest tremor can ripple into real distress for families and communities.

Starkly contrasted, it has been reported that after the election of Pope Leo, the phrase "How to become catholic" saw over a 300% rise in search engine results. Common sense prevailed as the United States officially recognized two sexes: male and female, and there are efforts to spark a Eucharistic Revival to acknowledge, to acclaim, to deliberately live out the fact the our Lord is here with us in the Holy Eucharist.

You didn't plan for any of this. And neither did I. Yet—here we are. Still living, still praying, still trying to walk through the plans God has made for our good, for our sanctification. Still believing, even if only with a mustard seed of faith.

Is this grit? Is it providence? Maybe it's the combination: intercession.

Saintfest has given us a specific individual in the heavenly court to turn to during this particular year for extra graces: St. Augustine.

Augustine, who once wandered so far from the Church, knows what it means to live through confusion and upheaval. He lived in a collapsing empire. He watched the world around him shift and fall. And yet in that chaos, his soul was awakened by grace. The voice of God reached him not through stability, but through restlessness. He found the Lover whom all of our hearts ache for`,
    slug: "o-beauty-ever-ancient-ever-new"
  },
  {
    id: "2",
    title: "Help Wanted: Blessed Intercessor",
    date: "2025-04-23",
    excerpt: "What is a 'Blessed Intercessor'? And what is the point of playing Saintfest? Good questions. The prize awaiting the saint who wins this contest is the title of Blessed Intercessor.",
    content: `What is a 'Blessed Intercessor'? And what is the point of playing Saintfest?

Good questions. The prize awaiting the saint who wins this contest is the title of Blessed Intercessor. While this is a small, meager crown and title offered to a saint, the blessed in heaven love to pray and intercede for us pilgrims here in Earth. The prayer of our game is the God would graciously invest a soul in heaven with special prayers for all that we may encounter in the new year. A saint we recall and turn to repeatedly as life flows by and brings us expected and unexpected twists and turns.

St. Thérèse of Lisieux was made famous for loving her death not out of a longing for her suffering to end, but instead out of a joyful hope that once she was in heaven she would be able to do far more good for those still living. Whether God truly fashions a crown, truly gives graces because of this game, is beside the point. Learning so much about a saint's life, praying with them for a time, and having them to turn to throughout a year is the blessing both of them and of us from God Who gives us to each other for support and care. Saintfest assists in highlighting all these truths and adds some fun in along the way.

The post describes Saintfest as a game where participants learn about saints and choose a "Blessed Intercessor" who will pray for them throughout the year. The key point is not winning a literal crown, but developing a spiritual connection with a saint and learning about their life and faith.`,
    slug: "help-wanted-blessed-intercessor"
  },
  {
    id: "3",
    title: "Casting Lots",
    date: "2025-04-07",
    excerpt: "Boldly, St. Peter claims he will never leave the side of Jesus even at the threat of death. Cowardly, St. Peter follows Jesus from afar on the eve of His Passion.",
    content: `Boldly, St. Peter claims he will never leave the side of Jesus even at the threat of death. Cowardly, St. Peter follows Jesus from afar on the eve of His Passion. Dejectedly, St. Peter returns to his fishing business after Jesus is placed in the tomb. Encouraged, St. Peter witnesses St. Thomas' hands go into the side of Christ. Devotedly, St. Peter awaits the descent of the Holy Ghost at Pentecost.

Strikingly, one of the very next acts after all these events is for St. Peter to throw reason to wind and cast lots for the replacement of Judas; a replacement that he himself discerned. "'So one of the men who have accompanied us during all the time that the Lord Jesus went in and out among us, beginning from the baptism of John until the day when he was taken up from us – one of these men must become with us a witness to his resurrection.' And they put forward two, Joseph called Barsab'bas, who was surnamed Justus, and Matthi'as. And they prayed and said, "Lord, you know the hearts of all men, show which one of these two you have chosen to take the place in this ministry and apostleship from which Judas turned aside, to go to his own place." And they cast lots for them, and the lot fell on Matthi'as; and he was enrolled with the eleven apostles." (Ac 1 : 21-28, RVS)

To me, it is paradoxical to consider that St. Peter both held the Keys to exercise his vested authority here on Earth and also would make one his early decisions by the chance of dice. However, this serves as a mirror which aligns with so many experiences as we move through life. Many times, what has seemed like chance has shaped the fortunes of our lives; a fullness of chance, meaning those events that we benefitted from as well as those events that seem to have brought a seemed of ruin, of pruning, of preparation for something else.

Some among us see gambling and chance as _malum en se_, wrong in and of itself, and all the time evil to be avoided. The Church cannot make such a`,
    slug: "casting-lots"
  },
  {
    id: "4",
    title: "In the Midst and Beyond",
    date: "2025-02-02",
    excerpt: "This game we enjoy, Saintfest, gets more fun with more and more participation from you and others.",
    content: `This game we enjoy, Saintfest, gets more fun with more and more participation from you and others. Actually, I'm going through the practice of plucking up the courage to ask for promotion for our contest around the catholic media corner of the internet. And this morning, God's Providence blessed me with some inspiration by coming across an excellent video from Amber Rose, The Religious Hippie, livestream and posted to YouTube touching on the topic of choosing a patron saint. The link is down below. Please check it out, and feel free to head over to her social media if you'd like to hear more.

In the midst of the video, I enjoyed the practical methods of getting to know saints better with some guiding theology sprinkled on top. God's inspiration connected her topic to the vision beyond Saintfest for me: Saintfest is a gateway to enjoyment of the vast number of saints of the Church. It is a meet-and-greet to relish in the magnanimous, in the strong, and, perhaps more importantly, in the lesser-known saints. It is my prayer that all of this playful exploration leads to both us, here in the Church Militant, loving the saints more earnestly, more trusty, but also them, in the Church Triumphant, having more concrete opportunities to seek our friendship. As Amber notes, St. Thérèse of Lisieux, will involve roses (their placement in our paths, their scents, their petals, etc.) as she is seeking a holy friendship with us. All of the saints have lived real lives here on Earth, and they are patrons because they intimately know the details of struggling and of overcoming. They are given to us as a way to demonstrate that we are not dealing with things no one has ever dealt with before, and as a demonstration of God's detailed awareness of our lives: He connects us with people have gone through the same experiences.

To summarize some ideas from her video (below), you could start just asking for more intercession each day from a new saint. Or if there is a saint who has some life experience that inspires or calls to you, perhaps you could pray a novena to them. Many graces, even unperceived, come from this practice.`,
    slug: "in-the-midst-and-beyond"
  },
  {
    id: "5",
    title: "Can the Blessed Mother ever compete?",
    date: "2025-01-24",
    excerpt: "One of the first decisions that had to be made when forming the structure around the game of Saintfest was, of course: 'Can Mom play, too?'",
    content: `One of the first decisions that had to be made when forming the structure around the game of Saintfest was, of course: "Can Mom play, too?"

Any faithful son of God the Father has taken Mary as his mother, handed gently to us all from Christ Himself on the Holy Cross. It is completely natural to take her hand and request that she join in the festivities. However, as a game-maker, as a judge, as an umpire, it is patently clear that it would be unfair for any saint to square off against the Mother of God. This is all under the light of fanciful fun; no one truly believes the saints actually compete for achievable glory in heaven like a currency. But, in this game geared toward glorifying the God who has deified so many, the truth of Mary's identity is still in play.

The Blessed Virgin Mary has been bestowed by God with many titles through the Church's two millennium journey. These are rewards for the humble, hidden life she virtuously led here on Earth. The Immaculate Conception, Help of All Christians, Star of the Sea, Seat of Wisdom, Undoer of Knots. The title I wish to magnify presently is that of Queen of Heaven. Just as maestros do not pick up a violin to join the orchestra, just as generals do not fight with feet upon the battlefield, and just as the emperors of Rome never competed themselves in the colosseum, our Lady is heralded and graciously seated to oversee our game as its patroness. From her throne, flanked by the throne of her earthly husband, St. Joseph, her virtues and her graces outshine all the myriad merit of those whom she looks upon. It would be, therefore, wholly unfair to have anyone in this community compare a saint to the Blessed Mother. Being the highest of all Creation, elevated and placed there by God's divine will, we, her children, are freer to frolic and play this silly game of saints under the comforting shade of her mantle.

For all games of Saintfest, Mary, we beseech your motherly intercession.

Blessed Mother, Queen of Heaven, pray for us.`,
    slug: "can-the-blessed-mother-ever-compete"
  },
  {
    id: "6",
    title: "Who makes the cut for Saintfest?",
    date: "2025-01-24",
    excerpt: "The Church recognizes at least hundreds, if not over a thousand, saints along her two millennium journey, and they all participate in the immense diversity of mankind and celebrate their glorious humanity.",
    content: `The Church recognizes at least hundreds, if not over a thousand, saints along her two millennium journey, and they all participate in the immense diversity of mankind and celebrate their glorious humanity. Out of all this beautiful individuality, some patterns do emerge like martyrs who would choose to lose their material life in exchange for immortal life; or missionaries who struck out into the vast unknown in search of the 'one lost sheep' over whose repentance there is manic joy in heaven. Each story is unique in its details, but communally binding over the centuries, yet only a handful can be selected for Saintfest.

While the formation of the Saintfest Bracket takes place during the height of summer each year (check out the countdown on the home page!), I wouldn't mind a little help and intercession to sketch it out as we move through the Liturgical Year. You could head over to the About page to learn of the inspiration for this site, but I expect that keeping this effort engaging and interesting will take more creativity that I've been gifted. In the mean time, there is a poll below to collect your thoughts and especially find more saints to add to the draft pool.

Also, check out these other posts for some considerations that I use for every bracket such as ["Can the Blessed Mother ever compete?"](https://saintfest.wordpress.com/wp-admin/post.php?post=115&action=edit) or ["What category do the Apostles fall into?"](https://saintfest.wordpress.com/wp-admin/post.php?post=117&action=edit).`,
    slug: "who-makes-the-cut-for-saintfest"
  },
  {
    id: "7",
    title: "All Saints Day 2024",
    date: "2024-12-23",
    excerpt: "What a spectacular Saintfest! In the final moments of our reverie, the contest between St. Andrew and St. Augustine was locked completely up.",
    content: "What a spectacular Saintfest! In the final moments of our reverie, the contest between St. Andrew and St. Augustine was locked completely up. This post celebrates the conclusion of Saintfest 2024, reflecting on the incredible journey through the brackets and the final championship between these two great saints. The competition showcased the diverse ways saints have served God and inspired the faithful throughout history.",
    slug: "all-saints-day-2024"
  },
  {
    id: "8",
    title: "October 31",
    date: "2024-12-23",
    excerpt: "Against the Patron of France, it took anything and everything St. Augustine had. However, the honorable St. Jeanne d'Arc concedes the battle.",
    content: "Against the Patron of France, it took anything and everything St. Augustine had. However, the honorable St. Jeanne d'Arc concedes the battle. This post covers the intense semifinal match between St. Augustine and St. Joan of Arc, highlighting the unique gifts and spiritual legacy of both saints as they competed for a place in the final championship round.",
    slug: "october-31"
  },
  {
    id: "9",
    title: "October 30",
    date: "2024-12-23",
    excerpt: "St. Andrew has secured his entry into our final contest! And man, what a name, what a patron.",
    content: "St. Andrew has secured his entry into our final contest! And man, what a name, what a patron. This post celebrates St. Andrew's advancement to the Saintfest 2024 finals, exploring his role as the first-called apostle and his continued patronage of Scotland and many other devotions worldwide.",
    slug: "october-30"
  },
  {
    id: "10",
    title: "October 29",
    date: "2024-12-23",
    excerpt: "St. Theodora admits that Jeanne d'Arc deserves the win when the voters happen to all be Cajun.",
    content: "St. Theodora admits that Jeanne d'Arc deserves the win when the voters happen to all be Cajun. This post covers the matchup between St. Theodora and St. Joan of Arc, with a humorous note about regional devotions and how cultural connections can influence spiritual preferences in the Saintfest voting.",
    slug: "october-29"
  },
  {
    id: "11",
    title: "October 28",
    date: "2024-12-23",
    excerpt: "The Apostles, just like in the First Century, are unstoppable! St. James takes his seat within the Consecrated Quaternary.",
    content: "The Apostles, just like in the First Century, are unstoppable! St. James takes his seat within the Consecrated Quaternary. This post highlights St. James the Greater's advancement in the tournament, reflecting on the enduring power and influence of the original twelve apostles in the life of the Church.",
    slug: "october-28"
  },
  {
    id: "12",
    title: "October 27",
    date: "2024-12-23",
    excerpt: "The humble mendicant bows to the hierarchy of Holy Mother Church. St. Andrew proceeds!",
    content: "The humble mendicant bows to the hierarchy of Holy Mother Church. St. Andrew proceeds! This post covers St. Andrew's victory over a mendicant saint, exploring themes of Church hierarchy, apostolic authority, and the different paths to sainthood represented in the tournament.",
    slug: "october-27"
  },
  {
    id: "13",
    title: "October 26",
    date: "2024-12-23",
    excerpt: "While the victory is handed to St. Augustine, we all know that the heights of the glory he enjoys stand upon the shoulders of the giants before him.",
    content: "While the victory is handed to St. Augustine, we all know that the heights of the glory he enjoys stand upon the shoulders of the giants before him. This post reflects on St. Augustine's advancement while honoring the contributions of earlier Church Fathers and saints who laid the foundation for his theological insights.",
    slug: "october-26"
  },
  {
    id: "14",
    title: "October 25 – Honored Octonary",
    date: "2024-12-23",
    excerpt: "St. Jeanne d'Arc plants her banner in the name of the King and Queen of Heaven and, just like that, we have our Honored Octonary!!",
    content: "St. Jeanne d'Arc plants her banner in the name of the King and Queen of Heaven and, just like that, we have our Honored Octonary!! This post celebrates the completion of the Elite Eight round, with St. Joan of Arc securing her place among the final eight saints competing for the title of Blessed Intercessor.",
    slug: "october-25-honored-octonary"
  },
  {
    id: "15",
    title: "October 24",
    date: "2024-12-23",
    excerpt: "God's Dog carries the torch of victory another step toward being our Blessed Intercessor!",
    content: "God's Dog carries the torch of victory another step toward being our Blessed Intercessor! This post likely refers to St. Dominic (often called 'Domini canis' or 'Dog of the Lord') advancing in the tournament, highlighting his role as founder of the Dominican Order and his dedication to preaching and combating heresy.",
    slug: "october-24"
  },
  {
    id: "16",
    title: "October 23",
    date: "2024-12-23",
    excerpt: "St. Ambrose leaves the Golden Tongue speechless and secures his spot in the Saintly Sixteen!",
    content: "St. Ambrose leaves the Golden Tongue speechless and secures his spot in the Saintly Sixteen! This post covers St. Ambrose's victory over St. John Chrysostom (the Golden Tongue), highlighting the matchup between two great Church Fathers known for their eloquence and pastoral leadership.",
    slug: "october-23"
  }
];

export default function PostsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [postsToShow, setPostsToShow] = useState(10);
  const [dynamicPosts, setDynamicPosts] = useState<BlogPost[]>([]);
  const [isLoadingDynamic, setIsLoadingDynamic] = useState(true);
  const [firestoreError, setFirestoreError] = useState<string | null>(null);

  // Fetch dynamic posts from Firestore
  useEffect(() => {
    try {
      const db = assertFirestore();

      if (!db) {
        setFirestoreError('Firebase not initialized');
        setIsLoadingDynamic(false);
        return;
      }

      const unsubscribers: (() => void)[] = [];

      // Query published posts from the posts collection
      const postsQuery = query(
        collection(db, 'posts'),
        where('status', '==', 'published'),
        orderBy('createdAt', 'desc')
      );

      let postsData: BlogPost[] = [];

      const checkLoadingComplete = () => {
        setDynamicPosts(postsData);
        setIsLoadingDynamic(false);
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
              date: data.createdAt ? new Date(data.createdAt.toDate()).toISOString() : new Date().toISOString(),
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
      setIsLoadingDynamic(false);
    }
  }, []);

  // Combine historical and dynamic posts
  const allPosts = useMemo(() => {
    return [...blogPosts, ...dynamicPosts];
  }, [dynamicPosts]);

  // Filter and sort posts
  const filteredAndSortedPosts = useMemo(() => {
    let filtered = allPosts;

    // Filter by search term
    if (searchTerm) {
      filtered = allPosts.filter(
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
  }, [searchTerm, sortOrder, allPosts]);

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


        {/* Loading indicator for dynamic posts */}
        {isLoadingDynamic && (
          <div style={{
            textAlign: 'center',
            padding: '1rem',
            color: '#6b7280',
            fontFamily: 'var(--font-cormorant)',
            fontSize: '0.875rem'
          }}>
            Loading latest posts...
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
            Unable to load latest posts: {firestoreError}
          </div>
        )}

        {/* Blog Posts */}
        <div style={{textAlign: 'left'}}>
          {filteredAndSortedPosts.length === 0 && !isLoadingDynamic ? (
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