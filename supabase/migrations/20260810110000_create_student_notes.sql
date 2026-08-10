-- A private, dated record of factual classroom observations and development updates.
begin;

create table if not exists public.student_notes (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  user_id uuid not null default auth.uid(),
  note_date date not null default current_date,
  entry_type text not null default 'anecdotal' check (entry_type in ('anecdotal', 'development')),
  development_area text,
  development_level text check (development_level in ('needs_support', 'on_track', 'exceeding')),
  body text not null check (char_length(trim(body)) > 0),
  created_at timestamptz not null default now(),
  constraint chk_student_notes_development_fields check (
    (entry_type = 'anecdotal' and development_area is null and development_level is null)
    or (entry_type = 'development')
  )
);

create index if not exists student_notes_user_student_date_idx
  on public.student_notes (user_id, student_id, note_date desc, created_at desc);

alter table public.student_notes enable row level security;
alter table public.student_notes force row level security;

create policy rls_student_notes_select_own on public.student_notes for select using (auth.uid() = user_id);
create policy rls_student_notes_insert_own on public.student_notes for insert with check (auth.uid() = user_id);
create policy rls_student_notes_update_own on public.student_notes for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy rls_student_notes_delete_own on public.student_notes for delete using (auth.uid() = user_id);

select public.add_owner_integrity_trigger(
  'student_notes',
  'trg_student_notes_owner_integrity',
  'student_id',
  'students'
);

notify pgrst, 'reload schema';
commit;
