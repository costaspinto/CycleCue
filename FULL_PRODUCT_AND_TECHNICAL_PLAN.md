# CycleCue — Full Product & Technical Plan

**Product:** CycleCue — Women's Health & Wellness Platform  
**Document status:** Product plan and implementation baseline  
**Date:** 23 November 2026  
**Current codebase:** React 19 + TypeScript + Vite frontend prototype  
**Target hosting:** Vercel  
**Target backend:** Supabase Auth + PostgreSQL + Row Level Security + Edge Functions + private Storage

---

## 1. Executive summary

CycleCue will evolve from a local period-tracking demonstration into a private, account-based women's health and wellness platform. It will support menstrual health, cycle awareness, fertility planning, pregnancy, postpartum wellbeing, nutrition, physical activity, sexual and reproductive health education, healthy habits, personal health records, and an optional AI health-information assistant.

The product must be supportive, inclusive, easy to use, privacy-first, and explicit about uncertainty. It is an educational and personal-tracking tool, not a diagnostic system, a clinical decision-support system, or a substitute for a clinician.

### Product principles

1. **Privacy by design:** collect only information needed for a feature; sensitive fields are optional; do not sell health data or use it for advertising.
2. **User control:** users can export, restore, permanently delete, and request deletion of their data.
3. **Transparent predictions:** distinguish recorded facts from estimates; show the method, data sufficiency, and uncertainty.
4. **Safe AI:** AI provides education and navigation, not diagnosis, prescribing, emergency triage, or certainty about pregnancy/ovulation.
5. **Graceful degradation:** core tracking works when AI or network services are unavailable; offline and error states are useful and understandable.
6. **Accessibility:** mobile-first, keyboard-operable, screen-reader-friendly, readable, and non-judgmental.
7. **Maintainability:** modular code, strict typing, schema validation, migrations, automated tests, security checks, and documented operations.

## 2. Target users and life stages

The app should not assume every user menstruates, is sexually active, wants pregnancy, or is pregnant. Users choose which modules to activate.

| User journey | Main features |
|---|---|
| General women's wellness | Habits, nutrition, fitness, sleep, education, appointments |
| Menstrual health | Period logging, symptoms, cycle history, calendar and estimates |
| Trying to conceive | Fertility observations, cycle awareness, reminders and educational guidance |
| Pregnancy | LMP/IVF/clinician dating inputs, gestational age, EDD, trimester, milestones |
| Postpartum | Recovery diary, wellbeing check-ins, appointment and self-care reminders |
| Perimenopause / menopause | Symptom, sleep, mood, cycle-change and wellbeing tracking |

**Release boundary:** first public beta should be designed for adults (18+) until safeguarding, parental/guardian rules, privacy obligations, and local healthcare guidance for minors have been reviewed. This is a product-risk decision, not a claim that minors do not need health information.

## 3. Information architecture and navigation

### Main navigation

1. Home
2. Cycle & Fertility
3. Pregnancy
4. Nutrition
5. Fitness
6. Women's Wellness
7. AI Health Companion
8. Health Planner
9. Health Records
10. Settings & Privacy

### Dashboard

- Today's overview and quick check-in.
- Next-period estimate, if cycle tracking is enabled and sufficient data exists.
- Estimated ovulation/fertile window, clearly marked as estimates.
- Pregnancy week and estimated due date, only when pregnancy mode is enabled.
- Hydration, movement, sleep and habit progress, based on user-selected goals.
- Upcoming appointments and reminders.
- Recent symptoms and personal notes.
- A discreet AI companion entry point.

Dashboard cards must be configurable. Avoid showing cycle or pregnancy information on a shared screen without user consent. Add a discreet notification mode that hides sensitive wording on lock screens.

## 4. Full feature scope

### 4.1 Account, onboarding and profile

