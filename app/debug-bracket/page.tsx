'use client';

import { useState } from 'react';
import { generateNewBracket } from '@/lib/bracketGenerator';
import BracketDisplay from '@/components/bracket/BracketDisplay';
import { Bracket } from '@/types';

export default function DebugBracketPage() {
  const [bracket, setBracket] = useState<Bracket | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testGeneration = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const currentYear = new Date().getFullYear();
      const newBracket = await generateNewBracket(currentYear);
      setBracket(newBracket);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate bracket');
      console.error('Bracket generation error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">
          Debug Bracket Generator
        </h1>
        
        <div className="mb-8">
          <button
            onClick={testGeneration}
            disabled={loading}
            className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Generating...' : 'Test Generate Bracket'}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-red-800">Error:</h3>
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {bracket && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-2xl font-bold mb-4">{bracket.title}</h2>
            <div className="space-y-4">
              <div>
                <strong>Status:</strong> {bracket.status}
              </div>
              <div>
                <strong>Categories:</strong> {bracket.categories.length}
              </div>
              <div>
                <strong>Total Saints:</strong> {bracket.categories.reduce((sum, cat) => sum + cat.saints.length, 0)}
              </div>
              <div>
                <strong>Categories:</strong>
                <ul className="ml-4 mt-2">
                  {bracket.categories.map(cat => (
                    <li key={cat.id} className="flex items-center">
                      <span 
                        className="w-4 h-4 rounded inline-block mr-2"
                        style={{ backgroundColor: cat.color }}
                      ></span>
                      <strong>{cat.name}</strong> ({cat.saints.length} saints): {cat.saints.map(s => s.name).join(', ')}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            
            <div className="mt-8">
              <h3 className="text-xl font-bold mb-4">Bracket Preview</h3>
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 overflow-x-auto">
                <BracketDisplay 
                  bracket={bracket} 
                  interactive={false} 
                  showVoting={false}
                  className="min-w-[1000px]"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}