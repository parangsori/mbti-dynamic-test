-- 오늘의 MBTI backend sync foundation
-- Run in Supabase SQL Editor after creating the project.
-- Keep RLS enabled: users may only read/write their own synced records.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  is_anonymous boolean not null default true,
  age_group text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create table if not exists public.test_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  local_entry_id text not null,
  mbti_result text not null check (char_length(mbti_result) = 4),
  sync_rate integer check (sync_rate is null or (sync_rate >= 0 and sync_rate <= 100)),
  theme_key text,
  variant_key text,
  axes jsonb,
  scores jsonb,
  question_context jsonb,
  client_created_at timestamptz not null,
  schema_version integer not null default 1,
  source text not null default 'web',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, local_entry_id)
);

alter table public.test_results enable row level security;

drop policy if exists "test_results_select_own" on public.test_results;
create policy "test_results_select_own"
  on public.test_results for select
  using (auth.uid() = user_id);

drop policy if exists "test_results_insert_own" on public.test_results;
create policy "test_results_insert_own"
  on public.test_results for insert
  with check (auth.uid() = user_id);

drop policy if exists "test_results_update_own" on public.test_results;
create policy "test_results_update_own"
  on public.test_results for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists test_results_user_created_idx
  on public.test_results (user_id, client_created_at desc);

create index if not exists test_results_user_mbti_idx
  on public.test_results (user_id, mbti_result);
