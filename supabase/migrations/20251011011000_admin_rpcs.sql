-- Helper to ensure admin role based on JWT claim
create or replace function public.assert_admin()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(auth.jwt() ->> 'role', '') <> 'admin' then
    raise exception 'admin role required';
  end if;
end;
$$;

revoke all on function public.assert_admin() from public;
grant execute on function public.assert_admin() to authenticated;

-- Admin: list profiles with site / manager info
create or replace function public.admin_list_profiles()
returns table (
  id uuid,
  email text,
  employee_no text,
  last_name text,
  first_name text,
  site_code text,
  site_name text,
  manager_id uuid,
  manager_name text,
  first_login_completed boolean,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.assert_admin();

  return query
    select p.id,
           p.email,
           p.employee_no,
           p.last_name,
           p.first_name,
           s.code as site_code,
           s.name as site_name,
           p.manager_id,
           m.last_name || coalesce(' ' || m.first_name, '') as manager_name,
           p.first_login_completed,
           p.created_at,
           p.updated_at
      from public.profiles p
      left join public.sites s on s.id = p.site_id
      left join public.profiles m on m.id = p.manager_id
     order by p.last_name nulls first, p.first_name nulls first;
end;
$$;

revoke all on function public.admin_list_profiles() from public;
grant execute on function public.admin_list_profiles() to authenticated;

-- Admin: monthly activity summary
create or replace function public.admin_monthly_activity(
  p_month date default date_trunc('month', now())::date
)
returns table (
  user_id uuid,
  email text,
  employee_no text,
  last_name text,
  first_name text,
  site_code text,
  site_name text,
  submission_count bigint,
  first_submission_at timestamptz,
  last_submission_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_start timestamptz := date_trunc('month', p_month);
  v_end timestamptz := (date_trunc('month', p_month) + interval '1 month');
begin
  perform public.assert_admin();

  return query
    select p.id,
           p.email,
           p.employee_no,
           p.last_name,
           p.first_name,
           s.code as site_code,
           s.name as site_name,
           count(sbm.id) as submission_count,
           min(sbm.created_at) as first_submission_at,
           max(sbm.created_at) as last_submission_at
      from public.profiles p
      left join public.sites s on s.id = p.site_id
      left join public.submissions sbm
        on sbm.user_id = p.id
       and sbm.created_at >= v_start
       and sbm.created_at < v_end
     group by p.id, p.email, p.employee_no, p.last_name, p.first_name, s.code, s.name
     order by submission_count desc, p.last_name nulls first;
end;
$$;

revoke all on function public.admin_monthly_activity(date) from public;
grant execute on function public.admin_monthly_activity(date) to authenticated;
