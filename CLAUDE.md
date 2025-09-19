# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is "saintfest-voting", a Next.js application for conducting community voting on saints. The application uses Firebase for authentication and data storage, and implements a tournament-style voting system where users can vote on different saints in various categories.

## Development Commands

- **Start development server**: `npm run dev` (starts on http://localhost:3000)
- **Build production**: `npm run build`
- **Start production server**: `npm start`
- **Lint code**: `npm run lint`
- **Type checking**: `npm run type-check`

## Architecture Overview

### Frontend Framework
- **Next.js 14** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Radix UI** components for accessible UI primitives

### Backend Services
- **Firebase Authentication** for user management
- **Firestore** for data storage
- **Firebase Storage** for file uploads

### Key Directory Structure
```
app/                    # Next.js App Router pages
├── auth/signin/        # Authentication pages
├── layout.tsx          # Root layout with fonts
└── page.tsx            # Homepage (currently default Next.js template)

contexts/               # React contexts
└── AuthContext.tsx     # Firebase auth integration with user management

lib/                    # Utility libraries
├── firebase.ts         # Firebase configuration and service initialization
└── utils.ts            # General utilities

types/                  # TypeScript type definitions
└── index.ts            # All application types (User, Saint, Poll, etc.)

components/ui/          # Reusable UI components (Radix-based)
hooks/                  # Custom React hooks
└── useRequireAuth.ts   # Authentication guard hook
```

### Authentication System
- Firebase Authentication with email/password and Google OAuth
- Custom user documents in Firestore with roles (admin/user)
- `AuthContext` provides authentication state and methods
- `useRequireAuth` hook for protecting routes

### Data Models
The application uses comprehensive TypeScript interfaces for:
- **User**: Basic user info with roles and timestamps
- **Saint**: Complete saint data including feast days, categories, historical info
- **Poll**: Voting polls with multiple types (single, multiple, ranked)
- **Vote**: User votes with support for rankings
- **Bracket**: Tournament-style bracket system
- **Category**: Saint categorization system

### File Naming Convention
Some files use colon notation in names (e.g., `lib:firebase.ts`, `contexts:AuthContext.tsx`). Access these files using the full colon-separated path.

## Environment Variables Required
```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
```

## Key Features to Understand
1. **Tournament Voting System**: Saints compete in bracket-style tournaments
2. **Role-based Access**: Admin vs regular user permissions
3. **Real-time Updates**: Designed for live voting results
4. **Saint Management**: Complex data model for saint information
5. **Category System**: Saints organized by categories
6. **Multi-year Tournaments**: Game years track which saints were used

## Development Notes
- The project currently shows the default Next.js template on the homepage
- UI components are built on Radix UI primitives with custom styling
- Authentication is fully implemented but pages may need to be built out
- Type definitions are comprehensive and cover the full application scope
- Firebase integration is complete and ready for production use