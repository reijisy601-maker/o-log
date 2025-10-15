-- JWTクレームとメタデータ内のロール配列を横断的に確認するようにis_admin()を再定義
create or replace function public.is_admin()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_roles text[] := '{}';
  v_candidate text;
  v_profile_role text;
begin
  -- JWTの単一ロールクレームを収集
  v_candidate := nullif(lower(trim(auth.jwt() ->> 'role')), '');
  if v_candidate is not null then
    v_roles := array_append(v_roles, v_candidate);
  end if;

  v_candidate := nullif(lower(trim(auth.jwt() -> 'app_metadata' ->> 'role')), '');
  if v_candidate is not null then
    v_roles := array_append(v_roles, v_candidate);
  end if;

  v_candidate := nullif(lower(trim(auth.jwt() -> 'user_metadata' ->> 'role')), '');
  if v_candidate is not null then
    v_roles := array_append(v_roles, v_candidate);
  end if;

  -- メタデータ内のroles配列も取り込み
  for v_candidate in
    select nullif(lower(trim(value)), '')
    from (
      select jsonb_array_elements_text(coalesce(auth.jwt() -> 'app_metadata' -> 'roles', '[]'::jsonb)) as value
      union all
      select jsonb_array_elements_text(coalesce(auth.jwt() -> 'user_metadata' -> 'roles', '[]'::jsonb)) as value
    ) as payload_roles
  loop
    if v_candidate is not null then
      v_roles := array_append(v_roles, v_candidate);
    end if;
  end loop;

  if array_position(v_roles, 'service_role') is not null then
    return true;
  end if;

  if array_position(v_roles, 'admin') is not null then
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

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;
