# Folder Structure Audit

Date: 2026-05-21

## Result

The structure is mostly logical for a small Next.js portfolio:

- `src/app`: routes, layout, API endpoints.
- `src/components`: public UI and admin UI components.
- `src/lib`: Supabase and auth helpers.
- `src/data`: portfolio constants and types.
- `data`: Supabase SQL helpers and local JSON seed placeholder.
- `public`: static images, logos, manifest, service worker.
- `sources`: audit notes and screenshots from this review.

## Issues Found

- `AdminPage.tsx` is very large and mixes many admin CRUD concerns in one file.
- `SmoothScrolling.tsx` depended on Lenis but the runtime implementation blocked reliable route/section scrolling.
- `/api/projects` was present but its backing table was optional/missing.
- Temporary Playwright output was generated during validation and removed before finalizing.

## Changes Made

- Removed the unused Lenis dependency and made `SmoothScrolling.tsx` a no-op compatibility component.
- Added `data/supabase-projects.sql` to document the optional `projects` table if the endpoint is needed.
- Stored review screenshots under `sources/screenshots`.

## Recommended Follow-up

Split `AdminPage.tsx` into smaller feature modules when adding new admin functionality. The current file works, but its size increases review and regression risk.
