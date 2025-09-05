'use client';

import { useState, useEffect } from 'react';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Trophy, Users, Shuffle, Download } from 'lucide-react';
import { Saint } from '@/types';

interface CategoryOption {
  field: keyof Saint;
  label: string;
  enabled: boolean;
}

export default function BracketGenerator() {
  const { currentUser, loading } = useRequireAuth('admin');
  const [saints, setSaints] = useState<Saint[]>([]);
  const [loadingSaints, setLoadingSaints] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [bracketYear, setBracketYear] = useState(new Date().getFullYear());
  const [status, setStatus] = useState<{
    type: 'success' | 'error' | 'info' | null;
    message: string;
  }>({ type: null, message: '' });

  const [categories, setCategories] = useState<CategoryOption[]>([
    { field: 'eastern', label: 'Eastern', enabled: false },
    { field: 'western', label: 'Western', enabled: false },
    { field: 'evangelist', label: 'Evangelist', enabled: false },
    { field: 'martyrs', label: 'Martyrs', enabled: false },
    { field: 'confessors', label: 'Confessors', enabled: false },
    { field: 'doctorsofthechurch', label: 'Doctors of the Church', enabled: false },
    { field: 'virgins', label: 'Virgins', enabled: false },
    { field: 'holywoman', label: 'Holy Woman', enabled: false },
    { field: 'mystic', label: 'Mystic', enabled: false },
    { field: 'convert', label: 'Convert', enabled: false },
    { field: 'blessed', label: 'Blessed', enabled: false },
    { field: 'venerable', label: 'Venerable', enabled: false },
    { field: 'missionary', label: 'Missionary', enabled: false },
    { field: 'deacon', label: 'Deacon', enabled: false },
    { field: 'priest', label: 'Priest', enabled: false },
    { field: 'bishop', label: 'Bishop', enabled: false },
    { field: 'cardinal', label: 'Cardinal', enabled: false },
    { field: 'pope', label: 'Pope', enabled: false },
    { field: 'apostle', label: 'Apostle', enabled: false },
    { field: 'abbotabbess', label: 'Abbot/Abbess', enabled: false },
    { field: 'hermit', label: 'Hermit', enabled: false },
    { field: 'royalty', label: 'Royalty', enabled: false },
    { field: 'religious', label: 'Religious', enabled: false },
    { field: 'lay', label: 'Lay', enabled: false },
    { field: 'groupcompanions', label: 'Group/Companions', enabled: false },
    { field: 'churchfather', label: 'Church Father', enabled: false },
    { field: 'oldtestament', label: 'Old Testament', enabled: false },
  ]);

  useEffect(() => {
    loadSaints();
  }, []);

  const loadSaints = async () => {
    try {
      const response = await fetch('/api/admin/saints');
      const result = await response.json();
      
      if (result.success) {
        setSaints(result.data || []);
      } else {
        setStatus({ type: 'error', message: 'Failed to load saints database' });
      }
    } catch (error) {
      setStatus({ type: 'error', message: 'Failed to connect to database' });
    } finally {
      setLoadingSaints(false);
    }
  };

  const toggleCategory = (index: number) => {
    setCategories(prev => 
      prev.map((cat, i) => 
        i === index ? { ...cat, enabled: !cat.enabled } : cat
      )
    );
  };

  const generateBracket = async () => {
    const enabledCategories = categories.filter(cat => cat.enabled);
    
    if (enabledCategories.length !== 4) {
      setStatus({ type: 'error', message: 'Please select exactly 4 categories for the tournament' });
      return;
    }

    // Check each category has at least 8 saints
    for (const category of enabledCategories) {
      const count = getCategoryCount(category.field);
      if (count < 8) {
        setStatus({ 
          type: 'error', 
          message: `Category "${category.label}" only has ${count} saints, need at least 8` 
        });
        return;
      }
    }

    setGenerating(true);
    setStatus({ type: 'info', message: 'Generating bracket...' });

    try {
      const response = await fetch('/api/admin/generate-bracket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          year: bracketYear,
          categories: enabledCategories.map(cat => cat.field),
        }),
      });

      const result = await response.json();

      if (result.success) {
        setStatus({
          type: 'success',
          message: `Successfully generated 32-saint tournament bracket for ${bracketYear}!`,
        });
        
        // Redirect to view the generated bracket after a short delay
        setTimeout(() => {
          window.location.href = `/admin/bracket/view/${result.bracketId}`;
        }, 1500);
      } else {
        setStatus({
          type: 'error',
          message: result.error || 'Failed to generate bracket',
        });
      }
    } catch (error) {
      setStatus({
        type: 'error',
        message: 'Failed to generate bracket',
      });
    } finally {
      setGenerating(false);
    }
  };

  const getCategoryCount = (field: keyof Saint): number => {
    return saints.filter(saint => saint[field] === true).length;
  };

  if (loading || loadingSaints) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Alert>
          <AlertDescription>Access denied. Admin privileges required.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center space-x-2">
        <Trophy className="h-8 w-8" />
        <h1 className="text-3xl font-bold">Generate Bracket</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuration Card */}
        <Card>
          <CardHeader>
            <CardTitle>Bracket Configuration</CardTitle>
            <CardDescription>
              Configure your March Madness style bracket
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="bracket-year">Year</Label>
                <Input
                  id="bracket-year"
                  type="number"
                  value={bracketYear}
                  onChange={(e) => setBracketYear(parseInt(e.target.value, 10))}
                  min="2020"
                  max="2030"
                />
              </div>
              <div>
                <Label htmlFor="bracket-size">Tournament Format</Label>
                <div className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm items-center">
                  32 Saints (4 categories × 8 saints each)
                </div>
              </div>
            </div>

            <div>
              <Label>Select Exactly 4 Categories</Label>
              <p className="text-sm text-muted-foreground mb-3">
                Choose exactly 4 categories. The system will randomly select 8 saints from each category (32 total).
              </p>
              <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                {categories.map((category, index) => {
                  const count = getCategoryCount(category.field);
                  return (
                    <div key={category.field} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`category-${category.field}`}
                        checked={category.enabled}
                        onChange={() => toggleCategory(index)}
                        className="h-4 w-4"
                      />
                      <Label 
                        htmlFor={`category-${category.field}`}
                        className="text-sm cursor-pointer flex-1"
                      >
                        {category.label} ({count})
                      </Label>
                    </div>
                  );
                })}
              </div>
            </div>

            <Button 
              onClick={generateBracket}
              disabled={generating || saints.length === 0}
              className="w-full"
            >
              {generating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Bracket...
                </>
              ) : (
                <>
                  <Shuffle className="mr-2 h-4 w-4" />
                  Generate 32-Saint Tournament
                </>
              )}
            </Button>

            {status.type && (
              <Alert variant={status.type === 'error' ? 'destructive' : 'default'}>
                <AlertDescription>{status.message}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Database Stats Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Saints Database</span>
            </CardTitle>
            <CardDescription>
              Overview of your saints database
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{saints.length}</div>
                <div className="text-sm text-muted-foreground">Total Saints</div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="font-medium">Most Popular Categories:</div>
                  <ul className="space-y-1 mt-2">
                    {categories
                      .map(cat => ({ ...cat, count: getCategoryCount(cat.field) }))
                      .sort((a, b) => b.count - a.count)
                      .slice(0, 5)
                      .map(cat => (
                        <li key={cat.field} className="flex justify-between">
                          <span>{cat.label}</span>
                          <span>{cat.count}</span>
                        </li>
                      ))}
                  </ul>
                </div>
                
                <div>
                  <div className="font-medium">Quick Actions:</div>
                  <div className="space-y-2 mt-2">
                    <Button variant="outline" size="sm" className="w-full" asChild>
                      <a href="/admin">Manage Saints</a>
                    </Button>
                    <Button variant="outline" size="sm" className="w-full">
                      <Download className="mr-2 h-4 w-4" />
                      View Brackets
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}