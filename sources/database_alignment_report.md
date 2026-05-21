# Database Alignment Report

Date: 2026-05-21

## Supabase Tables Observed Through Code

- Public portfolio: `industries`, `clients`, `carousels`, `copywriting`, `reels`, `stories`, `photo_editing`, `ai_images`, `ai_videos`, `portfolio_category_order`.
- Admin APIs: insert, update, delete, reorder, category order, upload, and admin data routes use authenticated Supabase bearer tokens.
- Optional legacy endpoint: `projects`.

## API Validation

| Endpoint | Result | Notes |
| --- | --- | --- |
| `/api/portfolio-graphics` | Pass | Returned 8 industries, 88 clients, 39 carousels, 9 reels, 8 stories, 5 copywriting items, 3 photo editing items, 6 AI images, 3 AI videos, and 8 category order rows. |
| `/api/admin-data` without auth | Pass | Returned 401. |
| `/api/admin-insert` without auth | Pass | Returned 401. |
| `/api/projects` | Pass with setup warning | Now returns `[]` and `X-MAV-Data-Warning` if the optional table is missing instead of leaking the Supabase schema-cache error. |

## Changes Made

- Centralized `/api/projects` auth through `ensureSupabaseAuthed`.
- Added invalid JSON handling and generic server errors for the optional projects endpoint.
- Added `data/supabase-projects.sql` with a safe optional table definition and RLS policies.
- Verified the `stories` table directly with the Supabase service role: 8 rows exist with `id`, `video_url`, `created_at`, and `sort_order`.
- Found that all 8 saved Story `video_url` values point to `my.canva.site/_assets/video/...` assets that now return HTTP 404. The public UI now shows the saved story records with an unavailable-media state instead of incorrectly showing an empty section.
- Enabled Supabase Storage uploads for `stories.video_url` so future Story uploads can use durable `portfolio/stories/video_url/...` assets instead of temporary Canva asset URLs.

## Remaining Verification Limit

I did not mutate production Supabase data. The existing 8 Story rows need their broken Canva URLs replaced by re-uploading the original story videos through Admin.
