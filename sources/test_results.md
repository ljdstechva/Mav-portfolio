# Test Results

Date: 2026-05-21

## Commands

| Command | Result | Notes |
| --- | --- | --- |
| `npm run lint` | Pass with warnings | 30 existing `@next/next/no-img-element` warnings for dynamic media previews. |
| `npm run build` | Pass | Production build passed on Next.js 16.2.6. |
| `npm audit --audit-level=moderate` | Partial | Remaining moderate Next/PostCSS advisory has no safe current stable fix; `npm audit fix --force` suggests a breaking downgrade to Next 9.3.3. |

## Browser Functional Checks

| Feature | Result | Notes |
| --- | --- | --- |
| Desktop homepage render | Pass | Screenshot captured. |
| Mobile homepage render | Pass | Screenshot captured. |
| Tablet homepage render | Pass | Screenshot captured. |
| Start a Project modal | Pass | Calendly modal opens and close control is accessible. |
| Lenis smooth scroll | Pass | `html` receives Lenis classes on `/`; scroll helper uses Lenis `scrollTo` with measured targets and falls back to native scrolling. |
| View Portfolio CTA | Pass | Scrolls to portfolio reliably on desktop, tablet, and mobile. |
| Dock navigation | Pass | Home, About, Work, and Contact controls scroll to the expected sections. |
| Graphic Designs gallery modal | Pass | Industry gallery opens; image lightbox opens, next/previous controls work, and close control is accessible. |
| Carousel modal | Pass | Carousel card opens modal; close control works. |
| Photo Editing modal | Pass | Before/after preview opens; close control works. |
| Copywriting modal | Pass | Preview opens from keyboard/focusable control; close control works. |
| Reels Show More | Pass | Expands in place after fix; no longer jumps to Process section. |
| AI Images category | Pass | Category opens and media appears. |
| AI Videos category | Pass | Category opens, video cards appear, and play/mute controls change state. |
| Stories category | Pass | Opens and renders saved Story records; unavailable media cards appear for broken Canva asset URLs. |
| Stories database check | Pass with data issue found | Supabase has 8 Story rows; all stored Canva asset URLs return HTTP 404, so the UI now shows unavailable story cards instead of a false empty state. |
| Portfolio spacing check | Pass | Desktop and mobile screenshots captured after reducing oversized category grid gaps. |
| Admin login screen | Pass | Renders unauthenticated state with labeled inputs and autocomplete. |
| Console/page errors | Pass | No app console errors or page errors during final interaction pass. |

## API Checks

| Endpoint | Result | Notes |
| --- | --- | --- |
| `/api/portfolio-graphics` | Pass | Returned expected portfolio data counts. |
| `/api/admin-data` without auth | Pass | 401. |
| `/api/admin-insert` without auth | Pass | 401. |
| `/api/projects` | Pass with warning | Safe empty response until optional table is applied. |
