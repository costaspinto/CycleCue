-- CycleCue initial schema. Apply with `supabase db push` after linking your project.
-- Never expose the service_role key in browser code.

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text check (display_name is null or char_length(display_name) <= 80),
  date_of_birth date,
  timezone text not null default 'Asia/Kolkata' check (char_length(timezone) <= 64),
  country_code text check (country_code is null or country_code ~ '^[A-Z]{2}$'),
  preferences jsonb not null default '{}'::jsonb check (jsonb_typeof(preferences) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.health_records (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  record_type text not null check (record_type in (
    'period', 'symptom_checkin', 'fertility_observation', 'pregnancy_profile',
    'pregnancy_checkin', 'nutrition_log', 'activity_log', 'habit_log',
    'sexual_wellness_note', 'appointment', 'medication_reminder', 'health_note'
  )),
  record_date date,
  payload jsonb not null check (jsonb_typeof(payload) = 'object' and pg_column_size(payload) <= 49152),
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint health_records_owner_not_null check (user_id is not null)
);

create index if not exists health_records_user_type_date_idx
  on public.health_records (user_id, record_type, record_date desc)
  where deleted_at is null;
create index if not exists health_records_user_deleted_idx
  on public.health_records (user_id, deleted_at desc)
  where deleted_at is not null;

create table if not exists public.user_consents (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  consent_type text not null check (consent_type in ('ai_context', 'cloud_sync', 'notifications', 'research_analytics')),
  granted boolean not null,
  policy_version text not null check (char_length(policy_version) <= 32),
  recorded_at timestamptz not null default now(),
  unique (user_id, consent_type, policy_version),
  constraint user_consents_owner_not_null check (user_id is not null)
);

create table if not exists public.health_documents (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  storage_path text not null unique,
  file_name text not null check (char_length(file_name) between 1 and 180),
  content_type text not null check (content_type in ('application/pdf', 'image/jpeg', 'image/png')),
  file_size_bytes bigint not null check (file_size_bytes between 1 and 10485760),
  notes text check (notes is null or char_length(notes) <= 1000),
  deleted_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists health_documents_user_idx on public.health_documents (user_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (user_id, display_name)
  values (new.id, nullif(left(coalesce(new.raw_user_meta_data ->> 'display_name', ''), 80), ''))
  on conflict (user_id) do nothing;
  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created_cyclecue on auth.users;
create trigger on_auth_user_created_cyclecue
after insert on auth.users
for each row execute procedure public.handle_new_user();

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
for each row execute procedure public.set_updated_at();

drop trigger if exists health_records_set_updated_at on public.health_records;
create trigger health_records_set_updated_at before update on public.health_records
for each row execute procedure public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.health_records enable row level security;
alter table public.user_consents enable row level security;
alter table public.health_documents enable row level security;

-- A user can only read and change their own profile.
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- All health records are owner-scoped. Deletion is soft-deletion via deleted_at.
drop policy if exists "health_records_select_own" on public.health_records;
create policy "health_records_select_own" on public.health_records for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "health_records_insert_own" on public.health_records;
create policy "health_records_insert_own" on public.health_records for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "health_records_update_own" on public.health_records;
create policy "health_records_update_own" on public.health_records for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "health_records_delete_recycled_own" on public.health_records;
create policy "health_records_delete_recycled_own" on public.health_records for delete to authenticated using ((select auth.uid()) = user_id and deleted_at is not null);

-- Consent is explicit, versioned and private to the account.
drop policy if exists "user_consents_select_own" on public.user_consents;
create policy "user_consents_select_own" on public.user_consents for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "user_consents_insert_own" on public.user_consents;
create policy "user_consents_insert_own" on public.user_consents for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "user_consents_update_own" on public.user_consents;
create policy "user_consents_update_own" on public.user_consents for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- Document metadata is owner-scoped. Files are stored in a private bucket.
drop policy if exists "health_documents_select_own" on public.health_documents;
create policy "health_documents_select_own" on public.health_documents for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "health_documents_insert_own" on public.health_documents;
create policy "health_documents_insert_own" on public.health_documents for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "health_documents_update_own" on public.health_documents;
create policy "health_documents_update_own" on public.health_documents for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "health_documents_delete_recycled_own" on public.health_documents;
create policy "health_documents_delete_recycled_own" on public.health_documents for delete to authenticated using ((select auth.uid()) = user_id and deleted_at is not null);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('cyclecue-private-health', 'cyclecue-private-health', false, 10485760, array['application/pdf', 'image/jpeg', 'image/png'])
on conflict (id) do nothing;

drop policy if exists "cyclecue_storage_select_own" on storage.objects;
create policy "cyclecue_storage_select_own" on storage.objects for select to authenticated
using (bucket_id = 'cyclecue-private-health' and (storage.foldername(name))[1] = (select auth.uid())::text);
drop policy if exists "cyclecue_storage_insert_own" on storage.objects;
create policy "cyclecue_storage_insert_own" on storage.objects for insert to authenticated
with check (bucket_id = 'cyclecue-private-health' and (storage.foldername(name))[1] = (select auth.uid())::text);
drop policy if exists "cyclecue_storage_update_own" on storage.objects;
create policy "cyclecue_storage_update_own" on storage.objects for update to authenticated
using (bucket_id = 'cyclecue-private-health' and (storage.foldername(name))[1] = (select auth.uid())::text)
with check (bucket_id = 'cyclecue-private-health' and (storage.foldername(name))[1] = (select auth.uid())::text);
drop policy if exists "cyclecue_storage_delete_own" on storage.objects;
create policy "cyclecue_storage_delete_own" on storage.objects for delete to authenticated
using (bucket_id = 'cyclecue-private-health' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- Do not add a public read policy. Use short-lived signed URLs for document access.
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update, delete on public.health_records to authenticated;
grant select, insert, update on public.user_consents to authenticated;
grant select, insert, update, delete on public.health_documents to authenticated;

-- Optional encrypted-in-transit account backup for the browser tracker state.
-- Client data is validated in the application and owner-isolated by RLS.
create table if not exists public.user_health_vault (
  user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  user_data jsonb not null check (jsonb_typeof(user_data) = 'object' and pg_column_size(user_data) <= 225280),
  updated_at timestamptz not null default now(),
  constraint user_health_vault_owner_not_null check (user_id is not null)
);
alter table public.user_health_vault enable row level security;
drop policy if exists "user_health_vault_select_own" on public.user_health_vault;
create policy "user_health_vault_select_own" on public.user_health_vault for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "user_health_vault_insert_own" on public.user_health_vault;
create policy "user_health_vault_insert_own" on public.user_health_vault for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "user_health_vault_update_own" on public.user_health_vault;
create policy "user_health_vault_update_own" on public.user_health_vault for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
grant select, insert, update on public.user_health_vault to authenticated;

-- Private daily quota ledger for the optional AI assistant.
create table if not exists public.ai_usage_daily (
  user_id uuid not null references auth.users(id) on delete cascade,
  usage_date date not null default (now() at time zone 'utc')::date,
  request_count integer not null default 0 check (request_count between 0 and 20),
  primary key (user_id, usage_date)
);
alter table public.ai_usage_daily enable row level security;

create or replace function public.consume_ai_request()
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_count integer;
begin
  if auth.uid() is null then return false; end if;
  insert into public.ai_usage_daily (user_id, usage_date, request_count)
  values ((select auth.uid()), (now() at time zone 'utc')::date, 1)
  on conflict (user_id, usage_date)
  do update set request_count = public.ai_usage_daily.request_count + 1
  where public.ai_usage_daily.request_count < 20
  returning request_count into new_count;
  return new_count is not null and new_count <= 20;
end;
$$;
revoke all on function public.consume_ai_request() from public, anon;
grant execute on function public.consume_ai_request() to authenticated;
