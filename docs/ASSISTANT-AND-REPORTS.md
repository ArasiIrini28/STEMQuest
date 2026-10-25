# Quest Companion and assessment reports

This update continues the existing STEMQuest app. It retains the previous learning recommendations, practice, session summaries, games and purple space theme. The uploaded ZIP was the earlier release, so its useful source was checked against the newer working project rather than replacing the completed upgrade.

## What was wrong with Quest Companion?

The old Tutor in `src/components/insights.tsx` used three keyword groups (fractions, gravity and coding) followed by one generic fallback. Neither “daily fact” nor “I can't find it” matched. The fallback had no conversation context, no fact lookup and no route map. The optional server request also sent only the latest question. This was a response-selection and context problem, not an input field ignoring your text.

The replacement is `src/components/quest-companion.tsx` with pure response logic in `src/lib/study-helper.ts`. It now handles:

- Sourced facts from the same curated dataset used by the automatic popup.
- Real navigation to lessons, quizzes, reports, facts, settings and simulations.
- Follow-ups such as “I can't find it” and “Give me an easier example”, using the current conversation.
- Level-appropriate fractions, gravity, coding and algorithm explanations, with the available lesson concepts for other matched topics.
- Current-question hints and explanations of the learner's latest recorded wrong answer when it matches the question.
- Practice prompts and recommendations based on this learner's actual attempts.
- A short clarification or honest limitation when local content cannot answer a request.

Try **daily fact → I can't find it**, **Explain fractions → Give me an easier example**, **Help me with coding**, **Where can I find my report?**, and **Quiz me on this topic**. Suggested prompt buttons submit their actual text. The app never awards XP for chat answers.

## Two clearly labelled modes

**Built-in study helper** works without API keys. It uses deterministic intent handling and curated curriculum; it is not a general-purpose language model. It remembers up to 40 messages in this tab, separately for each demo learner or authenticated account. Closing/reopening the helper preserves the conversation. Clear conversation removes it. Account sign-out clears that account's stored conversation. It is not cloud chat history or memory across devices.

**AI assistant** labels a successful response from the configured provider. A connected account can enable AI explanations. Facts, navigation and clarifications stay local. Other questions go through the authenticated Supabase tutor function, which supplies the last eight conversation messages plus authorized lesson context. Server-side code gets the current learner's level and latest result; it never reads another user's results or private answer keys for the tutor. The client never sends names, email addresses, class rosters or a profile dump. Messages typed by the user may still contain personal information, so avoid entering it.

Provider errors, missing setup, limits, malformed replies and timeouts show an explicit notice and an intent-specific local response. Retry AI retries the same conversation turn without duplicating its user bubble. Duplicate sends are blocked. No error is silently labelled as an AI answer. Responses render as text, with verified local navigation buttons; generated URLs are not executed or turned into navigation actions.

## Configure real AI

1. Set up Supabase using SUPABASE.md and apply migrations 001–007 in order. Existing databases need only unapplied migrations.
2. Put only the public Supabase URL and anon key in the app's `.env.local`.
3. In Supabase Edge Function secrets, set `OPENAI_API_KEY`, optional `OPENAI_MODEL` (default `gpt-4.1-mini`), and `APP_URL` equal to the app's exact origin. These are server secrets, not NEXT_PUBLIC variables. A ChatGPT subscription does not supply API billing or an API key.
4. Run `supabase functions deploy tutor --no-verify-jwt`. The function verifies the caller through Supabase `getUser()` even though gateway JWT verification is disabled.
5. For a synthetic test account, complete the operator's consent-verification process before setting `profiles.consent_verified`. The database reserves at most five AI calls per account per rolling 24 hours; failed calls count toward this allowance.
6. Test successful explanations, follow-ups, missing credentials, limits, timeout/network errors and moderation before real use. Live provider calls were not tested in this workspace because no provider credentials were configured.

The adapter uses OpenAI Responses with `store:false`, bounded inputs/outputs, and input/output moderation. Provider retention also depends on your API account's terms. The client caps the request at 35 seconds and the server uses shorter per-call timeouts. The adapter has mocked network tests; these do not substitute for deployment and live provider verification.

## Five-minute facts

The first fact queues automatically on entry to the learning area, including the demo, once per learner per tab session. One shared timer then counts five minutes of visible, recently active application use. Pointer, keyboard and scroll events count as activity for up to one minute. Hidden or idle time is excluded, delayed ticks are capped, and one queued fact replaces any backlog. Navigation does not create another timer. Reloading resets elapsed active time; it does not repeat the welcome fact within the same tab session. Signing out cleans up the account's timer/welcome marker.

