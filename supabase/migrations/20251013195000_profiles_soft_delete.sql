alter table public.profiles
  add column if not exists is_deleted boolean not null default false;

create or replace function public.admin_soft_delete_profile(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.assert_admin();

  update public.profiles
     set is_deleted = true,
         updated_at = now()
   where id = p_id;
end;
$$;

revoke all on function public.admin_soft_delete_profile(uuid) from public;
grant execute on function public.admin_soft_delete_profile(uuid) to authenticated;

drop function if exists public.admin_list_profiles();

create function public.admin_list_profiles()
returns table (
  id uuid,
  email text,
  employee_no text,
  last_name text,
  first_name text,
  site_id uuid,
  site_code text,
  site_name text,
  manager_id uuid,
  manager_name text,
  notes text,
  first_login_completed boolean,
  created_at timestamptz,
  updated_at timestamptz,
  is_deleted boolean
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
           p.site_id,
           s.code as site_code,
           s.name as site_name,
           p.manager_id,
           m.last_name || coalesce(' ' || m.first_name, '') as manager_name,
           p.notes,
           p.first_login_completed,
           p.created_at,
           p.updated_at,
           p.is_deleted
      from public.profiles p
      left join public.sites s on s.id = p.site_id
      left join public.profiles m on m.id = p.manager_id
     where coalesce(p.is_deleted, false) = false
     order by p.last_name nulls first, p.first_name nulls first;
end;
$$;

revoke all on function public.admin_list_profiles() from public;
grant execute on function public.admin_list_profiles() to authenticated;

drop function if exists public.admin_monthly_activity(date);

create function public.admin_monthly_activity(
  p_month date default date_trunc('month', now())::date
)
returns table (
  user_id uuid,
  email text,
  employee_no text,
  last_name text,
  first_name text,
  site_id uuid,
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
           p.site_id,
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
     where coalesce(p.is_deleted, false) = false
     group by p.id, p.email, p.employee_no, p.last_name, p.first_name, p.site_id, s.code, s.name
     order by submission_count desc, p.last_name nulls first;
end;
$$;

revoke all on function public.admin_monthly_activity(date) from public;
grant execute on function public.admin_monthly_activity(date) to authenticated;