- Email/password sign-up and sign-in.
- Email verification and password reset.
- Optional Google OAuth after the core email flow is stable.
- Session restore, logout, expired-session handling, and account deletion.
- First-run onboarding with skip/continue controls.
- Profile: display name, date of birth, country, timezone, units, language, and preferences.
- Optional health settings: cycle length, period length, pregnancy mode, dietary preference, activity level, and notification preferences.
- Consent screen explaining what data is stored, where it is processed, and which AI data is sent to a model provider.
- Do not require sexual history, pregnancy status, symptoms, or medical history to create an account.

### 4.2 Menstrual cycle tracker

- Record period start and end dates.
- Record flow level, spotting, period duration, cramps, pain level, symptoms, mood, energy and free-text notes.
- Edit and delete historical records.
- Calendar with separate visual treatments for recorded period days and estimated days.
- Cycle history with average, median, range, and variability.
- User-defined cycle and period settings.
- Import/export records using a documented JSON/CSV format.
- Duplicate-date prevention, impossible-date validation, future-date warnings, and corrections for mistaken entries.
- Support missing or uncertain dates rather than forcing false precision.

### 4.3 Ovulation and fertility awareness

- Calendar-based estimated ovulation date and estimated fertile window.
- Optional observations: cervical mucus, basal body temperature, ovulation test result, and intercourse/trying-to-conceive notes. These must be opt-in and private.
- Cycle variability visualization and data-sufficiency messaging.
- Educational guidance explaining that calendar estimates do not verify ovulation.
- Never describe the estimated fertile window as a guaranteed fertile or infertile interval.
- Never position the app as contraception or as a way to rule out pregnancy.

**Prediction design:** use deterministic, testable domain logic, not generative AI. Use recent valid cycle intervals, robust statistics, bounded input validation, and an uncertainty range. The interface must downgrade confidence when there are few records, irregular intervals, postpartum changes, hormonal contraception, or other known sources of variability. Avoid displaying a precise probability of pregnancy or conception without validated clinical evidence.

### 4.4 Pregnancy tracker

- Enable/disable pregnancy mode separately from cycle tracking.
- Dating inputs: first day of last menstrual period (LMP), known conception date (optional), IVF/assisted reproduction date and embryo age (where applicable), or clinician-confirmed ultrasound due date.
- Calculate gestational age (weeks + days), trimester, estimated due date, and pregnancy milestones.
- Pregnancy timeline with general educational content by week/trimester.
- Appointment and test reminders that users can edit or dismiss.
- Optional check-ins: symptoms, energy, mood, sleep, hydration, activity, questions for clinician, and notes.
- Optional weight/measurement fields should be hidden by default and never presented as a performance score.
- Allow users to mark a pregnancy outcome or switch to postpartum mode without judgmental language.
- Provide a clear route to pause, archive, or delete pregnancy data.

**EDD calculation:** LMP-based EDD uses 280 days from the first day of the LMP as a conventional estimate. Do not overwrite a clinician-confirmed dating decision automatically. First-trimester ultrasound and assisted-reproduction dating can change the preferred method. Display the selected dating source and an explicit estimate label.

### 4.5 Postpartum and recovery

- Optional postpartum mode with date of delivery and clinician-provided milestones.
- Recovery notes, mood and sleep check-ins.
- Feeding and hydration reminders only when selected by the user.
- Appointment and support reminders.
- Education about recovery, warning signs, emotional wellbeing, and asking for support, reviewed by qualified clinicians.
- No diagnostic interpretation of postpartum symptoms.

### 4.6 Nutrition and diet charts

- Food preferences: vegetarian, vegan, mixed, allergies/intolerances, religious/cultural preferences, budget and local food availability.
- Meal planner with breakfast, lunch, dinner and snacks.
- Weekly diet chart and grocery list.
- Hydration tracker with customizable reminders.
- General balanced-meal guidance and nutrient education.
- Pregnancy-specific educational content separated from general nutrition content.
- Clearly label all sample menus as general examples, not medical diets.
- Do not generate calorie-deficit or weight-loss plans for pregnancy, eating disorders, or users with medical risk without clinician input.
- Do not prescribe supplements, dosage, or treatment. Folic acid, iron and other pregnancy supplement guidance must link to current local clinical guidance and direct users to their clinician.
- Allergy filters must be deterministic and conservative; if ingredient safety is unclear, do not claim a meal is allergy-safe.

