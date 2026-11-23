# CycleCue — Women's Health & Wellness Platform

CycleCue is a responsive React + TypeScript application for menstrual-cycle awareness, fertility observations, pregnancy-date estimates, nutrition education, movement planning, sexual and reproductive wellness education, daily habits, and an optional AI education companion.

It is designed around privacy, user control, clear uncertainty labels, accessible controls, and graceful fallbacks. It is an educational and personal-tracking tool, not a medical device, diagnostic service, contraceptive method, or replacement for a clinician.

## Current implementation

### Available in the frontend

- **Cycle dashboard:** cycle day, upcoming date estimates, calendar, cycle history and insights.
- **Period tracking:** period start dates, duplicate prevention, date validation and symptom/mood check-ins.
- **Fertility observations:** optional OPK result, cervical-mucus observation and basal body temperature logging.
- **Pregnancy dating calculator:** LMP, conception and IVF embryo-transfer methods with estimated due date, gestational age and trimester.
- **Nutrition planner:** flexible meal ideas and user-selected food preferences/focus.
- **Movement planner:** seven-day activity ideas with life-stage and experience selectors.
- **Women's wellness:** sexual health, consent, STI prevention, contraception awareness, preventive care and vulvovaginal care education.
- **Healthy habits:** daily hydration, movement, sleep, nutrition and mindfulness check-ins.
- **Recycle Bin:** period, symptom and fertility records can be restored for 30 days or permanently deleted.
- **Data portability:** export the tracker state as JSON.
- **AI companion:** offline rule-based guidance works without an account; optional AI answers require sign-in, explicit consent and a configured server-side AI provider.
- **Authentication:** optional Supabase email/password and Google OAuth sign-up/sign-in, email verification, password reset and password update.
- **Account backup:** signed-in users can explicitly back up or restore the local tracker state to their own Supabase account.

### Data and sync behaviour

- Without Supabase environment variables, the app runs in clearly labelled local/demo mode.
- Local tracker state is stored in versioned browser storage. Browser `localStorage` is not encrypted; do not use a shared or compromised device for sensitive records.
- Account data is isolated by per-user storage keys in the browser.
- Cloud backup is **manual and user initiated** in this version. Signing in does not silently upload cycle, fertility or symptom history.
- The Supabase migration creates owner-scoped tables with Row Level Security (RLS), a private health-document bucket, a tracker backup vault, versioned consent records and a per-user daily AI request limit.
- With AI consent enabled, up to 10 recent chat messages may be sent to the configured AI provider. Cycle history, fertility logs, pregnancy dates and other app records are not automatically attached.
- AI messages are kept in the current page session only and are not saved by CycleCue.

## Tech stack

- React 19, TypeScript and Vite
- Lucide React icons and responsive CSS
- Supabase Auth, PostgreSQL, Row Level Security and Edge Functions (optional cloud features)
- Vitest and jsdom for unit testing
- Vercel static deployment configuration

## Requirements

- Node.js 22.22.2+ or 24.15+ (required by the current test DOM runtime)
- npm 10+
- A Supabase project for account and cloud features (optional for local mode)

## Run locally

```bash
npm install
npm run dev
```

Open the URL printed by Vite, normally `http://localhost:5173`.

## Environment configuration

Copy `.env.example` to `.env.local` and set the public Supabase project URL and publishable/anon key:

```dotenv
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_YOUR_KEY
VITE_APP_URL=http://localhost:5173
```

Only the Supabase publishable/anon key belongs in the frontend. **Never** put a Supabase `service_role` key, database password, or AI-provider key in a `VITE_*` variable or commit it to Git.

## Supabase setup

1. Create a Supabase project.
2. Copy `.env.example` to `.env.local` and fill in the project URL and publishable/anon key.
3. Install the Supabase CLI and authenticate:

   ```bash
   npx supabase login
   npx supabase link --project-ref YOUR_PROJECT_REF
   npx supabase db push
   ```

