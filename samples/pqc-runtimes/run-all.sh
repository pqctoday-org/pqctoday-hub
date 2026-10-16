#!/usr/bin/env bash
# SPDX-License-Identifier: AGPL-3.0-only
#
# Run one, several or all post-quantum runtime samples and check their output
# against expected.json (every SIZE line must match; the last line must be
# "OK <id>", or "SKIP <id> ..." for a .NET sample on a platform without PQC).
#
#   ./run-all.sh                    # every sample
#   ./run-all.sh go-mlkem go-mldsa  # just these
#   ./run-all.sh --list             # print the sample ids
#
# Needs jq, plus the toolchain(s) of the samples you run. PYTHON overrides the
# Python interpreter (default python3).
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
EXPECTED="$HERE/expected.json"
PYTHON="${PYTHON:-python3}"

all_ids() { jq -r '.samples | keys_unsorted[]' "$EXPECTED"; }

run_sample() {
  local id="$1"
  case "$id" in
    go-*) (cd "$HERE/$id" && go run .) ;;
    python-*) "$PYTHON" "$HERE/$id/main.py" ;;
    dotnet-*) dotnet run --project "$HERE/$id/$id.csproj" -c Release ;;
    java-mlkem) java "$HERE/$id/MlKemSample.java" ;;
    java-mldsa) java "$HERE/$id/MlDsaSample.java" ;;
    *)
      echo "unknown sample id: $id" >&2
      return 2
      ;;
  esac
}

check_sample() {
  local id="$1" output name want got
  if ! jq -e --arg id "$id" '.samples[$id]' "$EXPECTED" >/dev/null; then
    echo "FAIL $id: not listed in expected.json" >&2
    return 1
  fi
  echo "== $id"
  # Strip CR so Windows console output compares cleanly.
  if ! output="$(run_sample "$id" | tr -d '\r')"; then
    echo "$output"
    echo "FAIL $id: program exited non-zero" >&2
    return 1
  fi
  echo "$output"

  if grep -qx "SKIP $id platform-unsupported" <<<"$output"; then
    echo "-- $id skipped: platform has no support for this algorithm"
    if [[ -n "${GITHUB_ACTIONS:-}" ]]; then
      echo "::warning title=$id skipped::The runner's crypto provider does not support this algorithm"
    fi
    return 0
  fi

  while IFS=$'\t' read -r name want; do
    got="$(awk -v n="$name" '$1 == "SIZE" && $2 == n { print $3 }' <<<"$output")"
    if [[ "$got" != "$want" ]]; then
      echo "FAIL $id: SIZE $name expected $want, got '${got:-missing}'" >&2
      return 1
    fi
  done < <(jq -r --arg id "$id" '.samples[$id].sizes | to_entries[] | "\(.key)\t\(.value)"' "$EXPECTED")

  if [[ "$(tail -n 1 <<<"$output")" != "OK $id" ]]; then
    echo "FAIL $id: last line is not 'OK $id'" >&2
    return 1
  fi
}

if [[ "${1:-}" == "--list" ]]; then
  all_ids
  exit 0
fi

if [[ $# -gt 0 ]]; then
  ids=("$@")
else
  ids=()
  while IFS= read -r id; do ids+=("$id"); done < <(all_ids | tr -d '\r')
fi

failed=0
for id in "${ids[@]}"; do
  check_sample "$id" || failed=1
done
exit "$failed"
