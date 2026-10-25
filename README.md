# STEMQuest

A responsive, gamified STEM learning application built with Next.js App Router, TypeScript, React, Tailwind CSS, Framer Motion, and Supabase integration.

**This is a working first release with a public demo, not a completed production school platform.** The demo works without credentials and labels its sample data. Real accounts, server-backed progress, reminders, and optional AI require the external setup below. See [feature status](docs/FEATURES.md) for an explicit implemented/unverified/demo/blocked breakdown.

## Start from the ZIP

This update repairs Quest Companion, changes automatic facts to five active minutes, and adds saved quiz/subject reports. Read [assistant and reports guide](docs/ASSISTANT-AND-REPORTS.md) for the diagnosis, behavior and setup. Previous recommendations, session summaries, games and design are retained.

The final source package also restores the selected demo learner after account logout, protects against stale account snapshot responses, and adds report-loading feedback and retry. See [delivery notes](docs/DELIVERY.md) for the requested feature checklist and service requirements.

Read [START-HERE.md](START-HERE.md). With Node installed, Windows users can double-click `START-DEMO.cmd`; it installs dependencies and builds the first preview. This source-only ZIP excludes generated builds and dependencies. Internet access is needed for the initial installation. See [Windows and GitHub instructions](docs/SETUP-WINDOWS.md) and [upgrade notes](docs/UPGRADE.md).

## Run locally

Use Node 22.18+ (tested on Node 24.19) and npm.

```sh
npm ci
npm run dev
```

Open `http://localhost:3000`. No environment file is needed for demo mode. Leave the Supabase values blank to use the anonymous demo. Demo data is saved in browser localStorage; it is never described as cloud persistence.

```sh
npm run lint
npm run typecheck
npm test
npm run build
npm start
```

The production build creates `out/`; `npm start` serves that static output. The custom static server is a preview convenience, not an Internet-facing production server.

Browser checks, with the dev server or production preview running:

```sh
npx playwright install chromium
npm run test:e2e
```

Playwright uses its downloaded Chromium by default. An optional `CHROMIUM_PATH` selects a system browser. Tests start the development server automatically; set `E2E_BASE_URL` to test an existing production preview.

## Project map

```text
src/app/                 App Router shell, metadata, responsive design system
src/components/          Dashboard, learning engine, accounts, insights, staff tools
src/lib/content.ts       Original typed curriculum: 6 worlds, 16 lessons, 30 activities (plus extra-content.ts)
src/lib/engine.ts        Demo answer validation, rewards, streaks, safe interpreters
src/lib/supabase.ts      Public-key Supabase client; no service-role key in browser
supabase/migrations/     Schema, RLS, server validation, seed content, service jobs
supabase/functions/      Optional reminders, tutor, and account-deletion services
scripts/seed.mjs         Generates work/seed.sql for review from original content
scripts/serve.mjs        Local production preview
tests/                  Unit, PostgreSQL/RLS integration, browser and accessibility tests
docs/                    Setup, security, deployment and feature-status guides
```

## Architecture and decisions

- Next.js builds a static client application. View navigation uses URL fragments such as `/#worlds` and `/#lesson:robot-rescue`, so every view can load on basic static hosting. App Router provides the root application; these are not independent server-rendered routes.
- Supabase provides the real backend. PostgreSQL RPCs check identity, validate answers, calculate rewards, and apply transactional deduplication. RLS enforces student, class, and guardian boundaries.
- The public demo uses authored sample content and local browser persistence. Demo rankings are calculated from earned activity across local learner profiles. Family sample summaries are explicitly marked. Connected users never use fictional rankings.
- Python practice is a restricted interpreter for `for i in range(n): print(i)`. It never evaluates arbitrary JavaScript/Python, uses no `eval`, and caps execution at 30 iterations. It is not a full Python runtime.
- Project reflections are ungraded and saved locally. Ordering uses keyboard-accessible move buttons rather than requiring drag-and-drop.
- Streak day keys use the profile's IANA timezone at activity completion. Historical day keys never shift when timezone preferences change. Only a newly mastered scored activity qualifies in this release. Daily rewards have unique database keys. Ranking periods use UTC for daily, rolling 7/30 days for weekly/monthly.
- The daily challenge widget targets three newly mastered activities. The separate 5/15/30-minute preference is a learning goal; actual study time is not measured.
- Sites is the available deployment provider. The brief's Vercel deployment is documented but no Vercel account was available. The source can be imported into Vercel without a rewrite.
- Next 16.4's default Turbopack subprocess could not bind its build-time IPC port in this environment. The documented Webpack option and TypeScript 6 compiler API produced a successful type-checked production build. No build errors are ignored.
- Supplied Sites helper scripts were not mounted in this execution environment; source synchronization uses standard Git with a short-lived credential kept in process memory, followed by native Sites archive save/deploy calls.

## Connect services

1. Follow [Supabase setup](docs/SUPABASE.md). 
3. Follow [email and AI setup](docs/SERVICES.md) only if enabling those features.
4. Follow [deployment instructions](docs/DEPLOYMENT.md).
5. Review the [security checklist](docs/SECURITY.md) before real student enrolment.

No actual children's data, live email deliveries, or AI requests were used during development. Auth delivery, production Supabase persistence, and external providers require live verification after credentials are configured.

Vercel deployment update
