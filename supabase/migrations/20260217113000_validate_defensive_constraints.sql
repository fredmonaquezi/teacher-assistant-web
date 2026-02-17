-- Validate previously added NOT VALID defensive check constraints.
-- Safe to run multiple times and safe when some tables/constraints are absent.

begin;

create or replace function public.validate_constraint_if_exists(
  p_table text,
  p_constraint text
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_validated boolean;
begin
  if to_regclass(format('public.%I', p_table)) is null then
    raise notice 'Skipping validation for %. Table not found.', p_table;
    return;
  end if;

  select c.convalidated
    into v_validated
  from pg_constraint c
  join pg_class t on t.oid = c.conrelid
  join pg_namespace n on n.oid = t.relnamespace
  where n.nspname = 'public'
    and t.relname = p_table
    and c.conname = p_constraint;

  if v_validated is null then
    raise notice 'Skipping validation for %. Constraint % not found.', p_table, p_constraint;
    return;
  end if;

  if v_validated then
    raise notice 'Constraint % on % is already validated. Skipping.', p_constraint, p_table;
    return;
  end if;

  execute format(
    'alter table public.%I validate constraint %I',
    p_table,
    p_constraint
  );
end;
$$;

select public.validate_constraint_if_exists('classes', 'chk_classes_sort_order_non_negative');
select public.validate_constraint_if_exists('students', 'chk_students_sort_order_non_negative');
select public.validate_constraint_if_exists('subjects', 'chk_subjects_sort_order_non_negative');
select public.validate_constraint_if_exists('units', 'chk_units_sort_order_non_negative');
select public.validate_constraint_if_exists('assessments', 'chk_assessments_sort_order_non_negative');
select public.validate_constraint_if_exists('assessments', 'chk_assessments_max_score_positive');
select public.validate_constraint_if_exists('assessment_entries', 'chk_assessment_entries_score_non_negative');
select public.validate_constraint_if_exists('attendance_entries', 'chk_attendance_entries_status_allowed');
select public.validate_constraint_if_exists('running_records', 'chk_running_records_total_words_positive');
select public.validate_constraint_if_exists('running_records', 'chk_running_records_errors_non_negative');
select public.validate_constraint_if_exists('running_records', 'chk_running_records_self_corrections_non_negative');
select public.validate_constraint_if_exists('running_records', 'chk_running_records_errors_lte_total_words');
select public.validate_constraint_if_exists('running_records', 'chk_running_records_accuracy_pct_range');
select public.validate_constraint_if_exists('running_records', 'chk_running_records_sc_ratio_positive');
select public.validate_constraint_if_exists('rubric_categories', 'chk_rubric_categories_sort_order_non_negative');
select public.validate_constraint_if_exists('rubric_criteria', 'chk_rubric_criteria_sort_order_non_negative');
select public.validate_constraint_if_exists('development_scores', 'chk_development_scores_rating_range');
select public.validate_constraint_if_exists('group_constraints', 'chk_group_constraints_different_students');

notify pgrst, 'reload schema';

commit;
