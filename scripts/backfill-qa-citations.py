#!/usr/bin/env python3
"""
Backfill structured FK cross-references in Module Q&A CSV.

Scans answer text + source_citations for references to:
- Library reference_ids (FIPS 203, RFC 9180, etc.)
- Algorithm names (ML-KEM, ML-DSA, SLH-DSA, etc.)
- Compliance framework names (NIST, ANSSI, ETSI, etc.)
- Migrate product names
- Threat IDs
- Timeline event references

Only populates empty FK fields — never overwrites existing values.

Usage:
    python3 scripts/backfill-qa-citations.py [--dry-run] [--verbose]
"""

import csv
import re
import sys
import os
from collections import defaultdict

DRY_RUN = '--dry-run' in sys.argv
VERBOSE = '--verbose' in sys.argv

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
QA_FILE = os.path.join(BASE, 'src/data/module-qa/module_qa_combined_03272026.csv')


def load_library_refs():
    """Load library reference_ids and build matching patterns."""
    refs = {}
    import glob
    files = sorted(glob.glob(os.path.join(BASE, 'src/data/library_*2026*.csv')))
    if not files:
        return refs
    latest = files[-1]
    with open(latest) as f:
        r = csv.DictReader(f)
        for row in r:
            rid = row.get('reference_id', '').strip()
            if rid:
                refs[rid] = rid
    return refs


def load_algorithms():
    """Load algorithm names from the algorithm reference CSV."""
    algos = set()
    import glob
    files = sorted(glob.glob(os.path.join(BASE, 'src/data/pqc_complete_algorithm_reference_*2026*.csv')))
    if not files:
        return algos
    latest = files[-1]
    with open(latest) as f:
        r = csv.DictReader(f)
        for row in r:
            name = row.get('Algorithm', '').strip()
            if name:
                algos.add(name)
            fam = row.get('Algorithm Family', '').strip()
            if fam:
                algos.add(fam)
    return algos


def load_compliance_names():
    """Load compliance framework names/IDs."""
    names = set()
    import glob
    files = sorted(glob.glob(os.path.join(BASE, 'src/data/compliance_*2026*.csv')))
    if not files:
        return names
    latest = files[-1]
    with open(latest) as f:
        r = csv.DictReader(f)
        for row in r:
            name = row.get('name', '').strip()
            if name:
                names.add(name)
    return names


def load_threats():
    """Load threat IDs."""
    threats = set()
    import glob
    files = sorted(glob.glob(os.path.join(BASE, 'src/data/quantum_threats_*2026*.csv')))
    if not files:
        return threats
    latest = files[-1]
    with open(latest) as f:
        r = csv.DictReader(f)
        for row in r:
            tid = row.get('threat_id', row.get('threatId', '')).strip()
            if tid:
                threats.add(tid)
    return threats


def build_library_patterns(lib_refs):
    """Build regex patterns for matching library reference IDs in text.

    Returns list of (pattern, reference_id) tuples, longest first.
    """
    patterns = []
    for rid in lib_refs:
        # Escape for regex, allow flexible whitespace
        escaped = re.escape(rid)
        # Allow optional whitespace between components like "FIPS 203" matching "FIPS 203"
        # Also match with hyphens: "FIPS-203"
        flexible = escaped.replace(r'\ ', r'[\s\-]+')
        patterns.append((re.compile(r'\b' + flexible + r'\b', re.IGNORECASE), rid))
    # Sort longest first to avoid partial matches
    patterns.sort(key=lambda x: -len(x[1]))
    return patterns


def build_algorithm_patterns(algos):
    """Build regex patterns for matching algorithm names in text.

    Returns list of (pattern, algo_name) tuples.
    """
    patterns = []
    # Also add common short forms and aliases
    short_forms = {
        'ML-KEM': 'KEM',
        'ML-DSA': 'ML-DSA',
        'SLH-DSA': 'SLH-DSA',
        'FN-DSA': 'FN-DSA',
        'XMSS': 'XMSS',
        'LMS': 'LMS',
        'FrodoKEM': 'FrodoKEM',
        'HQC': 'HQC',
        'Classic McEliece': 'Classic-McEliece',
        'Kyber': 'KEM',
        'Dilithium': 'ML-DSA',
        'SPHINCS+': 'SLH-DSA',
        'Falcon': 'FN-DSA',
    }

    for algo in algos:
        escaped = re.escape(algo)
        patterns.append((re.compile(r'\b' + escaped + r'\b', re.IGNORECASE), algo))

    # Add short forms
    for short, canonical in short_forms.items():
        escaped = re.escape(short)
        patterns.append((re.compile(r'\b' + escaped + r'\b', re.IGNORECASE), canonical))

    # Sort longest first
    patterns.sort(key=lambda x: -len(x[1]))
    return patterns


def find_matches(text, patterns):
    """Find all matching references in text. Returns deduplicated set."""
    found = set()
    for pattern, ref_id in patterns:
        if pattern.search(text):
            found.add(ref_id)
    return found


