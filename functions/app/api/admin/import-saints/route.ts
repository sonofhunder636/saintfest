import { NextRequest, NextResponse } from 'next/server';
import { collection, doc, setDoc, getDoc, Timestamp } from 'firebase/firestore';
import { assertFirestore } from '@/lib/firebase';
import { Saint } from '@/types';
import { validateAdminAccess } from '@/lib/auth-middleware';

export async function POST(request: NextRequest) {
  try {
    // Validate admin authentication first
    const authResult = await validateAdminAccess(request);
    if (!authResult.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: authResult.error || 'Admin authentication required',
          requiresAuth: true
        },
        { status: 401 }
      );
    }

    console.log(`Admin authenticated: ${authResult.userEmail} importing saints`);

    // Initialize Firestore with runtime assertion
    const db = assertFirestore();

    const { googleSheetsUrl } = await request.json();

    if (!googleSheetsUrl) {
      return NextResponse.json(
        { success: false, error: 'Google Sheets URL is required' },
        { status: 400 }
      );
    }

    // Fetch CSV data from Google Sheets
    console.log('Fetching CSV data from:', googleSheetsUrl);
    const response = await fetch(googleSheetsUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch CSV: ${response.statusText}`);
    }

    const csvText = await response.text();
    
    // Parse CSV data
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      throw new Error('CSV file appears to be empty or invalid');
    }

    // Find the header row (look for "Name" column)
    let headerRowIndex = -1;
    for (let i = 0; i < Math.min(10, lines.length); i++) {
      const possibleHeaders = lines[i].split(',').map(h => h.trim().replace(/"/g, ''));
      if (possibleHeaders.some(h => h.toLowerCase().includes('name'))) {
        headerRowIndex = i;
        break;
      }
    }

    if (headerRowIndex === -1) {
      throw new Error('Could not find header row with "Name" column');
    }

    const headers = lines[headerRowIndex].split(',').map(h => h.trim().replace(/"/g, ''));
    const saints: Saint[] = [];

    console.log('Found header row at index:', headerRowIndex);
    console.log('CSV Headers:', headers);

    console.log(`Processing ${lines.length - headerRowIndex - 1} data rows...`);
    
    for (let i = headerRowIndex + 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      
      if (i <= headerRowIndex + 3) {
        console.log(`Row ${i}: ${values.length} values, first few:`, values.slice(0, 5));
      }
      
      // Find the name column index
      const nameColumnIndex = headers.findIndex(h => h.toLowerCase().includes('name'));
      const saintName = nameColumnIndex >= 0 ? values[nameColumnIndex] : '';
      
      if (values.length < 5 || !saintName || saintName.trim() === '') {
        if (i <= headerRowIndex + 5) {
          console.log(`Skipping row ${i}: length=${values.length}, name="${saintName}"`);
        }
        continue; // Skip empty or malformed rows
      }

      // Create a deterministic ID based on the saint's name
      const saintId = saintName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
      
      const saintData: any = {
        id: saintId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      // Map CSV columns to saint properties
      headers.forEach((header, index) => {
        const value = values[index] || '';
        const normalizedHeader = header.toLowerCase().replace(/\s+/g, '');

        switch (normalizedHeader) {
          case 'name':
            // Clean the name - remove any trailing characters and trim
            saintData.name = value.replace(/[^\w\s\-\'\.\(\)]/g, '').trim();
            break;
          case 'saintfestappearance':
            if (value && !isNaN(parseInt(value, 10))) {
              saintData.saintfestAppearance = parseInt(value, 10);
            }
            break;
          case 'hagiography':
          case 'hagiogrpahy': // Handle typo in spreadsheet
            saintData.hagiography = value;
            break;
          case 'birthyear':
            if (value && !isNaN(parseInt(value, 10))) {
              saintData.birthYear = parseInt(value, 10);
            }
            break;
          case 'deathyear':
            if (value && !isNaN(parseInt(value, 10))) {
              saintData.deathYear = parseInt(value, 10);
            }
            break;
          case 'origin':
            saintData.origin = value;
            break;
          case 'locationoflabor':
            saintData.locationOfLabor = value;
            break;
          case 'tags':
            saintData.tags = value;
            break;
          // Store categories exactly as they appear in the spreadsheet
          case 'eastern':
          case 'western':
          case 'evangelist':
          case 'martyrs':
          case 'confessors':
          case 'doctorsofthechurch':
          case 'virgins':
          case 'holywoman':
          case 'mystic':
          case 'convert':
          case 'blessed':
          case 'venerable':
          case 'missionary':
          case 'deacon':
          case 'priest':
          case 'bishop':
          case 'cardinal':
          case 'pope':
          case 'apostle':
          case 'abbotabbess':
          case 'hermit':
          case 'royalty':
          case 'religious':
          case 'lay':
          case 'groupcompanions':
          case 'churchfather':
          case 'oldtestament':
            // Store using the original header name as the field name
            const originalCategoryName = header.toLowerCase().replace(/\s+/g, '').replace(/\//g, '');
            saintData[originalCategoryName] = value.toLowerCase() === 'true';
            break;
        }
      });

      if (saintData.name) {
        saints.push(saintData as Saint);
      }
    }

    console.log(`Parsed ${saints.length} saints from CSV`);

    // Save to Firestore
    const saintsCollection = collection(db, 'saints');
    
    let importedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    
    for (const saint of saints) {
      try {
        const saintRef = doc(saintsCollection, saint.id);
        const existingDoc = await getDoc(saintRef);
        
        if (existingDoc.exists()) {
          // Update existing saint (merge new data)
          await setDoc(saintRef, { ...saint, updatedAt: Timestamp.now() }, { merge: true });
          updatedCount++;
        } else {
          // Create new saint
          await setDoc(saintRef, saint);
          importedCount++;
        }
      } catch (error) {
        console.error(`Failed to import saint ${saint.name}:`, error);
        skippedCount++;
      }
    }

    console.log(`Import complete: ${importedCount} new, ${updatedCount} updated, ${skippedCount} failed`);

    return NextResponse.json({
      success: true,
      imported: importedCount,
      updated: updatedCount,
      skipped: skippedCount,
      total: importedCount + updatedCount,
      message: `Import complete: ${importedCount} new saints, ${updatedCount} updated, ${skippedCount} failed`,
    });

  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}