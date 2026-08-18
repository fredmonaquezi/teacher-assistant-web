-- Keep an activity title separate from its subject and description.
begin;

alter table public.activity_assessments
  add column if not exists title text;

-- Older activity records used the subject text as their identifying label.
update public.activity_assessments
set title = subject
where title is null or char_length(trim(title)) = 0;

alter table public.activity_assessments
  alter column title set not null;

alter table public.activity_assessments
  drop constraint if exists chk_activity_assessments_title_not_blank;

alter table public.activity_assessments
  add constraint chk_activity_assessments_title_not_blank
  check (char_length(trim(title)) > 0);

notify pgrst, 'reload schema';
commit;
