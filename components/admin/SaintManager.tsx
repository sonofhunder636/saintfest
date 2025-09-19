'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, Edit, Trash2, Users } from 'lucide-react';
import { Saint } from '@/types';

export default function SaintManager() {
  const [saints, setSaints] = useState<Saint[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string>('');

  const filteredSaints = saints.filter(saint =>
    saint.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    saint.hagiography?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    saint.tags?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const loadSaints = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/admin/saints');
      const result = await response.json();
      
      if (result.success) {
        setSaints(result.data || []);
      } else {
        setError(result.error || 'Failed to load saints');
      }
    } catch (err) {
      setError('Failed to connect to database');
    } finally {
      setLoading(false);
    }
  };

  const deleteSaint = async (saintId: string) => {
    if (!confirm('Are you sure you want to delete this saint? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/saints/${saintId}`, {
        method: 'DELETE',
      });
      
      const result = await response.json();
      
      if (result.success) {
        setSaints(prev => prev.filter(saint => saint.id !== saintId));
      } else {
        setError(result.error || 'Failed to delete saint');
      }
    } catch (err) {
      setError('Failed to delete saint');
    }
  };

  useEffect(() => {
    loadSaints();
  }, []);

  const getBooleanCategories = (saint: Saint): string[] => {
    const categories: string[] = [];
    const booleanFields = [
      'eastern', 'western', 'martyr', 'confessors', 'virgins', 'bishops', 
      'popes', 'priests', 'deacons', 'religious', 'kings', 'queens', 
      'nobles', 'military', 'doctors', 'theologians', 'mystics', 
      'missionaries', 'reformers', 'founders', 'abbots', 'abbesses', 
      'hermits', 'pilgrims', 'crusaders', 'scholars', 'artists', 
      'writers', 'healers', 'workers'
    ];
    
    booleanFields.forEach(field => {
      if (saint[field as keyof Saint]) {
        categories.push(field.charAt(0).toUpperCase() + field.slice(1));
      }
    });
    
    return categories;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Users className="h-5 w-5" />
          <span>Saints Database</span>
        </CardTitle>
        <CardDescription>
          View and manage your imported saints
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search saints by name, story, or tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <Button onClick={loadSaints} disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Refresh'
            )}
          </Button>
        </div>

        {error && (
          <div className="text-red-600 text-sm">{error}</div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Showing {filteredSaints.length} of {saints.length} saints
            </div>
            
            <div className="grid gap-4 max-h-96 overflow-y-auto">
              {filteredSaints.map((saint) => (
                <Card key={saint.id} className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold">{saint.name}</h3>
                        {saint.saintfestAppearance && (
                          <Badge variant="outline">
                            Saintfest {saint.saintfestAppearance}
                          </Badge>
                        )}
                      </div>
                      
                      {(saint.birthYear || saint.deathYear) && (
                        <div className="text-sm text-muted-foreground">
                          {saint.birthYear} - {saint.deathYear}
                        </div>
                      )}
                      
                      {saint.hagiography && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {saint.hagiography}
                        </p>
                      )}
                      
                      {saint.tags && (
                        <div className="text-sm">
                          <span className="font-medium">Tags: </span>
                          {saint.tags}
                        </div>
                      )}
                      
                      <div className="flex flex-wrap gap-1">
                        {getBooleanCategories(saint).map((category) => (
                          <Badge key={category} variant="secondary" className="text-xs">
                            {category}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex space-x-2 ml-4">
                      <Button size="sm" variant="outline">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => deleteSaint(saint.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
              
              {filteredSaints.length === 0 && !loading && (
                <div className="text-center py-8 text-muted-foreground">
                  {saints.length === 0 
                    ? 'No saints found. Import your database first.'
                    : 'No saints match your search criteria.'
                  }
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}