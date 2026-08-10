-- A private, dated journal for whole-class observations.
begin;

create table if not exists public.class_notes (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  user_id uuid not null default auth.uid(),
  note_date date not null default current_date,
  body text not null check (char_length(trim(body)) > 0),
  created_at timestamptz not null default now()
);

create index if not exists class_notes_user_class_date_idx
  on public.class_notes (user_id, class_id, note_date desc, created_at desc);

alter table public.class_notes enable row level security;
alter table public.class_notes force row level security;

create policy rls_class_notes_select_own on public.class_notes for select using (auth.uid() = user_id);
create policy rls_class_notes_insert_own on public.class_notes for insert with check (auth.uid() = user_id);
create policy rls_class_notes_update_own on public.class_notes for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy rls_class_notes_delete_own on public.class_notes for delete using (auth.uid() = user_id);

select public.add_owner_integrity_trigger(
  'class_notes',
  'trg_class_notes_owner_integrity',
  'class_id',
  'classes'
);

notify pgrst, 'reload schema';
commit;
