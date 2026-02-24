begin;

create table if not exists public.random_picker_custom_categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  class_id uuid references public.classes(id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  sort_order integer not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.random_picker_rotation_state (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  class_id uuid references public.classes(id) on delete cascade,
  category text not null check (char_length(trim(category)) > 0),
  used_student_ids uuid[] not null default '{}',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists random_picker_custom_categories_user_id_idx
  on public.random_picker_custom_categories (user_id);
create index if not exists random_picker_custom_categories_user_id_class_id_sort_order_idx
  on public.random_picker_custom_categories (user_id, class_id, sort_order, created_at);

create index if not exists random_picker_rotation_state_user_id_idx
  on public.random_picker_rotation_state (user_id);
create index if not exists random_picker_rotation_state_user_id_class_id_category_idx
  on public.random_picker_rotation_state (user_id, class_id, category);

create unique index if not exists random_picker_custom_categories_scope_name_uniq
  on public.random_picker_custom_categories (
    user_id,
    coalesce(class_id, '00000000-0000-0000-0000-000000000000'::uuid),
    name
  );

create unique index if not exists random_picker_rotation_state_scope_category_uniq
  on public.random_picker_rotation_state (
    user_id,
    coalesce(class_id, '00000000-0000-0000-0000-000000000000'::uuid),
    category
  );

alter table public.random_picker_custom_categories enable row level security;
alter table public.random_picker_custom_categories force row level security;

alter table public.random_picker_rotation_state enable row level security;
alter table public.random_picker_rotation_state force row level security;

drop policy if exists rls_random_picker_custom_categories_select_own on public.random_picker_custom_categories;
drop policy if exists rls_random_picker_custom_categories_insert_own on public.random_picker_custom_categories;
drop policy if exists rls_random_picker_custom_categories_update_own on public.random_picker_custom_categories;
drop policy if exists rls_random_picker_custom_categories_delete_own on public.random_picker_custom_categories;

create policy rls_random_picker_custom_categories_select_own
  on public.random_picker_custom_categories
  for select
  using (auth.uid() = user_id);

create policy rls_random_picker_custom_categories_insert_own
  on public.random_picker_custom_categories
  for insert
  with check (auth.uid() = user_id);

create policy rls_random_picker_custom_categories_update_own
  on public.random_picker_custom_categories
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy rls_random_picker_custom_categories_delete_own
  on public.random_picker_custom_categories
  for delete
  using (auth.uid() = user_id);

drop policy if exists rls_random_picker_rotation_state_select_own on public.random_picker_rotation_state;
drop policy if exists rls_random_picker_rotation_state_insert_own on public.random_picker_rotation_state;
drop policy if exists rls_random_picker_rotation_state_update_own on public.random_picker_rotation_state;
drop policy if exists rls_random_picker_rotation_state_delete_own on public.random_picker_rotation_state;

create policy rls_random_picker_rotation_state_select_own
  on public.random_picker_rotation_state
  for select
  using (auth.uid() = user_id);

create policy rls_random_picker_rotation_state_insert_own
  on public.random_picker_rotation_state
  for insert
  with check (auth.uid() = user_id);

create policy rls_random_picker_rotation_state_update_own
  on public.random_picker_rotation_state
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy rls_random_picker_rotation_state_delete_own
  on public.random_picker_rotation_state
  for delete
  using (auth.uid() = user_id);

do $$
begin
  if to_regprocedure('public.add_owner_integrity_trigger(text,text,text[])') is not null then
    perform public.add_owner_integrity_trigger(
      'random_picker_custom_categories',
      'trg_random_picker_custom_categories_owner_integrity',
      'class_id',
      'classes'
    );

    perform public.add_owner_integrity_trigger(
      'random_picker_rotation_state',
      'trg_random_picker_rotation_state_owner_integrity',
      'class_id',
      'classes'
    );
  end if;
end;
$$;

notify pgrst, 'reload schema';

commit;