### 4.7 Exercise and movement planner

- Activity goals and weekly plans.
- Walking, gentle strength, yoga/mobility, stretching, breathing and rest-day options.
- Exercise logging: activity, duration, perceived effort and optional notes.
- Fitness plan adapts by user-selected mode (general wellness, cycle awareness, pregnancy, postpartum) but must not infer medical clearance.
- Pregnancy exercise content should advise users to discuss suitability with their obstetric clinician, especially when they have a health condition or pregnancy complication.
- Start-at-current-level recommendations; include beginner alternatives and rest days.
- Stop-exercise guidance and a clinician contact prompt for warning symptoms.
- No body-shaming language, arbitrary weight targets, or unsafe intensity prescriptions.

### 4.8 Sexual and reproductive wellness

- Consent, communication, privacy and respectful relationship education.
- Contraception education with clear explanation that different methods have different effectiveness, suitability and access considerations.
- STI prevention and testing education; explain that many STIs can be asymptomatic.
- Condom-use and vaccination education, including HPV and hepatitis B, with local-care links.
- Cervical screening and preventive-care reminders based on user-entered country/age only after local guidelines are verified.
- Menstrual hygiene, genital health basics, and guidance on when to seek professional evaluation.
- Optional private records for screenings, vaccines, tests, and questions for a clinician.
- Never infer sexual activity, orientation, fertility intent or relationship status.
- Do not diagnose vaginal infections or recommend antibiotics/antifungals from symptoms.

### 4.9 Healthy habits and wellbeing

- User-selected habits: hydration, movement, sleep routine, balanced meals, mindfulness, medication reminders, and appointment follow-through.
- Daily/weekly check-ins, streaks that can be paused, and flexible goals.
- Sleep diary and mood/energy trends.
- Gentle prompts rather than guilt, shame, or punishment for missed days.
- Optional reminders with quiet hours and discreet text.
- No medical claims that a habit prevents or cures a condition.

### 4.10 Health records and appointments

- Personal notes, clinician questions, appointment details, screening history, vaccination records and medication reminders.
- Private document upload to Supabase Storage with a per-user folder and Storage RLS.
- File size/type limits, safe filenames, signed access URLs with short expiry, and malware scanning where supported.
- Avoid collecting full medical records unless the feature is necessary and the user has explicitly chosen it.
- Do not treat uploaded reports as verified diagnoses. AI explanations of reports, if added later, must be opt-in and clearly non-diagnostic.

### 4.11 Notifications and reminders

- Period and predicted-date reminders.
- Habit and hydration reminders.
- Appointment reminders.
- Pregnancy milestone reminders.
- Medication reminders.
- User-configurable frequency, quiet hours, timezone and notification text privacy.
- In-app notifications first; browser push/email only after explicit opt-in and provider configuration.
- Handle denied browser permissions without blocking app usage.

## 5. AI health companion

### Features

- Ask general questions about menstrual health, fertility awareness, pregnancy education, nutrition, activity, sexual health and everyday wellbeing.
- Explain the user's own logged trends only when the user explicitly enables context sharing.
- Summarize a period history or user-entered symptom diary in neutral language.
- Suggest questions the user may wish to ask a healthcare professional.
- Suggest general habits and educational content, not diagnosis or treatment.
- Support multilingual answers after content quality and safety review.

### AI architecture

1. React client sends a bounded, validated request to an authenticated Supabase Edge Function.
2. Edge Function verifies the user JWT and checks consent and rate limits.
3. Only the minimum necessary context is retrieved from the user's own RLS-protected records.
4. AI provider key stays in server-side secrets; it never appears in a Vite `VITE_*` variable or browser bundle.
5. Response passes schema validation and safety checks before returning to the client.
6. Raw chat history is not saved by default. Users may explicitly opt into chat history.

### AI safety rules

