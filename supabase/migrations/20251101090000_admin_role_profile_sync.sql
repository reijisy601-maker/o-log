-- 管理者ロールの同期強化: authメタデータとプロフィールを揃える
update public.profiles p
   set role = 'admin'
 where coalesce(role, '') <> 'admin'
   and exists (
     select 1
       from auth.users u
      where u.id = p.id
        and (
          u.raw_app_meta_data ->> 'role' = 'admin'
          or u.raw_user_meta_data ->> 'role' = 'admin'
          or u.role = 'admin'
        )
   );

create or replace function public.admin_set_account_role(
  p_user_id uuid,
  p_role text
)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text := lower(coalesce(p_role, ''));
  v_profile public.profiles;
begin
  perform public.assert_admin();

  if v_role not in ('admin', 'user') then
    raise exception 'Unsupported role value: %', p_role;
  end if;

  update public.profiles
     set role = v_role
   where id = p_user_id
   returning * into v_profile;

  if not found then
    insert into public.profiles (id, role)
    values (p_user_id, v_role)
    on conflict (id) do update
      set role = excluded.role
    returning * into v_profile;
  end if;

  update auth.users
     set raw_app_meta_data = jsonb_set(
           coalesce(raw_app_meta_data, '{}'::jsonb),
           '{role}',
           to_jsonb(v_role),
           true
         ),
         raw_user_meta_data = jsonb_set(
           coalesce(raw_user_meta_data, '{}'::jsonb),
           '{role}',
           to_jsonb(v_role),
           true
         ),
         role = v_role
   where id = p_user_id;

  return v_profile;
end;
$$;

revoke all on function public.admin_set_account_role(uuid, text) from public;
grant execute on function public.admin_set_account_role(uuid, text) to authenticated;
