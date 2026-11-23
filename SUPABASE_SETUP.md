# CycleCue 1.3 — Supabase, Google sign-in and AI setup

This guide activates cloud accounts and the optional AI companion. Keep all secret credentials in Supabase's provider dashboards or Edge Function secrets. Do not paste secrets into chat, source code, Vercel client variables, or files committed to Git.

## A. Create your Supabase project

1. Create a project at <https://database.new> and save the project password in your password manager.
2. In **Project Settings → API**, copy the Project URL and the publishable key (`sb_publishable_...`). The browser must never use a `service_role` or secret key.
3. In the CycleCue project folder, create `.env.local` from `.env.example` and set:

   ```dotenv
   VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_YOUR_KEY
   VITE_APP_URL=http://localhost:5173
   ```

4. Restart Vite after changing environment variables: stop the server with Ctrl+C, then run `npm run dev` again.

## B. Apply the database schema

Use the Supabase Dashboard → **SQL Editor** and run the migration file:

`supabase/migrations/202611230001_initial_schema.sql`

Review the SQL output for errors before continuing. The migration creates user-scoped tables and policies with Row Level Security. Do not disable RLS to make an error disappear.

## C. Configure Supabase Auth redirect URLs

In Supabase Dashboard → **Authentication → URL Configuration**:

- Site URL: `http://localhost:5173`
- Additional Redirect URLs: `http://localhost:5173/**`
- When deployed, add your exact Vercel URL, for example `https://YOUR_APP.vercel.app/**`, and set Site URL to the production origin.

Keep password reset redirects included: `http://localhost:5173/reset-password` and `https://YOUR_APP.vercel.app/reset-password`.

## D. Enable email/password accounts

In **Authentication → Sign In / Providers**, enable Email. For production, configure a reliable SMTP sender in **Project Settings → Authentication → SMTP Settings** so verification and password reset messages can be delivered reliably. Test signup with an email you control. With email confirmation enabled, the user must verify the address before signing in.

## E. Enable Google sign-in

1. Open Google Cloud Console: <https://console.cloud.google.com/apis/credentials>.
2. Configure the Google Auth Platform consent screen and create an OAuth Client ID with application type **Web application**.
3. Add Authorized JavaScript origins:
   - `http://localhost:5173`
   - Your production Vercel origin, e.g. `https://YOUR_APP.vercel.app`
4. In Supabase Dashboard → **Authentication → Sign In / Providers → Google**, enable Google and copy the **Callback URL** displayed by Supabase.
5. Add that exact callback URL to Google Cloud Console → Authorized redirect URIs. It normally looks like `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`.
6. Paste the Google Client ID and Client Secret into Supabase's Google provider settings and save. Do not put either value in `.env.local` or Vercel frontend variables.
7. Verify the Supabase Site URL and Redirect URLs in section C. Try **Continue with Google** in CycleCue.

## F. Turn on the AI companion

The chat UI and Edge Function are included, but AI answers remain disabled until you provide an AI provider compatible with the OpenAI Chat Completions API. The browser never receives this provider key. The Edge Function uses Supabase's injected publishable-key set where available and falls back to the legacy injected anon key during migration.

1. Choose an AI provider and obtain an API key under your own account.
2. Install the Supabase CLI if needed, sign in, and link the project:

   ```powershell
   npx supabase login
   npx supabase link --project-ref YOUR_PROJECT_REF
   ```

3. Set server-side secrets (replace the example values locally in your terminal; never commit them):

   ```powershell
   npx supabase secrets set AI_API_URL=https://YOUR_PROVIDER_HOST/v1/chat/completions AI_API_KEY=YOUR_PROVIDER_SECRET AI_MODEL=YOUR_MODEL APP_ORIGINS=http://localhost:5173,https://YOUR_APP.vercel.app
   ```

   `APP_ORIGINS` is a comma-separated exact-origin allowlist. Remove localhost from the production secret after local testing if you do not need it.
4. Deploy the function:

   ```powershell
   npx supabase functions deploy health-assistant
   ```

5. Sign in to CycleCue, open **AI companion**, and explicitly enable **Enable AI answers**. The function includes an authenticated user check, consent check, strict origin allowlist, input limits, an 18-second timeout, daily quota, urgent-symptom fallback and a bounded recent conversation window.
6. Test with a general educational question. Then disable consent and verify the offline guide still responds.

Conversations are held only in the current page session; they are not saved to a CycleCue chat database. When consent is enabled, up to 10 recent chat messages may be sent to the AI provider. Period, fertility and pregnancy tracker records are never automatically attached.

## G. Vercel deployment

1. Import the Git repository into Vercel or deploy with the Vercel CLI.
2. Add `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, and `VITE_APP_URL` in Vercel → Project → Settings → Environment Variables for Production and Preview as appropriate.
3. Add the production Vercel origin to Supabase URL Configuration and Google OAuth Authorized JavaScript origins.
4. Deploy, then test email confirmation, Google sign-in, password reset, account separation, backup/restore and AI consent.

## H. Security checklist

- Never expose Supabase `service_role`, database passwords, Google Client Secret or AI provider keys in browser variables.
- Keep RLS enabled. Test with two separate accounts and confirm neither can read the other's rows.
- Use a dedicated production OAuth client and remove obsolete redirect URLs.
- Do not enter real medical or identifying information during local QA.
- AI answers are educational and can be wrong. They are not a diagnosis, emergency service, contraception advice or replacement for clinical care.
