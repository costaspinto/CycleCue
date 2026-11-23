# CycleCue v1.4.1 — OpenRouter + Supabase setup

## Before enabling the AI assistant

The Google-only login flow is unchanged. Do not add SMTP or browser-side AI API credentials.

### 1. Confirm the database schema

If the initial CycleCue schema has not been applied yet, open Supabase Dashboard → SQL Editor and run `supabase/migrations/202611230001_initial_schema.sql` first.

Then run this new migration in the SQL Editor:

`supabase/migrations/202611240001_add_ai_tracker_context_consent.sql`

It adds the `ai_tracker_context` value to the existing consent constraint. It does not delete existing user consent records.

### 2. Create an OpenRouter API key

Open https://openrouter.ai/settings/keys and create an API key for CycleCue. Keep the key private.

### 3. Add Supabase Edge Function secrets

In Supabase Dashboard → Edge Functions → Secrets, add:

| Name | Value |
|---|---|
| `OPENROUTER_API_KEY` | Your OpenRouter API key |
| `APP_ORIGINS` | `http://localhost:5173` (plus exact Vercel origin when deployed, comma-separated) |
| `OPENROUTER_MODEL` | Optional. Defaults to `baidu/ernie-5.5-flash-preview:free`; only allowlisted free model IDs are accepted. |

The function never accepts a paid model ID from `OPENROUTER_MODEL`; unknown values revert to the default free model. The OpenRouter key belongs only in Supabase Edge Function Secrets, never in `.env.local`, a `VITE_` variable, browser code, or Git.

### 4. Deploy the updated Edge Function

From the CycleCue project root, after installing the Supabase CLI and signing in:

```powershell
supabase login
supabase link --project-ref bqidfvxkzsxmlwovnjbd
supabase functions deploy health-assistant --project-ref bqidfvxkzsxmlwovnjbd
```

If the function already exists, deploy again after applying this patch so the updated OpenRouter implementation is live.

### 5. Enable AI and optional tracker context

Sign in to CycleCue with Google. In Ask CycleCue:

- `Enable AI answers` is required before chat messages are sent to the AI provider.
- `Allow CycleCue to include a short tracker summary` is a second, optional consent.

The optional summary includes cycle/period lengths, a count and most recent date of recorded period starts, predefined symptom counts from the last 30 days, and OPK/cervical-mucus observation counts. It does not include name, email, full symptom diary, pregnancy information, basal temperatures, or documents. Only whitelisted fields are sent. The tracker summary is generated locally from the current browser tracker state.

## Free model route

The current free fallback order is:

1. `baidu/ernie-5.5-flash-preview:free` (primary)
2. `nvidia/nemotron-3-ultra-550b-a55b:free`
3. `inclusionai/ling-3.2-flash:free`

OpenRouter currently lists these as free model variants. Free-model availability and rate limits can change. OpenRouter documents 20 requests/minute and 50 requests/day for free variants on accounts below its $10 credit threshold; this CycleCue app also has a separate daily per-user limit. Check OpenRouter's current limits before launch.

## Privacy, safety and limitations

The chat messages are sent to OpenRouter and the model provider that serves each request after the user enables AI chat. Provider data retention and handling policies can vary. The separate tracker summary is off by default and must be explicitly enabled; users can revoke either consent. Do not include names, contact information or identifying details in prompts.

CycleCue's AI is a general education tool, not a diagnostic or treatment service. Model answers can be wrong. It cannot diagnose, prescribe, confirm pregnancy or ovulation, or replace professional advice. Urgent red-flag wording is intercepted by the Edge Function, but this is not a complete medical triage system. The offline fallback remains available when OpenRouter is unavailable or rate-limited.
