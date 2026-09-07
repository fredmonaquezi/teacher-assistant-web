-- Optional per-activity criteria and per-student evidence.
begin;

create table if not exists public.activity_assessment_criteria (
  id uuid primary key default gen_random_uuid(),
  activity_assessment_id uuid not null references public.activity_assessments(id) on delete cascade,
  user_id uuid not null default auth.uid(),
  title text not null check (char_length(trim(title)) between 1 and 160),
  description text,
  sort_order integer not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.activity_assessment_criterion_results (
  id uuid primary key default gen_random_uuid(),
  criterion_id uuid not null references public.activity_assessment_criteria(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  user_id uuid not null default auth.uid(),
  outcome text not null check (outcome in ('needs_support', 'working_towards', 'met', 'exceeded')),
  notes text,
  observed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (criterion_id, student_id)
);

create index if not exists activity_assessment_criteria_activity_order_idx
  on public.activity_assessment_criteria (activity_assessment_id, sort_order, created_at);

create index if not exists activity_assessment_criterion_results_student_idx
  on public.activity_assessment_criterion_results (student_id, observed_at desc);

alter table public.activity_assessment_criteria enable row level security;
alter table public.activity_assessment_criteria force row level security;
alter table public.activity_assessment_criterion_results enable row level security;
alter table public.activity_assessment_criterion_results force row level security;

revoke all on table public.activity_assessment_criteria from anon;
revoke all on table public.activity_assessment_criterion_results from anon;
grant select, insert, update, delete on table public.activity_assessment_criteria to authenticated;
grant select, insert, update, delete on table public.activity_assessment_criterion_results to authenticated;

create policy rls_activity_assessment_criteria_select_own
  on public.activity_assessment_criteria for select to authenticated
  using ((select auth.uid()) = user_id);
create policy rls_activity_assessment_criteria_insert_own
  on public.activity_assessment_criteria for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy rls_activity_assessment_criteria_update_own
  on public.activity_assessment_criteria for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy rls_activity_assessment_criteria_delete_own
  on public.activity_assessment_criteria for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy rls_activity_assessment_criterion_results_select_own
  on public.activity_assessment_criterion_results for select to authenticated
  using ((select auth.uid()) = user_id);
create policy rls_activity_assessment_criterion_results_insert_own
  on public.activity_assessment_criterion_results for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1
      from public.activity_assessment_criteria criterion
      join public.activity_assessments activity on activity.id = criterion.activity_assessment_id
      join public.students student on student.id = activity_assessment_criterion_results.student_id
      where criterion.id = activity_assessment_criterion_results.criterion_id
        and activity.class_id = student.class_id
        and activity.user_id = activity_assessment_criterion_results.user_id
    )
  );
create policy rls_activity_assessment_criterion_results_update_own
  on public.activity_assessment_criterion_results for update to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1
      from public.activity_assessment_criteria criterion
      join public.activity_assessments activity on activity.id = criterion.activity_assessment_id
      join public.students student on student.id = activity_assessment_criterion_results.student_id
      where criterion.id = activity_assessment_criterion_results.criterion_id
        and activity.class_id = student.class_id
        and activity.user_id = activity_assessment_criterion_results.user_id
    )
  );
create policy rls_activity_assessment_criterion_results_delete_own
  on public.activity_assessment_criterion_results for delete to authenticated
  using ((select auth.uid()) = user_id);

select public.add_owner_integrity_trigger(
  'activity_assessment_criteria',
  'trg_activity_assessment_criteria_owner_integrity',
  'activity_assessment_id',
  'activity_assessments'
);

select public.add_owner_integrity_trigger(
  'activity_assessment_criterion_results',
  'trg_activity_assessment_criterion_results_owner_integrity',
  'criterion_id',
  'activity_assessment_criteria',
  'student_id',
  'students'
);

notify pgrst, 'reload schema';
commit;
