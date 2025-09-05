'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Upload, CheckCircle, AlertCircle } from 'lucide-react';

export default function SaintImporter() {
  const [importing, setImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<{
    type: 'success' | 'error' | 'info' | null;
    message: string;
    count?: number;
  }>({ type: null, message: '' });
  const [googleSheetsUrl, setGoogleSheetsUrl] = useState(
    'https://docs.google.com/spreadsheets/d/1SwQFOU0h7tt-AzV2PNX3pRjsoUHYEsRnCY2jDPxVPTc/export?format=csv'
  );

  const handleImportSaints = async () => {
    if (!googleSheetsUrl.trim()) {
      setImportStatus({
        type: 'error',
        message: 'Please enter a valid Google Sheets URL',
      });
      return;
    }

    setImporting(true);
    setImportStatus({ type: 'info', message: 'Fetching data from Google Sheets...' });

    try {
      const response = await fetch('/api/admin/import-saints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ googleSheetsUrl }),
      });

      const result = await response.json();

      if (result.success) {
        setImportStatus({
          type: 'success',
          message: `Import complete! ${result.imported} new saints, ${result.updated} updated, ${result.skipped || 0} failed. Total: ${result.total} saints in database.`,
          count: result.total,
        });
      } else {
        setImportStatus({
          type: 'error',
          message: result.error || 'Import failed for unknown reason',
        });
      }
    } catch (error) {
      setImportStatus({
        type: 'error',
        message: `Import failed: ${error instanceof Error ? error.message : 'Network error'}`,
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Upload className="h-5 w-5" />
          <span>Import Saints from Google Sheets</span>
        </CardTitle>
        <CardDescription>
          Import your saints database from Google Sheets CSV export URL
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="sheets-url">Google Sheets CSV Export URL</Label>
          <Input
            id="sheets-url"
            type="url"
            value={googleSheetsUrl}
            onChange={(e) => setGoogleSheetsUrl(e.target.value)}
            placeholder="https://docs.google.com/spreadsheets/d/.../export?format=csv"
            disabled={importing}
          />
          <p className="text-sm text-muted-foreground">
            Use the "File → Download → CSV" link from your Google Sheet
          </p>
        </div>

        <Button
          onClick={handleImportSaints}
          disabled={importing || !googleSheetsUrl.trim()}
          className="w-full"
        >
          {importing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Importing Saints...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Import Saints to Firestore
            </>
          )}
        </Button>

        {importStatus.type && (
          <Alert variant={importStatus.type === 'error' ? 'destructive' : 'default'}>
            {importStatus.type === 'success' && <CheckCircle className="h-4 w-4" />}
            {importStatus.type === 'error' && <AlertCircle className="h-4 w-4" />}
            {importStatus.type === 'info' && <Loader2 className="h-4 w-4 animate-spin" />}
            <AlertDescription>{importStatus.message}</AlertDescription>
          </Alert>
        )}

        <div className="text-sm text-muted-foreground space-y-2">
          <p><strong>Expected CSV format:</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Name, Saintfest Appearance, Hagiography</li>
            <li>Birth Year, Death Year, Origin, Location of Labor</li>
            <li>Tags and category boolean columns (Eastern, Western, Martyr, etc.)</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}