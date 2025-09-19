import * as functions from 'firebase-functions';
import { onRequest } from 'firebase-functions/v2/https';
import type { Request } from 'firebase-functions/v2/https';
import type { Response } from 'express';

// Import Next.js app
const next = require('next');
const path = require('path');

// Configure Next.js app
const dev = false; // Always production in Cloud Functions
const nextjsDir = path.join(__dirname, '../../');
const nextjsServer = next({
  dev,
  dir: nextjsDir,
  conf: {
    // Ensure compatibility with Cloud Functions
    distDir: '.next'
  }
});
const nextjsHandle = nextjsServer.getRequestHandler();

// Export the Next.js app as a Cloud Function
export const nextjsFunc = onRequest(
  {
    // Configure function options
    region: 'us-central1',
    memory: '2GiB',
    timeoutSeconds: 60,
    maxInstances: 10,
  },
  async (request: Request, response: Response) => {
    try {
      // Prepare Next.js if not ready
      if (!nextjsServer.isReady) {
        await nextjsServer.prepare();
      }

      // Handle the request with Next.js
      return nextjsHandle(request, response);
    } catch (error) {
      console.error('Next.js function error:', error);
      return response.status(500).json({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);