def backfill_row(row, lib_patterns, algo_patterns, compliance_names):
    """Backfill empty FK fields for a single Q&A row. Returns dict of changes."""
    changes = {}

    # Combine answer + source_citations for matching
    text = (row.get('answer', '') + ' ' + row.get('source_citations', '') + ' ' +
            row.get('question', '') + ' ' + row.get('consistency_assertions', ''))

    # Library refs
    if not row.get('library_refs', '').strip():
        lib_matches = find_matches(text, lib_patterns)
        if lib_matches:
            changes['library_refs'] = ';'.join(sorted(lib_matches))

    # Algorithm refs
    if not row.get('algorithm_refs', '').strip():
        algo_matches = find_matches(text, algo_patterns)
        # Filter out overly generic matches
        algo_matches.discard('Signature')
        algo_matches.discard('Classical KEM')
        algo_matches.discard('Classical Sig')
        algo_matches.discard('Hybrid KEM')
        if algo_matches:
            changes['algorithm_refs'] = ';'.join(sorted(algo_matches))

    # Compliance refs
    if not row.get('compliance_refs', '').strip():
        comp_matches = set()
        # Match known compliance framework names
        comp_keywords = {
            'NIST': 'NIST',
            'ANSSI': 'ANSSI',
            'BSI': 'BSI',
            'ETSI': 'ETSI',
            'CNSA 2.0': 'CNSA 2.0',
            'CNSA': 'CNSA',
            'Common Criteria': 'Common Criteria',
            'FIPS 140': 'FIPS 140',
            'SOC 2': 'SOC 2',
            'ISO 27001': 'ISO 27001',
            'PCI DSS': 'PCI DSS',
            'PCI-DSS': 'PCI DSS',
            'HIPAA': 'HIPAA',
            'FedRAMP': 'FedRAMP',
            'GDPR': 'GDPR',
            'eIDAS': 'eIDAS',
            'CCCS': 'CCCS',
            'NCSC': 'NCSC',
            'CISA': 'CISA',
            'NSA': 'NSA',
            'EAL': 'Common Criteria',
        }
        text_lower = text.lower()
        for keyword, ref in comp_keywords.items():
            if keyword.lower() in text_lower:
                comp_matches.add(ref)
        if comp_matches:
            changes['compliance_refs'] = ';'.join(sorted(comp_matches))

    return changes


def main():
    print(f'Loading reference data...')
    lib_refs = load_library_refs()
    print(f'  Library refs: {len(lib_refs)}')

    algos = load_algorithms()
    print(f'  Algorithms: {len(algos)}')

    compliance_names = load_compliance_names()
    print(f'  Compliance: {len(compliance_names)}')

    # Build patterns
    lib_patterns = build_library_patterns(lib_refs)
    algo_patterns = build_algorithm_patterns(algos)

    print(f'\nReading Q&A file: {QA_FILE}')

    rows = []
    with open(QA_FILE) as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        for row in reader:
            rows.append(row)

    print(f'  Total rows: {len(rows)}')

    # Count before
    ref_cols = ['library_refs', 'threat_refs', 'timeline_refs', 'leader_refs',
                'algorithm_refs', 'migrate_refs', 'compliance_refs']
    before_struct = sum(1 for row in rows if any(row.get(c, '').strip() for c in ref_cols))

    # Backfill
    stats = defaultdict(int)
    total_changes = 0
    changed_rows = 0
    newly_cited = 0  # rows that had zero refs and now gain at least one

    for row in rows:
        had_struct = any(row.get(c, '').strip() for c in ref_cols)
        changes = backfill_row(row, lib_patterns, algo_patterns, compliance_names)
        if changes:
            changed_rows += 1
            if not had_struct:
                newly_cited += 1
            for col, val in changes.items():
                stats[col] += 1
                total_changes += 1
                row[col] = val  # always apply to count after correctly
                if VERBOSE:
                    print(f'  {row["question_id"]}: {col} = {val[:80]}')

    # Count after
    after_struct = sum(1 for row in rows if any(row.get(c, '').strip() for c in ref_cols))

    print(f'\n=== Results ===')
    print(f'Rows with structured refs BEFORE: {before_struct}/{len(rows)} ({100*before_struct//len(rows)}%)')
    print(f'Rows with structured refs AFTER:  {after_struct}/{len(rows)} ({100*after_struct//len(rows)}%)')
    print(f'Newly cited (was 0 refs):         {newly_cited}')
    print(f'Rows changed (total):             {changed_rows}')
    print(f'Total field updates:              {total_changes}')
    print(f'Still uncited:                    {len(rows) - after_struct}')
    print(f'\nBreakdown by field:')
    for col, count in sorted(stats.items(), key=lambda x: -x[1]):
        print(f'  {col}: +{count}')

    if DRY_RUN:
        print(f'\n[DRY RUN] No file written. Re-run without --dry-run to write.')
    else:
        # Write output
        output_file = QA_FILE.replace('03272026', '03282026')
        with open(output_file, 'w', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(rows)
        print(f'\nWritten to: {output_file}')


if __name__ == '__main__':
    main()
