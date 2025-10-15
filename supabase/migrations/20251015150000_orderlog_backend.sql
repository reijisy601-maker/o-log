-- OrderLog 追加スキーマ: submissions拡張・admin_logs・ユーティリティ

alter table public.profiles
  add column if not exists last_login timestamptz;

-- submissions 追加カラム（存在しない場合のみ）
alter table public.submissions
  add column if not exists month text,
  add column if not exists image_url text,
  add column if not exists luggage_space_image_url text,
  add column if not exists tool_bag_image_url text,
  add column if not exists luggage_space_score integer check (luggage_space_score between 0 and 98),
  add column if not exists tool_bag_score integer check (tool_bag_score between 0 and 98),
  add column if not exists luggage_space_comment text,
  add column if not exists tool_bag_comment text,
  add column if not exists analysis_result text;

-- month の既存データを作成日時から補完
update public.submissions
   set month = coalesce(month, to_char(created_at, 'YYYY-MM'))
 where month is null;

-- month カラムの検索用インデックス
create index if not exists idx_submissions_month on public.submissions (month);

-- 管理者ログテーブル
create table if not exists public.admin_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references public.profiles(id) on delete cascade,
  action text not null,
  target_user_id uuid references public.profiles(id) on delete set null,
  details jsonb,
  created_at timestamptz not null default now()
);

alter table public.admin_logs enable row level security;

drop policy if exists admin_logs_select_admin on public.admin_logs;
create policy admin_logs_select_admin
  on public.admin_logs
  for select
  using (public.is_admin());

drop policy if exists admin_logs_insert_admin on public.admin_logs;
create policy admin_logs_insert_admin
  on public.admin_logs
  for insert
  with check (public.is_admin());

drop policy if exists admin_logs_update_admin on public.admin_logs;
create policy admin_logs_update_admin
  on public.admin_logs
  for update
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists admin_logs_delete_admin on public.admin_logs;
create policy admin_logs_delete_admin
  on public.admin_logs
  for delete
  using (public.is_admin());

-- 月次統計ビュー
drop view if exists public.monthly_stats;
create view public.monthly_stats as
select
  coalesce(s.month, to_char(s.created_at, 'YYYY-MM')) as month,
  count(distinct p.id) filter (where p.role = 'user') as total_users,
  count(distinct s.user_id) as submitted_users,
  round(
    case when count(distinct p.id) filter (where p.role = 'user') = 0 then 0
         else (count(distinct s.user_id)::numeric / nullif(count(distinct p.id) filter (where p.role = 'user'), 0)) * 100
    end,
    2
  ) as submission_rate,
  round(avg(s.score), 2) as average_score
from public.profiles p
left join public.submissions s on s.user_id = p.id
group by coalesce(s.month, to_char(s.created_at, 'YYYY-MM'))
order by month desc;

-- 未投稿ユーザー取得関数
create or replace function public.get_non_submitted_users(target_month text)
returns table (
  id uuid,
  email text,
  name text,
  last_login timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
    select
      p.id,
      p.email,
      coalesce(nullif(trim(coalesce(p.last_name, '') || ' ' || coalesce(p.first_name, '')), ''), p.email) as name,
      p.last_login
    from public.profiles p
    where p.role = 'user'
      and not exists (
        select 1
          from public.submissions s
         where s.user_id = p.id
           and coalesce(s.month, to_char(s.created_at, 'YYYY-MM')) = target_month
      )
    order by p.email;
end;
$$;

revoke all on function public.get_non_submitted_users(text) from public;
grant execute on function public.get_non_submitted_users(text) to authenticated;

-- ログイン時に last_login を更新
create or replace function public.touch_profile_last_login()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
     set last_login = now()
   where id = new.user_id;
  return new;
end;
$$;

drop trigger if exists on_auth_session_insert on auth.sessions;
create trigger on_auth_session_insert
  after insert on auth.sessions
  for each row
  execute function public.touch_profile_last_login();

comment on table public.admin_logs is '管理者操作の監査ログ';
comment on column public.profiles.notes is '管理者入力用の拠点メモ';
