import { NextResponse } from 'next/server';
import { PublishedBracket } from '@/types';
import fs from 'fs/promises';
import path from 'path';

export async function GET() {
  try {
    const publishedDir = path.join(process.cwd(), 'data', 'published_brackets');
    const currentBracketFile = path.join(publishedDir, 'current.json');

    // Check if current bracket exists
    try {
      const bracketData = await fs.readFile(currentBracketFile, 'utf-8');
      const publishedBracket: PublishedBracket = JSON.parse(bracketData);

      return NextResponse.json({
        success: true,
        bracket: publishedBracket
      });

    } catch (fileError) {
      // No current bracket published
      return NextResponse.json({
        success: true,
        bracket: null,
        message: 'No bracket currently published'
      });
    }

  } catch (error) {
    console.error('Failed to fetch current bracket:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch bracket'
    }, { status: 500 });
  }
}