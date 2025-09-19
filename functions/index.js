const { onRequest } = require('firebase-functions/v2/https');
const { setGlobalOptions } = require('firebase-functions/v2');

// Set global options for all functions
setGlobalOptions({
  maxInstances: 10,
  region: 'us-central1',
  memory: '1GiB',
  timeoutSeconds: 60,
});

// Initialize Firebase Admin SDK
const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp();
}

// Import Next.js server
const next = require('next');
const path = require('path');

// Determine if we're in development mode
const dev = process.env.NODE_ENV !== 'production';

// Create Next.js app with proper configuration
const app = next({
  dev,
  dir: __dirname,
  conf: {
    // Configure for Firebase Functions deployment
    distDir: '.next',
    // Handle public assets correctly
    assetPrefix: '',
    // Configure for serverless deployment
    output: 'standalone',
    // Ensure proper build output
    experimental: {
      outputFileTracingRoot: path.join(__dirname, '../'),
    }
  }
});

const handle = app.getRequestHandler();

// Prepare the app once
let appReady = false;
const prepareApp = async () => {
  if (!appReady) {
    console.log('Preparing Next.js app...');
    await app.prepare();
    appReady = true;
    console.log('Next.js app ready!');
  }
};

// Export the Firebase Function that serves Next.js
exports.nextjsFunc = onRequest({
  region: 'us-central1',
  memory: '1GiB',
  timeoutSeconds: 60,
  maxInstances: 10,
}, async (req, res) => {
  try {
    // Prepare Next.js if not already done
    await prepareApp();

    // Handle the request with Next.js
    return handle(req, res);
  } catch (error) {
    console.error('Error in Next.js function:', error);

    // Ensure we send a proper response
    if (!res.headersSent) {
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to handle request',
        timestamp: new Date().toISOString()
      });
    }
  }
});

// Export health check function
exports.healthCheck = onRequest({
  region: 'us-central1',
  memory: '128MiB',
  timeoutSeconds: 10,
}, (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'saintfest-functions',
    version: '1.0.0'
  });
});