#!/usr/bin/env bash
# Auto-archive old CSV versions in src/data/, keeping only the 2 most recent per prefix.
# Files are moved to src/data/archive/ using git mv (preserves history).
# Usage: npm run archive:csv
# Compatible with macOS bash 3.2 (no associative arrays).

set -euo pipefail

DATA_DIR="src/data"
ARCHIVE_DIR="src/data/archive"
MAX_VERSIONS=2

mkdir -p "$ARCHIVE_DIR"

# Extract unique prefixes
prefixes=$(
  for csv in "$DATA_DIR"/*.csv; do
    [ -f "$csv" ] || continue
    basename "$csv" | sed -E 's/[0-9]{8}(_r[0-9]+)?\.csv$//'
  done | sort -u
)

for prefix in $prefixes; do
  # Build sorted list: newest date + highest revision first
  sorted=$(
    for csv in "$DATA_DIR"/${prefix}*.csv; do
      [ -f "$csv" ] || continue
      f=$(basename "$csv")
      # Extract MMDDYYYY and optional _rN
      mm=$(echo "$f" | sed -E 's/.*([0-9]{2})([0-9]{2})([0-9]{4})(_r([0-9]+))?\.csv$/\1/')
      dd=$(echo "$f" | sed -E 's/.*([0-9]{2})([0-9]{2})([0-9]{4})(_r([0-9]+))?\.csv$/\2/')
      yyyy=$(echo "$f" | sed -E 's/.*([0-9]{2})([0-9]{2})([0-9]{4})(_r([0-9]+))?\.csv$/\3/')
      rev=$(echo "$f" | sed -E 's/.*[0-9]{8}_r([0-9]+)\.csv$/\1/' | grep -E '^[0-9]+$' || echo "0")
      printf "%s%s%s_%03d %s\n" "$yyyy" "$mm" "$dd" "$rev" "$f"
    done | sort -rn | awk '{print $2}'
  )

  count=$(echo "$sorted" | grep -c '.' || true)

  if [ "$count" -le "$MAX_VERSIONS" ]; then
    continue
  fi

  to_archive=$(echo "$sorted" | tail -n +"$((MAX_VERSIONS + 1))")

  echo "=== ${prefix}* ($count files, archiving $((count - MAX_VERSIONS))) ==="
  echo "$sorted" | head -n "$MAX_VERSIONS" | while IFS= read -r f; do
    echo "  KEEP: $f"
  done

  echo "$to_archive" | while IFS= read -r f; do
    [ -z "$f" ] && continue
    if git ls-files --error-unmatch "$DATA_DIR/$f" >/dev/null 2>&1; then
      git mv "$DATA_DIR/$f" "$ARCHIVE_DIR/$f"
    else
      mv "$DATA_DIR/$f" "$ARCHIVE_DIR/$f"
    fi
    echo "  ARCHIVED: $f"
  done
  echo ""
done

echo "Done. Check 'git status' for archived files."
