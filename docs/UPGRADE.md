# Learning upgrade — 24 October 2026

This guide describes the preserved recommendation/session features. The companion repair and automatic quiz/subject reports are documented in [ASSISTANT-AND-REPORTS.md](ASSISTANT-AND-REPORTS.md).

## What changed

The existing Next.js application, purple space theme, 16 lessons, 30 activities, games, simulations, accounts, teacher tools and admin lesson editor are retained. This release adds the three priority learning features from the upgrade brief. The broader platform wishlist is not fully implemented; see FEATURES.md for the remaining product work.

Before editing, the uploaded ZIP was inspected against the existing source and all 30 baseline unit/database tests passed. Inspection confirmed that the demo used browser persistence, account integrations required external configuration, and the new recommendation/fact/session flows were absent. The upgrade adds those flows without replacing the existing architecture. It also guards rapid duplicate submissions and discards stale account snapshots when the signed-in identity changes.

## 1. Recommendations and focused practice

Open the dashboard and scroll to **Recommended for You**. Cards show the actual lesson, level, expected lesson length, evidence band, reasons, and available foundation links. Select **Practice More**, **Review Lesson**, or **Review Your Mistakes**. Focused practice has three scored rounds and explains each answer. It uses the existing validated activities and normal reward submission, so repeating a mastered question earns zero extra XP.

`src/lib/personalization.ts` contains the editable policy: at least 3 attempts across 2 distinct questions; the latest 8 attempts determine the band. Bands are below 50% (needs practice), 50–69% (developing), 70–84% (progressing), and 85%+ (strong). Without sufficient evidence the UI says “Gathering evidence”. Thresholds are source configuration, not an admin settings screen. Rankings prioritize established low scores, then insufficient-evidence diagnostics.

The prerequisite map connects fraction and coding lessons. Two consecutive incorrect answers can route practice to an available, not-yet-mastered foundation. Strong results can route to a dependent challenge only when its mapped prerequisites have sufficient evidence. Otherwise practice stays on the current lesson, prioritizing unseen and recently missed questions. The practice bank is small and repeats are possible. This is deterministic adaptation, not a trained model or a calibrated difficulty system. Single-question lessons cannot establish strong topic evidence by repetition alone. Prerequisites advise; they do not lock catalogue access.

Improvement is shown only when two non-overlapping eight-attempt windows cover the same question IDs. It is a recent-results comparison, not a standardized assessment. Mistake review shows the question, explanation, timestamp and practice link; historical submitted answer text is not included in this version's client attempt record.

## 2. Did You Know?

Use **Discover a STEM fact** at any time. Entry to the learning area queues an initial fact at the next safe moment, once per learner per tab session. Afterward one timer counts five minutes of visible, recently active use. A pointer, key or scroll event keeps the user active for up to one minute; hidden and idle time does not accumulate. A delayed tick is capped, so returning from a sleeping tab does not create a backlog.

Automatic prompts wait during lessons, coding, forms, reports, focused practice, or another dialog. Continue or Escape dismisses the native keyboard-accessible dialog. Another Fact rotates the curated collection. Facts give no XP. Twenty-four facts in `src/lib/facts.ts` include categories, explanations and reference URLs; younger learners exclude advanced entries. References are editorial source links, not a live fact-search service. The recent history is stored per learner on this browser; it is not synced between devices. Timer state resets when the app is reloaded or the account changes. The timer and event listeners are cleaned up on unmount/logout.

## 3. Finish Learning and saved reports

On the dashboard choose **Start Learning Session**. Complete lessons or practice, return to the dashboard, and choose **Finish Learning**. Reports show distinct activities attempted, newly mastered activities, scored answers, correct/incorrect totals, accuracy, earned activity XP, topics, daily mission progress, evidence-based strengths and review links. Session totals and whole-day totals are separate. An empty session produces zero totals and no accuracy claim.

Sessions use start-inclusive/end-exclusive timestamps. Daily totals use the profile timezone and stop at the report finish time; later answers are not added to an old report. Reports reconstruct from saved boundaries and recorded attempts, including after refresh. They are not immutable snapshots: changing the timezone, deleting/resetting progress, or removing content can change the reconstruction. The application does not claim measured study duration. Incorrect answers, repetitions and repeated finish clicks do not create extra rewards.

Demo sessions live in browser storage under each local learner. Connected sessions use the database and server timestamps. Apply `006_study_sessions.sql` to an existing database after migrations 001–005. It adds one-active-session constraints, row-level ownership and idempotent start/finish functions. It does not alter existing progress. Browser clients cannot directly forge session rows. Back up the database before applying your own production migration workflow.

## Install or update

1. Extract the ZIP into a new folder and keep your previous folder as a backup. Do not overwrite a private `.env.local` with public files.
2. Install Node 24 LTS. Open a terminal in the folder containing package.json.
3. Run `npm ci`, then `npm run dev`; visit http://localhost:3000. On Windows PowerShell use `npm.cmd` in place of `npm`.
4. For a static preview run `npm run build` and `npm start`. Windows users can double-click START-DEMO.cmd for first-time installation/build/start. Later source edits require rebuilding.
5. Demo mode needs no keys. For accounts, follow SUPABASE.md, apply migration 006 once, restore your own public Supabase configuration, and rebuild.
6. Follow SETUP-WINDOWS.md for GitHub and DEPLOYMENT.md for Vercel. Neither service is required for local use.

## Validation and remaining setup

See VALIDATION.md for executed checks. Unit tests exercise evidence thresholds, real prerequisites, question selection, comparable improvement, empty reports, timezone boundaries, no-repeat fact rotation and active-time accounting. Embedded PostgreSQL tests enforce owner isolation and repeated finish behavior. Browser tests cover report persistence, fact deferral and keyboard behavior alongside the existing journeys.

Hosted Supabase authentication, SMTP/email delivery, AI provider calls, cross-device persistence and Vercel deployment still require the owner's services and live testing. Advanced CMS/role controls, broad adaptive banks, teacher quiz/review workflows, richer analytics, enforced unlock trees and the other items in FEATURES.md remain development work. The delivered demo does not pretend these are connected or complete.
