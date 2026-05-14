-- Run after the initial schema if Supabase lints warn about broad anonymous access
-- or result sync inserts do not reach test_results.

grant usage on schema public to authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update on public.test_results to authenticated;

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
