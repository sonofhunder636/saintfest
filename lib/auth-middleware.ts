import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from './firebase-admin';

// Admin email whitelist - matches the one in AuthContext.tsx
const ADMIN_EMAIL = 'andrewfisher1024@gmail.com';

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
      const isAdmin = userEmail === ADMIN_EMAIL;

      if (!isAdmin) {
        return {
          isValid: false,
          userEmail,
          error: `Access denied. Only ${ADMIN_EMAIL} has admin privileges.`
        };
      }

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