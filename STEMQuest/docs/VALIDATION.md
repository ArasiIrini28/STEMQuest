# Validation report

Validated on 19 October 2026 in the provided build environment.

| Check | Result |
|---|---|
| Fresh ZIP extraction and archive CRC | Passed; required files present, no dependencies/build cache/secrets bundled |
| Dependency installation from extracted folder | `npm ci` passed (417 packages) |
| Production build from extracted source | Passed; static export reports success |
| ESLint | Passed, no lint errors or warnings |
| TypeScript | Passed, no type errors |
| Unit and embedded PostgreSQL tests | 30 passed |
| Chromium end-to-end tests against production assets | 12 passed |
| Desktop rendering | Viewed at 1440px; no horizontal overflow or browser errors |
| Mobile navigation | Passed at 390px; catalogue navigation, no horizontal overflow, keyboard quiz submission |
| Dashboard accessibility | Axe WCAG 2 A/AA and 2.1 AA scan: no serious or critical violations |

The browser suite covers a wrong maze attempt, a correct route, XP persistence after reload, duplicate XP prevention, onboarding, preferences, catalogue filters, teacher demo class/assignment creation, mobile navigation, keyboard interaction, twenty application views, the dashboard accessibility scan, both new games, circuit controls, local learner switching, activity-based ranking, publishing/playing a custom lesson, and missing-account-configuration recovery.

The PostgreSQL suite runs real SQL in PGlite with synthetic auth identities and roles. It covers migrations and seed data, answer validation, maze/Python validation, unique XP, snapshots, student isolation, unauthorized writes, private answer keys, teacher permissions, one-use invitations, guardian isolation, reminder service permissions, delivery retries/idempotency, AI consent/usage limits, new game validation, class progress isolation, custom lesson permissions, draft visibility, private custom answers, and the server reward cap.

These results do not claim live Supabase authentication delivery, Resend email delivery, real OpenAI responses, production database verification, or a full accessibility audit. No external service credentials were available. See FEATURES.md and SERVICES.md for the remaining steps.

The Windows instructions and launcher are provided; this build environment is Linux, so native Windows execution was not tested. Browser tests cover the key controls and navigation, not every possible combination of inputs. Optional Edge Functions and Vercel deployment require provider verification; they were not executed against live credentials here.

The complete 12-test browser suite passed against the extracted package on localhost:3100. The extracted source also passed lint, generated route types, TypeScript, all 30 unit/database tests, and a production build. No external credentials were needed. The archive contains a prebuilt `out/` demo plus source; it excludes the original Sites project identity and Git metadata.