- No diagnosis, prescription, dosage, or medication changes.
- No claim that ovulation has been confirmed from calendar dates.
- No pregnancy confirmation from symptoms or cycle dates.
- No claim that a user is or is not pregnant.
- No emergency assessment based solely on a language model.
- Provide clear escalation guidance for concerning or urgent symptoms, based on clinician-reviewed content.
- Do not provide false reassurance when symptoms may need evaluation.
- Detect prompt injection and requests to bypass medical limitations.
- If an answer cannot be supported, say so and point to a clinician or official health source.
- Do not use AI responses as the source of deterministic cycle or due-date calculations.

### AI fallback design

- Provider unavailable: show a friendly retry option and curated educational FAQ.
- Timeout: cancel request, retain the user's draft, and offer a retry.
- Rate limit: show a wait message and preserve the conversation input.
- Invalid model output: reject it and return a safe fallback.
- Missing consent: answer only from public/general educational content, without reading personal health records.
- Urgent-risk language: show a predefined escalation card from reviewed content, not a generated diagnosis.

## 6. Prediction and calculation engine

All calculation code must live outside UI components in small, deterministic TypeScript modules with unit tests.

### Cycle and period estimates

- Validate date-only input independently of browser timezone.
- Deduplicate and sort period starts.
- Calculate intervals between valid period starts.
- Exclude clearly invalid intervals and expose how much data was used.
- Use median/recent-window logic rather than allowing one outlier to dominate.
- Display a range or variability note where appropriate.
- Estimate ovulation only as an approximate calendar marker; do not represent it as measured ovulation.

### Pregnancy dating

- LMP-based estimate: LMP + 280 days.
- Calculate gestational age as elapsed calendar days from the selected dating anchor.
- Support clinician-confirmed EDD as the preferred displayed date when entered.
- Support ART/IVF dating inputs with a separately tested calculation path.
- Show which dating method is active and when it was last updated.

### General rules

- No hidden machine-learning inference in the first release.
- No invented confidence percentages.
- All algorithms versioned and documented.
- All outputs include missing-data and uncertainty handling.
- Keep calculations stable across leap years, month boundaries, timezone offsets and daylight-saving transitions.

## 7. Recycle bin and deletion lifecycle

### User experience

- Delete action moves a record to Recycle Bin rather than immediately removing it.
- Recycle Bin shows item type, a minimal safe label, deletion date and expiry date.
- Restore action returns a valid, unexpired record to its original module.
- Permanent delete removes the selected item immediately after confirmation.
- Empty Recycle Bin action requires a second confirmation.
- Items expire automatically after **30 days by default**; retention should be configurable in product policy.
- Users can export data before permanent deletion.

### Technical design

- Use soft deletion on each applicable table (`deleted_at`, `purge_after`, optional `deleted_by`).
- Do not duplicate all sensitive fields into a generic JSON snapshot table.
- Recycle Bin queries return only the authenticated user's deleted records.
- Restore checks ownership, supported entity type and expiry in a database function/transaction.
- A scheduled server-side purge hard-deletes expired rows and associated Storage objects.
- Permanent delete is irreversible and must explain the consequence.
- Account deletion is a separate workflow: re-authenticate/confirm, revoke sessions, remove Storage objects, delete user-owned records, then delete the Auth identity through a trusted server-side operation.
- Document how provider backups and infrastructure retention differ from the in-app Recycle Bin; a user-facing delete should not be described as instantly erasing historic infrastructure backups.

## 8. Privacy, security and abuse resistance

Women's health information is sensitive. Security is a release blocker, not a polish task.

### Authentication and authorization

- Supabase Auth sessions; secure session lifecycle and email verification.
- Row Level Security on every user-owned table and Storage bucket.
- Policies must use the authenticated user identity and never trust a `user_id` supplied by the browser.
- No admin/service-role key in frontend code.
- User data access is denied by default.
- Test account A cannot read/update/delete account B's rows, including via direct API requests.

### Data handling

