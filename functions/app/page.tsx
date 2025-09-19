'use client';

import Link from "next/link";
import Image from "next/image";
import CountdownTimer from "@/components/CountdownTimer";
import CallToAction from "@/components/CallToAction";
import Navigation from "@/components/Navigation";

export default function Home() {
  return (
    <div className="min-h-screen text-center" style={{backgroundColor: '#fffbeb'}}>
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
      <main className="max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-12 text-center">
        {/* Countdown Section */}
        <div className="mb-8 md:mb-16">
          <CountdownTimer />
        </div>

        {/* Call to Action Section */}
        <div className="mb-8 md:mb-16">
          <CallToAction />
        </div>

        {/* 2025 Blessed Intercessor Winner */}
        <section className="text-center mb-20">
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-8 max-w-2xl mx-auto">
            <div className="mb-6">
              <div style={{
                position: 'relative',
                background: 'linear-gradient(to right, transparent, #eab308, transparent)',
                color: '#d97706',
                fontSize: '4rem',
                fontFamily: 'var(--font-cormorant)',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                fontWeight: '900',
                padding: '1.5rem 3rem',
                marginBottom: '1.5rem',
                overflow: 'hidden',
                textAlign: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <div style={{
                  position: 'absolute',
                  inset: '0',
                  background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.2), transparent)',
                  animation: 'pulse 2s infinite'
                }}></div>
                <div style={{ position: 'relative', zIndex: 10 }}>
                  <div style={{
                    borderBottom: '4px solid rgba(217, 119, 6, 0.5)',
                    paddingBottom: '0.5rem',
                    marginBottom: '0.5rem',
                    fontSize: '5rem'
                  }}>
                    2025
                  </div>
                  <div style={{
                    fontSize: '2.5rem',
                    letterSpacing: '0.05em'
                  }}>
                    Blessed Intercessor
                  </div>
                </div>
              </div>
              <h2 style={{
                fontSize: '3.5rem',
                fontFamily: 'var(--font-sorts-mill)',
                color: '#111827',
                margin: '2rem 0',
                fontWeight: '600',
                lineHeight: '1.1',
                textAlign: 'center'
              }}>
                St. Augustine of Hippo
              </h2>
            </div>
          </div>
        </section>
      </main>

      {/* St. Augustine Image Banner - Full Width */}
      <div style={{ 
        width: '100%',
        marginBottom: '5rem'
      }}>
        <Image 
          src="/images/winners/Saint_Augustine.jpg"
          alt="St. Augustine of Hippo"
          width={1200}
          height={600}
          className="saint-augustine-image"
          style={{
            width: '100%',
            height: '600px',
            objectFit: 'cover',
            objectPosition: 'center 15%',
            borderTop: '1px solid #e5e7eb',
            borderBottom: '1px solid #e5e7eb',
            display: 'block'
          }}
          priority
        />
      </div>

      <main className="max-w-4xl mx-auto px-4 md:px-6 pb-6 md:pb-12 text-center">
        <section className="text-center mb-20">
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-8" style={{maxWidth: '54rem', margin: '0 auto'}}>
            <blockquote style={{
              fontSize: '3rem',
              fontStyle: 'italic',
              color: '#374151',
              fontFamily: 'var(--font-cormorant)',
              lineHeight: '1.5',
              textAlign: 'center',
              margin: '0',
              padding: '0'
            }}>
              "You have made us for Yourself, O Lord, and our hearts are restless until they rest in You."
            </blockquote>
          </div>
        </section>


        {/* Latest Posts Section */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="font-sorts-mill text-gray-900 mb-4" style={{fontSize: '4rem', textAlign: 'center'}}>
              Latest Within Saintfest
            </h2>
            <div className="w-24 h-px bg-gray-300 mx-auto"></div>
          </div>
          
          <div className="space-y-20 max-w-2xl mx-auto">
            {/* Post 1 */}
            <article className="border-b border-gray-100 pb-16 text-center">
              <div className="mb-4" style={{textAlign: 'center'}}>
                <h3 className="text-2xl font-sorts-mill text-gray-900 leading-tight" style={{marginBottom: '0.25rem'}}>
                  O Beauty Ever Ancient, Ever New.
                </h3>
                <span className="font-league-spartan uppercase tracking-wide text-gray-500 text-sm" style={{display: 'block'}}>May 28, 2025</span>
              </div>
              <p className="text-gray-600 mb-4 leading-relaxed font-cormorant text-lg" style={{textAlign: 'center'}}>
                Ours is not to see the future. Only to walk through the present. As 2024 came to a close and the new Liturgical Year began, none of us imagined the extent of the future's upheaval.
              </p>
              <Link href="/posts/o-beauty-ever-ancient-ever-new" className="text-gray-700 hover:text-gray-900 font-league-spartan uppercase tracking-wide hover:underline transition-all text-sm" style={{textAlign: 'center', display: 'block', marginBottom: '4rem'}}>
                Continue Reading →
              </Link>
            </article>

            {/* Post 2 */}
            <article className="border-b border-gray-100 pb-16 text-center">
              <div className="mb-4" style={{textAlign: 'center'}}>
                <h3 className="text-2xl font-sorts-mill text-gray-900 leading-tight" style={{marginBottom: '0.25rem'}}>
                  Help Wanted: Blessed Intercessor
                </h3>
                <span className="font-league-spartan uppercase tracking-wide text-gray-500 text-sm" style={{display: 'block'}}>April 23, 2025</span>
              </div>
              <p className="text-gray-600 mb-4 leading-relaxed font-cormorant text-lg" style={{textAlign: 'center'}}>
                What is a 'Blessed Intercessor'? And what is the point of playing Saintfest? Good questions. The prize awaiting the saint who wins this contest is the title of Blessed Intercessor.
              </p>
              <Link href="/posts/help-wanted-blessed-intercessor" className="text-gray-700 hover:text-gray-900 font-league-spartan uppercase tracking-wide hover:underline transition-all text-sm" style={{textAlign: 'center', display: 'block', marginBottom: '4rem'}}>
                Continue Reading →
              </Link>
            </article>

            {/* Post 3 */}
            <article className="border-b border-gray-100 pb-16 text-center">
              <div className="mb-4" style={{textAlign: 'center'}}>
                <h3 className="text-2xl font-sorts-mill text-gray-900 leading-tight" style={{marginBottom: '0.25rem'}}>
                  Casting Lots
                </h3>
                <span className="font-league-spartan uppercase tracking-wide text-gray-500 text-sm" style={{display: 'block'}}>April 7, 2025</span>
              </div>
              <p className="text-gray-600 mb-4 leading-relaxed font-cormorant text-lg" style={{textAlign: 'center'}}>
                Boldly, St. Peter claims he will never leave the side of Jesus even at the threat of death. Cowardly, St. Peter follows Jesus from afar on the eve of His Passion.
              </p>
              <Link href="/posts/casting-lots" className="text-gray-700 hover:text-gray-900 font-league-spartan uppercase tracking-wide hover:underline transition-all text-sm" style={{textAlign: 'center', display: 'block', marginBottom: '4rem'}}>
                Continue Reading →
              </Link>
            </article>

            {/* Post 4 */}
            <article className="border-b border-gray-100 pb-16 text-center">
              <div className="mb-4" style={{textAlign: 'center'}}>
                <h3 className="text-2xl font-sorts-mill text-gray-900 leading-tight" style={{marginBottom: '0.25rem'}}>
                  In the Midst and Beyond
                </h3>
                <span className="font-league-spartan uppercase tracking-wide text-gray-500 text-sm" style={{display: 'block'}}>February 2, 2025</span>
              </div>
              <p className="text-gray-600 mb-4 leading-relaxed font-cormorant text-lg" style={{textAlign: 'center'}}>
                This game we enjoy, Saintfest, gets more fun with more and more participation from you and others.
              </p>
              <Link href="/posts/in-the-midst-and-beyond" className="text-gray-700 hover:text-gray-900 font-league-spartan uppercase tracking-wide hover:underline transition-all text-sm" style={{textAlign: 'center', display: 'block', marginBottom: '4rem'}}>
                Continue Reading →
              </Link>
            </article>

            {/* Post 5 */}
            <article className="pb-16 text-center">
              <div className="mb-4" style={{textAlign: 'center'}}>
                <h3 className="text-2xl font-sorts-mill text-gray-900 leading-tight" style={{marginBottom: '0.25rem'}}>
                  Can the Blessed Mother ever compete?
                </h3>
                <span className="font-league-spartan uppercase tracking-wide text-gray-500 text-sm" style={{display: 'block'}}>January 24, 2025</span>
              </div>
              <p className="text-gray-600 mb-4 leading-relaxed font-cormorant text-lg" style={{textAlign: 'center'}}>
                One of the first decisions that had to be made when forming the structure around the game of Saintfest was, of course: 'Can Mom play, too?'
              </p>
              <Link href="/posts/can-the-blessed-mother-ever-compete" className="text-gray-700 hover:text-gray-900 font-league-spartan uppercase tracking-wide hover:underline transition-all text-sm" style={{textAlign: 'center', display: 'block'}}>
                Continue Reading →
              </Link>
            </article>
          </div>
        </section>


      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 md:py-16">
        <div className="max-w-3xl mx-auto px-4 md:px-6 text-center">
          <blockquote className="italic text-gray-600 font-cormorant leading-relaxed mb-4 md:mb-6 max-w-4xl mx-auto" style={{fontSize: '3rem', textAlign: 'center'}}>
            "Therefore, since we are surrounded by so great a cloud of witnesses, let us rid ourselves of every burden and sin that clings to us and persevere in running the race that lies before us while keeping our eyes fixed on Jesus, the leader and perfecter of faith."
          </blockquote>
          <p className="text-gray-400 font-cormorant uppercase tracking-wider mb-6 md:mb-8" style={{fontSize: '2rem', textAlign: 'center'}}>
            Hebrews 12:1-2
          </p>
          <div className="w-16 md:w-24 h-px bg-gray-200 mx-auto mb-6 md:mb-8"></div>
          <p className="text-xs md:text-sm text-gray-400 font-league-spartan uppercase tracking-wide">
            © 2025 Saintfest · A celebration of saints through community
          </p>
        </div>
      </footer>
    </div>
  );
}