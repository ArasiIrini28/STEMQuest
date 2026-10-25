# Updated project delivery — 25 October 2026

This package continues the existing STEMQuest source and design. It includes all application source, original assets and curriculum, seven database migrations (including safe curriculum seed data), optional Edge Functions, tests, a lockfile and setup documentation. Dependencies, generated builds, private environment files and hosting credentials are deliberately excluded.

The previously created project PDF and Dev Duo presentation are retained in `public/downloads/` as reference materials. Current technical behavior and validation are documented in this folder. Older source ZIPs are excluded to avoid nested or conflicting project copies.

## Requested feature checklist

| Requirement | Included behavior | Verification boundary |
|---|---|---|
| Quest Companion | Actual-message intents, conversational follow-ups, daily facts, contextual help, real navigation and visible provider fallback | Local browser and mocked-provider tests; live AI needs configuration |
| Automatic facts | Welcome fact and five active-minute intervals, hidden/inactive-tab pause, safe deferral and no duplicate dialog | Timing logic and browser checks |
| Quiz reports | Automatic final-answer report with actual score, missed/unanswered answers, XP, subject/topic, retakes and duplicate prevention | Unit, embedded PostgreSQL and browser checks |
| Saved history | Local learner-specific reports; account-owned database reports and reopen controls | Local refresh verified; cloud SQL verified in embedded PostgreSQL, hosted account verification pending |
| Recommendations | Actual-result bands, prerequisites, revision, focused practice and comparable-attempt improvement | Unit and browser checks |
| Learning outcomes | Explicit finish-learning summary and actual daily progress | Unit, SQL and browser checks; no invented study duration |
| Authentication/profiles | Existing account workflows, profile preferences, role checks and row-level protection retained | SQL ownership tests; real auth delivery requires Supabase |
| Existing design/features | Lavender dashboard, worlds, courses, games, coding, simulations, achievements, rankings, calendar, settings and starter staff tools retained | Existing browser journeys rerun |
| Quality/package | Lint, types, tests, production build, archive integrity and extracted-source build | See VALIDATION.md for exact results |

## Final reliability fixes

- Account logout now restores the active browser demo learner, including saved quiz reports and earned XP, instead of overwriting it with a blank profile.
- An older account snapshot response cannot replace a newer requested snapshot or cross an account identity change.
- Cloud history shows loading status and a retry button after errors. Previously saved history can still load if checking new subject milestones fails. A loading or failed request is not presented as an empty confirmed history.
- Regression coverage verifies complete quiz/report restoration from the active roster even when the legacy snapshot is stale.

## Start and deploy

Extract the ZIP completely. Start with `START-HERE.md`. Windows users can run `START-DEMO.cmd` after installing Node.js 24. The first run needs internet to install dependencies. For editable source, run `npm ci` then `npm run dev`.

- Windows, PowerShell and GitHub: `docs/SETUP-WINDOWS.md`
- Supabase accounts, schema and migrations: `docs/SUPABASE.md`
- Optional OpenAI and email credentials/functions: `docs/SERVICES.md`
- Vercel static export deployment: `docs/DEPLOYMENT.md`
- Exact checks and limitations: `docs/VALIDATION.md`

The public demo remains browser-local. No Supabase, OpenAI, SMTP/email or Vercel credentials were available for live verification. Adding services requires applying the migrations, configuring public client values and server-only secrets, deploying the appropriate functions and testing with synthetic accounts. Nothing in this archive contains real student records or API keys.

This is the complete source of the current implementation. The much broader original master brief also describes future curriculum expansion and advanced operator/product tools; those are explicitly listed in `docs/FEATURES.md` and are not claimed as completed.
