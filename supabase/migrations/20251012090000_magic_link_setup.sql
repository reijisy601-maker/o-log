create table if not exists public.allowed_email_domains (
  domain text primary key,
  description text,
  created_at timestamptz default now()
);

insert into public.allowed_email_domains (domain, description)
values ('example.com', 'Sample domain for development')
on conflict (domain) do nothing;

create or replace function public.ensure_allowed_email_domain(p_email text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_domain text;
  v_exists boolean;
begin
  if p_email is null or position('@' in p_email) = 0 then
    raise exception 'Invalid email address';
  end if;
  v_domain := lower(split_part(p_email, '@', 2));
  select exists(select 1 from public.allowed_email_domains where domain = v_domain) into v_exists;
  if not v_exists then
    raise exception 'Email domain % is not allowed', v_domain;
  end if;
end;
$$;

revoke all on function public.ensure_allowed_email_domain(text) from public;
grant execute on function public.ensure_allowed_email_domain(text) to authenticated;

grant select on table public.allowed_email_domains to authenticated;

grant select on table public.allowed_email_domains to anon;

alter table public.profiles
  add column if not exists role text default 'user';

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.ensure_allowed_email_domain(new.email);

  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'user')
  on conflict (id) do update set email = excluded.email;

  return new;
end;
$$;
