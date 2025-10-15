-- Auto-create profile row when a new auth user is registered
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists handle_new_user on auth.users;
create trigger handle_new_user
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- RPC: mark first login completed and optionally update profile fields
create or replace function public.mark_first_login_completed(
  p_first_name text default null,
  p_last_name text default null,
  p_site_id uuid default null,
  p_employee_no text default null,
  p_notes text default null
)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile public.profiles;
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  update public.profiles
     set first_name = coalesce(p_first_name, first_name),
         last_name = coalesce(p_last_name, last_name),
         site_id = coalesce(p_site_id, site_id),
         employee_no = coalesce(p_employee_no, employee_no),
         notes = coalesce(p_notes, notes),
         first_login_completed = true
   where id = v_uid
   returning * into v_profile;

  if not found then
    raise exception 'Profile not found for user %', v_uid;
  end if;

  return v_profile;
end;
$$;

revoke all on function public.mark_first_login_completed(text, text, uuid, text, text) from public;
grant execute on function public.mark_first_login_completed(text, text, uuid, text, text) to authenticated;
