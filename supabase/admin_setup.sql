-- Admin feature setup for Hire GCians!
-- Run this in the Supabase SQL editor for the linked project.

alter table if exists public.profiles
  add column if not exists email text,
  add column if not exists is_active boolean not null default true;

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  audience text not null default 'all' check (audience in ('all', 'students', 'employers', 'admins')),
  priority text not null default 'normal' check (priority in ('normal', 'high')),
  author_id uuid references auth.users(id) on delete set null,
  author text not null default 'Admin',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_settings (
  id integer primary key default 1 check (id = 1),
  settings jsonb not null default '{}'::jsonb,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

insert into public.admin_settings (id, settings)
values (
  1,
  '{
    "platform_name": "Hire GCians!",
    "contact_email": "admin@gordoncollege.edu.ph",
    "maintenance_mode": false,
    "ai_enabled": true,
    "min_match_threshold": 40,
    "max_recommendations": 10,
    "job_duration_days": 30,
    "auto_close_jobs": true,
    "require_email_verification": false,
    "session_timeout": 60
  }'::jsonb
)
on conflict (id) do nothing;

alter table public.announcements enable row level security;
alter table public.admin_settings enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

drop policy if exists "Announcements are readable by signed-in users" on public.announcements;
create policy "Announcements are readable by signed-in users"
on public.announcements for select
to authenticated
using (
  audience = 'all'
  or audience = 'admins' and public.is_admin()
  or audience = (select role || 's' from public.profiles where id = auth.uid())
);

drop policy if exists "Admins can manage announcements" on public.announcements;
create policy "Admins can manage announcements"
on public.announcements for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can read settings" on public.admin_settings;
create policy "Admins can read settings"
on public.admin_settings for select
to authenticated
using (public.is_admin());

drop policy if exists "Admins can update settings" on public.admin_settings;
create policy "Admins can update settings"
on public.admin_settings for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Admin dashboard/report pages need platform-wide access to existing app data.
-- These policies are intentionally scoped to users whose public.profiles.role = 'admin'.
alter table if exists public.profiles enable row level security;
alter table if exists public.student_profiles enable row level security;
alter table if exists public.employer_profiles enable row level security;
alter table if exists public.jobs enable row level security;
alter table if exists public.applications enable row level security;
alter table if exists public.match_scores enable row level security;
alter table if exists public.saved_jobs enable row level security;
alter table if exists public.resumes enable row level security;

drop policy if exists "Admins can read profiles" on public.profiles;
create policy "Admins can read profiles"
on public.profiles for select
to authenticated
using (public.is_admin());

drop policy if exists "Admins can manage profiles" on public.profiles;
create policy "Admins can manage profiles"
on public.profiles for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can delete profiles" on public.profiles;
create policy "Admins can delete profiles"
on public.profiles for delete
to authenticated
using (public.is_admin());

drop policy if exists "Admins can read student profiles" on public.student_profiles;
create policy "Admins can read student profiles"
on public.student_profiles for select
to authenticated
using (public.is_admin());

drop policy if exists "Admins can manage student profiles" on public.student_profiles;
create policy "Admins can manage student profiles"
on public.student_profiles for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can read employer profiles" on public.employer_profiles;
create policy "Admins can read employer profiles"
on public.employer_profiles for select
to authenticated
using (public.is_admin());

drop policy if exists "Admins can manage employer profiles" on public.employer_profiles;
create policy "Admins can manage employer profiles"
on public.employer_profiles for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can read jobs" on public.jobs;
create policy "Admins can read jobs"
on public.jobs for select
to authenticated
using (public.is_admin());

drop policy if exists "Admins can manage jobs" on public.jobs;
create policy "Admins can manage jobs"
on public.jobs for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can read applications" on public.applications;
create policy "Admins can read applications"
on public.applications for select
to authenticated
using (public.is_admin());

drop policy if exists "Admins can manage applications" on public.applications;
create policy "Admins can manage applications"
on public.applications for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can read match scores" on public.match_scores;
create policy "Admins can read match scores"
on public.match_scores for select
to authenticated
using (public.is_admin());

drop policy if exists "Admins can manage match scores" on public.match_scores;
create policy "Admins can manage match scores"
on public.match_scores for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can read saved jobs" on public.saved_jobs;
create policy "Admins can read saved jobs"
on public.saved_jobs for select
to authenticated
using (public.is_admin());

drop policy if exists "Admins can manage saved jobs" on public.saved_jobs;
create policy "Admins can manage saved jobs"
on public.saved_jobs for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can read resumes" on public.resumes;
create policy "Admins can read resumes"
on public.resumes for select
to authenticated
using (public.is_admin());
