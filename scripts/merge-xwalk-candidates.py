#!/usr/bin/env python3
"""
scripts/merge-xwalk-candidates.py

Merges reviewed concept_xwalk_candidates_*.csv rows into the production
concept_xwalks_*.csv after normalizing IDs, filtering low-quality rows,
and deduplicating against existing edges.

Usage
-----
  # Dry-run — see what would be merged and what would be dropped
  python3 scripts/merge-xwalk-candidates.py --dry-run

  # Auto-accept all rows that pass quality checks (no manual review_status required)
  python3 scripts/merge-xwalk-candidates.py --auto-accept --dry-run

  # Write for real
  python3 scripts/merge-xwalk-candidates.py --auto-accept

  # Only merge manually-accepted rows (review_status=accepted in candidates CSV)
  python3 scripts/merge-xwalk-candidates.py

Options
-------
  --candidates PATH     Candidates CSV (default: latest concept_xwalk_candidates_*.csv)
  --production PATH     Production xwalk CSV (default: latest concept_xwalks_*.csv)
  --output PATH         Output path (default: src/data/concept_xwalks_MMDDYYYY.csv)
  --library PATH        Library CSV for ID resolution (default: latest library_*.csv)
  --dry-run             Print report only; write nothing
  --auto-accept         Accept all rows passing quality checks (ignores review_status)
  --min-evidence N      Minimum evidence length in chars (default: 30)
  --min-confidence LVL  Minimum confidence: high|medium|low (default: low = all)
  --include-unresolved  Keep edges with unresolved to_concept (marked unresolved in report)
  --no-color            Suppress ANSI colour codes
"""

import argparse
import csv
import glob
import os
import re
import sys
from collections import Counter, defaultdict
from datetime import datetime, timezone

# ── ANSI colours ─────────────────────────────────────────────────────────────

_USE_COLOR = True

def _c(code: str, text: str) -> str:
    return f"\033[{code}m{text}\033[0m" if _USE_COLOR else text

def green(t):  return _c("32", t)
def yellow(t): return _c("33", t)
def red(t):    return _c("31", t)
def bold(t):   return _c("1",  t)
def dim(t):    return _c("2",  t)

# ── File discovery ────────────────────────────────────────────────────────────

def latest_glob(pattern: str) -> str | None:
    hits = sorted(glob.glob(pattern))
    return hits[-1] if hits else None

# ── ID normalization ──────────────────────────────────────────────────────────

def build_normalizer(lib_ids: set[str]):
    """
    Returns a function (raw_id) -> resolved_id | None.

    Resolution order:
      1. Exact match
      2. Strip 'IETF ' prefix → try 'RFC XXXX'
      3. Try 'RFC-XXXX' (hyphen) variant
      4. 'IETF RFC XXXX' → 'IETF-RFC-XXXX' (some entries use hyphens throughout)
      5. 'NIST SP 800-XXX' → 'NIST-SP-800-XXX'
      6. Reverse: 'RFC XXXX' → 'RFC-XXXX' (hyphen variant in library)
      7. Reverse: 'RFC-XXXX' → 'RFC XXXX'
      8. 'FIPS XXX' → try 'FIPS-XXX' hyphen variant
    """
    def resolve(raw: str) -> str | None:
        raw = raw.strip()
        if not raw:
            return None
        # 1. Exact
        if raw in lib_ids:
            return raw
        # 2. IETF RFC XXXX → RFC XXXX
        m = re.match(r'^IETF (RFC \d+\S*)$', raw)
        if m and m.group(1) in lib_ids:
            return m.group(1)
        # 3. IETF RFC XXXX → RFC-XXXX
        m = re.match(r'^IETF RFC (\d+\S*)$', raw)
        if m:
            hyph = f"RFC-{m.group(1)}"
            if hyph in lib_ids:
                return hyph
        # 4. IETF RFC XXXX → IETF-RFC-XXXX
        m = re.match(r'^IETF RFC (\d+\S*)$', raw)
        if m:
            hyph = f"IETF-RFC-{m.group(1)}"
            if hyph in lib_ids:
                return hyph
        # 5. NIST SP 800-XXX → NIST-SP-800-XXX
        m = re.match(r'^NIST SP (800-\S+)$', raw)
        if m:
            dashed = f"NIST-SP-{m.group(1)}"
            if dashed in lib_ids:
                return dashed
        # 6. RFC XXXX → RFC-XXXX
        m = re.match(r'^RFC (\d+\S*)$', raw)
        if m:
            hyph = f"RFC-{m.group(1)}"
            if hyph in lib_ids:
                return hyph
        # 7. RFC-XXXX → RFC XXXX
        m = re.match(r'^RFC-(\d+\S*)$', raw)
        if m:
            space = f"RFC {m.group(1)}"
            if space in lib_ids:
                return space
        # 8. FIPS XXX → FIPS-XXX
        m = re.match(r'^FIPS (\d+\S*)$', raw)
        if m:
            hyph = f"FIPS-{m.group(1)}"
            if hyph in lib_ids:
                return hyph
        return None

    return resolve

