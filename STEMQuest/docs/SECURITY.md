# Security and launch checklist

## Implemented

- [x] No real secrets or child data in source or seed files.
- [x] Service-role credentials only used inside server-side Edge Functions.
- [x] Browser role selection cannot elevate a connected account.
- [x] RLS enabled on all public data tables; private answer/invitation/service tables have no browser table access.
- [x] Identity/role checks inside security-definer functions; empty search paths.
- [x] XP is calculated from database activity rules and awarded once under unique constraints and a profile row lock.
- [x] Sensitive learning submissions limited to 30/minute; AI reservations limited to five/day.
- [x] Random one-use invitation tokens, expiry, row locking, and consent checks for guardian links.
- [x] React output encoding; email HTML escaping; CSV formula-prefix escaping.
- [x] No arbitrary student code evaluation.
- [x] Quiet hours, opt-in, consent, cooldown, unsubscribe and duplicate-send controls.
- [x] Keyboard alternatives for ordering, visible focus, reduced motion, labelled forms and mobile layouts.

## Required before production enrolment

- [ ] Provision and apply the real Supabase project; re-run access tests with actual JWTs.
- [ ] Review every database function/policy and deploy migrations through a controlled process.
- [ ] Configure SMTP, CAPTCHA, auth rate limits, session/recovery settings, exact redirect allowlists and TLS.
- [ ] Enable real child accounts only after an age/guardian verification and consent workflow is reviewed for the operating jurisdiction. The public demo is anonymous; the current registration form only offers 16+ self-attestation and is not age verification.
- [ ] Add operator support/contact, final privacy/terms, retention and deletion rules, backup policy, incident process and security monitoring.
- [ ] Review sensitive profile visibility: authorized teachers/guardians can read linked learning data under the current policies. Tighten to column-limited views where needed.
- [ ] Review account deletion (including reauthentication and privileged account dependencies) using synthetic accounts.
- [ ] Configure host response headers/CSP appropriate to the actual Supabase origin and auth flows; verify on the final host.
- [ ] Audit all screens with keyboard and assistive technology. Automated dashboard checks are only one part of accessibility testing.
- [ ] Review lessons and AI behavior with educators; test provider outages, prompt abuse, moderation failures and billing controls.
- [ ] Add server-side content delivery for high-stakes assessments. Bundled sample answers are inspectable; this is a learning app, not an exam proctoring system.
- [ ] Conduct load, penetration, backup-restore, cross-browser and real-device tests. No claim of legal compliance is made.
