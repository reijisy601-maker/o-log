-- 管理者ロールの点検を自動化する診断RPCを追加
create or replace function public.admin_get_role_diagnostics(
  email text default null,
  user_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  invoker_role text;
  target_user auth.users%rowtype;
  target_profile public.profiles%rowtype;
  is_admin_definition text;
  assert_admin_definition text;
  has_is_admin_migration boolean := false;
  has_assert_admin_migration boolean := false;
  has_profile_sync_migration boolean := false;
  metadata_roles jsonb := '[]'::jsonb;
  diagnostics jsonb;
begin
  invoker_role := lower(coalesce(auth.jwt() ->> 'role', ''));
  if invoker_role not in ('admin', 'service_role') then
    raise exception 'admin role required';
  end if;

  if email is null and user_id is null then
    raise exception 'emailかuser_idのいずれかを指定してください';
  end if;

  if user_id is not null then
    select * into target_user from auth.users where id = user_id;
  else
    select *
      into target_user
      from auth.users
     where lower(auth.users.email) = lower(email)
     limit 1;
  end if;

  if not found then
    return jsonb_build_object('found', false);
  end if;

  select * into target_profile from public.profiles where id = target_user.id;

  select exists(
    select 1 from supabase_migrations.schema_migrations
     where version = '20251120090000_is_admin_jwt_arrays'
  ) into has_is_admin_migration;

  select exists(
    select 1 from supabase_migrations.schema_migrations
     where version = '20251102100000_assert_admin_uses_is_admin'
  ) into has_assert_admin_migration;

  select exists(
    select 1 from supabase_migrations.schema_migrations
     where version = '20251101090000_admin_role_profile_sync'
  ) into has_profile_sync_migration;

  metadata_roles := jsonb_build_array(
    nullif(lower(coalesce(target_user.raw_app_meta_data ->> 'role', '')), ''),
    nullif(lower(coalesce(target_user.raw_user_meta_data ->> 'role', '')), ''),
    nullif(lower(coalesce(target_user.role, '')), '')
  );

  metadata_roles := metadata_roles || coalesce(target_user.raw_app_meta_data -> 'roles', '[]'::jsonb);
  metadata_roles := metadata_roles || coalesce(target_user.raw_user_meta_data -> 'roles', '[]'::jsonb);

  is_admin_definition := pg_get_functiondef('public.is_admin()'::regprocedure);
  assert_admin_definition := pg_get_functiondef('public.assert_admin()'::regprocedure);

  diagnostics := jsonb_build_object(
    'found', true,
    'userId', target_user.id,
    'email', target_user.email,
    'appRole', target_user.raw_app_meta_data ->> 'role',
    'userRole', target_user.raw_user_meta_data ->> 'role',
    'jwtRole', target_user.role,
    'appRoles', coalesce(target_user.raw_app_meta_data -> 'roles', '[]'::jsonb),
    'userRoles', coalesce(target_user.raw_user_meta_data -> 'roles', '[]'::jsonb),
    'profileRole', target_profile.role,
    'hasProfile', target_profile is not null,
    'metadataRoles', metadata_roles,
    'migrations', jsonb_build_object(
      'isAdminJwtArrays', has_is_admin_migration,
      'assertAdminUsesIsAdmin', has_assert_admin_migration,
      'adminRoleProfileSync', has_profile_sync_migration
    ),
    'isAdminDefinitionUsesRoleArrays', position('jsonb_array_elements_text' in is_admin_definition) > 0,
    'isAdminDefinitionChecksServiceRole', position('service_role' in is_admin_definition) > 0,
    'assertAdminCallsIsAdmin', position('public.is_admin()' in assert_admin_definition) > 0
  );

  return diagnostics;
end;
$$;

revoke all on function public.admin_get_role_diagnostics(text, uuid) from public;
grant execute on function public.admin_get_role_diagnostics(text, uuid) to authenticated;
grant execute on function public.admin_get_role_diagnostics(text, uuid) to service_role;
