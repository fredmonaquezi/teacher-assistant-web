begin;

do $$
begin
  if to_regclass('public.rubrics') is null then
    raise notice 'Skipping rubric template locale migration: public.rubrics not found.';
    return;
  end if;

  alter table public.rubrics add column if not exists template_key text;
  alter table public.rubrics add column if not exists template_locale text;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.rubrics'::regclass
      and conname = 'chk_rubrics_template_locale_supported'
  ) then
    alter table public.rubrics
      add constraint chk_rubrics_template_locale_supported
      check (template_locale is null or template_locale in ('en', 'pt-BR'));
  end if;
end $$;

do $$
begin
  if to_regclass('public.rubrics') is null then
    return;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'rubrics'
      and column_name = 'user_id'
  ) then
    execute 'create index if not exists rubrics_template_lookup_idx on public.rubrics (user_id, template_key, template_locale)';
    execute 'create unique index if not exists rubrics_user_template_locale_unique_idx on public.rubrics (user_id, template_key, template_locale) where template_key is not null and template_locale is not null';
  else
    execute 'create index if not exists rubrics_template_lookup_idx on public.rubrics (template_key, template_locale)';
    execute 'create unique index if not exists rubrics_user_template_locale_unique_idx on public.rubrics (template_key, template_locale) where template_key is not null and template_locale is not null';
  end if;
end $$;

notify pgrst, 'reload schema';

commit;