# ── Quality filters ───────────────────────────────────────────────────────────

CONFIDENCE_RANK = {'high': 3, 'medium': 2, 'low': 1}

def confidence_passes(row_conf: str, min_conf: str) -> bool:
    return CONFIDENCE_RANK.get(row_conf, 0) >= CONFIDENCE_RANK.get(min_conf, 1)

# ── xwalk ID assignment ───────────────────────────────────────────────────────

def next_xwalk_id(existing_ids: list[str]) -> callable:
    nums = []
    for xid in existing_ids:
        m = re.match(r'^xw-(\d+)$', xid)
        if m:
            nums.append(int(m.group(1)))
    counter = max(nums, default=0)

    def _next():
        nonlocal counter
        counter += 1
        return f"xw-{counter:03d}"

    return _next

# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    global _USE_COLOR

    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('--candidates',         default=None)
    parser.add_argument('--production',         default=None)
    parser.add_argument('--output',             default=None)
    parser.add_argument('--library',            default=None)
    parser.add_argument('--dry-run',            action='store_true')
    parser.add_argument('--auto-accept',        action='store_true')
    parser.add_argument('--min-evidence',       type=int, default=30)
    parser.add_argument('--min-confidence',     default='low', choices=['high','medium','low'])
    parser.add_argument('--include-unresolved', action='store_true')
    parser.add_argument('--no-color',           action='store_true')
    args = parser.parse_args()

    if args.no_color:
        _USE_COLOR = False

    today = datetime.now(timezone.utc).strftime('%m%d%Y')

    # ── Resolve file paths ────────────────────────────────────────────────────
    candidates_path = args.candidates or latest_glob('src/data/concept_xwalk_candidates_*.csv')
    production_path = args.production or latest_glob('src/data/concept_xwalks_*.csv')
    library_path    = args.library    or latest_glob('src/data/library_*.csv')

    if args.output:
        output_path = args.output
    else:
        # Never overwrite the production file — add _r2, _r3, … if today's file already exists
        base = f'src/data/concept_xwalks_{today}.csv'
        if not os.path.exists(base) or (production_path and os.path.abspath(base) != os.path.abspath(production_path)):
            output_path = base
        else:
            rev = 2
            while os.path.exists(f'src/data/concept_xwalks_{today}_r{rev}.csv'):
                rev += 1
            output_path = f'src/data/concept_xwalks_{today}_r{rev}.csv'

    for label, path in [('candidates', candidates_path), ('production', production_path), ('library', library_path)]:
        if not path or not os.path.exists(path):
            print(red(f"ERROR: {label} file not found: {path}"))
            sys.exit(1)

    print(bold(f"\n{'='*70}"))
    print(bold("  merge-xwalk-candidates.py"))
    print(bold(f"{'='*70}"))
    print(f"  candidates : {candidates_path}")
    print(f"  production : {production_path}")
    print(f"  library    : {library_path}")
    print(f"  output     : {output_path}")
    print(f"  mode       : {'auto-accept' if args.auto_accept else 'review_status=accepted only'}")
    print(f"  dry-run    : {args.dry_run}")
    print()

    # ── Load data ─────────────────────────────────────────────────────────────
    with open(candidates_path) as f:
        candidates = list(csv.DictReader(f))
    with open(production_path) as f:
        production = list(csv.DictReader(f))
    with open(library_path) as f:
        library = list(csv.DictReader(f))

    lib_ids = {r['reference_id'] for r in library}
    resolve = build_normalizer(lib_ids)

    # Existing production pairs (both directions for dedup)
    prod_pairs: set[tuple[str,str]] = set()
    for r in production:
        prod_pairs.add((r['from_concept'], r['to_concept']))
        prod_pairs.add((r['to_concept'], r['from_concept']))

    next_id = next_xwalk_id([r['xwalk_id'] for r in production])

    # ── Process candidates ────────────────────────────────────────────────────
    accepted: list[dict] = []
    rejected: list[tuple[dict, str]] = []      # (row, reason)
    needs_stub: Counter = Counter()             # to_concept → count of edges needing it

    for row in candidates:
        rel  = row['relationship_type'].strip()
        ev   = row['evidence'].strip()
        conf = row['confidence'].strip().lower()
        src  = row['from_concept'].strip()
        tgt  = row['to_concept'].strip()
        status = row.get('review_status', '').strip()

        # Gate 0 — review status (unless --auto-accept)
        if not args.auto_accept and status != 'accepted':
            rejected.append((row, f"review_status={status or 'candidate'} (use --auto-accept to bypass)"))
            continue

        # Gate 1 — not_related edges are never promoted
        if rel == 'not_related':
            rejected.append((row, "not_related edges excluded by policy"))
            continue

        # Gate 2 — evidence length
        if len(ev) < args.min_evidence:
            rejected.append((row, f"evidence too short ({len(ev)} < {args.min_evidence} chars)"))
            continue

        # Gate 3 — confidence floor
        if not confidence_passes(conf, args.min_confidence):
            rejected.append((row, f"confidence {conf!r} below floor {args.min_confidence!r}"))
            continue

        # Gate 4 — resolve to_concept against library
        resolved_tgt = resolve(tgt)
        if resolved_tgt is None:
            needs_stub[tgt] += 1
            if args.include_unresolved:
                resolved_tgt = tgt  # keep raw; CM-4 will catch it
            else:
                rejected.append((row, f"to_concept {tgt!r} not in library — needs stub"))
                continue

        # Gate 5 — deduplicate against production
        if (src, resolved_tgt) in prod_pairs or (resolved_tgt, src) in prod_pairs:
            rejected.append((row, f"duplicate — ({src}, {resolved_tgt}) already in production"))
            continue

        # Accepted — build output row
        verified_date = row.get('reviewed_date', '').strip() or datetime.now(timezone.utc).strftime('%Y-%m-%d')
        verified_by   = row.get('reviewed_by',   '').strip() or 'qwen3.6:27b'

        accepted.append({
            'xwalk_id':         next_id(),
            'from_concept':     src,
            'to_concept':       resolved_tgt,
            'relationship_type': rel,
            'rationale_type':   row.get('rationale_type', 'technical_dependency').strip(),
            'evidence':         ev,
            'verified_date':    verified_date,
            'verified_by':      verified_by,
            'confidence':       conf,
        })
        # Mark pair as seen so later duplicates within candidates are also caught
        prod_pairs.add((src, resolved_tgt))
        prod_pairs.add((resolved_tgt, src))

    # ── Print report ──────────────────────────────────────────────────────────
    total   = len(candidates)
    n_acc   = len(accepted)
    n_rej   = len(rejected)

    print(bold("SUMMARY"))
    print(f"  Candidates read   : {total}")
    print(f"  {green('Accepted')}          : {n_acc}")
    print(f"  {red('Rejected')}          : {n_rej}")
    print(f"  Production edges  : {len(production)} → {len(production) + n_acc} after merge")
    print()

    if accepted:
        print(bold("ACCEPTED EDGES"))
        rel_counts = Counter(r['relationship_type'] for r in accepted)
        conf_counts = Counter(r['confidence'] for r in accepted)
        print(f"  Relationship types : {dict(rel_counts)}")
        print(f"  Confidence         : {dict(conf_counts)}")
        print()
        for r in accepted:
            norm_marker = ''
            orig_tgt = next((c['to_concept'] for c in candidates
                             if c['from_concept'] == r['from_concept']
                             and resolve(c['to_concept']) == r['to_concept']), None)
            if orig_tgt and orig_tgt != r['to_concept']:
                norm_marker = dim(f" [normalized from {orig_tgt!r}]")
            print(f"  {green(r['xwalk_id'])}  {r['from_concept'][:38]:38s}  "
                  f"──{r['relationship_type']}──▶  {r['to_concept'][:30]:30s}  "
                  f"[{r['confidence']}]{norm_marker}")

    print()
    if n_rej:
        rej_reasons = Counter(reason for _, reason in rejected)
        print(bold("REJECTION BREAKDOWN"))
        for reason, count in rej_reasons.most_common():
            print(f"  {count:3d}  {yellow(reason)}")
        print()

    if needs_stub:
        print(bold(f"NEEDS LIBRARY STUB ({len(needs_stub)} unique to_concepts, {sum(needs_stub.values())} edges blocked)"))
        print(dim("  These to_concept IDs are not in the library CSV."))
        print(dim("  Add stub records to unlock the blocked edges, then re-run this script."))
        print()
        for tgt, cnt in needs_stub.most_common(30):
            print(f"  {cnt:2d} edges  {yellow(tgt)}")
        if len(needs_stub) > 30:
            print(dim(f"  ... and {len(needs_stub)-30} more"))
        print()

    # ── Write output ──────────────────────────────────────────────────────────
    if args.dry_run:
        print(dim(f"[dry-run] would write {n_acc} new edges to {output_path}"))
        print(dim(f"[dry-run] total production edges after merge: {len(production) + n_acc}"))
        return

    if n_acc == 0:
        print(yellow("Nothing to merge. Exiting without writing."))
        return

    all_rows = production + accepted
    fieldnames = ['xwalk_id','from_concept','to_concept','relationship_type',
                  'rationale_type','evidence','verified_date','verified_by','confidence']

    with open(output_path, 'w', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction='ignore')
        writer.writeheader()
        writer.writerows(all_rows)

    print(green(f"✓ Wrote {len(all_rows)} edges ({n_acc} new) to {output_path}"))
    print()
    print(dim("Next steps:"))
    print(dim("  1. Run the validator: npx tsx scripts/validate-data-integrity.ts"))
    print(dim("  2. Check 0 errors, then: npm run build"))
    print(dim("  3. Commit: git add src/data/concept_xwalks_*.csv && git commit"))
    print(dim("  4. Archive old production CSV to src/data/archive/"))


if __name__ == '__main__':
    main()
