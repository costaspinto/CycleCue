# CycleCue Security Notes

## Security scope

CycleCue is an educational and personal-tracking application. It is not a certified medical device or a clinically validated prediction system. The code includes local-first tracking and optional Supabase account/cloud features, but the repository has not undergone an independent security audit or clinical review. Do not use it for real patient care or emergency decisions.

## Implemented safeguards

- Strict TypeScript compiler settings and reusable date-only domain helpers.
- Runtime validation, bounded arrays and allow-lists before accepting locally persisted tracker data.
- Versioned storage with migration support and corrupt-data handling.
- User-specific local storage namespaces after authentication.
- Supabase Auth using PKCE, persisted sessions and automatic token refresh.
- Supabase Row Level Security policies scoped to `auth.uid()` for user profiles, health records, consents, documents and tracker vault data.
- Private Storage bucket policies requiring the authenticated user's ID as the first path segment.
- No service-role key, database password or AI-provider key in frontend environment variables.
- AI requests are disabled until the user signs in and grants explicit, versioned consent.
- AI requests send the submitted question only; tracker records are not automatically attached.
- Edge Function session verification, exact-origin CORS allow-list, HTTPS provider URL validation, daily quota, timeout, bounded input and output validation.
- AI provider failures fall back to the offline information guide.
- The AI prompt forbids diagnosis and prescribing; a limited red-flag phrase check returns an urgent-care message.
- Recycle Bin with 30-day retention, restoration and permanent deletion for local period, symptom and fertility records.
- Export capability and user-triggered cloud backup/restore.
- React Error Boundary, defensive form validation and user-facing error messages.
- Content Security Policy and common security response headers in the HTML and Vercel configuration.

## Important limitations

- Browser `localStorage` is not encrypted. A user with access to the browser profile or a same-origin script injection could read it.
- Cloud tracker backup is manual and only includes the validated tracker state. It is not continuous sync, and account login alone does not upload records.
- AI consent controls question submission, but the user can still type sensitive information into a question. The UI warns users not to include identifying details.
- AI red-flag matching is a limited phrase heuristic, not a clinical triage classifier. It can miss emergencies and can produce false positives.
- Recycle Bin currently covers the period, symptom and fertility tracker records. Other future record types require their own retention and restore workflows.
- Appointment, medication and document workflows are not yet a complete end-user module even though the database schema reserves record types and a private bucket.
- AI configuration, Supabase policy correctness and production CORS behaviour must be tested in the actual deployed project.
- The code has not received independent penetration testing, privacy-law review, or clinician approval.

## Production checklist

1. **Secrets:** keep `service_role`, database passwords and AI keys in Supabase/Vercel server-side secret stores only. Scan Git history and build artifacts for secrets.
2. **Authentication:** configure email verification, production redirect allow-lists, SMTP, recovery links, session revocation and rate limits.
3. **Authorization:** run RLS tests as two independent users for every table and private storage operation. Verify anonymous users cannot read or mutate health data.
4. **AI endpoint:** configure a single exact `APP_ORIGIN`; test preflight, invalid-origin rejection, expired token, revoked consent, malformed payloads, quota and provider timeout.
5. **Data lifecycle:** test export, backup, restore, account deletion, Recycle Bin restoration, 30-day expiry and irreversible deletion. Add a scheduled purge for any future server-side soft-deleted records.
6. **Application security:** dependency audit, secret scanning, static analysis, CSP review, XSS review, CSRF/session review and penetration testing.
7. **Privacy and safety:** complete a data inventory, lawful basis/consent review, retention schedule, data subject request process, incident response plan and clinical review of all health content.
8. **Operational readiness:** backups, restore drills, monitoring with health-data redaction, dependency update policy and documented incident handling.

## Reporting

Do not include names, email addresses, medical records, cycle dates or other health data in public bug reports. Report suspected vulnerabilities privately to the project maintainer.
