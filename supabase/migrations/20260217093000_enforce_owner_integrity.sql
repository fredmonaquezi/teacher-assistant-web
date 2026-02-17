-- Enforce cross-table ownership integrity on relational references.
-- This prevents linking rows across different users even when RLS is enabled.

begin;

create or replace function public.assert_related_owner(
  p_parent_table regclass,
  p_parent_id uuid,
  p_child_owner uuid,
  p_child_table text,
  p_fk_column text
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_parent_owner uuid;
begin
  if p_parent_id is null then
    return;
  end if;

  execute format('select user_id from %s where id = $1', p_parent_table)
    into v_parent_owner
    using p_parent_id;

  if v_parent_owner is null then
    raise exception
      using
        errcode = '23503',
        message = format(
          'Invalid reference on %s.%s: related row %s not found in %s',
          p_child_table,
          p_fk_column,
          p_parent_id,
          p_parent_table::text
        );
  end if;

  if p_child_owner is distinct from v_parent_owner then
    raise exception
      using
        errcode = '23514',
        message = format(
          'Ownership mismatch on %s.%s: referenced row in %s belongs to another user',
          p_child_table,
          p_fk_column,
          p_parent_table::text
        );
  end if;
end;
$$;

create or replace function public.enforce_row_owner_integrity()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_child_owner uuid;
  v_fk_col text;
  v_parent_table regclass;
  v_fk_raw text;
  v_fk_id uuid;
  v_arg_index integer := 0;
begin
  if mod(tg_nargs, 2) <> 0 then
    raise exception 'Owner integrity trigger requires fk/parent pairs. Received % args.', tg_nargs;
  end if;

  v_child_owner := (to_jsonb(new) ->> 'user_id')::uuid;
  if v_child_owner is null then
    return new;
  end if;

  while v_arg_index < tg_nargs loop
    v_fk_col := tg_argv[v_arg_index];
    v_parent_table := tg_argv[v_arg_index + 1]::regclass;
    v_fk_raw := to_jsonb(new) ->> v_fk_col;

    if v_fk_raw is not null and v_fk_raw <> '' then
      v_fk_id := v_fk_raw::uuid;
      perform public.assert_related_owner(v_parent_table, v_fk_id, v_child_owner, tg_table_name, v_fk_col);
    end if;

    v_arg_index := v_arg_index + 2;
  end loop;

  return new;
end;
$$;

create or replace function public.add_owner_integrity_trigger(
  p_child_table text,
  p_trigger_name text,
  variadic p_fk_parent_pairs text[]
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_pair_count integer;
  v_idx integer := 1;
  v_fk_col text;
  v_parent_table text;
  v_trigger_args text := '';
  v_is_first boolean := true;
begin
  if to_regclass(format('public.%I', p_child_table)) is null then
    raise notice 'Skipping trigger % on %. Table not found.', p_trigger_name, p_child_table;
    return;
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = p_child_table
      and column_name = 'user_id'
  ) then
    raise notice 'Skipping trigger % on %. Missing user_id column.', p_trigger_name, p_child_table;
    return;
  end if;

  v_pair_count := coalesce(array_length(p_fk_parent_pairs, 1), 0);
  if v_pair_count = 0 or mod(v_pair_count, 2) <> 0 then
    raise exception 'Trigger % requires fk/parent pairs.', p_trigger_name;
  end if;

  while v_idx <= v_pair_count loop
    v_fk_col := p_fk_parent_pairs[v_idx];
    v_parent_table := p_fk_parent_pairs[v_idx + 1];

    if not exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = p_child_table
        and column_name = v_fk_col
    ) then
      v_idx := v_idx + 2;
      continue;
    end if;

    if to_regclass(format('public.%I', v_parent_table)) is null then
      v_idx := v_idx + 2;
      continue;
    end if;

    if not exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = v_parent_table
        and column_name = 'user_id'
    ) then
      v_idx := v_idx + 2;
      continue;
    end if;

    if not v_is_first then
      v_trigger_args := v_trigger_args || ', ';
    end if;

    v_trigger_args := v_trigger_args
      || quote_literal(v_fk_col)
      || ', '
      || quote_literal(format('public.%I', v_parent_table));
    v_is_first := false;
    v_idx := v_idx + 2;
  end loop;

  execute format('drop trigger if exists %I on public.%I', p_trigger_name, p_child_table);

  if v_trigger_args = '' then
    raise notice 'Skipping trigger % on %. No valid ownership pairs found.', p_trigger_name, p_child_table;
    return;
  end if;

  execute format(
    'create trigger %I before insert or update on public.%I for each row execute function public.enforce_row_owner_integrity(%s)',
    p_trigger_name,
    p_child_table,
    v_trigger_args
  );
