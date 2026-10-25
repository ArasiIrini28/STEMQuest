# Feature status

This build is an extensible first release, not the complete production system described in the master brief.

## A — Implemented and locally tested

- Next.js/React/TypeScript application; responsive sidebar, mobile navigation, landing view, dashboard, six learning worlds, subject catalogue, search, level/subject filters.
- Three-step onboarding and profile preferences; no unnecessary birth date or public legal name.
- Sixteen original lessons and 30 activities across Primary, Middle, Secondary, Higher Secondary, and College.
- Multiple-choice, multiple-select, fill-in, matching, accessible ordering, flashcards, ungraded project reflections.
- Playable robot maze with execution steps, obstacles, reset, hints, success/failure and XP.
- Playable spaceship fraction-fuel game and equivalent-fraction memory pairs, with reset and XP.
- Circuit simulation with voltage/resistance controls, switch, current/power readings, and reset.
- Local demo profiles, activity-based rankings, and lesson authoring with draft/publish/edit/unpublish.
- Gravity experiment with Earth/Moon, height control, calculated fall times and discovery questions.
- Restricted Python range-loop interpreter with strict grammar and execution limits.
- Immediate feedback, explanations, duplicate XP prevention, coins, level display, derived badges, progress charts, streak calendar, daily mission progress, export/reset.
- Unit and embedded PostgreSQL integration tests covering rewards, validation, RLS, teacher membership, guardian isolation, invites, reminder retries and AI limits.
- Local browser journeys for lessons, persistence, onboarding, filtering, classroom demo, mobile navigation, keyboard interaction, and view loading.

## B — Implemented; external verification still required

- Supabase signup, confirmation request, login, recovery/reset, session refresh, logout, profile RPC, server-backed progress, account deletion function.
- PostgreSQL schema, constraints, RLS policies, normalized curriculum, attempts/answers/progress, transactional XP/coins/daily records/achievements, class and guardian records.
- Real connected teacher class creation, one-use class invitations, assignment creation and CSV export.
- Class progress summaries restricted to enrolled learners; admin lesson creation/editing/publication through validated database RPCs.
- Verified guardian linking and authorized summary RPC.
- Connected class leaderboard with opt-in nicknames and server-calculated period totals.
- Optional reminder and weekly-summary function, quiet-hour/consent checks, unsubscribe, durable delivery claims, stable idempotency keys, failure/retry handling.
- Optional moderated AI function, identity validation, input/output limits and per-user usage reservations.
- These were not exercised against a hosted Supabase/Auth/Resend/OpenAI account. Embedded PostgreSQL tests do not replace live integration tests.

## C — Demonstration/sample functionality

- Public deployment runs anonymous demo mode with browser-local progress.
- All curriculum is original starter content; no full curriculum/exam coverage is claimed.
- Demo leaderboard scores come from real activity in this browser. Guardian family summaries are fictional and labelled.
- Demo teacher classes and assignments are saved on the same device; invitation codes do not enrol real people.
- Demo admin content is stored on this device. Connected administrators can publish custom single-question multiple-choice lessons to the database. Advanced content moderation, rich authoring and role management remain future work.
- The demo companion is authored hint lookup, not live AI.
- Welcome notifications are authored UI notices; read status is device/local-state functionality, not a complete notification service.
- Project reflections are ungraded and local; they do not appear in teacher review automatically.

## D — Blocked by missing external setup

- Supabase project provisioning, hosted migration application, real email/password account testing, remote persistence and production RLS verification.
- Email provider credentials, sending-domain verification, SMTP, scheduler activation and real delivery confirmation.
- Optional AI API credential and live moderation/tutor validation.
- GitHub repository creation and Vercel account deployment. Source is supplied as a download and saved to Sites' own source repository; no GitHub repository was created.
- Real child enrolment awaits operator identity, support contact, consent processes, privacy/retention policy and jurisdiction-specific review.

## Not yet implemented

These are product-development tasks, not features that become available simply by adding credentials:

- Full curriculum, adaptive difficulty, lesson prerequisites/unlock trees, class/grade top-improver metrics, persistent personal bests, streak freezes and XP bonuses for paths/streaks/weekly quests.
- Timed quizzes, arbitrary Python sandbox, general code editor, advanced simulations, circuit construction, and automatic project grading.
- Teacher-authored quiz builder, assignment submission/review UI, advanced class analytics and announcement UI, roster management/removal UI, consent invitation emails.
- Advanced multi-activity CMS, role/moderation interface, feature flags, XP-rule editor, email delivery dashboard, aggregate analytics.
- Weekly preference UI, achievement/teacher/guardian report emails, provider bounce/webhook processing and large-population scheduling.
- Guardian goal/privacy management and end-to-end consent collection.
- OAuth, localized lesson translations, dark theme, production telemetry/error tracking, backup restoration exercises and complete legal compliance review.

The core learning journey is usable now. Launching a real school service requires both the external setup and the remaining operator/product work above.
