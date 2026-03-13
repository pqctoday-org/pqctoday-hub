#!/usr/bin/env python3
"""Filter leaders CSV: keep Public + Academic + 13 named Private exceptions.

One-time utility script. Creates:
  - src/data/leaders_03132026.csv (filtered, 68 leaders)
  - leadersbackup03122026.md (archive of 113 deleted leaders)
"""
import csv
import os
import sys
from datetime import datetime

SRC = os.path.join('src', 'data', 'leaders_03122026_r1.csv')
DST = os.path.join('src', 'data', 'leaders_03132026.csv')
BACKUP = 'leadersbackup03122026.md'

KEEP_PRIVATE = {
    'Todd Moore',
    'Jaime Gomez Garcia',
    'Blair Canavan',
    'Éric Brier',
    'Paul van Brouwershaven',
    'Sven Rajala',
    'Chris Bailey',
    'Tomas Gustavsson',
    'David Hook',
    'Corey Bonnell',
    'John Gray',
    'Sudha E. Iyer',
    'Tadahiko Ito',
}


def should_keep(row):
    """Return True if this leader row should be kept."""
    name = row[0]   # Name column
    typ = row[4]    # Type column
    if typ in ('Public', 'Academic'):
        return True
    if name in KEEP_PRIVATE:
        return True
    return False


def main():
    if not os.path.exists(SRC):
        print(f'ERROR: Source file not found: {SRC}', file=sys.stderr)
        sys.exit(1)

    # Read source CSV
    with open(SRC, newline='', encoding='utf-8') as f:
        reader = csv.reader(f)
        header = next(reader)
        all_rows = list(reader)

    # Filter out empty trailing rows
    all_rows = [r for r in all_rows if any(cell.strip() for cell in r)]

    kept = [r for r in all_rows if should_keep(r)]
    deleted = [r for r in all_rows if not should_keep(r)]

    print(f'Source: {len(all_rows)} leaders')
    print(f'Kept: {len(kept)} (Public + Academic + {len(KEEP_PRIVATE)} Private exceptions)')
    print(f'Deleted: {len(deleted)}')

    # Verify all 13 Private exceptions were found
    kept_names = {r[0] for r in kept}
    missing = KEEP_PRIVATE - kept_names
    if missing:
        print(f'WARNING: These Private exceptions were NOT found in CSV: {missing}', file=sys.stderr)

    # Write filtered CSV
    with open(DST, 'w', encoding='utf-8', newline='') as f:
        writer = csv.writer(f, lineterminator='\n')
        writer.writerow(header)
        for row in kept:
            writer.writerow(row)

    print(f'Wrote {len(kept)} leaders to {DST}')

    # Write markdown backup of deleted leaders
    with open(BACKUP, 'w', encoding='utf-8') as f:
        f.write(f'# Leaders Backup — {datetime.now().strftime("%Y-%m-%d")}\n\n')
        f.write(f'Removed {len(deleted)} Private-type leaders from leaders_03122026_r1.csv.\n\n')
        f.write('These leaders were removed to avoid using private industry names without consent.\n')
        f.write('Only Public (government), Academic, and 13 explicitly approved Private leaders were retained.\n\n')
        f.write('---\n\n')

        for row in deleted:
            # CSV columns: Name, Country, Role, Organization, Type, Category, Contribution, ImageUrl, WebsiteUrl, LinkedinUrl, KeyResourceUrl
            name = row[0] if len(row) > 0 else ''
            country = row[1] if len(row) > 1 else ''
            role = row[2] if len(row) > 2 else ''
            org = row[3] if len(row) > 3 else ''
            typ = row[4] if len(row) > 4 else ''
            cat = row[5] if len(row) > 5 else ''
            contrib = row[6] if len(row) > 6 else ''
            img = row[7] if len(row) > 7 else ''
            web = row[8] if len(row) > 8 else ''
            lin = row[9] if len(row) > 9 else ''
            kru = row[10] if len(row) > 10 else ''

            f.write(f'## {name}\n\n')
            f.write(f'- **Country**: {country}\n')
            f.write(f'- **Role**: {role}\n')
            f.write(f'- **Organization**: {org}\n')
            f.write(f'- **Type**: {typ}\n')
            f.write(f'- **Category**: {cat}\n')
            f.write(f'- **Contribution**: {contrib}\n')
            if web:
                f.write(f'- **Website**: {web}\n')
            if lin:
                f.write(f'- **LinkedIn**: {lin}\n')
            if kru:
                f.write(f'- **KeyResourceUrl**: {kru}\n')
            f.write('\n---\n\n')

    print(f'Wrote backup of {len(deleted)} deleted leaders to {BACKUP}')

    # Summary by type
    from collections import Counter
    type_counts = Counter(r[4] for r in kept)
    print(f'\nKept type distribution: {dict(type_counts)}')
    del_type_counts = Counter(r[4] for r in deleted)
    print(f'Deleted type distribution: {dict(del_type_counts)}')


if __name__ == '__main__':
    main()
