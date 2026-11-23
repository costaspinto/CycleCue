import { useState } from 'react';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { supabase } from '../lib/supabase';

type AuthScreenProps = {
  serviceError?: string | null;
  onBack?: () => void;
};

function friendlyAuthError(error: unknown): string {
  const message = error instanceof Error ? error.message.toLowerCase() : '';
  if (message.includes('provider is not enabled') || message.includes('unsupported provider')) {
    return 'Google sign-in is not enabled yet. Enable Google under Supabase → Authentication → Sign In / Providers.';
  }
  if (message.includes('redirect') || message.includes('url not allowed')) {
    return 'This redirect URL is not allowed. Add your current CycleCue URL under Supabase → Authentication → URL Configuration.';
  }
  if (message.includes('network') || message.includes('fetch')) {
    return 'Network error. Check your connection and try again.';
  }
  return 'Google sign-in could not be started. Please try again.';
}

export function AuthScreen({ serviceError, onBack }: AuthScreenProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(serviceError ?? null);
  const configured = Boolean(supabase);

  const continueWithGoogle = async () => {
    setError(null);
    if (!supabase) {
      setError('Connect your Supabase project first. Check the local environment configuration and restart CycleCue.');
      return;
    }
    setBusy(true);
    try {
      const { error: requestError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
          queryParams: { prompt: 'select_account' },
        },
      });
      if (requestError) throw requestError;
    } catch (requestError) {
      setError(friendlyAuthError(requestError));
      setBusy(false);
    }
  };

  return (
    <div className="auth-screen">
      <section className="auth-card auth-card-upgraded auth-card-google-only">
        {onBack && <button className="auth-back" type="button" onClick={onBack}><ArrowLeft size={15} /> Back to CycleCue</button>}
        <img className="auth-full-logo" src="/brand/cyclecue-full.png" alt="CycleCue — women's health companion" />
        <div className="auth-intro">
          <p className="eyebrow">YOUR PERSONAL WELLNESS SPACE</p>
          <h1>Welcome to CycleCue</h1>
          <p>One private place to understand your cycle, track your wellbeing and support your health journey.</p>
        </div>
        {!configured && (
          <div className="auth-setup-notice" role="status">
            <ShieldCheck size={19} />
            <div><strong>Account connection is not configured</strong><p>Check VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in .env.local, then restart the development server.</p></div>
          </div>
        )}
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="google-auth-button google-auth-button-primary" type="button" onClick={() => { void continueWithGoogle(); }} disabled={busy || !configured}>
          <span className="google-g" aria-hidden="true">G</span>
          {busy ? 'Connecting to Google…' : 'Continue with Google'}
        </button>
        <div className="google-only-note"><ShieldCheck size={16} /><span>Secure sign-in powered by Google and Supabase. Your first Google sign-in creates your CycleCue account automatically.</span></div>
        <p className="auth-footnote">CycleCue provides educational tracking tools, not medical diagnosis or contraceptive advice. Your health data is private to your account when cloud storage is enabled.</p>
      </section>
    </div>
  );
}
