#!/usr/bin/env python3
"""
Shift CSV/MD date stamps so the most recent version of EACH file type
lands on today's date. Older versions of each type shift by the same
per-type delta, preserving relative gaps within each type.

Usage:
  python3 scripts/shift-csv-dates.py             # dry-run (default, safe — no changes)
  python3 scripts/shift-csv-dates.py --apply     # execute renames

How it works:
  For each file type prefix (library, timeline, pqcquiz, etc.):
    1. Find its most recent date
    2. Compute delta = today - max_date_for_this_prefix
    3. Shift all versions of that type by that delta

  Result: every file type's latest version gets today's date, and its
  older versions are proportionally earlier.

Revision suffixes supported:
  library_02282026r1.csv — date shifts, rN suffix preserved.

Files intentionally excluded:
  - src/data/x509_profiles/         (use _2025 year suffix, not MMDDYYYY)
  - Undated static files            (openssl_docs_map.csv, etc.)
  - Files matching EXCLUDE_PREFIXES (security_audit_report, etc.)
"""

import re
import sys
from collections import defaultdict
from pathlib import Path
from datetime import date, timedelta

# Matches filename ending in _MMDDYYYY[rN].ext  (csv or md)
DATE_RE = re.compile(r'^(.+_)(\d{2})(\d{2})(\d{4})(r\d+)?(\.(csv|md))$')

REPO_ROOT = Path(__file__).resolve().parent.parent

SCAN_DIRS = [
    REPO_ROOT / 'src' / 'data',
    REPO_ROOT / 'src' / 'data' / 'doc-enrichments',
    REPO_ROOT / 'src' / 'data' / 'archive',
]

SKIP_SUBDIRS = {'x509_profiles'}

EXCLUDE_PREFIXES = {
    'security_audit_report',
}


def collect_dated_files():
    results = []
    seen_paths = set()

    for scan_dir in SCAN_DIRS:
        if not scan_dir.exists():
            continue
        for f in scan_dir.iterdir():
            if not f.is_file():
                continue
            if f.parent.name in SKIP_SUBDIRS:
                continue
            m = DATE_RE.match(f.name)
            if not m:
                continue
            prefix, mm, dd, yyyy, revision, suffix, _ = m.groups()

            bare_prefix = prefix.rstrip('_').lower()
            if bare_prefix in EXCLUDE_PREFIXES:
                continue

            try:
                d = date(int(yyyy), int(mm), int(dd))
            except ValueError:
                print(f'  WARNING: invalid date in {f.name}, skipping', file=sys.stderr)
                continue

            if f in seen_paths:
                continue
            seen_paths.add(f)
            results.append({
                'path': f,
                'prefix': prefix,
                'date': d,
                'revision': revision or '',
                'suffix': suffix,
            })

    return results


def format_date(d: date) -> str:
    return f'{d.month:02d}{d.day:02d}{d.year:04d}'


def compute_renames(files: list, today: date) -> list:
    """
    Per-prefix strategy: each file type's latest version gets today's date.
    Returns list of (old_path, new_path, old_date, delta) tuples.
    """
    # Find max date per prefix
    max_by_prefix: dict = {}
    for f in files:
        p = f['prefix']
        if p not in max_by_prefix or f['date'] > max_by_prefix[p]:
            max_by_prefix[p] = f['date']

    renames = []
    for f in files:
        delta = today - max_by_prefix[f['prefix']]
        new_date = f['date'] + delta
        new_name = f['prefix'] + format_date(new_date) + f['revision'] + f['suffix']
        new_path = f['path'].parent / new_name
        if new_path != f['path']:
            renames.append((f['path'], new_path, f['date'], delta))

    return renames


def print_table(renames: list, today: date) -> None:
    if not renames:
        print()
        print('  Nothing to rename — all file types are already current.')
        return

    # Group by directory
    by_dir: dict = defaultdict(list)
    for old, new, _, _ in renames:
        key = str(old.parent.relative_to(REPO_ROOT))
        by_dir[key].append((old, new))

    print()
    total = 0
    for dir_label in sorted(by_dir):
        entries = by_dir[dir_label]
        print(f'  {dir_label}/  ({len(entries)} files)')
        for old, new in sorted(entries, key=lambda x: x[0].name):
            print(f'    {old.name}')
            print(f'      → {new.name}')
        total += len(entries)
        print()

    print(f'  Today          : {today.strftime("%B %d, %Y")}  ({format_date(today)})')
    print(f'  Total          : {total} files to rename.')


def apply_renames(renames: list) -> None:
    """
    Execute renames in safe order to prevent in-directory collisions.
    Groups by (directory, prefix) and sorts within each group: oldest first
    when delta < 0, newest first when delta > 0.
    """
    # Group by (directory, prefix) for safe ordering
    groups: dict = defaultdict(list)
    for entry in renames:
        old, new, old_date, delta = entry
        key = (str(old.parent), old.name.split('_')[0] if '_' in old.name else old.stem)
        groups[key].append(entry)

    for key, entries in groups.items():
        delta = entries[0][3]
        reverse = delta.days > 0  # newest-first for positive delta
        sorted_entries = sorted(entries, key=lambda x: x[2], reverse=reverse)
        for old, new, _, _ in sorted_entries:
            if new.exists():
                print(f'  SKIP (target exists): {old.name} → {new.name}', file=sys.stderr)
                continue
            old.rename(new)
            print(f'  renamed: {old.name} → {new.name}')


def main():
    dry_run = '--apply' not in sys.argv

    print()
    print('shift-csv-dates.py' + ('  [DRY RUN — no changes]' if dry_run else '  [APPLYING RENAMES]'))
    print('=' * 60)

    files = collect_dated_files()
    if not files:
        print('  No dated files found.')
        return

    today = date.today()
    renames = compute_renames(files, today)
    print_table(renames, today)

    if dry_run:
        if renames:
            print()
            print('  Run with --apply to execute these renames.')
        print()
        return

    print()
    apply_renames(renames)
    print()
    print(f'  Done. {len(renames)} files renamed.')
    print('  Remember to restart the dev server so Vite re-resolves import.meta.glob.')
    print()


if __name__ == '__main__':
    main()