- TLS in transit; rely on documented provider encryption at rest but do not claim end-to-end encryption.
- Minimize personal data and avoid unnecessary analytics.
- No advertising SDKs or third-party tracking pixels in sensitive pages.
- Do not log symptoms, LMP, pregnancy status, sexual-health details, chat prompts or document contents.
- Redact identifiers and request bodies from error tracking.
- Use private Storage buckets and short-lived signed URLs.
- Validate uploaded files by content type, size and safe storage path.
- Sanitize/render user text safely; avoid dynamic HTML insertion.
- Use restrictive Content Security Policy and security headers, then test that required Supabase endpoints are explicitly allowed.
- Protect Edge Functions with JWT verification, rate limiting, request-size limits, schema validation and timeouts.
- Add abuse controls for sign-up, password reset and AI endpoints.

### Governance and compliance

- Complete privacy impact assessment and threat model before real-user launch.
- Review applicable Indian and other user-country privacy, consumer, health-content and child-safety requirements with qualified counsel.
- Publish clear Privacy Notice, Terms, AI Notice, deletion/retention policy and support contact.
- Get clinician review for health education and red-flag guidance.
- Keep content sources, reviewers, review dates and change history in a controlled content register.
- Provide a security incident response and data breach procedure.

## 9. Recommended technology stack

| Layer | Choice | Reason |
|---|---|---|
| Frontend | React 19 + TypeScript + Vite | Retain existing prototype and assignment work |
| Styling | CSS Modules or organized CSS + design tokens | Consistent, responsive UI without excessive dependencies |
| UI icons | lucide-react | Existing dependency and consistent iconography |
| Routing | React Router | Auth-protected routes and module separation |
| Server state | TanStack Query | Caching, retries, request lifecycle and invalidation |
| Forms | React Hook Form + Zod | Typed forms and shared validation schemas |
| Backend | Supabase | Managed Auth, Postgres, Storage and Edge Functions |
| Database | Supabase PostgreSQL | Relational health data with RLS |
| AI | Provider adapter behind Edge Function | Provider can be changed without exposing credentials |
| Unit/component tests | Vitest + Testing Library | Existing test setup |
| End-to-end tests | Playwright | Auth, forms, data lifecycle and user journeys |
| Accessibility checks | axe-core + keyboard/screen-reader review | Catch common accessibility failures |
| Static analysis | ESLint + TypeScript + dependency audit | Catch code and dependency issues early |
| Hosting | Vercel | Existing Vite app deployment target |
| CI | GitHub Actions | Repeatable checks before merge/deploy |

### Environment separation

- Local development Supabase project.
- Staging Supabase project for preview deployments and QA.
- Production Supabase project with restricted access.
- Separate environment variables and AI provider secrets for each environment.
- Use database migrations committed to Git; do not make undocumented production-only schema edits.

## 10. Proposed repository structure

```text
cyclecue/
├── public/
├── src/
│   ├── app/                 # app shell, providers, route guards
│   ├── components/          # shared UI components
│   ├── features/
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── cycle/
│   │   ├── fertility/
│   │   ├── pregnancy/
│   │   ├── postpartum/
│   │   ├── nutrition/
│   │   ├── fitness/
│   │   ├── sexual-health/
│   │   ├── habits/
│   │   ├── records/
│   │   ├── recycle-bin/
│   │   └── assistant/
│   ├── lib/                 # Supabase client, date, validation, utilities
│   ├── services/            # API/domain orchestration
│   ├── hooks/
│   ├── types/
│   ├── styles/
│   └── test/
├── supabase/
│   ├── migrations/
│   ├── functions/
│   │   ├── health-assistant/
│   │   ├── purge-trash/
│   │   └── delete-account/
│   └── seed.sql
├── e2e/
├── docs/
├── .env.example
├── SECURITY.md
├── README.md
└── vercel.json
```

## 11. UI/UX design system and interaction rules

### Visual direction

- Calm, modern, warm, reassuring and professional.
- Cream/off-white surfaces, muted rose accents, sage/teal secondary accents, charcoal text.
- High-contrast text and clear error/success states; do not communicate meaning through color alone.
- Avoid childish visuals, excessive gradients, crowded cards and overly decorative dashboards.
- Use a consistent spacing scale, typography scale, radius scale and reusable components.

### Usability requirements

