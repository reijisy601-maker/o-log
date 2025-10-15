create table if not exists public.auth_allowed_domains (
  domain text primary key,
  created_at timestamptz not null default now()
);

alter table public.auth_allowed_domains enable row level security;

drop policy if exists "allowed_domains_admin_select" on public.auth_allowed_domains;
create policy "allowed_domains_admin_select" on public.auth_allowed_domains
  for select using ( public.is_admin() );

drop policy if exists "allowed_domains_admin_modify" on public.auth_allowed_domains;
create policy "allowed_domains_admin_modify" on public.auth_allowed_domains
  for all using ( public.is_admin() ) with check ( public.is_admin() );

create or replace function public.admin_list_allowed_domains()
returns setof public.auth_allowed_domains
language sql
security definer
as $$
  select * from public.auth_allowed_domains order by domain;
$$;

revoke all on function public.admin_list_allowed_domains() from public;
grant execute on function public.admin_list_allowed_domains() to authenticated;

drop function if exists public.admin_add_allowed_domain(text);
create function public.admin_add_allowed_domain(p_domain text)
returns public.auth_allowed_domains
language plpgsql
security definer
set search_path = public
as $$
declare
  v_domain text := lower(trim(p_domain));
  v_row public.auth_allowed_domains;
begin
  perform public.assert_admin();

  if v_domain is null or v_domain = '' then
    raise exception 'invalid_domain';
  end if;

  insert into public.auth_allowed_domains(domain)
  values (v_domain)
  on conflict (domain) do nothing
  returning * into v_row;

  if v_row is null then
    select * into v_row from public.auth_allowed_domains where domain = v_domain;
  end if;

  return v_row;
end;
$$;

revoke all on function public.admin_add_allowed_domain(text) from public;
grant execute on function public.admin_add_allowed_domain(text) to authenticated;

drop function if exists public.admin_remove_allowed_domain(text);
create function public.admin_remove_allowed_domain(p_domain text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_domain text := lower(trim(p_domain));
begin
  perform public.assert_admin();

  delete from public.auth_allowed_domains where domain = v_domain;
end;
$$;

revoke all on function public.admin_remove_allowed_domain(text) from public;
grant execute on function public.admin_remove_allowed_domain(text) to authenticated;

drop function if exists public.is_domain_allowed(text);
create function public.is_domain_allowed(p_email text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_domain text;
  v_count integer;
begin
  if p_email is null or strpos(p_email, '@') = 0 then
    return false;
  end if;

  v_domain := lower(split_part(p_email, '@', 2));

  select count(*) into v_count from public.auth_allowed_domains;
  if v_count = 0 then
    return true; -- 暫定ですべて許可
  end if;

  return exists (
    select 1
      from public.auth_allowed_domains
     where domain = v_domain
  );
end;
$$;

revoke all on function public.is_domain_allowed(text) from public;
grant execute on function public.is_domain_allowed(text) to authenticated;
