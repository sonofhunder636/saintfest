'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import SaintImage from '../SaintImage';
import { Upload, Link as LinkIcon, Search, Download, ExternalLink } from 'lucide-react';

interface Saint {
  id: string;
  name: string;
  imageUrl?: string;
  feastDay: string;
}

interface ImageManagerProps {
  saints: Saint[];
  onUpdateSaintImage: (saintId: string, imageUrl: string) => void;
}

export default function ImageManager({ saints, onUpdateSaintImage }: ImageManagerProps) {
  const [selectedSaint, setSelectedSaint] = useState<Saint | null>(null);
  const [imageUrl, setImageUrl] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredSaints = saints.filter(saint => 
    saint.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedSaint) return;

    setUploading(true);
    try {
      // In a real implementation, you'd upload to your storage service
      // For now, we'll simulate the process
      const formData = new FormData();
      formData.append('file', file);
      formData.append('saintId', selectedSaint.id);
      
      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In production, this would be the actual uploaded file URL
      const uploadedUrl = `/images/saints/${selectedSaint.id}.jpg`;
      onUpdateSaintImage(selectedSaint.id, uploadedUrl);
      
      alert('Image uploaded successfully!');
    } catch (error) {
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleUrlSubmit = () => {
    if (!selectedSaint || !imageUrl.trim()) return;
    
    onUpdateSaintImage(selectedSaint.id, imageUrl.trim());
    setImageUrl('');
    alert('Image URL updated successfully!');
  };

  const publicDomainSources = [
    {
      name: "Wikimedia Commons",
      url: "https://commons.wikimedia.org",
      searchUrl: (saintName: string) => `https://commons.wikimedia.org/w/index.php?search=${encodeURIComponent(saintName + ' saint')}&title=Special:MediaSearch&go=Go&type=image`,
      description: "Largest repository of public domain saint images"
    },
    {
      name: "Metropolitan Museum",
      url: "https://www.metmuseum.org/art/collection",
      searchUrl: (saintName: string) => `https://www.metmuseum.org/art/collection/search?q=${encodeURIComponent(saintName)}`,
      description: "High-quality museum collection with many public domain works"
    },
    {
      name: "National Gallery of Art",
      url: "https://www.nga.gov/collection",
      searchUrl: (saintName: string) => `https://www.nga.gov/collection/art-object-page.html?artobj=${encodeURIComponent(saintName)}`,
      description: "US national collection with open access images"
    },
    {
      name: "Rijksmuseum",
      url: "https://www.rijksmuseum.nl",
      searchUrl: (saintName: string) => `https://www.rijksmuseum.nl/en/search?q=${encodeURIComponent(saintName)}&st=Objects&ii=0`,
      description: "Dutch national museum with extensive religious art"
    }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Saints List */}
      <Card>
        <CardHeader>
          <CardTitle>Manage Saint Images</CardTitle>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search saints..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredSaints.map((saint) => (
              <div
                key={saint.id}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedSaint?.id === saint.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedSaint(saint)}
              >
                <div className="flex items-center space-x-3">
                  <SaintImage saint={saint} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      St. {saint.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      Feast Day: {saint.feastDay}
                    </p>
                    <p className="text-xs text-gray-400">
                      {saint.imageUrl ? '✓ Has image' : '○ No image'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Image Management */}
      <div className="space-y-6">
        {selectedSaint ? (
          <>
            {/* Current Image Preview */}
            <Card>
              <CardHeader>
                <CardTitle>St. {selectedSaint.name}</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <SaintImage saint={selectedSaint} size="lg" showName={false} className="mx-auto mb-4" />
                <p className="text-sm text-gray-600">
                  Current image for St. {selectedSaint.name}
                </p>
              </CardContent>
            </Card>

            {/* Upload Methods */}
            <Card>
              <CardHeader>
                <CardTitle>Update Image</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* File Upload */}
                <div>
                  <Label>Upload Image File</Label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="w-full mt-2"
                    variant="outline"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {uploading ? 'Uploading...' : 'Choose File'}
                  </Button>
                </div>

                <div className="text-center text-gray-400">or</div>

                {/* URL Input */}
                <div>
                  <Label>Image URL</Label>
                  <div className="flex space-x-2 mt-2">
                    <Input
                      placeholder="https://example.com/saint-image.jpg"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                    />
                    <Button onClick={handleUrlSubmit} disabled={!imageUrl.trim()}>
                      <LinkIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Public Domain Sources */}
            <Card>
              <CardHeader>
                <CardTitle>Public Domain Image Sources</CardTitle>
                <p className="text-sm text-gray-600">
                  Click to search for St. {selectedSaint.name} in these repositories
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {publicDomainSources.map((source) => (
                    <div key={source.name} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium">{source.name}</h4>
                        <p className="text-sm text-gray-600">{source.description}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(source.searchUrl(selectedSaint.name), '_blank')}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Tip:</strong> Look for images marked as "Public Domain" or with Creative Commons licenses. 
                    Always verify the license before using any image.
                  </p>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-gray-500">Select a saint to manage their image</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}