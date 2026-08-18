-- Restore the persisted group-maker domain when deploying the simplified app
-- to a database that did not retain the legacy group tables.
begin;

create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) > 0),
  class_id uuid not null references public.classes(id) on delete cascade,
  user_id uuid not null default auth.uid(),
  created_at timestamptz not null default now()
);

create table if not exists public.group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  user_id uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  unique (group_id, student_id)
);

create table if not exists public.group_constraints (
  id uuid primary key default gen_random_uuid(),
  student_a uuid not null references public.students(id) on delete cascade,
  student_b uuid not null references public.students(id) on delete cascade,
  user_id uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  check (student_a <> student_b)
);

alter table public.groups alter column user_id set default auth.uid();
alter table public.group_members alter column user_id set default auth.uid();
alter table public.group_constraints alter column user_id set default auth.uid();

create index if not exists groups_user_class_created_idx
  on public.groups (user_id, class_id, created_at desc);
create index if not exists group_members_user_group_idx
  on public.group_members (user_id, group_id);
create index if not exists group_members_user_student_idx
  on public.group_members (user_id, student_id);
create index if not exists group_constraints_user_students_idx
  on public.group_constraints (user_id, student_a, student_b);

alter table public.groups enable row level security;
alter table public.groups force row level security;
alter table public.group_members enable row level security;
alter table public.group_members force row level security;
alter table public.group_constraints enable row level security;
alter table public.group_constraints force row level security;

drop policy if exists rls_groups_select_own on public.groups;
drop policy if exists rls_groups_insert_own on public.groups;
drop policy if exists rls_groups_update_own on public.groups;
drop policy if exists rls_groups_delete_own on public.groups;
create policy rls_groups_select_own on public.groups for select using (auth.uid() = user_id);
create policy rls_groups_insert_own on public.groups for insert with check (auth.uid() = user_id);
create policy rls_groups_update_own on public.groups for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy rls_groups_delete_own on public.groups for delete using (auth.uid() = user_id);

drop policy if exists rls_group_members_select_own on public.group_members;
drop policy if exists rls_group_members_insert_own on public.group_members;
drop policy if exists rls_group_members_update_own on public.group_members;
drop policy if exists rls_group_members_delete_own on public.group_members;
create policy rls_group_members_select_own on public.group_members for select using (auth.uid() = user_id);
create policy rls_group_members_insert_own on public.group_members for insert with check (auth.uid() = user_id);
create policy rls_group_members_update_own on public.group_members for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy rls_group_members_delete_own on public.group_members for delete using (auth.uid() = user_id);

drop policy if exists rls_group_constraints_select_own on public.group_constraints;
drop policy if exists rls_group_constraints_insert_own on public.group_constraints;
drop policy if exists rls_group_constraints_update_own on public.group_constraints;
drop policy if exists rls_group_constraints_delete_own on public.group_constraints;
create policy rls_group_constraints_select_own on public.group_constraints for select using (auth.uid() = user_id);
create policy rls_group_constraints_insert_own on public.group_constraints for insert with check (auth.uid() = user_id);
create policy rls_group_constraints_update_own on public.group_constraints for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy rls_group_constraints_delete_own on public.group_constraints for delete using (auth.uid() = user_id);

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

notify pgrst, 'reload schema';
commit;
