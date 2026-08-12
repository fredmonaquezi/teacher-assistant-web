-- Whole-class activities with a private outcome recorded for every student.
begin;

create table if not exists public.activity_assessments (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  user_id uuid not null default auth.uid(),
  activity_date date not null default current_date,
  subject text not null check (char_length(trim(subject)) > 0),
  description text not null check (char_length(trim(description)) > 0),
  created_at timestamptz not null default now()
);

create table if not exists public.activity_assessment_entries (
  id uuid primary key default gen_random_uuid(),
  activity_assessment_id uuid not null references public.activity_assessments(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  user_id uuid not null default auth.uid(),
  outcome text not null check (outcome in ('needs_support', 'working_towards', 'met', 'exceeded')),
  notes text,
  created_at timestamptz not null default now(),
  unique (activity_assessment_id, student_id)
);

create index if not exists activity_assessments_user_class_date_idx
  on public.activity_assessments (user_id, class_id, activity_date desc, created_at desc);

create index if not exists activity_assessment_entries_user_student_idx
  on public.activity_assessment_entries (user_id, student_id, created_at desc);

alter table public.activity_assessments enable row level security;
alter table public.activity_assessments force row level security;
alter table public.activity_assessment_entries enable row level security;
alter table public.activity_assessment_entries force row level security;

create policy rls_activity_assessments_select_own on public.activity_assessments for select using (auth.uid() = user_id);
create policy rls_activity_assessments_insert_own on public.activity_assessments for insert with check (auth.uid() = user_id);
create policy rls_activity_assessments_update_own on public.activity_assessments for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy rls_activity_assessments_delete_own on public.activity_assessments for delete using (auth.uid() = user_id);

create policy rls_activity_assessment_entries_select_own on public.activity_assessment_entries for select using (auth.uid() = user_id);
create policy rls_activity_assessment_entries_insert_own on public.activity_assessment_entries
  for insert with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.activity_assessments activity
      join public.students student on student.id = activity_assessment_entries.student_id
      where activity.id = activity_assessment_entries.activity_assessment_id
        and activity.class_id = student.class_id
    )
  );
create policy rls_activity_assessment_entries_update_own on public.activity_assessment_entries
  for update using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.activity_assessments activity
      join public.students student on student.id = activity_assessment_entries.student_id
      where activity.id = activity_assessment_entries.activity_assessment_id
        and activity.class_id = student.class_id
    )
  );
create policy rls_activity_assessment_entries_delete_own on public.activity_assessment_entries for delete using (auth.uid() = user_id);

select public.add_owner_integrity_trigger(
  'activity_assessments',
  'trg_activity_assessments_owner_integrity',
  'class_id',
  'classes'
);

select public.add_owner_integrity_trigger(
  'activity_assessment_entries',
  'trg_activity_assessment_entries_owner_integrity',
  'activity_assessment_id',
  'activity_assessments',
  'student_id',
  'students'
);

notify pgrst, 'reload schema';
commit;
