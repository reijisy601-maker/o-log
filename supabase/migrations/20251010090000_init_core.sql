-- Sites
create table public.sites (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  active boolean default true,
  created_at timestamptz default now()
);

-- Profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  employee_no text,
  last_name text,
  first_name text,
  site_id uuid references public.sites(id),
  manager_id uuid references public.profiles(id),
  notes text,
  first_login_completed boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index on public.profiles(site_id);
create index on public.profiles(manager_id);
create unique index if not exists profiles_employee_no_key on public.profiles(employee_no) where employee_no is not null;

-- Updated_at trigger
create or replace function public.touch_profiles_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;
create trigger trg_profiles_updated
  before update on public.profiles
  for each row execute function public.touch_profiles_updated_at();

-- Submissions
create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  image_path text not null,
  first_impression jsonb,
  score int,
  created_at timestamptz default now()
);
create index idx_submissions_user_created on public.submissions(user_id, created_at desc);

-- RLS
alter table public.profiles enable row level security;
alter table public.submissions enable row level security;
alter table public.sites enable row level security;

-- Policies
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "profiles_admin_all" on public.profiles for all using ((auth.jwt() ->> 'role')='admin') with check ((auth.jwt() ->> 'role')='admin');

create policy "submissions_owner_all" on public.submissions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "submissions_admin_all" on public.submissions for all using ((auth.jwt() ->> 'role')='admin') with check ((auth.jwt() ->> 'role')='admin');

create policy "sites_admin_all" on public.sites for all using ((auth.jwt() ->> 'role')='admin') with check ((auth.jwt() ->> 'role')='admin');

-- View (optional)
create or replace view public.monthly_user_activity as
select
  p.id as user_id,
  date_trunc('month', s.created_at) as month,
  count(s.id) as submission_count,
  min(s.created_at) as first_submission_at,
  max(s.created_at) as last_submission_at
from public.profiles p
left join public.submissions s on s.user_id = p.id
group by p.id, date_trunc('month', s.created_at);
