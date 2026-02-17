-- Add defense-in-depth check constraints for key numeric and status fields.
-- Constraints are added as NOT VALID so legacy rows do not block rollout.
-- New/updated rows are still enforced.

begin;

create or replace function public.add_check_constraint_if_columns_exist(
  p_table text,
  p_constraint text,
  p_expression text,
  variadic p_required_columns text[]
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_col text;
begin
  if to_regclass(format('public.%I', p_table)) is null then
    raise notice 'Skipping constraint % on %. Table not found.', p_constraint, p_table;
    return;
  end if;

  if exists (
    select 1
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    where n.nspname = 'public'
      and t.relname = p_table
      and c.conname = p_constraint
  ) then
    raise notice 'Constraint % already exists on %. Skipping.', p_constraint, p_table;
    return;
  end if;

  foreach v_col in array p_required_columns loop
    if not exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = p_table
        and column_name = v_col
    ) then
      raise notice 'Skipping constraint % on %. Missing column %.', p_constraint, p_table, v_col;
      return;
    end if;
  end loop;

  execute format(
    'alter table public.%I add constraint %I check (%s) not valid',
    p_table,
    p_constraint,
    p_expression
  );
end;
$$;

select public.add_check_constraint_if_columns_exist(
  'classes',
  'chk_classes_sort_order_non_negative',
  'sort_order >= 0',
  'sort_order'
);

select public.add_check_constraint_if_columns_exist(
  'students',
  'chk_students_sort_order_non_negative',
  'sort_order >= 0',
  'sort_order'
);

select public.add_check_constraint_if_columns_exist(
  'subjects',
  'chk_subjects_sort_order_non_negative',
  'sort_order >= 0',
  'sort_order'
);

select public.add_check_constraint_if_columns_exist(
  'units',
  'chk_units_sort_order_non_negative',
  'sort_order >= 0',
  'sort_order'
);

select public.add_check_constraint_if_columns_exist(
  'assessments',
  'chk_assessments_sort_order_non_negative',
  'sort_order >= 0',
  'sort_order'
);

select public.add_check_constraint_if_columns_exist(
  'assessments',
  'chk_assessments_max_score_positive',
  'max_score is null or max_score > 0',
  'max_score'
);

select public.add_check_constraint_if_columns_exist(
  'assessment_entries',
  'chk_assessment_entries_score_non_negative',
  'score is null or score >= 0',
  'score'
);

select public.add_check_constraint_if_columns_exist(
  'attendance_entries',
  'chk_attendance_entries_status_allowed',
  $$status in ('Present', 'Arrived late', 'Left early', 'Didn''t come')$$,
  'status'
);

select public.add_check_constraint_if_columns_exist(
  'running_records',
  'chk_running_records_total_words_positive',
  'total_words > 0',
  'total_words'
);

select public.add_check_constraint_if_columns_exist(
  'running_records',
  'chk_running_records_errors_non_negative',
  'errors >= 0',
  'errors'
);

select public.add_check_constraint_if_columns_exist(
  'running_records',
  'chk_running_records_self_corrections_non_negative',
  'self_corrections >= 0',
  'self_corrections'
);

select public.add_check_constraint_if_columns_exist(
  'running_records',
  'chk_running_records_errors_lte_total_words',
  'errors <= total_words',
  'errors',
  'total_words'
);

select public.add_check_constraint_if_columns_exist(
  'running_records',
  'chk_running_records_accuracy_pct_range',
  'accuracy_pct >= 0 and accuracy_pct <= 100',
  'accuracy_pct'
);

select public.add_check_constraint_if_columns_exist(
  'running_records',
  'chk_running_records_sc_ratio_positive',
  'sc_ratio is null or sc_ratio > 0',
  'sc_ratio'
);

select public.add_check_constraint_if_columns_exist(
  'rubric_categories',
  'chk_rubric_categories_sort_order_non_negative',
  'sort_order >= 0',
  'sort_order'
);

select public.add_check_constraint_if_columns_exist(
  'rubric_criteria',
  'chk_rubric_criteria_sort_order_non_negative',
  'sort_order >= 0',
  'sort_order'
);

select public.add_check_constraint_if_columns_exist(
  'development_scores',
  'chk_development_scores_rating_range',
  'rating >= 1 and rating <= 5',
  'rating'
);

select public.add_check_constraint_if_columns_exist(
  'group_constraints',
  'chk_group_constraints_different_students',
  'student_a <> student_b',
  'student_a',
  'student_b'
);

notify pgrst, 'reload schema';

commit;
