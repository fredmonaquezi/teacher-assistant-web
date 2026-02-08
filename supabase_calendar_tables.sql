-- Calendar tables for web app parity with iOS CalendarRootView
-- Run this in Supabase SQL Editor.

create table if not exists public.calendar_diary_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  entry_date date not null,
  class_id uuid references public.classes(id) on delete set null,
  subject_id uuid references public.subjects(id) on delete set null,
  unit_id uuid references public.units(id) on delete set null,
  start_time timestamptz,
  end_time timestamptz,
  plan text,
  objectives text,
  materials text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  event_date date not null,
  class_id uuid references public.classes(id) on delete set null,
  title text not null,
  details text,
  is_all_day boolean not null default false,
  start_time timestamptz,
  end_time timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists calendar_diary_entries_user_date_idx
  on public.calendar_diary_entries(user_id, entry_date desc);

create index if not exists calendar_events_user_date_idx
  on public.calendar_events(user_id, event_date desc);

alter table public.calendar_diary_entries enable row level security;
alter table public.calendar_events enable row level security;

drop policy if exists "Users can select own calendar diary entries" on public.calendar_diary_entries;
create policy "Users can select own calendar diary entries"
  on public.calendar_diary_entries for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own calendar diary entries" on public.calendar_diary_entries;
create policy "Users can insert own calendar diary entries"
  on public.calendar_diary_entries for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own calendar diary entries" on public.calendar_diary_entries;
create policy "Users can update own calendar diary entries"
  on public.calendar_diary_entries for update
  using (auth.uid() = user_id);

drop policy if exists "Users can delete own calendar diary entries" on public.calendar_diary_entries;
create policy "Users can delete own calendar diary entries"
  on public.calendar_diary_entries for delete
  using (auth.uid() = user_id);

drop policy if exists "Users can select own calendar events" on public.calendar_events;
create policy "Users can select own calendar events"
  on public.calendar_events for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own calendar events" on public.calendar_events;
create policy "Users can insert own calendar events"
  on public.calendar_events for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own calendar events" on public.calendar_events;
create policy "Users can update own calendar events"
  on public.calendar_events for update
  using (auth.uid() = user_id);

drop policy if exists "Users can delete own calendar events" on public.calendar_events;
create policy "Users can delete own calendar events"
  on public.calendar_events for delete
  using (auth.uid() = user_id);

notify pgrst, 'reload schema';
