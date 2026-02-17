# Supabase RLS Rollout Notes

Migration file:
- `supabase/migrations/20260216160000_add_ownership_columns_and_rls.sql`

## What it does
- Adds `user_id` ownership to app tables (if missing).
- Sets `user_id` default to `auth.uid()` for new inserts.
- Enables + forces RLS.
- Replaces existing policies with strict per-user policies.

## Backfill behavior
- If exactly **one** user exists in `auth.users`, migration auto-backfills existing `NULL user_id` rows to that user.
- If multiple/no users exist, migration leaves `NULL user_id` rows untouched and prints notices.

## Manual backfill (multi-user projects)
Use SQL Editor to assign legacy rows before relying on strict access:

```sql
-- Example for classes (repeat for each table as needed)
update public.classes
set user_id = '<owner-user-uuid>'
where user_id is null;
```

Then verify:

```sql
select count(*) as null_user_rows
from public.classes
where user_id is null;
```

## Defensive constraints: audit + validation
Migration files:
- `supabase/migrations/20260217100000_add_defensive_check_constraints.sql`
- `supabase/migrations/20260217113000_validate_defensive_constraints.sql`

Use this audit SQL in Supabase SQL Editor before and after running validation migration:

```sql
do $$
declare
  rec record;
  v_count bigint;
begin
  create temporary table if not exists tmp_constraint_audit (
    table_name text,
    violation_where text,
    violation_count bigint
  );

  truncate tmp_constraint_audit;

  for rec in
    select * from (
      values
        ('classes', 'sort_order < 0'),
        ('students', 'sort_order < 0'),
        ('subjects', 'sort_order < 0'),
        ('units', 'sort_order < 0'),
        ('assessments', 'sort_order < 0'),
        ('assessments', 'max_score is not null and max_score <= 0'),
        ('assessment_entries', 'score is not null and score < 0'),
        ('attendance_entries', $$status not in ('Present', 'Arrived late', 'Left early', 'Didn''t come')$$),
        ('running_records', 'total_words <= 0'),
        ('running_records', 'errors < 0'),
        ('running_records', 'self_corrections < 0'),
        ('running_records', 'errors > total_words'),
        ('running_records', 'accuracy_pct < 0 or accuracy_pct > 100'),
        ('running_records', 'sc_ratio is not null and sc_ratio <= 0'),
        ('rubric_categories', 'sort_order < 0'),
        ('rubric_criteria', 'sort_order < 0'),
        ('development_scores', 'rating < 1 or rating > 5'),
        ('group_constraints', 'student_a = student_b')
    ) as v(table_name, violation_where)
  loop
    if to_regclass(format('public.%I', rec.table_name)) is null then
      insert into tmp_constraint_audit values (rec.table_name, rec.violation_where, 0);
      continue;
    end if;

    execute format(
      'select count(*) from public.%I where %s',
      rec.table_name,
      rec.violation_where
    )
    into v_count;

    insert into tmp_constraint_audit values (rec.table_name, rec.violation_where, v_count);
  end loop;
end $$;

select *
from tmp_constraint_audit
order by violation_count desc, table_name, violation_where;
```

Expected result:
- Every row should have `violation_count = 0`.

Rollout steps:
1. Run `npx supabase db push` so `20260217113000_validate_defensive_constraints.sql` is applied.
2. Run the audit SQL above in Supabase SQL Editor.
3. Confirm all `violation_count` values are `0`.
