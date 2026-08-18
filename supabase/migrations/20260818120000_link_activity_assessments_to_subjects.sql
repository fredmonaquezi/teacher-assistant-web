-- Link activity assessments to class subjects while preserving the stored subject label.
begin;

alter table public.activity_assessments
  add column if not exists subject_id uuid references public.subjects(id) on delete set null;

update public.activity_assessments activity
set subject_id = (
  select subject.id
  from public.subjects subject
  where subject.class_id = activity.class_id
    and lower(trim(subject.name)) = lower(trim(activity.subject))
  order by subject.sort_order asc, subject.created_at asc, subject.id asc
  limit 1
)
where activity.subject_id is null;

create index if not exists activity_assessments_user_subject_date_idx
  on public.activity_assessments (user_id, subject_id, activity_date desc, created_at desc);

select public.add_owner_integrity_trigger(
  'activity_assessments',
  'trg_activity_assessments_owner_integrity',
  'class_id',
  'classes',
  'subject_id',
  'subjects'
);

create or replace function public.enforce_activity_assessment_subject_class()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_subject_class_id uuid;
begin
  if new.subject_id is null then
    return new;
  end if;

  select class_id into v_subject_class_id
  from public.subjects
  where id = new.subject_id;

  if v_subject_class_id is null then
    raise exception using errcode = '23503', message = 'The selected subject does not exist.';
  end if;

  if new.class_id is distinct from v_subject_class_id then
    raise exception using errcode = '23514', message = 'The selected subject does not belong to this class.';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_activity_assessments_subject_class on public.activity_assessments;
create trigger trg_activity_assessments_subject_class
  before insert or update of class_id, subject_id on public.activity_assessments
  for each row execute function public.enforce_activity_assessment_subject_class();

notify pgrst, 'reload schema';
commit;
