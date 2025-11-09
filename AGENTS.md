# Repository Guidelines

## Project Structure & Module Organization
This Vite-powered React app lives in `src/`, with feature views under `src/pages`, reusable UI under `src/components`, shared state in `src/contexts`, and Firebase helpers inside `src/firebase`. Static assets (icons, images, base CSS) sit in `src/assets` and `src/index.css`. Public files (favicon, `index.html`) stay in `public/`, while production builds output to `dist/`. Use this separation to keep data-fetching logic close to components, and prefer colocated helper modules (e.g., `src/components/StatCard.jsx`) when a piece of UI is reused three times or more.

## Build, Test, and Development Commands
- `bun install` — install Bun-managed dependencies (keep `package-lock.json` in sync via `npm install` if Bun is unavailable in CI).
- `bun run dev` — start Vite dev server with hot reloading on http://localhost:5173.
- `bun run build` — create an optimized bundle in `dist/` for Vercel deployment.
- `bun run preview` — serve the production build locally; run this before releasing.
- `bun run lint` — execute ESLint with the repo’s flat config to catch regressions early.

## Coding Style & Naming Conventions
Follow React 19 functional components with hooks, 2-space indentation, semicolons, and single quotes for strings (see `src/components/CommunityStats.jsx`). Name components and hooks in PascalCase (`ProfileViewModal`, `useAuthContext`) and files with matching names. Keep Tailwind utility classes minimal—extract repeated styles into CSS modules or shared components. Run `bun run lint` before every PR; ESLint plugins for React hooks and refresh will flag order-of-hooks issues automatically.

## Testing Guidelines
Automated tests are not yet wired, so new features must include either unit tests (Vitest + Testing Library) under `src/__tests__` named `*.test.jsx`, or a short manual test plan in the PR description. Aim for critical-path coverage: authentication, population stats queries, and modal workflows. When adding Vitest, mirror the `bun run test` script and ensure it passes in CI before merging.

## Commit & Pull Request Guidelines
Recent history uses lowercase imperative prefixes (`feat:`, `fix:`). Continue that style, keep subject lines under 72 characters, and group logical changes into separate commits. PRs should include: summary of changes, screenshots or GIFs for UI updates, linked Linear/Jira issue, test evidence (command output or checklist), and deployment considerations (migrations, env var updates). Request review from at least one maintainer familiar with Firebase before merging.

## Security & Configuration Tips
Never commit live keys; copy `.env.example` to `.env.local` and fill every `VITE_FIREBASE_*` entry (API key, auth domain, project ID, storage buckets, messaging sender, app ID, optional measurement, plus `VITE_FIREBASE_STORAGE_BUCKET_GS`). When working with Firestore, double-check rules in the Firebase console before deploying features that expose new collections. Clear any cached credentials before recording demos or screenshots.
