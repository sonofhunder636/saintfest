'use client';

import Image from 'next/image';
import { useState } from 'react';

interface SaintImageProps {
  saint: {
    id: string;
    name: string;
    imageUrl?: string;
  };
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showName?: boolean;
  priority?: boolean;
}

const sizeClasses = {
  sm: 'w-16 h-16',
  md: 'w-32 h-32', 
  lg: 'w-48 h-48',
  xl: 'w-64 h-64'
};

const textSizeClasses = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
  xl: 'text-lg'
};

export default function SaintImage({ 
  saint, 
  size = 'md', 
  className = '', 
  showName = false,
  priority = false 
}: SaintImageProps) {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Generate a consistent fallback based on saint name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getImagePath = () => {
    if (saint.imageUrl) {
      // If it's already a full URL, use it
      if (saint.imageUrl.startsWith('http') || saint.imageUrl.startsWith('/')) {
        return saint.imageUrl;
      }
      // Otherwise, assume it's in our saints directory
      return `/images/saints/${saint.imageUrl}`;
    }
    // Try default naming convention
    return `/images/saints/${saint.id}.jpg`;
  };

  const handleImageError = () => {
    setImageError(true);
    setIsLoading(false);
  };

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  return (
    <div className={`relative ${className}`}>
      <div className={`${sizeClasses[size]} relative rounded-lg overflow-hidden bg-gray-100 border border-gray-200`}>
        {!imageError ? (
          <>
            <Image
              src={getImagePath()}
              alt={`Saint ${saint.name}`}
              fill
              className="object-cover"
              onError={handleImageError}
              onLoad={handleImageLoad}
              priority={priority}
            />
            {isLoading && (
              <div className="absolute inset-0 bg-gray-100 animate-pulse flex items-center justify-center">
                <div className="text-gray-400 text-xs">Loading...</div>
              </div>
            )}
          </>
        ) : (
          // Fallback when image fails to load
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
            <div className={`font-sorts-mill font-semibold text-gray-600 ${textSizeClasses[size]}`}>
              {getInitials(saint.name)}
            </div>
            <div className="absolute bottom-1 left-1 right-1">
              <div className={`text-center text-gray-500 leading-tight ${size === 'sm' ? 'text-[8px]' : 'text-[10px]'}`}>
                St. {saint.name.split(' ').slice(-1)[0]}
              </div>
            </div>
          </div>
        )}
        
        {/* Optional overlay for loading state */}
        {isLoading && !imageError && (
          <div className="absolute inset-0 bg-white bg-opacity-50 animate-pulse" />
        )}
      </div>
      
      {showName && (
        <div className="mt-2 text-center">
          <p className={`font-sorts-mill text-gray-700 leading-tight ${textSizeClasses[size]}`}>
            St. {saint.name}
          </p>
        </div>
      )}
    </div>
  );
}