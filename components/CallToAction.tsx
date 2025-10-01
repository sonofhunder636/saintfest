'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface CallToActionState {
  type: 'previous-year' | 'suggest-saints' | 'download-bracket' | 'daily-voting' | 'litany' | 'winner';
  message: string;
  buttonText?: string;
  buttonLink?: string;
  secondaryButtonText?: string;
  secondaryButtonLink?: string;
}

export default function CallToAction() {
  const [actionState, setActionState] = useState<CallToActionState | null>(null);
  const [showSaintForm, setShowSaintForm] = useState(false);
  const [saintSuggestion, setSaintSuggestion] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const determineActionState = () => {
      const now = new Date();
      const month = now.getMonth() + 1; // getMonth() is 0-indexed
      const day = now.getDate();
      const year = now.getFullYear();

      // Nov 2 - Dec 31: Previous bracket and latest posts
      if ((month === 11 && day >= 2) || month === 12) {
        return {
          type: 'previous-year' as const,
          message: `Explore the ${year - 1} Saintfest results and catch up on our latest reflections`,
          buttonText: `View ${year - 1} Bracket`,
          buttonLink: `/bracket/${year - 1}`,
          secondaryButtonText: 'Latest Posts',
          secondaryButtonLink: '/posts'
        };
      }

      // Jan 1 - Sept 13: Suggest saints
      if ((month >= 1 && month <= 8) || (month === 9 && day <= 13)) {
        return {
          type: 'suggest-saints' as const,
          message: 'Help us build this year\'s bracket!\nSuggest a holy soul you think should compete in Saintfest.',
          buttonText: 'Suggest a Saint',
          buttonLink: '/suggest-saint'
        };
      }

      // Sept 14 - Sept 30: Download current bracket
      if (month === 9 && day >= 14 && day <= 30) {
        return {
          type: 'download-bracket' as const,
          message: `The Saintfest ${year} bracket is ready! Download and print your copy to follow along`,
          buttonText: `Download ${year} Bracket`,
          buttonLink: `/bracket/`
        };
      }

      // Oct 1 - Oct 29: Daily voting
      if (month === 10 && day >= 1 && day <= 29) {
        return {
          type: 'daily-voting' as const,
          message: `Saintfest ${year} is live! Vote for today's matchup`,
          buttonText: 'Vote Now',
          buttonLink: '/posts'
        };
      }

      // Oct 30: Litany of the Saints
      if (month === 10 && day === 30) {
        return {
          type: 'litany' as const,
          message: 'Join us for the traditional Litany of the Saints to conclude this year\'s celebration',
          buttonText: 'View Litany',
          buttonLink: '/posts/litany-of-saints'
        };
      }

      // Nov 1: Display winner
      if (month === 11 && day === 1) {
        return {
          type: 'winner' as const,
          message: `Celebrating the Saintfest ${year} champion!`,
          buttonText: 'View Results',
          buttonLink: `/bracket/${year}/results`
        };
      }

      // Default fallback
      return {
        type: 'previous-year' as const,
        message: 'Welcome to Saintfest! Explore our community celebration of the saints',
        buttonText: 'Learn More',
        buttonLink: '/about'
      };
    };

    setActionState(determineActionState());
  }, []);

  const handleSuggestSaint = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setShowSaintForm(true);
      setIsTransitioning(false);
    }, 250);
  };

  const handleSubmitSuggestion = () => {
    if (saintSuggestion.trim()) {
      // Here we could save to Firebase/database in the future
      console.log('Saint suggestion:', saintSuggestion);
      setIsTransitioning(true);
      
      setTimeout(() => {
        setIsSubmitted(true);
        setIsTransitioning(false);
      }, 250);
      
      // Reset form after 5 seconds
      setTimeout(() => {
        setIsTransitioning(true);
        setTimeout(() => {
          setShowSaintForm(false);
          setIsSubmitted(false);
          setSaintSuggestion('');
          setIsTransitioning(false);
        }, 250);
      }, 5000);
    }
  };

  if (!actionState) {
    return null;
  }

  const getStateStyles = () => {
    switch (actionState.type) {
      case 'previous-year':
        return {
          bgColor: '#f3f4f6',
          textColor: '#374151',
          buttonColor: '#6b7280'
        };
      case 'suggest-saints':
        return {
          bgColor: '#ecfdf5',
          textColor: '#065f46',
          buttonColor: '#059669'
        };
      case 'download-bracket':
        return {
          bgColor: '#eff6ff',
          textColor: '#1e40af',
          buttonColor: '#2563eb'
        };
      case 'daily-voting':
        return {
          bgColor: '#fef3c7',
          textColor: '#92400e',
          buttonColor: '#d97706'
        };
      case 'litany':
        return {
          bgColor: '#f3e8ff',
          textColor: '#6b21a8',
          buttonColor: '#7c3aed'
        };
      case 'winner':
        return {
          bgColor: '#fef9e7',
          textColor: '#a16207',
          buttonColor: '#ca8a04'
        };
      default:
        return {
          bgColor: '#f3f4f6',
          textColor: '#374151',
          buttonColor: '#6b7280'
        };
    }
  };

  const styles = getStateStyles();

  return (
    <div style={{
      backgroundColor: styles.bgColor,
      padding: '2rem',
      borderRadius: '0.75rem',
      textAlign: 'center',
      margin: '2rem auto',
      maxWidth: '48rem'
    }}>
      <div style={{
        opacity: isTransitioning ? 0 : 1,
        transition: 'opacity 0.25s ease-in-out'
      }}>
        {isSubmitted ? (
          <p style={{
            fontSize: '1.125rem',
            color: styles.textColor,
            fontFamily: 'var(--font-cormorant)',
            lineHeight: '1.6'
          }}>
            Thank you for the vote of confidence! Perhaps you will see them in this year's bracket.
          </p>
        ) : (
          <>
            <div style={{
              fontSize: '1.125rem',
              color: styles.textColor,
              marginBottom: '1.5rem',
              fontFamily: 'var(--font-cormorant)',
              lineHeight: '1.6'
            }}>
              {actionState.message.split('\n').map((line, index) => (
                <p key={index} style={{ margin: index === 0 ? '0 0 0.5rem 0' : '0' }}>
                  {line}
                </p>
              ))}
            </div>
            
            {showSaintForm && actionState.type === 'suggest-saints' ? (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '1rem',
                flexWrap: 'wrap',
                alignItems: 'center'
              }}>
                <input
                  type="text"
                  placeholder="Enter saint name..."
                  value={saintSuggestion}
                  onChange={(e) => setSaintSuggestion(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmitSuggestion()}
                  style={{
                    padding: '0.75rem 1rem',
                    borderRadius: '0.375rem',
                    border: `2px solid ${styles.buttonColor}`,
                    fontSize: '1rem',
                    fontFamily: 'var(--font-cormorant)',
                    outline: 'none',
                    minWidth: '16rem',
                    transition: 'border-color 0.2s ease'
                  }}
                />
                <button
                  onClick={handleSubmitSuggestion}
                  style={{
                    backgroundColor: styles.buttonColor,
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
                    transition: 'all 0.2s ease'
                  }}
                >
                  Submit
                </button>
              </div>
            ) : (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '1rem',
                flexWrap: 'wrap'
              }}>
                {actionState.buttonText && (
                  actionState.type === 'suggest-saints' ? (
                    <button
                      onClick={handleSuggestSaint}
                      style={{
                        backgroundColor: styles.buttonColor,
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
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {actionState.buttonText}
                    </button>
                  ) : (
                    actionState.buttonLink && (
                      <Link 
                        href={actionState.buttonLink}
                        style={{
                          backgroundColor: styles.buttonColor,
                          color: 'white',
                          padding: '0.75rem 1.5rem',
                          borderRadius: '0.375rem',
                          textDecoration: 'none',
                          fontFamily: 'var(--font-league-spartan)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          fontWeight: '600',
                          fontSize: '0.875rem',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {actionState.buttonText}
                      </Link>
                    )
                  )
                )}
                
                {actionState.secondaryButtonText && actionState.secondaryButtonLink && (
                  <Link 
                    href={actionState.secondaryButtonLink}
                    style={{
                      backgroundColor: 'transparent',
                      color: styles.buttonColor,
                      padding: '0.75rem 1.5rem',
                      borderRadius: '0.375rem',
                      textDecoration: 'none',
                      fontFamily: 'var(--font-league-spartan)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      fontWeight: '600',
                      fontSize: '0.875rem',
                      border: `2px solid ${styles.buttonColor}`,
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {actionState.secondaryButtonText}
                  </Link>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}