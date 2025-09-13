// lib/pdfGenerator.ts
import puppeteer from 'puppeteer';
import { Bracket, PublishedBracket } from '@/types';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

export interface PDFGenerationResult {
  pdfBuffer: Buffer;
  downloadUrl: string;
}

export async function generateBracketPDF(bracket: Bracket): Promise<PDFGenerationResult> {
  let browser = null;

  try {
    // Launch browser
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    // Set page size to letter landscape
    await page.setViewport({ width: 1100, height: 850 });

    // Generate HTML content for the bracket
    const htmlContent = generateBracketHTML(bracket);

    // Set the HTML content
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

    // Wait for any images to load
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'letter',
      landscape: true,
      margin: {
        top: '0.5in',
        bottom: '0.5in',
        left: '0.5in',
        right: '0.5in'
      },
      printBackground: true,
      preferCSSPageSize: false
    });

    // Upload to Firebase Storage
    const fileName = `brackets/${bracket.year}/${bracket.id}.pdf`;
    const storageRef = ref(storage, fileName);
    
    await uploadBytes(storageRef, pdfBuffer, {
      contentType: 'application/pdf',
      customMetadata: {
        bracketId: bracket.id,
        year: bracket.year.toString(),
        generatedAt: new Date().toISOString()
      }
    });

    // Get download URL
    const downloadUrl = await getDownloadURL(storageRef);

    return {
      pdfBuffer: Buffer.from(pdfBuffer),
      downloadUrl
    };

  } catch (error) {
    console.error('PDF generation failed:', error);
    throw new Error('Failed to generate bracket PDF');
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

function generateBracketHTML(bracket: Bracket): string {
  const round1Matches = bracket.rounds.find(r => r.roundNumber === 1)?.matches || [];
  const round2Matches = bracket.rounds.find(r => r.roundNumber === 2)?.matches || [];
  const round3Matches = bracket.rounds.find(r => r.roundNumber === 3)?.matches || [];
  const round4Matches = bracket.rounds.find(r => r.roundNumber === 4)?.matches || [];
  const championshipMatch = bracket.rounds.find(r => r.roundNumber === 5)?.matches[0];

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${bracket.title} Bracket</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=League+Spartan:wght@400;600;700;800&display=swap');
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: 'League Spartan', sans-serif;
          background: white;
          width: 100%;
          height: 100vh;
          overflow: hidden;
        }

        .bracket-container {
          width: 100%;
          height: 100%;
          padding: 20px;
          position: relative;
        }

        .title {
          text-align: center;
          font-size: 48px;
          font-weight: 800;
          color: #2d3748;
          margin-bottom: 30px;
        }

        .title-line {
          width: 200px;
          height: 3px;
          background: linear-gradient(to right, transparent, #8FBC8F, transparent);
          margin: 10px auto 20px;
        }

        .bracket-grid {
          position: relative;
          height: calc(100% - 200px);
          width: 100%;
        }

        .category-section {
          position: absolute;
          width: 220px;
        }

        .category-section.top-left { top: 0; left: 0; }
        .category-section.top-right { top: 0; right: 0; }
        .category-section.bottom-left { bottom: 100px; left: 0; }
        .category-section.bottom-right { bottom: 100px; right: 0; }

        .category-header {
          text-align: center;
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 15px;
          font-weight: 700;
          font-size: 18px;
        }

        .match {
          background: white;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          padding: 8px;
          margin-bottom: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .match-saint {
          padding: 4px 0;
          font-size: 14px;
          font-weight: 500;
        }

        .match-divider {
          border-bottom: 1px solid #e2e8f0;
          margin: 4px 0;
        }

        .round-section {
          position: absolute;
          text-align: center;
        }

        .round-title {
          font-size: 16px;
          font-weight: 700;
          color: #4a5568;
          margin-bottom: 15px;
        }

        .round-match {
          background: white;
          border: 2px solid #8FBC8F;
          border-radius: 8px;
          padding: 12px;
          margin-bottom: 15px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        }

        .round2-left { top: 80px; left: 25%; width: 200px; }
        .round2-right { top: 80px; right: 25%; width: 200px; }
        .round3-left { top: 120px; left: 32%; width: 220px; }
        .round3-right { top: 120px; right: 32%; width: 220px; }
        .round4 { top: 160px; left: 38%; width: 240px; }
        .championship { top: 220px; left: 42%; width: 260px; }

        .championship-match {
          background: linear-gradient(135deg, #8FBC8F, #98D982);
          color: white;
          border: 3px solid #6B8E6B;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 4px 16px rgba(0,0,0,0.2);
        }

        .saints-gallery {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 120px;
          background: linear-gradient(135deg, #f0f8ff, #f5f0ff);
          border-radius: 12px;
          padding: 15px;
        }

        .gallery-title {
          text-align: center;
          font-size: 20px;
          font-weight: 700;
          color: #2d3748;
          margin-bottom: 15px;
        }

        .saints-grid {
          display: grid;
          grid-template-columns: repeat(16, 1fr);
          gap: 8px;
          height: 70px;
        }

        .saint-item {
          text-align: center;
          font-size: 10px;
        }

        .saint-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 2px;
          font-size: 16px;
        }

        /* Bracket Lines */
        .bracket-lines {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: -1;
        }
      </style>
    </head>
    <body>
      <div class="bracket-container">
        <!-- Title -->
        <div class="title">${bracket.title}</div>
        <div class="title-line"></div>

        <div class="bracket-grid">
          <!-- Categories -->
          ${bracket.categories.map(category => `
            <div class="category-section ${category.position}">
              <div class="category-header" style="background-color: ${category.color}20; color: ${category.color}; border: 2px solid ${category.color}">
                ${category.name}
              </div>
              ${round1Matches.filter(m => m.categoryPosition === category.position).map(match => `
                <div class="match">
                  <div class="match-saint">${match.saint1Name || 'TBD'}</div>
                  <div class="match-divider"></div>
                  <div class="match-saint">${match.saint2Name || 'TBD'}</div>
                </div>
              `).join('')}
            </div>
          `).join('')}

          <!-- Round 2 -->
          <div class="round-section round2-left">
            <div class="round-title">Round 2</div>
            ${round2Matches.slice(0, 4).map(match => `
              <div class="round-match">
                <div class="match-saint">${match.saint1Name || 'TBD'}</div>
                <div class="match-divider"></div>
                <div class="match-saint">${match.saint2Name || 'TBD'}</div>
              </div>
            `).join('')}
          </div>

          <div class="round-section round2-right">
            <div style="height: 25px;"></div> <!-- Spacer for title alignment -->
            ${round2Matches.slice(4, 8).map(match => `
              <div class="round-match">
                <div class="match-saint">${match.saint1Name || 'TBD'}</div>
                <div class="match-divider"></div>
                <div class="match-saint">${match.saint2Name || 'TBD'}</div>
              </div>
            `).join('')}
          </div>

          <!-- Round 3 - Elite Eight -->
          <div class="round-section round3-left">
            <div class="round-title">Elite Eight</div>
            ${round3Matches.slice(0, 2).map(match => `
              <div class="round-match">
                <div class="match-saint">${match.saint1Name || 'TBD'}</div>
                <div class="match-divider"></div>
                <div class="match-saint">${match.saint2Name || 'TBD'}</div>
              </div>
            `).join('')}
          </div>

          <div class="round-section round3-right">
            <div style="height: 25px;"></div> <!-- Spacer -->
            ${round3Matches.slice(2, 4).map(match => `
              <div class="round-match">
                <div class="match-saint">${match.saint1Name || 'TBD'}</div>
                <div class="match-divider"></div>
                <div class="match-saint">${match.saint2Name || 'TBD'}</div>
              </div>
            `).join('')}
          </div>

          <!-- Round 4 - Final Four -->
          <div class="round-section round4">
            <div class="round-title">Final Four</div>
            ${round4Matches.map(match => `
              <div class="round-match">
                <div class="match-saint">${match.saint1Name || 'TBD'}</div>
                <div class="match-divider"></div>
                <div class="match-saint">${match.saint2Name || 'TBD'}</div>
              </div>
            `).join('')}
          </div>

          <!-- Championship -->
          ${championshipMatch ? `
            <div class="round-section championship">
              <div class="round-title" style="color: white;">Championship</div>
              <div class="championship-match">
                <div class="match-saint" style="font-size: 16px; font-weight: 700;">${championshipMatch.saint1Name || 'TBD'}</div>
                <div class="match-divider" style="border-color: rgba(255,255,255,0.3);"></div>
                <div class="match-saint" style="font-size: 16px; font-weight: 700;">${championshipMatch.saint2Name || 'TBD'}</div>
              </div>
            </div>
          ` : ''}

          <!-- SVG Lines for bracket connections would go here -->
          <svg class="bracket-lines" width="100%" height="100%">
            <!-- Simplified bracket lines -->
            ${generateBracketLineSVG()}
          </svg>
        </div>

        <!-- Saints Gallery -->
        <div class="saints-gallery">
          <div class="gallery-title">Saints of ${bracket.year}</div>
          <div class="saints-grid">
            ${bracket.categories.flatMap(cat => cat.saints).map(saint => `
              <div class="saint-item">
                <div class="saint-avatar">👤</div>
                <div style="font-size: 8px; line-height: 1;">${saint.name.split(' ')[0]}</div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generateBracketLineSVG(): string {
  // Simplified bracket connection lines
  return `
    <defs>
      <style>
        .bracket-line { stroke: #d1d5db; stroke-width: 2; fill: none; }
      </style>
    </defs>
    
    <!-- Connecting lines from categories to Round 2 -->
    <line x1="220" y1="80" x2="280" y2="80" class="bracket-line"/>
    <line x1="220" y1="160" x2="280" y2="160" class="bracket-line"/>
    <line x1="280" y1="80" x2="280" y2="160" class="bracket-line"/>
    <line x1="280" y1="120" x2="320" y2="120" class="bracket-line"/>
    
    <!-- Mirror lines for right side -->
    <line x1="780" y1="80" x2="840" y2="80" class="bracket-line"/>
    <line x1="780" y1="160" x2="840" y2="160" class="bracket-line"/>
    <line x1="780" y1="80" x2="780" y2="160" class="bracket-line"/>
    <line x1="740" y1="120" x2="780" y2="120" class="bracket-line"/>
  `;
}

export async function generatePublishedBracketPDF(publishedBracket: PublishedBracket): Promise<Buffer> {
  let browser = null;

  try {
    // Launch browser with performance optimizations
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor'
      ]
    });

    const page = await browser.newPage();

    // Set page size for optimal PDF rendering
    await page.setViewport({ width: 960, height: 720 });

    // Generate HTML content for the published bracket
    const htmlContent = generatePublishedBracketHTML(publishedBracket);

    // Set the HTML content
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

    // No wait needed - static HTML content

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'letter',
      landscape: true,
      margin: {
        top: '0.3in',
        bottom: '0.3in',
        left: '0.3in',
        right: '0.3in'
      },
      printBackground: true,
      preferCSSPageSize: false
    });

    return Buffer.from(pdfBuffer);

  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

function generatePublishedBracketHTML(bracket: PublishedBracket): string {
  // Calculate proper scale for 8.5x11 paper (usable area: 960x720px)
  // Bracket dimensions: 2780x1630px → Target: 960x720px
  const scale = 0.345;

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${bracket.title} Bracket</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Cormorant:wght@400;600;700&family=Sorts+Mill+Goudy:ital,wght@0,400;1,400&display=swap');

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: 'Cormorant', serif;
          background: white;
          width: 100%;
          height: 100vh;
          overflow: hidden;
          color: #2D3748;
        }

        .bracket-container {
          width: ${bracket.dimensions.totalWidth * scale}px;
          height: ${bracket.dimensions.totalHeight * scale}px;
          position: relative;
          margin: 20px auto;
        }

        .bracket-match {
          position: absolute;
          background: white;
          border: 1px solid #CBD5E0;
          border-radius: 4px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          font-size: ${12 * scale}px;
        }

        .saint-slot {
          height: 50%;
          width: 100%;
          padding: ${4 * scale}px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 500;
        }

        .saint-slot.top {
          border-bottom: 1px solid #E2E8F0;
        }

        .saint-seed {
          font-size: ${10 * scale}px;
          color: #718096;
          margin-left: ${4 * scale}px;
        }

        .category-label {
          position: absolute;
          width: ${200 * scale}px;
          height: ${200 * scale}px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #CBD5E0;
          border-radius: 4px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          font-family: 'Sorts Mill Goudy', serif;
          font-weight: bold;
          font-size: ${16 * scale}px;
          color: #2D3748;
        }

        .bracket-title {
          position: absolute;
          left: 50%;
          top: ${50 * scale}px;
          transform: translateX(-50%);
          text-align: center;
          font-family: 'Sorts Mill Goudy', serif;
          font-weight: bold;
          font-size: ${48 * scale}px;
          color: #4A5568;
          opacity: 0.8;
        }

        .center-overlay {
          position: absolute;
          text-align: center;
          pointer-events: none;
          font-family: 'Sorts Mill Goudy', serif;
          font-weight: bold;
          font-size: ${48 * scale}px;
          color: rgba(55, 65, 81, 0.8);
          opacity: 0.8;
          line-height: 1.1;
        }

        .connection-lines {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 1;
        }

        .print-footer {
          position: fixed;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          text-align: center;
          font-size: 10px;
          color: #718096;
          font-family: 'Sorts Mill Goudy', serif;
        }
      </style>
    </head>
    <body>
      <div class="bracket-container">

        <!-- Connection Lines -->
        <svg class="connection-lines" width="${bracket.dimensions.totalWidth * scale}px" height="${bracket.dimensions.totalHeight * scale}px">
          ${bracket.connections.map(connection => `
            <line
              x1="${connection.x1 * scale}"
              y1="${connection.y1 * scale}"
              x2="${connection.x2 * scale}"
              y2="${connection.y2 * scale}"
              stroke="#9CA3AF"
              stroke-width="${connection.strokeWidth * scale}"
              opacity="0.8"
            />
          `).join('')}
        </svg>

        <!-- Tournament Matches -->
        ${bracket.matches.map(match => `
          <div class="bracket-match" style="
            left: ${match.position.x * scale}px;
            top: ${match.position.y * scale}px;
            width: ${match.position.width * scale}px;
            height: ${match.position.height * scale}px;
          ">
            <div class="saint-slot top">
              ${match.saint1Name ? `
                ${match.saint1Name}
                ${match.saint1Seed ? `<span class="saint-seed">(${match.saint1Seed})</span>` : ''}
              ` : ''}
            </div>
            <div class="saint-slot">
              ${match.saint2Name ? `
                ${match.saint2Name}
                ${match.saint2Seed ? `<span class="saint-seed">(${match.saint2Seed})</span>` : ''}
              ` : ''}
            </div>
          </div>
        `).join('')}

        <!-- Category Labels -->
        ${bracket.categories.map(category => `
          <div class="category-label" style="
            left: ${category.labelPosition.x * scale}px;
            top: ${category.labelPosition.y * scale}px;
            background-color: ${category.color || 'rgba(255, 255, 255, 0.9)'};
          ">
            ${category.name}
          </div>
        `).join('')}

        <!-- Center Overlay -->
        ${bracket.centerOverlay ? `
          <div class="center-overlay" style="
            left: ${bracket.centerOverlay.x * scale}px;
            top: ${bracket.centerOverlay.y * scale}px;
            transform: translate(-50%, -50%);
          ">
            ${bracket.centerOverlay.text.map(line => `<div>${line}</div>`).join('')}
          </div>
        ` : ''}

        <!-- Title -->
        <div class="bracket-title">
          ${bracket.title}
        </div>

      </div>

      <div class="print-footer">
        Generated from Saintfest ${bracket.year} • Fill in your predictions!
      </div>

    </body>
    </html>
  `;
}