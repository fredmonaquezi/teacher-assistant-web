-- Allow teachers to override assessment-derived learning profiles for grouping.
begin;

alter table public.students
  add column if not exists academic_level_override text;

alter table public.students
  drop constraint if exists chk_students_academic_level_override;

alter table public.students
  add constraint chk_students_academic_level_override
  check (
    academic_level_override is null
    or academic_level_override in ('needs_support', 'developing', 'on_track', 'extending')
  );

notify pgrst, 'reload schema';
commit;
