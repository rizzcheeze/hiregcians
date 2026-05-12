-- pgvector setup for Hire GCians cosine-similarity matching.
-- Run this in the Supabase SQL editor before deploying the Edge Functions.

create extension if not exists vector;

create table if not exists public.resume_embeddings (
  id uuid primary key default gen_random_uuid(),
  resume_id uuid not null references public.resumes(id) on delete cascade,
  embedding vector not null,
  created_at timestamptz not null default now()
);

create table if not exists public.job_embeddings (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  embedding vector not null,
  created_at timestamptz not null default now()
);

alter table public.job_embeddings
  drop constraint if exists job_embeddings_job_id_fkey;

alter table public.job_embeddings
  add constraint job_embeddings_job_id_fkey
  foreign key (job_id)
  references public.jobs(id)
  on delete cascade;

alter table public.resume_embeddings
  add column if not exists created_at timestamptz not null default now();

alter table public.job_embeddings
  add column if not exists created_at timestamptz not null default now();

alter table public.resume_embeddings
  alter column embedding type vector using embedding::vector;

alter table public.job_embeddings
  alter column embedding type vector using embedding::vector;

delete from public.resume_embeddings a
using public.resume_embeddings b
where a.ctid < b.ctid
  and a.resume_id = b.resume_id;

create unique index if not exists resume_embeddings_resume_id_key
  on public.resume_embeddings (resume_id);

delete from public.job_embeddings a
using public.job_embeddings b
where a.ctid < b.ctid
  and a.job_id = b.job_id;

create unique index if not exists job_embeddings_job_id_key
  on public.job_embeddings (job_id);

delete from public.match_scores a
using public.match_scores b
where a.ctid < b.ctid
  and a.student_id = b.student_id
  and a.job_id = b.job_id;

create unique index if not exists match_scores_student_id_job_id_key
  on public.match_scores (student_id, job_id);

create or replace function public.upsert_resume_embedding(
  resume_id_param uuid,
  embedding_param text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.resume_embeddings (resume_id, embedding, created_at)
  values (resume_id_param, embedding_param::vector, now())
  on conflict (resume_id)
  do update set
    embedding = excluded.embedding,
    created_at = now();
end;
$$;

create or replace function public.upsert_job_embedding(
  job_id_param uuid,
  embedding_param text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.job_embeddings (job_id, embedding, created_at)
  values (job_id_param, embedding_param::vector, now())
  on conflict (job_id)
  do update set
    embedding = excluded.embedding,
    created_at = now();
end;
$$;

create or replace function public.compute_cosine_matches_for_student(student_id_param uuid)
returns table(job_id uuid, score double precision)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  with active_resume as (
    select re.embedding
    from public.resumes r
    join public.resume_embeddings re on re.resume_id = r.id
    where r.student_id = student_id_param
      and coalesce(r.is_active, true) = true
    order by r.created_at desc
    limit 1
  ),
  scored as (
    select
      j.id as job_id,
      greatest(0, least(1, 1 - (ar.embedding <=> je.embedding)))::double precision as score
    from active_resume ar
    join public.job_embeddings je on true
    join public.jobs j on j.id = je.job_id
    where coalesce(j.status, 'active') = 'active'
  ),
  saved as (
    insert into public.match_scores (student_id, job_id, score, rationale, computed_at)
    select
      student_id_param,
      scored.job_id,
      scored.score,
      'Cosine similarity score based on resume and job embeddings.',
      now()
    from scored
    on conflict (student_id, job_id)
    do update set
      score = excluded.score,
      rationale = excluded.rationale,
      computed_at = excluded.computed_at
    returning match_scores.job_id, match_scores.score::double precision
  )
  select saved.job_id, saved.score
  from saved
  order by saved.score desc;
end;
$$;

create or replace function public.compute_cosine_matches_for_job(job_id_param uuid)
returns table(student_id uuid, job_id uuid, score double precision)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  with target_job as (
    select je.embedding
    from public.job_embeddings je
    where je.job_id = job_id_param
    limit 1
  ),
  latest_resume as (
    select distinct on (r.student_id)
      r.student_id,
      re.embedding
    from public.resumes r
    join public.resume_embeddings re on re.resume_id = r.id
    where coalesce(r.is_active, true) = true
    order by r.student_id, r.created_at desc
  ),
  scored as (
    select
      lr.student_id,
      job_id_param as job_id,
      greatest(0, least(1, 1 - (lr.embedding <=> tj.embedding)))::double precision as score
    from latest_resume lr
    join target_job tj on true
  ),
  saved as (
    insert into public.match_scores (student_id, job_id, score, rationale, computed_at)
    select
      scored.student_id,
      scored.job_id,
      scored.score,
      'Cosine similarity score based on resume and job embeddings.',
      now()
    from scored
    on conflict (student_id, job_id)
    do update set
      score = excluded.score,
      rationale = excluded.rationale,
      computed_at = excluded.computed_at
    returning match_scores.student_id, match_scores.job_id, match_scores.score::double precision
  )
  select saved.student_id, saved.job_id, saved.score
  from saved
  order by saved.score desc;
end;
$$;

create or replace function public.match_jobs_for_student(
  student_id_param uuid,
  match_count integer default 10
)
returns table(job_id uuid, score double precision)
language sql
security definer
set search_path = public
as $$
  select m.job_id, m.score::double precision
  from public.compute_cosine_matches_for_student(student_id_param) m
  order by m.score desc
  limit match_count;
$$;

grant execute on function public.upsert_resume_embedding(uuid, text) to service_role;
grant execute on function public.upsert_job_embedding(uuid, text) to service_role;
grant execute on function public.compute_cosine_matches_for_student(uuid) to service_role;
grant execute on function public.compute_cosine_matches_for_job(uuid) to service_role;
grant execute on function public.match_jobs_for_student(uuid, integer) to authenticated, service_role;
