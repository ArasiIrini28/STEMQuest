# Validation report — complete updated source package

Verified again on 25 October 2026 in the provided Linux environment. Work continued from the existing companion/reports release and retained its personalization, sessions, curriculum, games and design. The original uploaded STEMQuest.zip had matched the earlier release (91 files, valid CRC); it was not used to overwrite the newer source.

| Check | Result |
|---|---|
| ESLint | Passed |
| TypeScript and generated route types | Passed |
| Unit, mocked-provider and embedded PostgreSQL tests | 66 passed across 6 files |
| Chromium end-to-end tests against production assets | All 21 journeys passed: 20 in the full run, plus the corrected practice fixture in a targeted rerun |
| Production static export | Passed |
| Fresh ZIP extraction | Dependency installation (417 packages) and production build passed from the extracted source |
| Dashboard accessibility | Axe WCAG 2 A/AA and 2.1 AA: no serious or critical violations |
| Companion and fact-dialog accessibility | Same automated scan passed at 390px |
| Visual checks | Mobile companion and desktop assessment report inspected |
| Archive checks | Required files, CRC, source byte matching, lockfile agreement and excluded paths are checked by the packaging script |

Assistant tests exercise actual fact requests, contextual “I can't find it”, simpler follow-ups, mathematics/science/coding/AI explanations, real navigation, unknown requests, owner-scoped learner evidence, malformed replies, timeouts and visible fallback. Mocked HTTP tests verify bounded history, rejection of system-role history, omission of client-supplied student identity, server-selected level/context, provider storage disabled, moderation on both sides, and rate-limit/malformed-response handling. These mocks do not establish live OpenAI operation.

Browser tests send actual messages with Enter and Send, use a navigation action, reopen chat, switch local learners to verify conversation isolation, and operate the helper on mobile with keyboard focus and Escape. A clock-controlled test verifies an automatic welcome fact, no repeat before five active minutes, and a new fact afterward. Another test verifies deferral throughout a lesson.

Quiz tests verify a three-answer 66.7% result, incomplete attempts without completed reports, duplicate-answer idempotency, no repeated mastery XP, immutable old snapshots and retakes. Browser tests automatically reach the report after the final answer, reopen it after refresh, review mistakes, and record a separate retake. Subject checks require every configured scored activity, preserve milestones and prevent duplicate creation.

Database tests apply migrations 001–007 to embedded PostgreSQL (PGlite). They verify report and quiz ownership, denied direct writes, cross-user submission rejection, question membership, duplicate responses, final-answer/report persistence, separate retakes, reward deduplication and all-required subject completion. Existing account/role, class/guardian, invitation, custom-content, reminder and AI-usage SQL tests also pass.

The existing games, simulations, onboarding, catalogue filters, local profiles, rankings, admin authoring, session reports, focused practice and responsive navigation remain covered by the complete 21-test browser suite. The first combined browser run exposed duplicate session panels from colliding React keys; the keys were separated and the complete suite subsequently passed.

The final reliability update restores the selected local learner after account logout, ignores stale account snapshot responses, and adds loading/retry feedback for cloud report history. Four new restoration tests cover saved quiz reports and XP, legacy data, invalid/unavailable storage, and privileged-role removal. The browser quiz test verifies roster recovery even when the legacy snapshot is stale. The practice fixture previously edited only that legacy key; it now changes learning level through Settings, waits for save confirmation, and passes. No application failure remains from that test. Hosted sign-out and cloud report retry still require service configuration for end-to-end verification.

The final archive contains 83 files, including all seven migrations, safe authored seed content, tests, setup instructions, the blank `.env.example`, and the existing PDF and Dev Duo presentation. Old ZIPs are excluded. Archive paths, CRC, source-byte matches and lockfile agreement pass; private environment files, private-key markers, dependencies and build caches are excluded/checked. Fresh extraction installed 417 packages from the populated npm cache and built successfully. Only these validation notes change after that build; the final archive is regenerated and its integrity checks repeated.

No live Supabase/Auth, OpenAI, SMTP/email provider or Vercel credentials were configured. Hosted authentication delivery, production RLS, cloud synchronization, actual AI responses and deployed Edge Function execution still need operator verification. Native Windows execution was not available; the launcher and Windows instructions were inspected on Linux. Automated accessibility scans are representative rather than a complete audit. Fact reference pages were not live-audited.

See ASSISTANT-AND-REPORTS.md for behavior and setup, and FEATURES.md for the remaining product scope.

The clean installation used `npm ci --offline` with this environment's populated npm cache; a first-time installation on your computer needs internet. The final archive is regenerated after this validation note, and its CRC, required files and source-byte checks are repeated. Dependencies, build output, Git/Sites metadata, test output and private environment files are excluded.
