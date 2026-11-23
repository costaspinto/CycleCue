# CycleCue 1.3.0 UI, accounts and AI companion upgrade

## User experience
- DM Sans body type with Fraunces display headings, larger type scale, improved spacing and surface hierarchy.
- Responsive navigation uses a horizontal scroll rail on small screens.
- Motion and hover treatments respect `prefers-reduced-motion`.
- Persistent Sign in / My account entry points in the top bar and sidebar.
- Dedicated About CycleCue page.

## Authentication
- Supabase Auth email/password sign-up and sign-in.
- Password reset and update flow.
- Google OAuth with PKCE and an account selection prompt.
- The UI explicitly reports when Supabase URL and publishable key are not configured.

## AI companion
- Multi-message context bounded to the 10 most recent messages.
- Account-specific, versioned consent stored in `user_consents`.
- No period, fertility or pregnancy tracker records are attached to prompts.
- AI provider credentials remain in Supabase Edge Function secrets. The Edge Function prefers Supabase's injected publishable-key set and supports the legacy anon key during migration.
- Provider timeouts, quotas, strict origin allowlist, payload validation and offline fallback.
- Safety fallback responses are visibly classified separately from generated AI answers.
- Chat history remains in the current browser page session only.

## Setup
Follow `SUPABASE_SETUP.md` to configure a Supabase project, apply the existing SQL migration, enable Email and Google providers, and deploy the AI Edge Function with provider secrets.

## Verification in the supplied build environment
All 28 TypeScript/TSX source files, including the Edge Function, passed a TypeScript transpile/parser check with zero syntax diagnostics. A full dependency-backed typecheck, ESLint run, Vitest run and production build must still be run in the Windows project folder after applying this patch. No cloud auth or AI provider credentials were supplied, so live sign-in and provider inference are not yet activated.
