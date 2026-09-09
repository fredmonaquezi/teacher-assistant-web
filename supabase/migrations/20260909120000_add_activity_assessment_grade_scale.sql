-- Allow activity assessments to use either descriptive outcomes or 0-10 grades.
begin;

alter table public.activity_assessments
  add column if not exists assessment_scale text not null default 'outcome';

alter table public.activity_assessments
  drop constraint if exists activity_assessments_assessment_scale_check;
alter table public.activity_assessments
  add constraint activity_assessments_assessment_scale_check
  check (assessment_scale in ('outcome', 'grade'));

alter table public.activity_assessment_entries
  drop constraint if exists activity_assessment_entries_outcome_check;
alter table public.activity_assessment_entries
  add constraint activity_assessment_entries_outcome_check
  check (
    outcome in ('needs_support', 'working_towards', 'met', 'exceeded')
    or outcome ~ '^grade_(10|[0-9])$'
  );

alter table public.activity_assessment_criterion_results
  drop constraint if exists activity_assessment_criterion_results_outcome_check;
alter table public.activity_assessment_criterion_results
  add constraint activity_assessment_criterion_results_outcome_check
  check (
    outcome in ('needs_support', 'working_towards', 'met', 'exceeded')
    or outcome ~ '^grade_(10|[0-9])$'
  );

commit;