4. In Supabase Authentication settings, enable email/password authentication, configure the email sender, and add the local and production app URLs to the allowed redirect URLs. Include `http://localhost:5173/reset-password` and `https://YOUR_DOMAIN/reset-password` for password recovery.
5. In Vercel project settings, add `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `VITE_APP_URL` as environment variables for the appropriate environments.
6. Deploy the app to Vercel and verify email confirmation, sign-in, password reset, account isolation, backup and restore.

The migration in `supabase/migrations/202611230001_initial_schema.sql` creates the tables and policies. Review it for your deployment before running against production data.

## Optional AI assistant setup

The browser calls a Supabase Edge Function. Provider credentials must remain server-side.

Set Edge Function secrets (use the exact production origin, with no trailing slash):

```bash
npx supabase secrets set APP_ORIGIN=https://YOUR_DOMAIN
npx supabase secrets set AI_API_URL=https://YOUR_OPENAI_COMPATIBLE_PROVIDER/v1/chat/completions
npx supabase secrets set AI_API_KEY=YOUR_PRIVATE_PROVIDER_KEY
npx supabase secrets set AI_MODEL=YOUR_MODEL_NAME
```

Then deploy:

```bash
npx supabase functions deploy health-assistant
```

`AI_API_URL` must use HTTPS and return an OpenAI-compatible chat-completions response. The Edge Function verifies the user session, verifies explicit versioned consent, applies a daily quota, enforces a timeout, rejects unapproved origins and returns safe errors. If the AI service is not configured or is unavailable, the offline guide remains available.

## Quality checks

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

The project includes unit tests for date handling, cycle calculations, pregnancy-date calculations, storage validation/migration and recycle-bin retention/restore. Run the full checks after installing dependencies and before deployment.

## Prediction methodology and limitations

CycleCue uses a deterministic, transparent calendar calculation rather than allowing an LLM to invent health dates:

1. Validate and sort unique recorded period start dates.
2. Calculate the latest six valid intervals between 15 and 60 days.
3. Use the median interval to reduce the effect of a single unusual interval; use the configured cycle length when no interval is available.
4. Estimate the next period from the latest recorded start date.
5. Estimate ovulation as approximately 14 days before the next predicted period and show an approximate fertile window of five days before through one day after that estimate.

Ovulation and fertile-window dates are uncertain calendar estimates. OPK results, cervical mucus and basal temperature are user-entered observations, not confirmation of ovulation. Period-tracking and fertility-awareness calendar estimates must not be used as contraception.

Pregnancy due-date estimates use separate calculations for LMP, conception and IVF transfer. The user's clinician or ultrasound-based dating may differ and should take priority.

## Health-content safeguards

- Health education is general, conservative and non-diagnostic.
- The app does not prescribe medication or supplement dosages, diagnose infections, or determine pregnancy.
- Nutrition and exercise suggestions are examples, not individualized medical plans.
- Users with pregnancy-related concerns, severe symptoms, chronic conditions, allergies or special dietary needs should seek qualified clinical guidance.
- The AI companion is not an emergency service. Red-flag text patterns trigger a generic urgent-care message before an AI provider is called; this is not a complete emergency detection system.

## Security and privacy review checklist

Before real users or production health data:

- Review `SECURITY.md` and perform a privacy impact assessment.
- Verify every exposed table has RLS enabled and test with two separate user accounts.
- Confirm no service-role/database/AI secrets are exposed in built assets.
- Test sign-up, email confirmation, expired sessions, password reset, logout and account deletion.
- Test export, backup, restore, recycle/retention and permanent deletion.
- Run dependency and secret scanning, static analysis, browser security checks and penetration testing.
- Review the Content Security Policy against the exact production domain and Supabase project.
- Review applicable privacy, health-data, retention and breach-notification obligations with qualified counsel.
- Obtain a clinical review of health education and escalation language before public release.

## Week 3 AI-development assignment notes

### Prompts used

The implementation instructions supplied during development included:

- "Start building. Follow good coding practices, security, robustness, fallbacks, error handling and exception handling."
- "Add account login, Supabase storage, cycle and ovulation records, pregnancy estimated delivery dates, diet and exercise planning, healthy habits, women's sexual and reproductive wellness, an AI chatbot, predictions and a recoverable Recycle Bin."
- "Use the CycleCue name. Make the application user friendly, apply UI/UX best practices, add security, tests and prepare for Vercel deployment."

Additional implementation prompts were decomposed into the README sections above: validated date-only helpers, versioned storage, RLS policies, consent-gated AI, timeout/error fallbacks, accessible forms, responsive layout and test coverage.

### How AI assisted

AI assisted with component architecture, domain logic, schema design, migration creation, Supabase authentication wiring, UI states, test cases, security review prompts, documentation and deployment configuration.

### Manual review and improvements

- Replaced simple averages with a median of recent valid cycle intervals.
- Added strict date-only validation and cycle interval bounds.
- Added schema-versioned storage and explicit migration from previous tracker keys.
- Added per-account local storage keys to avoid mixing users on a shared browser profile.
- Added 30-day recycle/restore handling for period, symptom and fertility records.
- Added independent LMP, conception and IVF due-date calculations with future-date rejection.
- Added owner-scoped database policies and a private storage bucket.
- Added an account reset-password route and password-length bounds.
- Changed AI CORS from wildcard to an exact configured production origin.
- Kept all AI-provider credentials server-side and implemented explicit consent, quota, HTTPS validation, timeout and offline fallback.
- Added tests for data migration, storage validation, due-date methods and recycle-bin expiry.
- Documented remaining limitations rather than representing the prototype as a deployed or clinically validated product.

## Deployment status

The repository is configured for Vercel static builds, but deployment is not performed automatically by this source package. A Supabase project, environment variables, migrations, Edge Function secrets and Vercel account access are required to enable cloud authentication and AI. Do not claim the live cloud features are operational until the deployment checklist has passed.

## Reference reading

- [NHS — Periods and fertility in the menstrual cycle](https://www.nhs.uk/conditions/periods/fertility-in-the-menstrual-cycle/)
- [ACOG — Fertility Awareness-Based Methods of Family Planning](https://www.acog.org/womens-health/faqs/fertility-awareness-based-methods-of-family-planning)
- [ACOG — Estimated Due Date guidance](https://www.acog.org/womens-health/faqs/obstetric-estimate-of-gestation-and-due-date)


## CycleCue 1.3 UI and account upgrade

- Updated type scale, font pairing, responsive motion and focus states.
- Persistent Sign in / My account entry point in the top navigation and sidebar.
- Email/password account flows and Google OAuth button (provider configuration required).
- Dedicated About CycleCue page.
- Multi-turn AI chat with copy, clear, retry, typing indicator, keyboard shortcuts and a safe offline fallback.
- AI requests include up to 10 recent chat turns only after explicit consent.

See [`SUPABASE_SETUP.md`](./SUPABASE_SETUP.md) for database, email login, Google OAuth, Edge Function and AI provider setup.
