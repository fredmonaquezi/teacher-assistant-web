begin;

alter table public.running_records
add column if not exists book_level text;

commit;
