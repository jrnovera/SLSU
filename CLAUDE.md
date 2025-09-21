# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React-based Indigenous People Management and Registration (IPMR) system called "Bantay Lahi" for Southern Leyte State University (SLSU). The application tracks population demographics, health conditions, and educational status for indigenous communities across various barangays.

## Development Commands

- `bunx vite` - Start development server
- `bunx vite build` - Build for production
- `bunx eslint .` - Run linter
- `bunx vite preview` - Preview production build

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
- `RoleBasedRedirect` component handles initial routing based on user role
- Three route protection levels:
  - `ProtectedRoute` - Any authenticated user
  - `AdminRoute` - Requires "IPMR" role (mapped from super_admin)
  - `SuperAdminRoute` - Requires "Chieftain" role (mapped from admin)

### Firebase Integration
- Configuration in `src/firebase/config.js`
- Firestore for user data and population records
- Firebase Storage for image uploads
- Authentication context in `src/contexts/AuthContext.jsx`

### Key Components
- Population tracking and statistics in various page components
- Family tree visualization using `@jsplumb/browser-ui`
- Google Maps integration via `google-map-react`
- Modal components for data entry and viewing
- reCAPTCHA integration for security (config in `src/config/recaptcha.js`)

### Styling
- TailwindCSS v4 for utility-first CSS
- Custom CSS files for specific components
- Component-scoped styling patterns

## Important Notes

- The project uses Bun as the package manager and runtime
- Role names have legacy mappings that must be preserved for backward compatibility
- Firebase config contains production keys - handle with care
- reCAPTCHA keys are exposed in client-side config
- Population data includes sensitive demographic information
- Image assets for different barangays are stored in `src/assets/images/`

## File Structure Highlights

- `src/pages/` - Main application pages
- `src/components/` - Reusable components and modals
- `src/contexts/` - React contexts (primarily AuthContext)
- `src/firebase/` - Firebase configuration and utilities
- `src/config/` - Application configuration files
- `src/assets/` - Static assets including barangay images and icons