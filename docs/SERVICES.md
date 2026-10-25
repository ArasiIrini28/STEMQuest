# Optional email and AI services

## Transactional authentication email

Supabase sends account verification and reset messages. Enable confirmation and configure custom SMTP in Supabase Auth. Verify your sending domain with the chosen provider. Test delivery and recovery with synthetic accounts before opening registration.

## Learning reminders and weekly summaries

The reminder Edge Function is implemented, but no provider, sender domain, live schedule, or recipient account was configured during this build. No email was sent.

1. Create a Resend account and verify your own sending domain.
2. Set secrets securely with the Supabase dashboard or CLI (never commit values): `RESEND_API_KEY`, `EMAIL_FROM`, `APP_URL`, and a high-entropy `CRON_SECRET`.
3. Deploy `supabase functions deploy reminders --no-verify-jwt`. The function verifies the separate cron secret itself. Its public unsubscribe route uses a high-entropy token and requires a confirmation POST.
4. Configure an hourly scheduler to POST to `https://YOUR_PROJECT.supabase.co/functions/v1/reminders` with `Authorization: Bearer YOUR_CRON_SECRET`. Use Supabase Cron + Vault/pg_net, or another authenticated scheduler. Store the cron secret in the scheduler's encrypted secret store, not SQL committed to this repository.
5. Enable preferences for a synthetic account and set `consent_verified` only after consent has actually been verified. Email must be confirmed in Supabase Auth.
6. Test around 18:00 in that account's timezone, outside quiet hours. For weekly summaries, set `reminder_preferences.frequency='weekly'`; they become eligible on Sundays at 18:00 local time. Frequency switching is currently a database/operator setting; the UI exposes the reminder opt-in and quiet hours.
7. Inspect private delivery logs through the SQL editor. `sent` means the provider returned a message ID and the log write succeeded; it does not prove inbox delivery. Use provider delivery events for deliverability monitoring.

### Eligibility and retry policy

- Default: reminders off, consent unverified. No non-essential mail is sent until both are enabled.
- Confirmed email, verified consent, allowed hour, quiet hours, unsubscribe status, recent learning and cooldown are checked before claiming.
- Daily reminders skip accounts that learned today. Weekly summaries show the last seven days' XP.
- Equal quiet start/end means all-day quiet.
- Each user/type/period has one unique log. A row lock prevents concurrent claims. Sending claims expire after 15 minutes; failed sends can retry up to three times.
- Resend uses a stable idempotency key per delivery. Successful logs block repeat delivery. A 23-hour cooldown accommodates DST days.
- Email templates escape display names and contain an unsubscribe link. No peer information is included.
- Up to 1,000 eligible profiles are scanned per invocation. This starter must be upgraded to paginated batches before scaling beyond that population.

Achievement emails, teacher reports, guardian reports, bounce handling, provider webhooks, and a delivery-log admin UI are not implemented.

## Optional tutor

1. Set `OPENAI_API_KEY` in Supabase secrets, and optionally `OPENAI_MODEL` (default `gpt-4.1-mini`). API billing is separate from ChatGPT subscriptions.
2. Set `APP_URL` to the exact app origin for CORS. Deploy `supabase functions deploy tutor --no-verify-jwt`.
3. The function validates the actual Supabase user with `getUser`; disabling gateway JWT verification does not disable application authorization.
4. Consent must be verified. Five questions per account per rolling 24 hours are reserved atomically. Failed provider calls count toward the limit to bound retries and cost.
5. The current question is capped at 500 characters, history at eight user/assistant messages of 2,500 characters each, and output at 500 tokens/2,500 characters. Input/history and output go through moderation. Responses use `store:false`. The server retrieves the caller's level and only the requested published lesson, public question/hint, and caller's latest result for that lesson. It does not send private answer keys, names, emails, class rosters or another student's records. Provider retention is also governed by your API account's terms; `store:false` is not a blanket retention guarantee.
6. Test safe learning questions, limits, failed API calls, and moderation behavior with synthetic users. These live provider tests were not run here.

The repaired companion has an intent-specific built-in helper for sourced facts, real navigation, level-aware explanations, contextual follow-ups, current-question hints and recommendations. It keeps the current tab's conversation under an account/learner-specific sessionStorage key. Facts and navigation stay local even when AI is enabled. Other eligible questions use the server provider when a connected account enables it. Successful provider replies say **AI assistant**; local replies say **Built-in study helper**. Errors and timeouts show a notice, a useful local response, and Retry AI. The whole client request has a 35-second cap; the Edge Function also bounds provider/moderation calls. No API key belongs in a NEXT_PUBLIC variable. See ASSISTANT-AND-REPORTS.md for behavior, tests and limitations.

## Account deletion

Deploy `supabase functions deploy account --no-verify-jwt`. It validates the caller's session, deletes only that authenticated user with the server-side admin client, and relies on cascading database relationships. Test deletion with synthetic students, teachers, and guardians before enabling production use. Retention, legal holds, and reauthentication policy require operator review.
