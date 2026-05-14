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
  to authenticated
  using ((select auth.uid()) = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  to authenticated
  with check ((select auth.uid()) = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

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
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "test_results_insert_own" on public.test_results;
create policy "test_results_insert_own"
  on public.test_results for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "test_results_update_own" on public.test_results;
create policy "test_results_update_own"
  on public.test_results for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create index if not exists test_results_user_created_idx
  on public.test_results (user_id, client_created_at desc);

create index if not exists test_results_user_mbti_idx
  on public.test_results (user_id, mbti_result);

-- Required when "Automatically expose new tables" is disabled.
-- Anonymous Supabase auth sessions use the authenticated database role,
-- and RLS policies above still apply after these grants.
grant usage on schema public to authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update on public.test_results to authenticated;

-- Supabase automatic RLS can create a SECURITY DEFINER helper in public.
-- Keep it unavailable through the public REST/RPC surface when it exists.
do $$
begin
  if exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'rls_auto_enable'
      and p.pronargs = 0
  ) then
    revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
  end if;
end $$;
