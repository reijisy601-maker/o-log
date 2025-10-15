create or replace function public.admin_update_profile(
  p_id uuid,
  p_employee_no text default null,
  p_first_name text default null,
  p_last_name text default null,
  p_site_id uuid default null,
  p_manager_id uuid default null,
  p_notes text default null,
  p_first_login_completed boolean default null
)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile public.profiles;
begin
  perform public.assert_admin();

  update public.profiles
     set employee_no = coalesce(p_employee_no, employee_no),
         first_name = coalesce(p_first_name, first_name),
         last_name = coalesce(p_last_name, last_name),
         site_id = coalesce(p_site_id, site_id),
         manager_id = coalesce(p_manager_id, manager_id),
         notes = coalesce(p_notes, notes),
         first_login_completed = coalesce(p_first_login_completed, first_login_completed)
   where id = p_id
   returning * into v_profile;

  if not found then
    raise exception 'Profile % not found', p_id;
  end if;

  return v_profile;
end;
$$;

revoke all on function public.admin_update_profile(uuid, text, text, text, uuid, uuid, text, boolean) from public;
grant execute on function public.admin_update_profile(uuid, text, text, text, uuid, uuid, text, boolean) to authenticated;
