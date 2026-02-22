-- Avoid false integrity failures during cascading updates (for example class deletes
-- that trigger ON DELETE actions across related tables). On UPDATE, validate only
-- references that actually changed or when row ownership changed.

begin;

create or replace function public.enforce_row_owner_integrity()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_child_owner uuid;
  v_old_owner uuid;
  v_fk_col text;
  v_parent_table regclass;
  v_fk_raw text;
  v_old_fk_raw text;
  v_fk_id uuid;
  v_arg_index integer := 0;
begin
  if mod(tg_nargs, 2) <> 0 then
    raise exception 'Owner integrity trigger requires fk/parent pairs. Received % args.', tg_nargs;
  end if;

  v_child_owner := (to_jsonb(new) ->> 'user_id')::uuid;
  if v_child_owner is null then
    return new;
  end if;

  if tg_op = 'UPDATE' then
    v_old_owner := (to_jsonb(old) ->> 'user_id')::uuid;
  end if;

  while v_arg_index < tg_nargs loop
    v_fk_col := tg_argv[v_arg_index];
    v_parent_table := tg_argv[v_arg_index + 1]::regclass;
    v_fk_raw := to_jsonb(new) ->> v_fk_col;

    if tg_op = 'UPDATE' then
      v_old_fk_raw := to_jsonb(old) ->> v_fk_col;

      if v_child_owner is not distinct from v_old_owner
         and v_fk_raw is not distinct from v_old_fk_raw then
        v_arg_index := v_arg_index + 2;
        continue;
      end if;
    end if;

    if v_fk_raw is not null and v_fk_raw <> '' then
      v_fk_id := v_fk_raw::uuid;
      perform public.assert_related_owner(v_parent_table, v_fk_id, v_child_owner, tg_table_name, v_fk_col);
    end if;

    v_arg_index := v_arg_index + 2;
  end loop;

  return new;
end;
$$;

notify pgrst, 'reload schema';

commit;
