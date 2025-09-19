'use client';

import SaintImage from './SaintImage';

interface Winner {
  id: string;
  name: string;
  imageUrl?: string;
  year: number;
  title: 'Blessed Intercessor' | 'Consecrated Quaternary';
  rank?: number; // For Consecrated Quaternary (1-4)
}

interface WinnersGalleryProps {
  year: number;
  blessedIntercessor?: Winner;
  consecratedQuaternary?: Winner[];
  title?: string;
  className?: string;
}

export default function WinnersGallery({ 
  year, 
  blessedIntercessor, 
  consecratedQuaternary = [],
  title,
  className = ""
}: WinnersGalleryProps) {
  
  const displayTitle = title || `${year} Champions`;

  return (
    <section className={`mb-16 ${className}`}>
      <h2 className="text-3xl font-sorts-mill text-gray-800 mb-8 text-center">
        {displayTitle}
      </h2>
      
      {/* Blessed Intercessor - The Champion */}
      {blessedIntercessor && (
        <div className="mb-12">
          <h3 className="text-2xl font-sorts-mill text-center text-amber-700 mb-6">
            🏆 Blessed Intercessor
          </h3>
          <div className="flex justify-center">
            <div className="relative">
              <SaintImage 
                saint={blessedIntercessor} 
                size="xl" 
                showName={true}
                priority={true}
                className="text-center"
              />
              {/* Champion crown decoration */}
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <div className="text-4xl">👑</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Consecrated Quaternary - The Final Four */}
      {consecratedQuaternary.length > 0 && (
        <div>
          <h3 className="text-2xl font-sorts-mill text-center text-blue-700 mb-6">
            ⭐ Consecrated Quaternary
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {consecratedQuaternary.map((saint, index) => (
              <div key={saint.id} className="text-center">
                <SaintImage 
                  saint={saint} 
                  size="lg" 
                  showName={true}
                  className="mx-auto"
                />
                {saint.rank && (
                  <div className="mt-2">
                    <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-league-spartan">
                      #{saint.rank}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!blessedIntercessor && consecratedQuaternary.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-lg mb-4">
            🏆 Champions will be crowned here
          </div>
          <p className="text-gray-500">
            The {year} Saintfest winners will be displayed once the tournament concludes.
          </p>
        </div>
      )}
    </section>
  );
}