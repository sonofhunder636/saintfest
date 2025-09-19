import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from './firebase-admin';

// Enhanced admin email whitelist for security
const ADMIN_EMAILS = [
  'andrewfisher1024@gmail.com',
  'andyhund636@gmail.com'
  // Add other admin emails here
];

export interface AuthResult {
  isValid: boolean;
  userEmail?: string;
  userId?: string;
  error?: string;
}

/**
 * Validates admin access for API routes using Firebase Admin SDK
 * This works with the existing frontend authentication system
 */
export async function validateAdminAccess(request: NextRequest): Promise<AuthResult> {
  try {
    // Extract Firebase token from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        isValid: false,
        error: 'Missing or invalid Authorization header. Expected: Bearer <token>'
      };
    }

    const token = authHeader.replace('Bearer ', '');
    if (!token || token.trim() === '') {
      return {
        isValid: false,
        error: 'Empty authentication token'
      };
    }

    try {
      // Verify the Firebase token using Admin SDK
      const decodedToken = await adminAuth.verifyIdToken(token);

      // Verify the email matches our admin whitelist
      const userEmail = decodedToken.email;
      const isAdmin = ADMIN_EMAILS.includes(userEmail || '');

      if (!isAdmin) {
        console.warn(`Unauthorized admin access attempt: ${userEmail} at ${new Date().toISOString()}`);
        return {
          isValid: false,
          userEmail,
          error: `Access denied. User not in admin whitelist.`
        };
      }

      // Enhanced logging for security audit trail
      console.log(`Admin access granted: ${userEmail} at ${new Date().toISOString()}`);

      return {
        isValid: true,
        userEmail,
        userId: decodedToken.uid
      };

    } catch (tokenError) {
      console.error('Token verification failed:', tokenError);
      return {
        isValid: false,
        error: 'Invalid or expired authentication token'
      };
    }

  } catch (error) {
    console.error('Auth middleware error:', error);
    return {
      isValid: false,
      error: 'Authentication verification failed'
    };
  }
}

/**
 * Middleware wrapper that automatically handles admin authentication
 * Usage: export const POST = withAdminAuth(async (request, authResult) => { ... });
 */
export function withAdminAuth(
  handler: (request: NextRequest, authResult: AuthResult) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
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

    // Call the original handler with auth info
    return handler(request, authResult);
  };
}

/**
 * Simple helper to create admin-only API responses
 */
export function createAdminAuthError(message?: string): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: message || 'Admin authentication required',
      requiresAuth: true,
      adminEmail: ADMIN_EMAIL
    },
    { status: 401 }
  );
}