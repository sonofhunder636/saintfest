'use client';

import { Bracket, BracketCategory, BracketMatch, BracketSaint } from '@/types';
import { useState } from 'react';
import Image from 'next/image';

interface BracketDisplayProps {
  bracket: Bracket;
  interactive?: boolean;
  showVoting?: boolean;
  className?: string;
}

export default function BracketDisplay({ 
  bracket, 
  interactive = false, 
  showVoting = false,
  className = '' 
}: BracketDisplayProps) {
  const [selectedMatch, setSelectedMatch] = useState<string | null>(null);

  return (
    <div className={`bracket-display w-full ${className}`} style={{ minHeight: '800px' }}>
      {/* Title */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2" style={{ fontFamily: 'League Spartan, sans-serif' }}>
          {bracket.title}
        </h1>
        <div className="w-32 h-1 bg-gradient-to-r from-transparent via-gray-400 to-transparent mx-auto"></div>
      </div>

      {/* Simplified Bracket Display */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="text-center text-gray-600">
          <p className="text-lg mb-4">Canvas-Based Bracket System</p>
          <p className="text-sm">Bracket rendering has been simplified and restored to the working Canvas-based approach.</p>
          <p className="text-sm mt-2">Visit the Bracket Editor to see the full interactive tournament structure.</p>
        </div>
      </div>

      {/* Saints Gallery at Bottom */}
      <SaintsGallery categories={bracket.categories} />
    </div>
  );
}


interface SaintsGalleryProps {
  categories: BracketCategory[];
}

function SaintsGallery({ categories }: SaintsGalleryProps) {
  const allSaints = categories.flatMap(cat => cat.saints);

  return (
    <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg">
      <h3 className="text-2xl font-bold text-center mb-6 text-gray-800">
        Saints of {new Date().getFullYear()}
      </h3>
      
      <div className="grid grid-cols-4 md:grid-cols-8 lg:grid-cols-16 gap-4">
        {allSaints.map((saint, index) => (
          <div key={saint.saintId} className="text-center">
            {saint.imageUrl ? (
              <div className="w-16 h-16 rounded-full overflow-hidden mx-auto mb-2 border-2 border-gray-200">
                <Image
                  src={saint.imageUrl}
                  alt={saint.name}
                  width={64}
                  height={64}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center mx-auto mb-2">
                <span className="text-2xl">👤</span>
              </div>
            )}
            <p className="text-xs font-medium text-gray-700 truncate" title={saint.name}>
              {saint.name}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}