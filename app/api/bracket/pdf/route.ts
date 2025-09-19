// app/api/bracket/pdf/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Bracket } from '@/types';
import { generateBracketPDF } from '@/lib/pdfGenerator';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    // Check Firebase connection
    if (!db) {
      return NextResponse.json({
        success: false,
        error: 'Database connection not available'
      }, { status: 503 });
    }

    const { bracketId } = await request.json();

    if (!bracketId) {
      return NextResponse.json({ error: 'Bracket ID is required' }, { status: 400 });
    }

    // Get the bracket from database
    const bracketDoc = await getDoc(doc(db, 'brackets', bracketId));
    
    if (!bracketDoc.exists()) {
      return NextResponse.json({ error: 'Bracket not found' }, { status: 404 });
    }

    const bracket = { id: bracketDoc.id, ...bracketDoc.data() } as Bracket;

    // Generate PDF
    const { pdfBuffer, downloadUrl } = await generateBracketPDF(bracket);

    // Update bracket with download URL
    await updateDoc(doc(db, 'brackets', bracketId), {
      downloadUrl,
      updatedAt: new Date()
    });

    // Return PDF as response
    return new Response(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${bracket.title.replace(/\s+/g, '_')}_Bracket.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });

  } catch (error) {
    console.error('PDF generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF' }, 
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check Firebase connection
    if (!db) {
      return NextResponse.json({
        success: false,
        error: 'Database connection not available'
      }, { status: 503 });
    }

    const { searchParams } = new URL(request.url);
    const bracketId = searchParams.get('bracketId');

    if (!bracketId) {
      return NextResponse.json({ error: 'Bracket ID is required' }, { status: 400 });
    }

    // Get the bracket to check if PDF already exists
    const bracketDoc = await getDoc(doc(db, 'brackets', bracketId));
    
    if (!bracketDoc.exists()) {
      return NextResponse.json({ error: 'Bracket not found' }, { status: 404 });
    }

    const bracket = { id: bracketDoc.id, ...bracketDoc.data() } as Bracket;

    if (bracket.downloadUrl) {
      return NextResponse.json({ downloadUrl: bracket.downloadUrl });
    }

    return NextResponse.json({ downloadUrl: null });

  } catch (error) {
    console.error('PDF check error:', error);
    return NextResponse.json(
      { error: 'Failed to check PDF status' }, 
      { status: 500 }
    );
  }
}