Quizzes, lessons, coding, focused practice, typing, open reports and other dialogs defer automatic popups. Close, Escape, Another Fact and real related-lesson actions work. Facts carry IDs, categories, grade-range labels, explanations and reference URLs. Recent history is browser-local and separate per learner. Chat facts use the same collection and avoid repeats within the conversation; chat and popup histories are intentionally separate. Facts earn no XP.

Change `FACT_INTERVAL` in `src/lib/facts.ts` to change the interval. The current value is 300,000 milliseconds. The STEM facts navigation item lets a learner find the full collection without waiting.

## Three kinds of reports

| Report | Trigger | Calculation and storage |
|---|---|---|
| Assessment | Lesson → Take lesson quiz → Start or resume quiz; the final validated answer automatically opens the report | One recorded answer per scored question. Total, correct, incorrect, unanswered, accuracy to one decimal place, attempt XP, daily XP at completion, newly mastered activities and explanations are saved as a snapshot. |
| Subject completion | Every configured scored activity in every published lesson for one subject and level has been mastered | A single milestone per required-activity set. Accuracy includes all scored answers in that subject and level up to completion, including retakes; it is not a claim that every historical answer was correct. |
| Session/day | Explicit Start Learning Session, then Finish Learning | Existing start/end boundaries reconstruct session totals and whole-day totals separately. This remains independent of quiz completion. |

After each non-final quiz answer, read the feedback and select **Next quiz question**. The final answer does not require an extra finish click. A three-question attempt with two correct and one incorrect answer produces 66.7% accuracy. Unanswered questions are tracked during an unfinished attempt; no completed report is created until all questions have validated answers. Leaving the quiz preserves it; Start or resume quiz continues the unfinished attempt. Opening an old report does not change it. Practice More starts a retake and retains previous reports.

**My Learning Reports** is in the sidebar and dashboard. It lists saved attempts and subject milestones, supports mistake review and provides practice links. An available subject report opens automatically at the next safe page after completion; it does not interrupt a quiz. Ungraded reflections and flashcards are not configured as required scored activities in this starter. Changing the published curriculum can create a new subject milestone for the new required-activity set.

Quiz/subject reports snapshot their timezone, totals and timestamp. Session reports continue to reconstruct from attempts and the current profile timezone. No report claims measured study duration. Rewards come from the existing mastery engine: an already-mastered activity gives zero extra XP on a retake. A wrong answer can later earn its first mastery reward on a new attempt or regular practice. Merely showing or saving a report earns nothing.

## Persistence and security

Demo quiz runs, reports, attempts and XP live together in the learner's browser state. Storage writes must succeed before the report is shown as saved. This is local demonstration storage, not tamper-proof multi-user storage or cross-tab synchronization.

Connected accounts use `quiz_runs` and `learning_reports`, added by migration 007. RLS exposes only the owner's runs/reports. Direct browser inserts/updates are denied. Start and answer RPCs derive the owner from authentication, lock the profile/run, verify quiz membership, call existing server answer validation, and return an existing response on duplicate submission. The final answer and report commit in the same database transaction. Subject synchronization verifies all required mastery records before inserting a milestone. A unique owner/report key prevents duplicate snapshots. Live hosted persistence still needs verification after configuring your Supabase project.

## Configuration and limits

- Recommendation evidence thresholds remain in `src/lib/personalization.ts`: at least three attempts across two questions, using the last eight results. Quiz snapshot score bands use the same default 50/70/85 thresholds; changing a deployed database's report bands requires a new SQL migration as well as the client policy change.
- Lesson banks are small original starter content, not a complete school curriculum or calibrated adaptive assessment system. The helper will ask for clarification when local content does not match.
- Use existing curriculum and authoring instructions to add questions. Avoid editing a published question/answer key while learners have active quizzes: current server grading uses the current validated key. Completed report snapshots retain their recorded wording and score.
- Fixed quizzes and history are implemented; timed exams, a teacher quiz builder, large-scale report analytics and general Python execution remain outside this release. Existing role features and service setup limitations are listed in FEATURES.md.
- GitHub and Windows instructions: SETUP-WINDOWS.md. Vercel/static deployment: DEPLOYMENT.md. Actual verification results: VALIDATION.md.
