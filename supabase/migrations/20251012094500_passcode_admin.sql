alter table public.auth_passcodes
  add column if not exists updated_by uuid references auth.users(id),
  add column if not exists rotated_at timestamptz default now();

create index if not exists idx_auth_passcodes_rotated_at on public.auth_passcodes (rotated_at desc);

create or replace function public.admin_list_passcodes()
returns table (
  id uuid,
  code text,
  description text,
  valid_from timestamptz,
  valid_until timestamptz,
  is_active boolean,
  updated_by uuid,
  rotated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.assert_admin();
  return query
    select p.id, p.code, p.description, p.valid_from, p.valid_until, p.is_active, p.updated_by, p.rotated_at
    from public.auth_passcodes p
    order by coalesce(p.rotated_at, p.valid_from) desc;
end;
$$;

revoke all on function public.admin_list_passcodes() from public;
grant execute on function public.admin_list_passcodes() to authenticated;

create or replace function public.admin_rotate_passcode(
  p_code text,
  p_description text default null,
  p_valid_until timestamptz default null
)
returns public.auth_passcodes
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.auth_passcodes;
  v_uid uuid := auth.uid();
begin
  perform public.assert_admin();

  if p_code is null or length(trim(p_code)) = 0 then
    raise exception 'invalid_passcode';
  end if;

  update public.auth_passcodes
     set is_active = false,
         valid_until = coalesce(valid_until, now()),
         updated_by = v_uid,
         rotated_at = now()
   where is_active;

  insert into public.auth_passcodes (code, description, valid_from, valid_until, is_active, updated_by, rotated_at)
  values (p_code, p_description, now(), p_valid_until, true, v_uid, now())
  returning * into v_row;

  return v_row;
end;
$$;

revoke all on function public.admin_rotate_passcode(text, text, timestamptz) from public;
grant execute on function public.admin_rotate_passcode(text, text, timestamptz) to authenticated;
