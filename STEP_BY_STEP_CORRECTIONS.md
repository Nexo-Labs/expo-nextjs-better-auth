# Step-by-Step Correction Guide - Pafe Portal

## Prerequisites

Before starting these corrections, ensure you have:
- Node.js 18.x or 20.x installed
- Git for version control
- Backup of current project state
- iOS/Android development environment set up (if testing mobile)

## Phase 1: Critical Fixes (Must Do First)

### Step 1: Standardize Package Manager

**Issue**: Mixed package managers causing conflicts
**Time**: 15 minutes
**Priority**: Critical

```bash
# 1. Remove conflicting package managers
rm pnpm-lock.yaml
rm -rf apps/pafe-app/node_modules
rm -rf apps/next/node_modules
rm -rf node_modules
rm apps/pafe-app/package-lock.json

# 2. Keep yarn.lock and ensure consistent yarn version
# Root package.json already specifies yarn@1.22.22 - keep this

# 3. Clean install with yarn
yarn install
```

**Verification**: `yarn --version` should show 1.22.22, no pnpm-lock.yaml should exist

### Step 2: Fix React Version Compatibility

**Issue**: React 19 in Next.js app incompatible with React 18 in mobile app
**Time**: 20 minutes
**Priority**: Critical

```bash
# 1. Downgrade React in Next.js app
cd apps/next
yarn remove react react-dom
yarn add react@18.2.0 react-dom@18.2.0

# 2. Update React Native version to match
yarn remove react-native
yarn add react-native@0.72.6

# 3. Update React Native Web for consistency
yarn remove react-native-web
yarn add react-native-web@0.19.6
```

**Verification**: Both apps should have React 18.2.0 in package.json

### Step 3: Update Expo SDK

**Issue**: Outdated Expo SDK causing compatibility issues
**Time**: 30 minutes
**Priority**: High

```bash
# 1. Navigate to mobile app
cd apps/pafe-app

# 2. Update Expo SDK to latest stable
npx expo install --fix

# 3. Update to Expo SDK 51 (latest stable)
npx expo install expo@~51.0.0
npx expo install --fix

# 4. Update React Native to match Expo SDK
npx expo install react-native@0.74.5
```

**Verification**: `apps/pafe-app/package.json` should show Expo ~51.0.0

### Step 4: Fix Package Dependencies

**Issue**: Mismatched React Native versions across apps
**Time**: 15 minutes
**Priority**: High

```bash
# 1. Update Next.js app React Native dependencies
cd apps/next
yarn remove react-native
yarn add react-native@0.74.5

# 2. Ensure React Native Web compatibility
yarn remove react-native-web
yarn add react-native-web@0.19.12
```

**Verification**: Both apps should have compatible React Native versions

## Phase 2: Configuration Improvements

### Step 5: Update Build Configuration

**Issue**: Build system issues and TypeScript errors
**Time**: 25 minutes
**Priority**: Medium

```bash
# 1. Update Next.js configuration
cd apps/next
```

Edit `next.config.js`:
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: false, // Enable type checking
  },
  transpilePackages: [
    'react-native-web',
    'expo-linking',
    'expo-constants',
    'expo-modules-core',
  ],
  experimental: {
    scrollRestoration: true,
  },
  // Add webpack config for better React Native Web support
  webpack: (config) => {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      'react-native$': 'react-native-web',
    };
    config.resolve.extensions = [
      '.web.js',
      '.web.jsx',
      '.web.ts',
      '.web.tsx',
      ...config.resolve.extensions,
    ];
    return config;
  },
};

module.exports = nextConfig;
```

### Step 6: Update Turbo Configuration

**Issue**: Turborepo not optimized for cross-platform
**Time**: 10 minutes
**Priority**: Medium

Edit `turbo.json`:
```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalEnv": ["BETTER_AUTH_SECRET", "BETTER_AUTH_URL", "GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"],
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "inputs": ["$TURBO_DEFAULT", ".env*"],
      "outputs": [".turbo/**", ".next/**", ".vercel/**", "build/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "start": {
      "dependsOn": ["^build"]
    },
    "lint": {
      "dependsOn": ["^lint"]
    },
    "test": {
      "dependsOn": ["^build"]
    }
  }
}
```

### Step 7: Simplify Authentication Configuration

**Issue**: Overly complex auth setup
**Time**: 20 minutes
**Priority**: Medium

```bash
# 1. Update mobile auth configuration
cd apps/pafe-app
```

Edit `lib/auth.tsx` to simplify:
```typescript
// Replace the complex backend URL logic with:
const BACKEND_URL = __DEV__ 
  ? Platform.OS === 'android' 
    ? 'http://10.0.2.2:3000' 
    : 'http://localhost:3000'
  : process.env.EXPO_PUBLIC_BACKEND_URL || 'https://your-production-url.com';

// Simplify Google client ID configuration
const GOOGLE_CLIENT_ID = Platform.select({
  ios: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS,
  android: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID,
  default: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB,
});
```

## Phase 3: Environment Setup

### Step 8: Create Proper Environment Configuration

**Issue**: Missing environment variables and dummy values
**Time**: 15 minutes
**Priority**: High

```bash
# 1. Create environment files
cd /Users/ruben/Developer/pafe-portal