- Mobile-first layout; primary actions reachable with one hand.
- Desktop sidebar and mobile bottom navigation or compact drawer.
- Quick log flow should take as few steps as practical.
- Every form supports labels, hints, validation and clear recovery from errors.
- Use confirmation for destructive actions, not for routine navigation.
- Use skeleton/loading, empty, offline, error and success states consistently.
- Calendar legend differentiates recorded, predicted and user-entered information.
- Charts include readable labels and accessible text summaries.
- Provide undo where safe; recycle bin provides recovery for destructive record actions.
- Respect reduced-motion preferences, browser zoom and keyboard navigation.
- Target WCAG 2.2 AA for the core flows.

## 12. Error handling, resilience and fallbacks

| Failure | Expected behavior |
|---|---|
| No internet | Show offline banner; preserve safe local draft; disable cloud writes clearly |
| Supabase unavailable | Do not show stale success; allow retry; show last sync state |
| Expired session | Preserve unsent draft; request re-authentication |
| RLS denial | Show generic access error; log redacted diagnostic identifier |
| Invalid form data | Inline validation; do not send request |
| Database conflict | Refresh relevant data; explain conflict; avoid silent overwrite |
| AI provider timeout | Keep prompt; show retry and curated FAQ fallback |
| AI invalid output | Reject response and show safe fallback |
| Storage upload failure | Keep metadata form open; offer retry; do not create broken record |
| Corrupt cached data | Quarantine/discard safely; re-fetch authoritative server data |
| Unexpected React exception | Error boundary with retry and safe navigation |
| Notification permission denied | Keep reminders visible in-app; no repeated permission prompts |

All asynchronous operations need bounded retries with exponential backoff where retry is safe, request timeouts, cancellation on unmount/navigation, and idempotency for operations that might otherwise create duplicates.

## 13. Testing and quality assurance plan

### A. Unit tests

- Date-only parsing, leap years, month transitions and timezone boundaries.
- Cycle interval validation, duplicates, outliers, low-data and irregular-data cases.
- Ovulation/fertile-window labelling and uncertainty states.
- EDD calculations from LMP and supported IVF inputs.
- Gestational age and trimester boundary dates.
- Nutrition allergy filtering and unsafe/unknown ingredient fallback.
- Habit calculations, timezone-safe reminder scheduling and date boundaries.
- Soft-delete, restore, expiry and permanent-delete business rules.
- Runtime schemas for all request/response types.

### B. Component and accessibility tests

- Forms, errors, dialogs, calendar controls, charts and responsive navigation.
- Keyboard-only operation and visible focus.
- Screen-reader names, field labels, status announcements and dialog focus management.
- Contrast checks and reduced-motion behavior.
- No horizontal overflow at common phone/tablet/desktop widths.

### C. Integration tests

- Sign-up, email verification, login, logout and password reset.
- Session restoration and expiration.
- CRUD for every health module.
- User A cannot query or mutate User B's records.
- Recycle Bin lists only the current user's deleted records.
- Restore, expiry, empty-bin and permanent deletion behavior.
- Storage bucket ownership and signed URL expiry.
- AI function verifies JWT, consent, rate limits and schema.
- Account deletion removes the user's live database records and storage objects according to the documented workflow.

### D. End-to-end tests

1. Register a new test user and complete optional onboarding.
2. Log, edit and delete a period record.
3. Verify cycle estimates and low-data messages.
4. Add symptom check-in and view trend history.
5. Enable pregnancy mode and calculate an estimated due date.
6. View pregnancy milestones and mark a reminder complete.
7. Create a meal plan and a movement goal.
8. Use the AI assistant with consent enabled and disabled.
9. Simulate AI timeout and confirm fallback.
10. Delete a record, restore it, then permanently delete it.
11. Export data and verify the exported file.
12. Log out and confirm private routes do not expose data.
13. Log in as a second user and confirm account isolation.

### E. Security tests

