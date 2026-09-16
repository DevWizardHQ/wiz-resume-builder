-- ==============================================================================
-- 001_init.sql — AI-Powered ATS Resume Builder Database Schema
-- ==============================================================================

-- 1. EXTENSIONS
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- 2. UPDATED_AT TRIGGER FUNCTION
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- 3. RESUMES TABLE
create table if not exists public.resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null default 'Untitled Resume',
  slug text not null,
  template_id text not null default 'classic-ats',
  section_order jsonb not null default '[
    "contact", "summary", "experience", "projects", "education",
    "skills", "certifications", "involvement", "awards", "publications", "references"
  ]'::jsonb,
  content jsonb not null default '{
    "contact": { "fullName": "", "email": "", "phone": "", "location": "", "linkedinUrl": "", "githubUrl": "", "portfolioUrl": "" },
    "summary": { "text": "", "visible": true },
    "experience": [],
    "projects": [],
    "education": [],
    "skills": [],
    "certifications": [],
    "involvement": [],
    "awards": [],
    "publications": [],
    "references": []
  }'::jsonb,
  ats_score integer default 0 check (ats_score >= 0 and ats_score <= 100),
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- 4. COVER LETTERS TABLE
create table if not exists public.cover_letters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  resume_id uuid references public.resumes(id) on delete set null,
  job_title text not null,
  company_name text not null,
  content text not null default '',
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- 5. INDEXES FOR QUERY OPTIMIZATION
create index if not exists resumes_user_id_idx on public.resumes (user_id);
create index if not exists resumes_slug_user_id_idx on public.resumes (user_id, slug);
create index if not exists resumes_updated_at_idx on public.resumes (updated_at desc);

create index if not exists cover_letters_user_id_idx on public.cover_letters (user_id);
create index if not exists cover_letters_resume_id_idx on public.cover_letters (resume_id);
create index if not exists cover_letters_updated_at_idx on public.cover_letters (updated_at desc);

-- 6. TRIGGERS FOR AUTO UPDATING TIMESTAMPS
drop trigger if exists set_resumes_updated_at on public.resumes;
create trigger set_resumes_updated_at
  before update on public.resumes
  for each row
  execute function public.handle_updated_at();

drop trigger if exists set_cover_letters_updated_at on public.cover_letters;
create trigger set_cover_letters_updated_at
  before update on public.cover_letters
  for each row
  execute function public.handle_updated_at();

-- 7. ROW LEVEL SECURITY (RLS) POLICIES
alter table public.resumes enable row level security;
alter table public.cover_letters enable row level security;

-- Resumes Policies
create policy "Users can view their own resumes"
  on public.resumes for select
  using (auth.uid() = user_id);

create policy "Users can insert their own resumes"
  on public.resumes for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own resumes"
  on public.resumes for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own resumes"
  on public.resumes for delete
  using (auth.uid() = user_id);

-- Cover Letters Policies
create policy "Users can view their own cover letters"
  on public.cover_letters for select
  using (auth.uid() = user_id);

create policy "Users can insert their own cover letters"
  on public.cover_letters for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own cover letters"
  on public.cover_letters for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own cover letters"
  on public.cover_letters for delete
  using (auth.uid() = user_id);
