'use client';

import Link from "next/link";
import Navigation from "@/components/Navigation";

export default function AboutPage() {
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
      <main style={{maxWidth: '48rem', margin: '0 auto', padding: '3rem 1.5rem', textAlign: 'left'}}>
        {/* Page Title */}
        <div style={{textAlign: 'center', marginBottom: '3rem'}}>
          <h1 style={{
            fontSize: '3rem',
            fontFamily: 'var(--font-sorts-mill)',
            color: '#374151',
            marginBottom: '1rem',
            fontWeight: '600'
          }}>
            About Saintfest
          </h1>
          <div style={{
            width: '6rem',
            height: '1px',
            backgroundColor: '#d1d5db',
            margin: '0 auto'
          }}></div>
        </div>

        {/* Content */}
        <div style={{
          fontFamily: 'var(--font-cormorant)',
          fontSize: '1.125rem',
          lineHeight: '1.75',
          color: '#4b5563',
          maxWidth: '42rem',
          margin: '0 auto',
          textAlign: 'left'
        }}>
          <p style={{marginBottom: '2rem'}}>
            During the Lenten season of 2018, I stumbled across a site whose premise is very similar to this one. I will leave that bread crumble trail to you if you want to search it out. However, I noticed the spirit of the world slowly creeping into the drafting pool of the &apos;saints&apos; that were selected each year. Eventually, I decided to try it out for myself with the foundation of elevating and highlighting only saints, venerable, and blesseds who garner devotees around the world.
          </p>

          <p style={{marginBottom: '2rem'}}>
            The Church teaches that were are always surrounded by a &quot;great cloud of witnesses.&quot; These witnesses have employed their bodies and souls toward the highest glorification of God and, therefore, encourage us through example to do the same. They actively invite us, personally, to live as they lived, and both beseech and offer aid when we don&apos;t quite measure up. These holy people are especially present with us in the right adoration and worship of the Almighty.
          </p>

          <p style={{marginBottom: '2rem'}}>
            Saintfest is an annual competition that participates in the anticipation of the autumn Triduum: All Hallows&apos; Eve, All Saints Day, and All Souls Day. It is wise that the Church has ordained these days which call to mind our individual ends to coincide with the ending of the Liturgical Year. Each saint, representing an honorable participation in the life of the Church (Martyrs, Missionaries, Lay, Bishops, Converts, Mystics, etc.), is pitting against another in a &apos;March-Madness&apos; style bracket. The daily winner is chosen by popular vote by those who may have a devotion to the saint, who may estimate that saint deserves to be better known, who consider that this saint gave higher glory to God. Whatever the details, the bracket whittles itself through the Saintly Sixteen, the Honored Octonary, and the Consecrated Quaternary. The competition heats up at the semi-finals and finally reaches two saints who have gathered the community to rally behind them. The first day of the Autumn Triduum, All Hallows&apos; Eve, October 31, is reserved to pray a litany to all the saints who have competed. In the context of the game, their intercession helps to wisely choose an intercessor for the upcoming year. More broadly, their intercession is a surge of grace into the lives of the Saintfest participants for all their needs. Finally, on the morning of All Saints Day, the Blessed Intercessor is announced, symbolically and digitally crowned, and asked to intercede for us and the world until the next Saintfest!
          </p>

          <p style={{marginBottom: '2rem'}}>
            This game is for all the faithful. The Church does not hide her jewels and gems which are the saints proclaimed to offer us heavenly aid. Please, spread this site and this game around. Our world is in desperate, awful need of this help. We will not see the renewal or correction of anything until we turn back to our God and humbly ask Him to fix it all for us. He with then request that we work alongside Him, but it will be His work and His doing. So, again, please scatter this site everywhere and enjoy not having to take life all that seriously!
          </p>
        </div>
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