import { NextRequest, NextResponse } from 'next/server';
import { PublishedBracket } from '@/types';
import { generatePublishedBracketPDF } from '@/lib/pdfGenerator';
import fs from 'fs/promises';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    // Read the current published bracket from file system
    const currentBracketPath = path.join(process.cwd(), 'data', 'published_brackets', 'current.json');

    let publishedBracket: PublishedBracket;
    try {
      const bracketData = await fs.readFile(currentBracketPath, 'utf8');
      publishedBracket = JSON.parse(bracketData);
    } catch (error) {
      return NextResponse.json({ error: 'No published bracket available' }, { status: 404 });
    }

    // Generate PDF
    const pdfBuffer = await generatePublishedBracketPDF(publishedBracket);

    // Return PDF as response
    const filename = `saintfest-${publishedBracket.year}-bracket.pdf`;
    return new Response(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
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