-- migration: create_schema
-- description: creates the initial database schema for lawly mvp
-- affected tables: profiles, questions, sessions
-- affected functions: handle_new_user()
-- affected triggers: on_auth_user_created
-- notes:
--   - enables uuid-ossp extension for backwards compatibility
--   - all tables have rls enabled with granular policies
--   - handle_new_user() runs as security definer to bypass rls
--   - cascade delete chain: auth.users -> profiles -> sessions

-- =============================================================================
-- 1. extensions
-- =============================================================================

-- enable uuid-ossp for backwards compatibility with uuid generation.
-- the schema primarily uses gen_random_uuid() (built-in since postgresql 14),
-- but this extension provides additional uuid functions as a safety net.
create extension if not exists "uuid-ossp";

-- =============================================================================
-- 2. tables
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 2.1 profiles
-- -----------------------------------------------------------------------------
-- stores user profile data, created automatically via trigger on auth.users.
-- 1:1 relationship with auth.users — the primary key is also a foreign key.
-- in mvp this table mainly tracks onboarding state (has_seen_welcome).

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  has_seen_welcome boolean not null default false,
  created_at timestamptz not null default now()
);

-- add table comment for documentation
comment on table public.profiles is
  'user profiles, auto-created by trigger after registration in auth.users. '
  '1:1 relationship with auth.users via shared primary key.';

comment on column public.profiles.has_seen_welcome is
  'tracks whether the user has dismissed the welcome/onboarding screen.';

-- -----------------------------------------------------------------------------
-- 2.2 questions
-- -----------------------------------------------------------------------------
-- stores predefined questions with options and sow fragments.
-- independent table — no foreign key relationships.
-- managed via direct database access (no admin panel in mvp).
--
-- the options column stores a jsonb array with the following structure:
-- [
--   {
--     "id": "string-identifier",
--     "text": "option text displayed to the user",
--     "sow_fragment": "sow fragment text mapped to this answer"
--   }
-- ]

create table public.questions (
  id uuid primary key default gen_random_uuid(),
  question_order integer not null,
  question_text text not null,
  options jsonb not null,
  created_at timestamptz not null default now()
);

comment on table public.questions is
  'predefined questions with single-select options and assigned sow fragments. '
  'managed via direct db access — no admin ui in mvp.';

comment on column public.questions.question_order is
  'determines the display order of questions in the wizard (1-based).';

comment on column public.questions.options is
  'jsonb array of objects: [{id, text, sow_fragment}]. '
  'no check constraint in mvp — structure enforced by application code.';

-- -----------------------------------------------------------------------------
-- 2.3 sessions
-- -----------------------------------------------------------------------------
-- stores completed wizard sessions with answers and generated sow fragments.
-- sessions are immutable (write-once) — no update or delete by the application.
-- only created after the user completes all 5 questions.
--
-- the answers column stores a jsonb array with the following structure:
-- [
--   {
--     "question_id": "uuid-of-the-question",
--     "answer_id": "id-of-the-selected-option"
--   }
-- ]

create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  answers jsonb not null,
  generated_fragments text[] not null
);

comment on table public.sessions is
  'completed wizard sessions. immutable after creation (write-once). '
  'cascade-deleted when the parent profile is removed.';

comment on column public.sessions.completed_at is
  'nullable for future flexibility, but always set at insert time in mvp.';

comment on column public.sessions.answers is
  'jsonb array of objects: [{question_id, answer_id}]. '
  'order matches question_order. no physical fk to questions table.';

comment on column public.sessions.generated_fragments is
  'postgresql native text[] array — preserves fragment boundaries and order.';

-- =============================================================================
-- 3. indexes
-- =============================================================================

-- primary access pattern: fetch a user''s sessions ordered by newest first
create index idx_sessions_user_id_created_at
  on public.sessions (user_id, created_at desc);

-- fetch questions in defined order for the wizard
create index idx_questions_question_order
  on public.questions (question_order);

-- =============================================================================
-- 4. row level security (rls)
-- =============================================================================

-- enable rls on all public tables
alter table public.profiles enable row level security;
alter table public.questions enable row level security;
alter table public.sessions enable row level security;

-- -----------------------------------------------------------------------------
-- 4.1 profiles policies
-- -----------------------------------------------------------------------------

-- authenticated users can read only their own profile.
-- this is the primary read path used after login to check onboarding state.
create policy "profiles_select_own"
  on public.profiles
  for select
  to authenticated
  using (id = auth.uid());

-- authenticated users can update only their own profile.
-- used to set has_seen_welcome = true after dismissing the welcome screen.
create policy "profiles_update_own"
  on public.profiles
  for update
  to authenticated
  using (id = auth.uid());

-- no insert policy: profile creation is handled by the handle_new_user()
-- trigger which runs with security definer privileges, bypassing rls.

-- no delete policy: users cannot delete their own profiles in mvp.

-- -----------------------------------------------------------------------------
-- 4.2 questions policies
-- -----------------------------------------------------------------------------

-- all authenticated users can read all questions.
-- questions are shared resources — no per-user filtering needed.
create policy "questions_select_authenticated"
  on public.questions
  for select
  to authenticated
  using (true);

-- no insert/update/delete policies: question management is done via
-- direct database access using the service role key.

-- -----------------------------------------------------------------------------
-- 4.3 sessions policies
-- -----------------------------------------------------------------------------

-- authenticated users can read only their own sessions.
-- used for the session history list and detail views.
create policy "sessions_select_own"
  on public.sessions
  for select
  to authenticated
  using (user_id = auth.uid());

-- authenticated users can create sessions only for themselves.
-- the with check clause prevents creating sessions for other users.
create policy "sessions_insert_own"
  on public.sessions
  for insert
  to authenticated
  with check (user_id = auth.uid());

-- no update/delete policies: sessions are immutable after creation (write-once).

-- =============================================================================
-- 5. functions and triggers
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 5.1 handle_new_user() function
-- -----------------------------------------------------------------------------
-- automatically creates a profile record when a new user registers via
-- supabase auth. runs as security definer to bypass rls.
--
-- security considerations:
-- - security definer: executes with the function owner's privileges
-- - set search_path = '': prevents search_path injection attacks
--   (supabase best practice for security definer functions)

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, has_seen_welcome, created_at)
  values (new.id, false, now());
  return new;
end;
$$;

comment on function public.handle_new_user() is
  'trigger function: creates a profile record for each new auth.users row. '
  'runs as security definer with empty search_path for security.';

-- -----------------------------------------------------------------------------
-- 5.2 on_auth_user_created trigger
-- -----------------------------------------------------------------------------
-- fires after a new user is inserted into auth.users.
-- the profile is created synchronously within the same transaction
-- as the user registration.

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