- RLS policy tests for every table and Storage bucket.
- Attempt cross-user select/insert/update/delete through direct API calls.
- Check that no service-role or provider secret appears in source maps, bundles, Git history or browser network responses.
- Dependency vulnerability audit and lockfile review.
- Static analysis and secret scanning.
- SQL migration review and database security advisor.
- Input-size limits, malformed JSON, unexpected enum values and injection attempts.
- Rate-limit and brute-force testing for auth and AI routes.
- Prompt-injection and unsafe medical-advice test set for the AI assistant.
- Verify CSP, CORS, security headers and redirect configuration.

### F. Release gates

No production release until all of the following are true:

- TypeScript build passes.
- ESLint passes without ignored safety-critical errors.
- Unit, component, integration and end-to-end tests pass.
- RLS cross-account isolation tests pass.
- No high/critical dependency or secret-scan issue remains unresolved.
- Accessibility review completed for authentication, logging, calendar, recycle bin and pregnancy flows.
- Health content and urgent-care messaging reviewed by a qualified professional.
- Privacy notice, AI notice and data lifecycle documentation are published.
- Backup, restore, incident response and support process are tested/documented.

## 14. CI/CD and Vercel deployment

### Build and release pipeline

1. Commit changes to a feature branch.
2. GitHub Actions runs install, typecheck, lint, unit tests, build, secret scan and dependency audit.
3. Pull request creates a Vercel preview deployment connected to staging Supabase.
4. E2E and RLS tests run against the staging project.
5. Review and merge to the production branch.
6. Vercel deploys the frontend with production environment variables.
7. Apply reviewed Supabase migrations to production.
8. Run smoke tests for authentication, database access, private data isolation and health calculations.
9. Monitor availability and errors without logging sensitive health payloads.

### Required configuration

Frontend environment variables:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

The Supabase publishable/anon key is intended to be used by the client only when every exposed table is protected by correct RLS. It is not a secret and must not be treated as authorization by itself.

Server-side Supabase Edge Function secrets (never `VITE_*`):

```env
SUPABASE_URL=
SUPABASE_ANON_KEY=
AI_PROVIDER_API_KEY=
AI_PROVIDER_MODEL=
```

Use the platform's supported secret-management process. Never commit real `.env` files or production credentials. Do not put `SUPABASE_SERVICE_ROLE_KEY` in the browser. Use the caller-scoped RLS client for normal user operations; use elevated privileges only in narrowly scoped, audited server functions.

### Deployment prerequisites

- A GitHub repository containing the project.
- Supabase development/staging/production projects and configured Auth redirect URLs.
- Vercel account with repository access.
- DNS/domain access if a custom domain is desired.
- Verified sender configuration for production authentication emails.
- AI provider account/key only if the AI feature is enabled.

The Vercel deployment cannot be completed from source code alone: access to the user's Supabase and Vercel projects is required. Deploy only after the release gates pass.

## 15. Delivery roadmap

| Phase | Scope | Completion criteria |
|---|---|---|
| 0 — Audit & foundation | Review current CycleCue prototype, clean architecture, design system, routes, schemas and tests | Baseline build and test report; agreed data model |
| 1 — Accounts & cloud data | Supabase setup, auth, profiles, RLS, migrations, session lifecycle | Two-user isolation tests pass |
| 2 — Cycle & recycle bin | Period, symptoms, cycle history, fertility estimates, export, soft-delete/restore/purge | Full cycle and data lifecycle E2E pass |
| 3 — Pregnancy | Pregnancy mode, EDD, trimester, milestones and appointments | LMP/IVF/clinician-date tests and content review pass |
| 4 — Wellness suite | Nutrition, movement, habits, sexual/reproductive education, postpartum and menopause modules | Safety-reviewed content and accessibility checks pass |
| 5 — AI companion | Edge Function, provider adapter, opt-in context, curated fallback, safety tests | Prompt-injection, timeout and privacy tests pass |
| 6 — Production readiness | CI/CD, Vercel, monitoring, privacy docs, incident response, security review | All release gates pass |

### Scope control