# 2. Create .env.local for Next.js
cd apps/next
touch .env.local
```

Add to `.env.local`:
```env
BETTER_AUTH_SECRET=your-secret-key-here-minimum-32-characters
BETTER_AUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

```bash
# 3. Create .env for mobile app
cd ../pafe-app
touch .env
```

Add to `.env`:
```env
EXPO_PUBLIC_BACKEND_URL=http://localhost:3000
EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB=your-web-client-id
EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS=your-ios-client-id
EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID=your-android-client-id
```

### Step 9: Fix TypeScript Configuration

**Issue**: TypeScript errors being ignored
**Time**: 15 minutes
**Priority**: Medium

```bash
# 1. Update Next.js TypeScript config
cd apps/next
```

Edit `tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ]
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### Step 10: Update Mobile App Configuration

**Issue**: iOS/Android configuration issues
**Time**: 20 minutes
**Priority**: Medium

```bash
cd apps/pafe-app
```

Edit `app.json`:
```json
{
  "expo": {
    "name": "pafe-app",
    "slug": "pafe-app",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/images/icon.png",
    "scheme": "com.pafe.app",
    "userInterfaceStyle": "automatic",
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.pafe.app",
      "infoPlist": {
        "CFBundleURLTypes": [
          {
            "CFBundleURLName": "pafeapp",
            "CFBundleURLSchemes": ["com.pafe.app"]
          }
        ]
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "package": "com.pafe.app"
    },
    "web": {
      "bundler": "metro",
      "output": "static",
      "favicon": "./assets/images/favicon.png"
    },
    "plugins": [
      "expo-router"
    ],
    "experiments": {
      "typedRoutes": true
    }
  }
}
```

## Phase 4: Testing and Verification

### Step 11: Test Installation and Build

**Issue**: Verify all changes work correctly
**Time**: 30 minutes
**Priority**: Critical

```bash
# 1. Clean install from root
cd /Users/ruben/Developer/pafe-portal
rm -rf node_modules apps/*/node_modules
yarn install

# 2. Test Next.js app
cd apps/next
yarn run build
yarn run dev &
# Test in browser at http://localhost:3000

# 3. Test mobile app
cd ../pafe-app
npx expo start
# Test in Expo Go or simulator
```

**Verification**: Both apps should start without errors

### Step 12: Fix Any Remaining Issues

**Issue**: Address any issues found during testing
**Time**: 30-60 minutes
**Priority**: High

Common issues and fixes:
- TypeScript errors: Fix type imports and declarations
- Build errors: Check dependency versions and imports
- Runtime errors: Verify component compatibility
- Auth issues: Check environment variables and client IDs

## Phase 5: Final Optimizations

### Step 13: Add Development Scripts

**Issue**: Improve development workflow
**Time**: 10 minutes
**Priority**: Low

Update root `package.json` scripts:
```json
{
  "scripts": {
    "dev": "turbo run dev --parallel",
    "build": "turbo run build",
    "start": "turbo run start",
    "lint": "turbo run lint",
    "test": "turbo run test",
    "clean": "rm -rf node_modules apps/*/node_modules && yarn install",
    "dev:web": "turbo run dev --filter=next-app",
    "dev:mobile": "turbo run start --filter=pafe-app"
  }
}
```

### Step 14: Add Git Hooks and Linting

**Issue**: Prevent future compatibility issues
**Time**: 15 minutes
**Priority**: Low

```bash
# 1. Install development dependencies
yarn add -D @commitlint/cli @commitlint/config-conventional lint-staged

# 2. Add git hooks
npx husky install
npx husky add .husky/pre-commit "yarn lint-staged"
```

## Post-Implementation Checklist

After completing all steps:

- [ ] All package managers standardized to yarn
- [ ] React versions aligned across apps
- [ ] Expo SDK updated to latest stable
- [ ] Build configuration optimized
- [ ] Environment variables properly configured
- [ ] TypeScript errors resolved
- [ ] Both apps build successfully
- [ ] Authentication flow works
- [ ] Mobile app runs on iOS/Android
- [ ] Web app runs in browser
- [ ] No console errors during development

## Common Troubleshooting

### If builds fail:
1. Clear all node_modules and reinstall
2. Check for version conflicts in package.json files
3. Verify environment variables are set correctly

### If auth doesn't work:
1. Check Google OAuth client IDs are correct
2. Verify redirect URIs match in Google Console
3. Ensure environment variables are loaded

### If mobile app crashes:
1. Check React Native version compatibility
2. Verify Expo SDK is up to date
3. Test in different simulators/devices

### If type errors occur:
1. Check TypeScript configurations
2. Verify all imports are correct
3. Update type definitions if needed

## Estimated Total Time: 4-6 hours

This includes testing and troubleshooting. The actual implementation time depends on:
- Current project state
- Number of custom modifications
- Testing requirements
- Team experience level

---

*Created on: 2025-07-06*
*For: Pafe Portal Development Team*
*Priority: Execute Phase 1 (Critical Fixes) immediately*