-- Add ownership columns + strict per-user RLS across app tables.
-- Safe rollout behavior:
-- - If there is exactly 1 auth user, existing NULL ownership rows are auto-assigned.
-- - If there are multiple/no auth users, existing NULL ownership rows are left untouched and must be backfilled manually.

begin;

do $$
declare
  app_tables text[] := array[
    'classes',
    'students',
    'lesson_plans',
    'attendance_sessions',
    'attendance_entries',
    'assessments',
    'assessment_entries',
    'running_records',
    'subjects',
    'units',
    'rubrics',
    'rubric_categories',
    'rubric_criteria',
    'development_scores',
    'groups',
    'group_members',
    'group_constraints',
    'calendar_diary_entries',
    'calendar_events'
  ];
  tbl text;
  pol record;
  auth_user_count integer;
  default_owner uuid;
  null_count bigint;
begin
  select count(*)::integer into auth_user_count from auth.users;

  if auth_user_count = 1 then
    select id into default_owner from auth.users limit 1;
    raise notice 'Single auth user detected (%). Existing rows with NULL user_id will be backfilled.', default_owner;
  else
    raise notice 'Auth users count = %. Existing NULL user_id rows require manual backfill.', auth_user_count;
  end if;

  foreach tbl in array app_tables loop
    if to_regclass(format('public.%I', tbl)) is null then
      raise notice 'Skipping public.%: table not found.', tbl;
      continue;
    end if;

    execute format('alter table public.%I add column if not exists user_id uuid', tbl);
    execute format('alter table public.%I alter column user_id set default auth.uid()', tbl);

    if default_owner is not null then
      execute format('update public.%I set user_id = $1 where user_id is null', tbl)
      using default_owner;
    end if;

    execute format('select count(*) from public.%I where user_id is null', tbl) into null_count;

    if null_count = 0 then
      execute format('alter table public.%I alter column user_id set not null', tbl);
    else
      raise notice 'public.% still has % rows with NULL user_id (manual backfill required).', tbl, null_count;
    end if;

    execute format('create index if not exists %I on public.%I (user_id)', tbl || '_user_id_idx', tbl);

    -- Reset policies to avoid legacy permissive rules remaining active.
    for pol in
      select policyname
      from pg_policies
      where schemaname = 'public'
        and tablename = tbl
    loop
      execute format('drop policy if exists %I on public.%I', pol.policyname, tbl);
    end loop;

    execute format('alter table public.%I enable row level security', tbl);
    execute format('alter table public.%I force row level security', tbl);

    execute format(
      'create policy %I on public.%I for select using (auth.uid() = user_id)',
      'rls_' || tbl || '_select_own',
      tbl
    );
    execute format(
      'create policy %I on public.%I for insert with check (auth.uid() = user_id)',
      'rls_' || tbl || '_insert_own',
      tbl
    );
    execute format(
      'create policy %I on public.%I for update using (auth.uid() = user_id) with check (auth.uid() = user_id)',
      'rls_' || tbl || '_update_own',
      tbl
    );
    execute format(
      'create policy %I on public.%I for delete using (auth.uid() = user_id)',
      'rls_' || tbl || '_delete_own',
      tbl
    );
  end loop;
end $$;

notify pgrst, 'reload schema';

commit;
