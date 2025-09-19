import { NextRequest, NextResponse } from 'next/server';
import { collection, doc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { assertFirestore } from '@/lib/firebase';
import { Saint } from '@/types';
import * as ExcelJS from 'exceljs';
import { validateAdminAccess } from '@/lib/auth-middleware';

export async function POST(request: NextRequest) {
  try {
    // CRITICAL: Validate admin authentication first
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

    console.log(`Admin ${authResult.userEmail} importing saints data at ${new Date().toISOString()}`);

    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    console.log('Processing Excel file with secure ExcelJS:', file.name);

    // Read and parse Excel file with secure ExcelJS
    const buffer = await file.arrayBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    const worksheet = workbook.getWorksheet(1);
    if (!worksheet) {
      return NextResponse.json(
        { success: false, error: 'No worksheet found in Excel file' },
        { status: 400 }
      );
    }

    // Convert worksheet to JSON format
    const jsonData: any[] = [];
    worksheet.eachRow((row) => {
      const rowData: any[] = [];
      row.eachCell((cell, colNumber) => {
        rowData[colNumber - 1] = cell.value;
      });
      jsonData.push(rowData);
    });

    if (jsonData.length < 3) {
      return NextResponse.json(
        { success: false, error: 'Excel file needs at least 3 rows (names start at row 3)' },
        { status: 400 }
      );
    }

    // Skip first 2 rows, data starts at row 3 (index 2)
    const dataRows = jsonData.slice(2) as any[][];
    
    console.log('Data rows found (starting from row 3):', dataRows.length);
    console.log('Sample first row:', dataRows[0]?.slice(0, 10));

    // Map Excel columns to Saint interface fields
    const saintsToImport: Partial<Saint>[] = [];
    
    dataRows.forEach((row, index) => {
      try {
        const saintData: Partial<Saint> = {
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        // Get saint name from column B (index 1)
        const saintName = row[1];
        if (!saintName || String(saintName).trim().length < 2) {
          console.warn(`Row ${index + 3}: Skipping saint with invalid name in column B:`, saintName);
          return;
        }
        
        saintData.name = String(saintName).trim();
        
        // Skip invalid names
        if (saintData.name === 'FALSE' || saintData.name === 'TRUE') {
          console.warn(`Row ${index + 3}: Skipping invalid name:`, saintData.name);
          return;
        }

        // Map category columns J through AJ (indices 9-35)
        // Based on your saint categories from the bracket system
        const categoryMappings = [
          { col: 9, field: 'eastern' },           // J - Eastern
          { col: 10, field: 'western' },          // K - Western  
          { col: 11, field: 'evangelist' },       // L - Evangelist
          { col: 12, field: 'martyrs' },          // M - Martyrs
          { col: 13, field: 'confessors' },       // N - Confessors
          { col: 14, field: 'doctorsofthechurch' }, // O - Doctors of the Church
          { col: 15, field: 'virgins' },          // P - Virgins
          { col: 16, field: 'holywoman' },        // Q - Holy Woman
          { col: 17, field: 'mystic' },           // R - Mystic
          { col: 18, field: 'convert' },          // S - Convert
          { col: 19, field: 'blessed' },          // T - Blessed
          { col: 20, field: 'venerable' },        // U - Venerable
          { col: 21, field: 'missionary' },       // V - Missionary
          { col: 22, field: 'deacon' },           // W - Deacon
          { col: 23, field: 'priest' },           // X - Priest
          { col: 24, field: 'bishop' },           // Y - Bishop
          { col: 25, field: 'cardinal' },         // Z - Cardinal
          { col: 26, field: 'pope' },             // AA - Pope
          { col: 27, field: 'apostle' },          // AB - Apostle
          { col: 28, field: 'abbotabbess' },      // AC - Abbot/Abbess
          { col: 29, field: 'hermit' },           // AD - Hermit
          { col: 30, field: 'royalty' },          // AE - Royalty
          { col: 31, field: 'religious' },        // AF - Religious
          { col: 32, field: 'lay' },              // AG - Lay
          { col: 33, field: 'groupcompanions' },  // AH - Group/Companions
          { col: 34, field: 'churchfather' },     // AI - Church Father
          { col: 35, field: 'oldtestament' },     // AJ - Old Testament
        ];

        categoryMappings.forEach(({ col, field }) => {
          const cellValue = row[col];
          if (cellValue !== undefined && cellValue !== null && cellValue !== '') {
            const boolValue = String(cellValue).toLowerCase();
            (saintData as any)[field] = boolValue === 'true' || boolValue === '1' || parseInt(String(cellValue)) > 0;
          }
        });

        saintsToImport.push(saintData);
      } catch (error) {
        console.error(`Error processing row ${index + 3}:`, error);
      }
    });

    console.log(`Processed ${saintsToImport.length} valid saints from ${dataRows.length} rows`);

    // Import saints to Firestore in batches
    const db = assertFirestore();
    const saintsCollection = collection(db, 'saints');
    const batchSize = 500;
    const batches = [];
    let currentBatch = writeBatch(db);
    let operationCount = 0;
    let totalImported = 0;

    saintsToImport.forEach((saintData) => {
      const docRef = doc(saintsCollection);
      currentBatch.set(docRef, {
        ...saintData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      
      operationCount++;
      totalImported++;

      if (operationCount === batchSize) {
        batches.push(currentBatch);
        currentBatch = writeBatch(db);
        operationCount = 0;
      }
    });

    if (operationCount > 0) {
      batches.push(currentBatch);
    }

    // Execute all batches
    console.log(`Executing ${batches.length} batches to import ${totalImported} saints...`);
    
    for (let i = 0; i < batches.length; i++) {
      await batches[i].commit();
      console.log(`Import batch ${i + 1}/${batches.length} completed`);
    }

    return NextResponse.json({
      success: true,
      message: 'Saints imported successfully',
      totalRows: dataRows.length,
      validSaints: saintsToImport.length,
      importedCount: totalImported,
      skippedCount: dataRows.length - saintsToImport.length,
      batchesExecuted: batches.length,
    });

  } catch (error) {
    console.error('Error importing saints:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to import saints',
      },
      { status: 500 }
    );
  }
}