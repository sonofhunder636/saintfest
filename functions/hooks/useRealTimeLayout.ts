import { useLayoutEffect, useRef, useState, useCallback } from 'react';

export interface RealTimeTextMeasurement {
  width: number;
  height: number;
  lines: string[];
  visualCenterY: number;
}

export interface RealTimeMatchLayout {
  [matchId: string]: {
    actualHeight: number;
    saint1Measurement: RealTimeTextMeasurement;
    saint2Measurement: RealTimeTextMeasurement;
    actualVisualCenter: number;
    containerBounds: DOMRect;
  };
}

/**
 * Hook for measuring actual rendered text dimensions and positions
 */
export function useRealTimeTextMeasurement() {
  const measurementRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [measurements, setMeasurements] = useState<RealTimeMatchLayout>({});

  const registerTextElement = useCallback((matchId: string, element: HTMLDivElement | null) => {
    if (element) {
      measurementRefs.current.set(matchId, element);
    } else {
      measurementRefs.current.delete(matchId);
    }
  }, []);

  const measureAllElements = useCallback(() => {
    const newMeasurements: RealTimeMatchLayout = {};

    measurementRefs.current.forEach((element, matchId) => {
      const containerBounds = element.getBoundingClientRect();
      
      // Find the saint name elements within this match container
      const saint1Element = element.querySelector('[data-saint="saint1"]') as HTMLDivElement;
      const saint2Element = element.querySelector('[data-saint="saint2"]') as HTMLDivElement;
      
      if (!saint1Element || !saint2Element) return;

      const saint1Bounds = saint1Element.getBoundingClientRect();
      const saint2Bounds = saint2Element.getBoundingClientRect();
      
      // Calculate actual visual center based on rendered content
      const contentTop = saint1Bounds.top - containerBounds.top;
      const contentBottom = saint2Bounds.bottom - containerBounds.top;
      const contentHeight = contentBottom - contentTop;
      const actualVisualCenter = contentTop + (contentHeight / 2);

      // Extract actual rendered lines
      const saint1Lines = Array.from(saint1Element.children).map(child => 
        (child as HTMLElement).textContent || ''
      );
      const saint2Lines = Array.from(saint2Element.children).map(child => 
        (child as HTMLElement).textContent || ''
      );

      newMeasurements[matchId] = {
        actualHeight: containerBounds.height,
        saint1Measurement: {
          width: saint1Bounds.width,
          height: saint1Bounds.height,
          lines: saint1Lines,
          visualCenterY: (saint1Bounds.top + saint1Bounds.bottom) / 2 - containerBounds.top
        },
        saint2Measurement: {
          width: saint2Bounds.width,
          height: saint2Bounds.height,
          lines: saint2Lines,
          visualCenterY: (saint2Bounds.top + saint2Bounds.bottom) / 2 - containerBounds.top
        },
        actualVisualCenter,
        containerBounds
      };
    });

    setMeasurements(newMeasurements);
  }, []);

  // Measure after each render
  useLayoutEffect(() => {
    measureAllElements();
  });

  // Re-measure on resize
  useLayoutEffect(() => {
    const handleResize = () => {
      measureAllElements();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [measureAllElements]);

  return {
    registerTextElement,
    measurements,
    remeasure: measureAllElements
  };
}

/**
 * Hook for creating dynamic bracket connections based on real rendered layout
 */
export function useRealTimeBracketConnections(
  measurements: RealTimeMatchLayout,
  bracketPositions: { [matchId: string]: { x: number; y: number; lineLength: number } }
) {
  const [connections, setConnections] = useState<Array<{
    x1: number; y1: number; x2: number; y2: number; type: 'horizontal' | 'vertical'
  }>>([]);

  useLayoutEffect(() => {
    const newConnections: typeof connections = [];

    // Generate connections based on actual measured positions
    Object.entries(measurements).forEach(([matchId, measurement]) => {
      const position = bracketPositions[matchId];
      if (!position) return;

      // Create connections using actual visual centers
      const startX = position.x + position.lineLength;
      const actualStartY = position.y + measurement.actualVisualCenter;

      // For now, create basic connections - this will be enhanced based on tournament structure
      newConnections.push({
        x1: startX,
        y1: actualStartY,
        x2: startX + 30,
        y2: actualStartY,
        type: 'horizontal'
      });
    });

    setConnections(newConnections);
  }, [measurements, bracketPositions]);

  return connections;
}