The initial public beta should prioritize account security, period tracking, symptom logging, cycle estimates, Recycle Bin, export, basic pregnancy dating, wellness education and the AI assistant's safe general-information mode. Advanced content, document interpretation, push messaging, social/community features and predictive ML should remain out of the first release until there is evidence, testing capacity and a clear privacy case.

## 16. Current codebase status and migration notes

The current project is a frontend-only prototype. It already contains:

- React + TypeScript + Vite project setup.
- Overview, calendar, insights, settings and a local rule-based companion.
- Local-storage persistence, basic validation, export/delete and an error boundary.
- Cycle/date utility modules and initial Vitest tests.
- README, SECURITY.md, environment example and Vercel headers.

It does **not yet** contain:

- Supabase authentication or account management.
- Cloud PostgreSQL persistence or RLS policies.
- Recycle Bin / recoverable soft delete.
- Pregnancy, postpartum, menopause, nutrition or fitness modules.
- Server-side AI integration.
- Full E2E, RLS, accessibility or security test coverage.
- A verified production deployment.

Implementation should extend the current project incrementally rather than replacing the working cycle logic blindly. Existing local data needs a deliberate migration/export path; do not silently upload sample/demo records as real user data.

## 17. Health-content governance and reference principles

- Period and ovulation windows are estimates; cycle length and ovulation timing vary. Tracking apps and calendar calculations are not reliable contraception.
- LMP-based EDD uses 280 days as a conventional estimate, but ultrasound and assisted-reproduction dating may be used to confirm or establish the preferred due date.
- Pregnancy nutrition and exercise content must be sourced from recognized clinical/public-health authorities and reviewed for local relevance.
- Sexual health education should be factual and non-judgmental. STI testing, condoms and vaccination content must not imply that symptoms alone can rule an STI in or out.
- Every health article should include its source, review date, geography, reviewer and next review date.
- Urgent warning-sign content must be clinically reviewed and must not be generated ad hoc by the AI model.

## 18. Key product decisions

| Decision | Proposed baseline |
|---|---|
| Product name | CycleCue is the approved product name for this build |
| Frontend | Keep React + TypeScript + Vite |
| Backend | Supabase |
| Authentication | Email/password first; Google optional later |
| Cloud data | PostgreSQL with RLS on every user-owned table |
| Recycle Bin | Soft delete + 30-day default retention + user restore/permanent delete |
| AI | Authenticated Edge Function; opt-in health context; no chat retention by default |
| Prediction | Deterministic, explainable calculations; no generative AI prediction engine |
| Deployment | Vercel with staging/production separation |
| First public beta | Adult users only until minors/safeguarding requirements are reviewed |

---

## Reference sources

1. Supabase Auth: https://supabase.com/docs/guides/auth
2. Supabase Row Level Security: https://supabase.com/docs/guides/database/postgres/row-level-security
3. Supabase production security checklist: https://supabase.com/docs/guides/security/production-checklist
4. Supabase Edge Function security: https://supabase.com/docs/guides/functions/auth
5. Supabase user management: https://supabase.com/docs/guides/auth/managing-user-data
6. Supabase backups: https://supabase.com/docs/guides/platform/backups
7. Vite static deployment: https://vite.dev/guide/static-deploy
8. ACOG — Methods for Estimating the Due Date: https://www.acog.org/clinical/clinical-guidance/committee-opinion/articles/2017/05/methods-for-estimating-the-due-date
9. ACOG — Exercise During Pregnancy: https://www.acog.org/womens-health/faqs/exercise-during-pregnancy
10. NHS inform — Periods and pregnancy: https://www.nhsinform.scot/healthy-living/womens-health/girls-and-young-women-puberty-to-around-25/periods-and-menstrual-health/periods-and-pregnancy/
11. NHS — Healthy diet in pregnancy: https://www.nhs.uk/pregnancy/keeping-well/have-a-healthy-diet/
12. WHO — Sexually transmitted infections: https://www.who.int/news-room/fact-sheets/detail/sexually-transmitted-infections-%28stis%29

---

**Planning status:** This document describes the proposed target product and delivery approach. The production features listed as future scope are not represented as implemented. Each phase must be built, tested and reviewed before being marked complete.
