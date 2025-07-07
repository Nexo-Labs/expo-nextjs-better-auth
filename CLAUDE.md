# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Pafe Portal** is a monorepo using Turborepo with pnpm, containing:
- `apps/next/` - Next.js web application with Better-Auth authentication
- `apps/pafe-app/` - Expo React Native mobile app
- `packages/` - Shared packages (currently empty)

## Architecture Discrepancy

**Important**: The `.cursor/rules/architecture-rule.mdc` documents a PayloadCMS + GraphQL architecture, but the current implementation uses Better-Auth with Next.js. The project appears to be in transition from the documented architecture to a simpler Better-Auth based system.

## Development Commands

### Root Level (Turborepo)
```bash
pnpm dev          # Start all apps in development
pnpm build        # Build all apps
pnpm start        # Start all apps in production
pnpm dev:web      # Start only web app
pnpm build:web    # Build only web app
```

### Next.js App (`apps/next/`)
```bash
pnpm dev          # Development server
pnpm build        # Production build (runs yarn build from root first)
pnpm start        # Production server
pnpm serve        # Production server on port 8151
pnpm test         # Run Vitest tests
pnpm lint         # ESLint checks
```

### Expo App (`apps/pafe-app/`)
```bash
pnpm start        # Start Expo development server
pnpm android      # Start Android development
pnpm ios          # Start iOS development
pnpm web          # Start web development
pnpm lint         # ESLint checks
```

## Technology Stack

### Next.js App
- **Framework**: Next.js 14 with App Router
- **Authentication**: Better-Auth (not PayloadCMS as documented)
- **Database**: Better-SQLite3 with authentication tables
- **Social Login**: Google OAuth integration
- **Testing**: Vitest with comprehensive build tests
- **Cross-platform**: Includes React Native Web support

### Expo App
- **Framework**: Expo SDK 53 with Expo Router
- **Authentication**: Google OAuth via Better-Auth backend
- **Navigation**: Stack navigation with authentication routing
- **React Native**: Version 0.79.5
- **New Architecture**: Enabled (Fabric/TurboModules)
- **Platforms**: iOS, Android, and Web
- **Structure**: Clean, minimal setup with login/dashboard flow

## Authentication System

The project uses **Better-Auth** (not PayloadCMS as documented):
- Server-side authentication with SQLite database
- Google OAuth social login
- Session management with automatic redirects
- JWT-based authentication for mobile app integration

## Testing

### Next.js Testing
- **Framework**: Vitest with single-threaded pool
- **Build Tests**: Comprehensive build verification tests
- **Timeout**: 60-second timeout for build tests
- **Coverage**: Tests verify routing, chunking, and build output

Run tests with: `pnpm test` (in Next.js app directory)

## Package Management

- **Package Manager**: pnpm (version 10.5.0)
- **Hoisting**: Managed by Turborepo
- **Installation**: Always use `pnpm install` from root

## Development Setup

1. Install dependencies: `pnpm install`
2. Set up environment variables (Google OAuth credentials)
3. Start development: `pnpm dev`
4. Web app: `http://localhost:3000`
5. Mobile app: Use Expo Go or simulators

## Docker & Deployment

- **Production**: Docker setup with PostgreSQL 17
- **Development**: Uses Better-SQLite3 locally
- **Scripts**: Available in `scripts/` directory

## Key Files

- `turbo.json` - Turborepo configuration
- `apps/next/lib/auth.ts` - Better-Auth configuration
- `apps/next/vitest.config.ts` - Test configuration
- `apps/pafe-app/app.json` - Expo configuration