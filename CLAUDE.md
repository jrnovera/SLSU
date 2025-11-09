# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React-based Indigenous People Management and Registration (IPMR) system called "Bantay Lahi" for Southern Leyte State University (SLSU). The application tracks population demographics, health conditions, and educational status for indigenous communities across various barangays.

## Development Commands

- `bunx vite` or `bun run dev` - Start development server
- `bunx vite build` or `bun run build` - Build for production
- `bunx eslint .` or `bun run lint` - Run linter
- `bunx vite preview` or `bun run preview` - Preview production build

## Architecture

### Authentication & Authorization
- Firebase Authentication with role-based access control
- Three user roles with legacy naming:
  - `user` → Regular user
  - `admin` → Maps to "Chieftain" role
  - `super_admin` → Maps to "IPMR" role
- Role mapping handled in `src/firebase/config.js:getUserRole()` and `src/contexts/AuthContext.jsx`

### Routing Structure
- Role-based routing with protected routes in `src/App.jsx`
- `RoleBasedRedirect` component handles initial routing based on user role:
  - IPMR role → redirects to `/admin` (Homepage)
  - Chieftain role → redirects to `/super-admin` (SuperAdminDashboard)
  - Regular user → redirects to `/home` (Homepage)
- Three route protection levels:
  - `ProtectedRoute` - Any authenticated user
  - `AdminRoute` - Requires "IPMR" role (mapped from super_admin in Firestore)
  - `SuperAdminRoute` - Requires "Chieftain" role (mapped from admin in Firestore)
- SPA routing supported via `vercel.json` rewrites for Vercel deployment

### Firebase Integration
- Configuration in `src/firebase/config.js` with HMR-safe initialization
- Firestore for user data and population records (collection: `users`)
- Firebase Storage locked to specific bucket: `gs://bantay-lahi-project.firebasestorage.app`
- Authentication context in `src/contexts/AuthContext.jsx`:
  - Provides `currentUser`, `userRole`, `signup`, `login`, `logout`, `loading`
  - Uses `browserLocalPersistence` for session management
  - Auto-clears localStorage on logout

### Key Components
- **Pages**: 7 main pages including Homepage, TotalPopulation, SuperAdminDashboard, Login, Signup, ForgotPassword, Unauthorized
- **Modals**: IPFormModal, ProfileViewModal, ViewOnlyProfileModal, HealthCategoryModal, StudentCategoryModal, ConfirmationModal, CameraCaptureModal
- **Visualizations**:
  - Family tree using `@jsplumb/browser-ui` (FamilyTreeClassic, FamilyTreeNew)
  - Google Maps integration via `google-map-react` (LocationMap, MapView)
  - Statistics with `react-circular-progressbar` (StatCard, CommunityStats)
- **Security**: reCAPTCHA integration (config in `src/config/recaptcha.js`)

### Styling
- TailwindCSS v4 with `@tailwindcss/vite` plugin
- Custom CSS files for specific components (e.g., ProtectedRoute.css)
- Component-scoped styling patterns
- ESLint configuration with React hooks and refresh plugins

## Important Notes

- **Runtime**: Uses Bun as the package manager and runtime (not npm/yarn/pnpm)
- **Role Mapping Critical**: Role names have legacy mappings that MUST be preserved:
  - Firestore `super_admin` → Display as "IPMR"
  - Firestore `admin` → Display as "Chieftain"
  - Never change this mapping logic in `getUserRole()` functions
- **Sensitive Data**:
  - Firebase config contains production keys
  - reCAPTCHA keys are exposed in client-side config
  - Population data includes sensitive demographic information
- **Barangay Images**: 47+ barangay images stored in `src/assets/images/` with specific naming patterns
- **Deployment**: Configured for Vercel with SPA routing support via `vercel.json`

## File Structure Highlights

- `src/pages/` - Main application pages
- `src/components/` - Reusable components and modals
- `src/contexts/` - React contexts (primarily AuthContext)
- `src/firebase/` - Firebase configuration and utilities
- `src/config/` - Application configuration files
- `src/assets/` - Static assets including barangay images and icons