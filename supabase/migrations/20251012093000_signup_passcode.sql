drop trigger if exists handle_new_user on auth.users;

drop function if exists public.handle_new_user();

drop function if exists public.ensure_allowed_email_domain(text);

drop function if exists public.is_valid_signup_passcode(text);

create table if not exists public.auth_passcodes (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  description text,
  valid_from timestamptz not null default now(),
  valid_until timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1 from information_schema.table_constraints
    where table_schema = 'public'
      and table_name = 'auth_passcodes'
      and constraint_name = 'auth_passcodes_code_key'
  ) then
    alter table public.auth_passcodes add constraint auth_passcodes_code_key unique (code);
  end if;
end $$;

create index if not exists idx_auth_passcodes_active on public.auth_passcodes (is_active, valid_from, valid_until);

insert into public.auth_passcodes (code, description)
values ('DEMO-CODE-2025', 'Development default passcode')
on conflict (code) do nothing;

create or replace function public.is_valid_signup_passcode(p_code text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists(
    select 1
    from public.auth_passcodes
    where is_active
      and code = p_code
      and valid_from <= now()
      and (valid_until is null or valid_until >= now())
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'user')
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

create trigger handle_new_user
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

create or replace function public.register_magic_link(p_email text, p_passcode text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_exists boolean;
begin
  if p_email is null or position('@' in p_email) = 0 then
    raise exception 'invalid_email';
  end if;
  select exists(select 1 from auth.users where lower(email) = lower(p_email)) into v_exists;
  if v_exists then
    return;
  end if;
  if p_passcode is null or not public.is_valid_signup_passcode(p_passcode) then
    raise exception 'invalid_passcode';
  end if;
end;
$$;

revoke all on table public.auth_passcodes from public;

grant select on table public.auth_passcodes to service_role;

grant execute on function public.register_magic_link(text, text) to anon, authenticated;
