#!/usr/bin/env bash
# Lint check: fail if any CSV prefix in src/data/ has more than 2 files.
# This prevents bundle bloat from un-archived CSV versions.
# Usage: npm run check:csv-count
# Compatible with macOS bash 3.2 (no associative arrays).

set -euo pipefail

DATA_DIR="src/data"
MAX_VERSIONS=2
EXIT_CODE=0

# Extract unique prefixes (everything before MMDDYYYY date stamp)
prefixes=$(
  for csv in "$DATA_DIR"/*.csv; do
    [ -f "$csv" ] || continue
    basename "$csv" | sed -E 's/[0-9]{8}(_r[0-9]+)?\.csv$//'
  done | sort -u
)

for prefix in $prefixes; do
  # Count files matching this prefix
  count=0
  files=""
  for csv in "$DATA_DIR"/${prefix}*.csv; do
    [ -f "$csv" ] || continue
    count=$((count + 1))
    files="$files  $(basename "$csv")"$'\n'
  done

  if [ "$count" -gt "$MAX_VERSIONS" ]; then
    echo "ERROR: '${prefix}*' has $count CSV files (max $MAX_VERSIONS):"
    echo "$files"
    echo "  Run 'npm run archive:csv' to move old versions to src/data/archive/"
    echo ""
    EXIT_CODE=1
  fi
done

if [ "$EXIT_CODE" -eq 0 ]; then
  echo "OK: All CSV prefixes have <= $MAX_VERSIONS files in $DATA_DIR/"
fi

exit $EXIT_CODE
