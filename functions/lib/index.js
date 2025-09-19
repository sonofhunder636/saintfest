"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.nextjsFunc = void 0;
const https_1 = require("firebase-functions/v2/https");
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
exports.nextjsFunc = (0, https_1.onRequest)({
    // Configure function options
    region: 'us-central1',
    memory: '2GiB',
    timeoutSeconds: 60,
    maxInstances: 10,
}, async (request, response) => {
    try {
        // Prepare Next.js if not ready
        if (!nextjsServer.isReady) {
            await nextjsServer.prepare();
        }
        // Handle the request with Next.js
        return nextjsHandle(request, response);
    }
    catch (error) {
        console.error('Next.js function error:', error);
        return response.status(500).json({
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
//# sourceMappingURL=index.js.map