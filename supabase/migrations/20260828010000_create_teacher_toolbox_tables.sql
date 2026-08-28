-- Add the optional account-backed features used by Teacher Toolbox.
-- Built-in games remain public; RLS limits saved prompts to their owner.

begin;

create table if not exists public.custom_prompts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  game_id text not null,
  prompt_data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.custom_prompts
  drop constraint if exists custom_prompts_game_id_check;

update public.custom_prompts
set game_id = 'bluff-the-blank'
where game_id = concat('fib', 'bage');

alter table public.custom_prompts
  add constraint custom_prompts_game_id_check check (
    game_id in (
      'would-you-rather',
      'have-you-ever',
      'bluff-the-blank',
      'lets-rank-it',
      'paper-quips',
      'no-way',
      'category-countdown',
      'debate-corner',
      'story-spark'
    )
  );

create index if not exists custom_prompts_user_id_idx
  on public.custom_prompts (user_id);

create index if not exists custom_prompts_user_game_idx
  on public.custom_prompts (user_id, game_id);

alter table public.custom_prompts enable row level security;

revoke all on table public.custom_prompts from anon;
grant select, insert, update, delete on table public.custom_prompts to authenticated;

drop policy if exists "Teachers can read their own prompts" on public.custom_prompts;
create policy "Teachers can read their own prompts"
  on public.custom_prompts
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Teachers can create their own prompts" on public.custom_prompts;
create policy "Teachers can create their own prompts"
  on public.custom_prompts
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Teachers can update their own prompts" on public.custom_prompts;
create policy "Teachers can update their own prompts"
  on public.custom_prompts
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Teachers can delete their own prompts" on public.custom_prompts;
create policy "Teachers can delete their own prompts"
  on public.custom_prompts
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

create table if not exists public.suggestions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  kind text not null check (kind in ('game', 'improvement')),
  title text not null check (char_length(title) between 3 and 120),
  details text not null check (char_length(details) between 10 and 2000),
  contact_email text check (
    contact_email is null or char_length(contact_email) <= 254
  ),
  page_url text check (page_url is null or char_length(page_url) <= 500),
  created_at timestamptz not null default now()
);

create index if not exists suggestions_created_at_idx
  on public.suggestions (created_at desc);

alter table public.suggestions enable row level security;

revoke all on table public.suggestions from anon, authenticated;
grant insert on table public.suggestions to anon, authenticated;

drop policy if exists "Anyone can submit a suggestion" on public.suggestions;
create policy "Anyone can submit a suggestion"
  on public.suggestions
  for insert
  to anon, authenticated
  with check (
    user_id is null or (select auth.uid()) = user_id
  );

notify pgrst, 'reload schema';

commit;
