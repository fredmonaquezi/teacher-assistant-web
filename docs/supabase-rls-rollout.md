# Supabase RLS Rollout Notes

Migration file:
- `supabase/migrations/20260216160000_add_ownership_columns_and_rls.sql`

## What it does
- Adds `user_id` ownership to app tables (if missing).
- Sets `user_id` default to `auth.uid()` for new inserts.
- Enables + forces RLS.
- Replaces existing policies with strict per-user policies.

## Backfill behavior
- If exactly **one** user exists in `auth.users`, migration auto-backfills existing `NULL user_id` rows to that user.
- If multiple/no users exist, migration leaves `NULL user_id` rows untouched and prints notices.

## Manual backfill (multi-user projects)
Use SQL Editor to assign legacy rows before relying on strict access:

```sql
-- Example for classes (repeat for each table as needed)
update public.classes
set user_id = '<owner-user-uuid>'
where user_id is null;
```

Then verify:

```sql
select count(*) as null_user_rows
from public.classes
where user_id is null;
```
