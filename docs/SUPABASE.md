# Database and authentication setup

## Required external setup

No Supabase project or credentials were available during this build. The public deployment therefore uses demo mode. The following are the exact steps to enable cloud accounts:

1. Create a Supabase project in your own account. Save its database password securely.
2. Install the Supabase CLI and authenticate on your machine. Run `supabase link --project-ref YOUR_PROJECT_REF` in this repository.
3. Apply `supabase db push`. This applies all seven numbered migrations (`001_core.sql` through `007_assessment_reports.sql`) in order. For an existing installation, apply only migrations not already recorded. Alternatively, apply the files in the Supabase SQL editor in that order. Migration 006 adds session boundaries; migration 007 adds owned fixed-length quiz attempts, immutable assessment/subject reports and transactional grading. Neither resets progress or rewards.
4. Copy the project URL and **anon/publishable key** to `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. In Supabase Authentication → URL Configuration, set the Site URL to the deployed STEMQuest origin. Add the exact origin and permitted auth redirect URLs. Development can use `http://localhost:3000/`.
6. Keep email confirmation enabled. Configure custom SMTP for reliable verification/reset emails. Set authentication rate limits and CAPTCHA before opening registration.
7. Rebuild and deploy with the two public environment variables present at build time. Static exports bake public values into JavaScript; changing runtime hosting settings alone is insufficient.
8. Create two synthetic adult test accounts. Verify signup, confirmation, login, password recovery, sign-out, profile saving, lesson submission, cross-device progress, class access, and deletion.

Never put the service-role key in any `NEXT_PUBLIC_` variable, source file, browser, or chat message.

## Roles

New users are always students. Client-supplied role choices are ignored. Bootstrap the first administrator only through the trusted SQL editor:

```sql
update public.profiles set role = 'admin' where id = 'VERIFIED_OPERATOR_AUTH_USER_UUID';
```

The administrator UI creates, edits, publishes and unpublishes custom lessons with a single multiple-choice question. Verified role grants and consent approval are operator tasks in the SQL editor for this release:

```sql
update public.profiles set role = 'teacher' where id = 'VERIFIED_TEACHER_UUID';
update public.profiles set role = 'guardian' where id = 'VERIFIED_GUARDIAN_UUID';
-- Only after recording and reviewing appropriate consent outside this starter:
update public.profiles set consent_verified = true where id = 'CONSENTED_ACCOUNT_UUID';
```

Do not make users administrators because they ask in the browser. Production role management needs an audited operator workflow.

## Class and guardian invitations

Teachers create one-use class tokens in their dashboard. Students accept them from Help. Tokens are random, expire in 48 hours, are consumed under a row lock, and are never publicly queryable.

After consent is verified, an administrator can call `create_guardian_invite(student_uuid)` as their authenticated identity. A verified guardian accepts the token from the guardian dashboard. Merely knowing a child's email does not grant access. Secure distribution of invitations is the operator's responsibility; this build does not send invitation emails.

## Data access

| Records | Student | Teacher | Guardian | Administrator |
|---|---|---|---|---|
| Published curriculum | Read | Read | Read | Read; manage custom lessons through admin studio |
| Profile and progress | Own | Enrolled classes only | Explicitly linked learners only | Authorized administration |
| Student answers | Own | Enrolled classes only | Linked learners only | Authorized administration |
| XP, coins, daily records | Read authorized scope; no direct writes | Read authorized scope | Read authorized scope | Read |
| Assignments | Enrolled classes | Own classes; create/update | No direct access | Read |
| Class membership | Own | Own classes | No direct access | Read |
| Notification preferences | Own via validated RPC | Own | Own | Own |
| Answer keys/invites/email logs/AI logs | No direct access | No direct access | No direct access | Trusted service or SQL only |

RLS is enabled on all public tables. The private schema has no table grants to anonymous or authenticated browser roles. Security-definer functions use an empty search path and explicit identity checks. Rewards run in one transaction with unique constraints and a profile row lock.

## Add content

Edit `src/lib/content.ts`, then run `npm run seed:generate`. Review the generated `work/seed.sql`. Before modifying a deployed database, create a new numbered migration instead of changing an already-applied migration. Rebuild the client so the authored demo curriculum and database content agree.

The built-in curriculum is bundled with the client. Custom lessons published by the admin studio are loaded from Supabase and do not require rebuilding. Correct answers stay in the private schema; the RPC fixes rewards at 25 XP and validates all authoring fields. A teacher can view progress only for enrolled members of their own classes.
