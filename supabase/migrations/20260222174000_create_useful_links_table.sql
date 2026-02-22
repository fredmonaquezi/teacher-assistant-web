begin;

create table if not exists public.useful_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  title text not null check (char_length(trim(title)) > 0),
  url text not null check (url ~* '^https://.+'),
  description text,
  sort_order integer not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists useful_links_user_id_idx on public.useful_links (user_id);
create index if not exists useful_links_user_id_sort_order_idx
  on public.useful_links (user_id, sort_order, created_at);

alter table public.useful_links enable row level security;
alter table public.useful_links force row level security;

drop policy if exists rls_useful_links_select_own on public.useful_links;
drop policy if exists rls_useful_links_insert_own on public.useful_links;
drop policy if exists rls_useful_links_update_own on public.useful_links;
drop policy if exists rls_useful_links_delete_own on public.useful_links;

create policy rls_useful_links_select_own
  on public.useful_links
  for select
  using (auth.uid() = user_id);

create policy rls_useful_links_insert_own
  on public.useful_links
  for insert
  with check (auth.uid() = user_id);

create policy rls_useful_links_update_own
  on public.useful_links
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy rls_useful_links_delete_own
  on public.useful_links
  for delete
  using (auth.uid() = user_id);

notify pgrst, 'reload schema';

commit;
