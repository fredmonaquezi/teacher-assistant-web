#!/usr/bin/env bash
set -euo pipefail

MIGRATIONS_DIR="supabase/migrations"
NAME_REGEX='^[0-9]{14}_[a-z0-9_]+\.sql$'

if [[ ! -d "$MIGRATIONS_DIR" ]]; then
  echo "Missing migrations directory: $MIGRATIONS_DIR"
  exit 1
fi

migration_files=()
while IFS= read -r file; do
  migration_files+=("$file")
done < <(find "$MIGRATIONS_DIR" -maxdepth 1 -type f -name '*.sql' -print | sort)

if [[ ${#migration_files[@]} -eq 0 ]]; then
  echo "No migration files found in $MIGRATIONS_DIR"
  exit 1
fi

prev_name=""
seen_prefixes=""

for file in "${migration_files[@]}"; do
  name="$(basename "$file")"

  if [[ ! "$name" =~ $NAME_REGEX ]]; then
    echo "Invalid migration filename format: $name"
    echo "Expected format: YYYYMMDDHHMMSS_description.sql"
    exit 1
  fi

  prefix="${name%%_*}"
  if printf '%s\n' "$seen_prefixes" | rg -qx "$prefix"; then
    echo "Duplicate migration timestamp prefix found: $prefix"
    exit 1
  fi
  seen_prefixes="${seen_prefixes}"$'\n'"$prefix"

  if [[ -n "$prev_name" && "$name" < "$prev_name" ]]; then
    echo "Migration ordering violation: $name appears before $prev_name"
    exit 1
  fi
  prev_name="$name"

  if ! rg -qi '^\s*begin\s*;' "$file"; then
    echo "Migration must start a transaction (missing BEGIN;): $name"
    exit 1
  fi

  if ! rg -qi '^\s*commit\s*;' "$file"; then
    echo "Migration must end a transaction (missing COMMIT;): $name"
    exit 1
  fi
done

echo "Migration policy checks passed for ${#migration_files[@]} file(s)."
