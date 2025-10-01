'use client';

import { useState, useEffect } from 'react';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export default function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [gameState, setGameState] = useState<'countdown' | 'active' | 'finished'>('countdown');

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth(); // 0-indexed: Jan=0, Feb=1, ..., Dec=11
      const currentDate = now.getDate();

      // Determine the target year for October 1st
      // If we're past November 1st, target next year's October 1st
      // Otherwise, target this year's October 1st
      let targetYear = currentYear;
      if (currentMonth === 10 && currentDate > 1) { // Past Nov 1st
        targetYear = currentYear + 1;
      } else if (currentMonth > 10) { // December
        targetYear = currentYear + 1;
      }

      const saintfestStart = new Date(targetYear, 9, 1, 0, 0, 0); // October 1st at midnight
      const saintfestEnd = new Date(targetYear, 10, 1, 23, 59, 59); // November 1st end of day

      // Debug logging
      console.log('Current date:', now.toISOString());
      console.log('Target year:', targetYear);
      console.log('Saintfest start:', saintfestStart.toISOString());
      console.log('Time difference (ms):', saintfestStart.getTime() - now.getTime());

      // Check current game state
      if (now >= saintfestStart && now <= saintfestEnd) {
        setGameState('active');
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      } else if (now > saintfestEnd && now < new Date(targetYear, 10, 2)) {
        setGameState('finished');
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      } else {
        setGameState('countdown');
        const timeDifference = saintfestStart.getTime() - now.getTime();

        if (timeDifference > 0) {
          const days = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
          const hours = Math.floor((timeDifference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((timeDifference % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((timeDifference % (1000 * 60)) / 1000);

          return { days, hours, minutes, seconds };
        }
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }
    };

    // Calculate initial time
    setTimeLeft(calculateTimeLeft());

    // Update every second
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const renderCountdown = () => {
    // Debug: log current state
    console.log('Current gameState:', gameState);
    console.log('Current timeLeft:', timeLeft);
    
    switch (gameState) {
      case 'active':
        return (
          <div className="text-center">
            <h2 className="text-3xl font-sorts-mill text-gray-800 mb-4">
              Saintfest is Live!
            </h2>
            <p className="text-xl text-gray-600 mb-4">
              The tournament is underway!
            </p>
            <div className="text-lg text-blue-600">
              Vote for your favorite saints now
            </div>
          </div>
        );
      
      case 'finished':
        const now = new Date();
        const nextYear = now.getFullYear() + 1;
        return (
          <div className="text-center">
            <div className="text-6xl mb-4">🏆</div>
            <h2 className="text-3xl font-sorts-mill text-gray-800 mb-4">
              Saintfest {now.getFullYear()} Complete!
            </h2>
            <p className="text-xl text-gray-600 mb-4">
              Thank you for participating!
            </p>
            <div className="text-lg text-green-600">
              See you next October for Saintfest {nextYear}
            </div>
          </div>
        );
      
      case 'countdown':
      default:
        const targetYear = (new Date().getMonth() > 10 || (new Date().getMonth() === 10 && new Date().getDate() > 1)) 
          ? new Date().getFullYear() + 1 
          : new Date().getFullYear();
          
        return (
          <div style={{ textAlign: 'center' }}>
            {/* Days - Large on its own line */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ 
                fontSize: '6rem', 
                fontWeight: 'bold', 
                color: '#1f2937',
                fontFamily: 'var(--font-dancing-script)',
                lineHeight: '1'
              }}>
                {timeLeft.days}
              </div>
              <div style={{ 
                fontSize: '1.125rem', 
                color: '#6b7280', 
                textTransform: 'uppercase', 
                letterSpacing: '0.05em',
                fontFamily: 'var(--font-league-spartan)',
                marginTop: '0.5rem'
              }}>
                Days
              </div>
            </div>
            
            {/* Hours, Minutes, Seconds - Smaller on line below */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center',
              gap: '2rem', 
              marginBottom: '1.5rem'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ 
                  fontSize: '1.25rem', 
                  fontWeight: 'bold', 
                  color: '#1f2937',
                  fontFamily: 'var(--font-dancing-script)'
                }}>
                  {timeLeft.hours}
                </div>
                <div style={{ 
                  fontSize: '0.75rem', 
                  color: '#6b7280', 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.05em',
                  fontFamily: 'var(--font-league-spartan)'
                }}>
                  Hours
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ 
                  fontSize: '1.25rem', 
                  fontWeight: 'bold', 
                  color: '#1f2937',
                  fontFamily: 'var(--font-dancing-script)'
                }}>
                  {timeLeft.minutes}
                </div>
                <div style={{ 
                  fontSize: '0.75rem', 
                  color: '#6b7280', 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.05em',
                  fontFamily: 'var(--font-league-spartan)'
                }}>
                  Minutes
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ 
                  fontSize: '1.25rem', 
                  fontWeight: 'bold', 
                  color: '#1f2937',
                  fontFamily: 'var(--font-dancing-script)'
                }}>
                  {timeLeft.seconds}
                </div>
                <div style={{ 
                  fontSize: '0.75rem', 
                  color: '#6b7280', 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.05em',
                  fontFamily: 'var(--font-league-spartan)'
                }}>
                  Seconds
                </div>
              </div>
            </div>
            
            <p style={{ 
              color: '#6b7280', 
              fontFamily: 'var(--font-league-spartan)', 
              fontSize: '1.125rem' 
            }}>
              until the tournament begins
            </p>
          </div>
        );
    }
  };

  return (
    <div className="text-center">
      {renderCountdown()}
    </div>
  );
}