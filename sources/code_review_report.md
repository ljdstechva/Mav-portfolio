# Code Review Report

Date: 2026-05-21

## Scope Reviewed

- Next.js App Router pages: `/`, `/admin`, API routes, metadata, sitemap, robots.
- Public components: header, hero, about, portfolio, process, testimonials, footer, dock, modals, preloader, service worker.
- Admin surface: login flow, Supabase auth usage, API auth requirements, upload/CRUD route wiring.
- Data layer: Supabase browser/server clients, portfolio graphics fetch, admin mutations, optional projects endpoint.

## Main Issues Found

- The landing preloader fetched and warmed the full portfolio media set before the first experience, delaying first paint.
- The hero `View Portfolio` control changed the URL hash but did not reliably scroll after the Lenis layer was removed.
- `/api/projects` returned a raw Supabase schema-cache error when the optional `projects` table was absent.
- Dock items, portfolio breadcrumbs, and several portfolio preview controls needed stronger semantic button/focus behavior.
- Admin login inputs had placeholders but no explicit labels or autocomplete hints.
- Calendly modals could show a blank white iframe while the third-party scheduler initialized.
- Service worker image caching attempted unsupported cache writes for some browser-managed image responses.
- Dependency audit found vulnerable transitive packages and a vulnerable pinned Next.js version.

## Fix Summary

- Replaced full media preloading with a short critical-asset preloader.
- Restored Lenis smooth scrolling with a shared scroll helper, route-aware setup, cleanup, reduced-motion handling, and modal pause/resume behavior.
- Hardened `/api/projects` errors and added an optional Supabase setup SQL file.
- Converted header, dock, portfolio breadcrumb, carousel, copywriting, and photo-editing interactions to more accessible buttons/focusable controls.
- Added focus-visible styles, reduced-motion handling, admin login labels, iframe titles, and loading/fallback modal states.
- Updated Next.js and `eslint-config-next` to `16.2.6`, restored `lenis`, and refreshed the lockfile.
- Lowered the dock overlay layer and limited dock pointer events to the actual icon buttons so fixed navigation no longer blocks portfolio cards or modal controls.
- Fixed Reels `Show More` so it expands content in place instead of jumping into the next Process section.

## Notes

`npm run lint` passes with 30 existing warnings from dynamic `<img>` usage in admin/media preview surfaces. These warnings are not build blockers; converting all dynamic external media previews to `next/image` should be a separate, focused media optimization pass.
