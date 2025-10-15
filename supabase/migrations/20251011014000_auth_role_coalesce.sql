create or replace function public.is_admin()
returns boolean
language sql
security definer
as $$
  select coalesce(auth.jwt() ->> 'role', auth.jwt() -> 'user_metadata' ->> 'role') = 'admin';
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

create or replace function public.assert_admin()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'admin role required';
  end if;
end;
$$;

revoke all on function public.assert_admin() from public;
grant execute on function public.assert_admin() to authenticated;

-- Update policies to rely on is_admin()
drop policy if exists "profiles_admin_all" on public.profiles;
create policy "profiles_admin_all" on public.profiles for all
using ( public.is_admin() )
with check ( public.is_admin() );

drop policy if exists "submissions_admin_all" on public.submissions;
create policy "submissions_admin_all" on public.submissions for all
using ( public.is_admin() )
with check ( public.is_admin() );

drop policy if exists "sites_admin_all" on public.sites;
create policy "sites_admin_all" on public.sites for all
using ( public.is_admin() )
with check ( public.is_admin() );
