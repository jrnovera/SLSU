# Repository Guidelines

## Project Structure & Module Organization
The Vite-driven React app resides in `src/`. Feature screens live under `src/pages`, shared UI in `src/components`, context state in `src/contexts`, and Firebase utilities in `src/firebase`. Static assets (icons, base CSS, fonts) are colocated in `src/assets` plus `src/index.css`, while public-only files (favicon, `index.html`) stay in `public/`. Tests belong in `src/__tests__` and should mirror the folder of the feature they cover. Production bundles land in `dist/`. Keep data-fetching hooks near the component that owns the query, and extract UI repeated three or more times into its own component file.

## Build, Test, and Development Commands
- `bun install` — install dependencies (use `npm install` only when Bun is unavailable to keep `package-lock.json` synced).
- `bun run dev` — launch the Vite dev server on http://localhost:5173 with hot refresh.
- `bun run build` — generate the optimized bundle in `dist/` for Vercel.
- `bun run preview` — serve the production bundle locally; run before handoff.
- `bun run lint` — execute the flat ESLint config with React Hooks and Refresh plugins.

## Coding Style & Naming Conventions
Author React 19 function components with hooks, 2-space indentation, semicolons, and single quotes. Name components, hooks, and files in PascalCase (e.g., `ProfileViewModal.jsx`, `useAuthContext.js`). Favor descriptive prop names, keep Tailwind utility chains short, and move shared styling into CSS modules or reusable components. Run `bun run lint` prior to every commit to catch order-of-hooks violations early.

## Testing Guidelines
Adopt Vitest + Testing Library under `src/__tests__`, naming files `FeatureName.test.jsx`. Cover critical flows—authentication, population stats lookups, and modal workflows. Until automated coverage exists, attach a concise manual test plan in the PR describing scenarios exercised, commands run, and screenshots if UI changed. Mirror `bun run test` when adding scripts.

## Commit & Pull Request Guidelines
Use lowercase imperative prefixes (`feat:`, `fix:`, `chore:`). Keep subjects under 72 characters and bundle only related changes per commit. PRs must include a summary, linked Linear/Jira ticket, screenshots or GIFs for UI updates, evidence of tests (`bun run lint`, manual checklist), and any deployment considerations (migrations, env vars). Request review from a Firebase-aware maintainer before merging.

## Security & Configuration Tips
Never commit live credentials. Copy `.env.example` to `.env.local` and fill every `VITE_FIREBASE_*` plus `VITE_FIREBASE_STORAGE_BUCKET_GS`. Verify Firestore security rules before exposing new collections or queries. Remove cached credentials and blur sensitive data when sharing demos or logs.
