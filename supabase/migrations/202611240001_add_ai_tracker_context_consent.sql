-- Add a separate, user-controlled consent for sharing a limited tracker summary with the AI assistant.
-- Existing consent records and account data are preserved.
alter table public.user_consents
  drop constraint if exists user_consents_consent_type_check;

alter table public.user_consents
  add constraint user_consents_consent_type_check
  check (consent_type in (
    'ai_context',
    'ai_tracker_context',
    'cloud_sync',
    'notifications',
    'research_analytics'
  ));
