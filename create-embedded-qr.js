const QRCode = require('qrcode');
const { createCanvas, loadImage, registerFont } = require('canvas');
const fs = require('fs');
const https = require('https');

async function downloadFont() {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream('SortsMillGoudy-Regular.ttf');
    https.get('https://fonts.gstatic.com/s/sortsmillgoudy/v15/Qw3GZR9MED_6PSuS_50nEaVrfzgEXH0OjpM75PE.ttf', (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink('SortsMillGoudy-Regular.ttf', () => {});
      reject(err);
    });
  });
}

async function createEmbeddedQR() {
  try {
    // Download and register the font
    await downloadFont();
    registerFont('SortsMillGoudy-Regular.ttf', { family: 'Sorts Mill Goudy' });
    const url = 'http://saintfest.community';
    
    // Generate QR code with high error correction to allow for embedded content
    const qrDataURL = await QRCode.toDataURL(url, {
      width: 500,
      margin: 2,
      errorCorrectionLevel: 'H', // High error correction (30% redundancy)
      color: {
        dark: '#8FBC8F',  // Mint green
        light: '#FFFFFF'  // White
      }
    });
    
    // Create canvas
    const canvas = createCanvas(500, 500);
    const ctx = canvas.getContext('2d');
    
    // Load and draw QR code
    const qrImage = await loadImage(qrDataURL);
    ctx.drawImage(qrImage, 0, 0, 500, 500);
    
    // Calculate center area for embedding title aligned to QR grid
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    // QR code has 37x37 modules with 2-module margin on each side
    // Total canvas is 500px, so each module is about 500/37 ≈ 13.5px
    const moduleSize = 500 / 37;
    
    // Align to QR grid - use 13 modules wide by 5 modules tall for more padding
    const embedWidth = Math.round(13 * moduleSize);   // 13 modules wide (more padding)
    const embedHeight = Math.round(5 * moduleSize);   // 5 modules tall
    
    // Center position aligned to module boundaries
    const embedX = Math.round(centerX - embedWidth / 2);
    const embedY = Math.round(centerY - embedHeight / 2);
    
    // Draw white background for title aligned to QR grid
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(embedX, embedY, embedWidth, embedHeight);
    
    // Draw "Saintfest" title with Sorts Mill Goudy styling
    ctx.fillStyle = '#8FBC8F';
    ctx.font = '600 40px "Sorts Mill Goudy"';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Saintfest', centerX, centerY);
    
    // Save as PNG
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync('saintfest-embedded-qr.png', buffer);
    
    // Create SVG version with proper font family
    const svgQR = await QRCode.toString(url, {
      type: 'svg',
      width: 500,
      margin: 2,
      errorCorrectionLevel: 'H',
      color: {
        dark: '#8FBC8F',
        light: '#FFFFFF'
      }
    });
    
    // Create custom SVG with embedded title using Sorts Mill Goudy
    const customSVG = `
<svg width="500" height="500" xmlns="http://www.w3.org/2000/svg">
  <!-- QR Code Background -->
  ${svgQR.replace('<svg', '<g').replace('</svg>', '</g>').replace(/xmlns="[^"]*"/, '').replace(/width="[^"]*"/, '').replace(/height="[^"]*"/, '')}
  
  <!-- Embedded title background aligned to QR grid -->
  <rect x="${embedX}" y="${embedY}" width="${embedWidth}" height="${embedHeight}" fill="#FFFFFF"/>
  
  <!-- Embedded title text with proper font -->
  <text x="250" y="${embedY + embedHeight/2 + 5}" font-family="'Sorts Mill Goudy'" 
        font-size="40" font-weight="600" text-anchor="middle" fill="#8FBC8F">Saintfest</text>
</svg>`;
    
    fs.writeFileSync('saintfest-embedded-qr.svg', customSVG);
    
    console.log('Embedded QR codes created successfully!');
    console.log('- PNG: saintfest-embedded-qr.png');
    console.log('- SVG: saintfest-embedded-qr.svg');
    console.log(`URL: ${url}`);
    console.log('Features: Mint green QR with "Saintfest" title in Sorts Mill Goudy font');
    console.log('Error correction: High (30% redundancy allows for embedded content)');
    
  } catch (error) {
    console.error('Error creating embedded QR code:', error);
  }
}

createEmbeddedQR();