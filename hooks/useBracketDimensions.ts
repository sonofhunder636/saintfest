import { useMemo } from 'react';
import { Bracket } from '@/types';
import { 
  calculateBracketLineConfig, 
  BracketLineConfig
} from '@/lib/bracketLineUtils';

export interface BracketLayoutState {
  config: BracketLineConfig;
  totalWidth: number;
  totalHeight: number;
}

/**
 * Simplified hook for basic bracket configuration
 */
export function useBracketDimensions(bracket: Bracket): BracketLayoutState {
  const layoutConfig = useMemo(() => {
    if (!bracket || !bracket.rounds || bracket.rounds.length === 0) {
      return {
        config: {
          uniformLineLength: 180,
          totalWidth: 800,
          totalHeight: 600
        },
        totalWidth: 800,
        totalHeight: 600
      };
    }
    
    const config = calculateBracketLineConfig(bracket);
    
    return {
      config,
      totalWidth: config.totalWidth,
      totalHeight: config.totalHeight
    };
  }, [bracket]);
  
  return layoutConfig;
}