-- 管理者ロール判定をメタデータとprofilesの双方で大文字小文字を区別しないように更新
create or replace function public.is_admin()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_metadata_role text;
  v_app_metadata_role text;
  v_claim_role text;
  v_profile_role text;
begin
  select
    nullif(lower(trim(auth.jwt() -> 'user_metadata' ->> 'role')), ''),
    nullif(lower(trim(auth.jwt() -> 'app_metadata' ->> 'role')), ''),
    nullif(lower(trim(auth.jwt() ->> 'role')), '')
  into
    v_user_metadata_role,
    v_app_metadata_role,
    v_claim_role;

  if v_user_metadata_role = 'admin' then
    return true;
  end if;

  if v_app_metadata_role = 'admin' then
    return true;
  end if;

  if v_claim_role = 'admin' then
    return true;
  end if;

  if auth.uid() is null then
    return false;
  end if;

  select nullif(lower(trim(role)), '')
    into v_profile_role
    from public.profiles
    where id = auth.uid();

  return coalesce(v_profile_role = 'admin', false);
end;
$$;