end;
$$;

select public.add_owner_integrity_trigger(
  'students',
  'trg_students_owner_integrity',
  'class_id',
  'classes'
);

select public.add_owner_integrity_trigger(
  'subjects',
  'trg_subjects_owner_integrity',
  'class_id',
  'classes'
);

select public.add_owner_integrity_trigger(
  'units',
  'trg_units_owner_integrity',
  'subject_id',
  'subjects'
);

select public.add_owner_integrity_trigger(
  'assessments',
  'trg_assessments_owner_integrity',
  'class_id',
  'classes',
  'subject_id',
  'subjects',
  'unit_id',
  'units'
);

select public.add_owner_integrity_trigger(
  'assessment_entries',
  'trg_assessment_entries_owner_integrity',
  'assessment_id',
  'assessments',
  'student_id',
  'students'
);

select public.add_owner_integrity_trigger(
  'attendance_sessions',
  'trg_attendance_sessions_owner_integrity',
  'class_id',
  'classes'
);

select public.add_owner_integrity_trigger(
  'attendance_entries',
  'trg_attendance_entries_owner_integrity',
  'session_id',
  'attendance_sessions',
  'student_id',
  'students'
);

select public.add_owner_integrity_trigger(
  'running_records',
  'trg_running_records_owner_integrity',
  'student_id',
  'students'
);

select public.add_owner_integrity_trigger(
  'rubric_categories',
  'trg_rubric_categories_owner_integrity',
  'rubric_id',
  'rubrics'
);

select public.add_owner_integrity_trigger(
  'rubric_criteria',
  'trg_rubric_criteria_owner_integrity',
  'category_id',
  'rubric_categories'
);

select public.add_owner_integrity_trigger(
  'development_scores',
  'trg_development_scores_owner_integrity',
  'student_id',
  'students',
  'criterion_id',
  'rubric_criteria'
);

select public.add_owner_integrity_trigger(
  'groups',
  'trg_groups_owner_integrity',
  'class_id',
  'classes'
);

select public.add_owner_integrity_trigger(
  'group_members',
  'trg_group_members_owner_integrity',
  'group_id',
  'groups',
  'student_id',
  'students'
);

select public.add_owner_integrity_trigger(
  'group_constraints',
  'trg_group_constraints_owner_integrity',
  'student_a',
  'students',
  'student_b',
  'students'
);

select public.add_owner_integrity_trigger(
  'lesson_plans',
  'trg_lesson_plans_owner_integrity',
  'class_id',
  'classes',
  'subject_id',
  'subjects',
  'unit_id',
  'units'
);

select public.add_owner_integrity_trigger(
  'calendar_diary_entries',
  'trg_calendar_diary_entries_owner_integrity',
  'class_id',
  'classes',
  'subject_id',
  'subjects',
  'unit_id',
  'units'
);

select public.add_owner_integrity_trigger(
  'calendar_events',
  'trg_calendar_events_owner_integrity',
  'class_id',
  'classes'
);

notify pgrst, 'reload schema';

commit;
