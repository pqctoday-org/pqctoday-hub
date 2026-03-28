#!/usr/bin/env python3
"""
scripts/generate-fact-allowlists.py

Auto-generates fact_allowlists.json from the algorithm reference CSV and
library CSV. Used by:
  - generate-module-qa-ollama.py (post-generation fact validation)
  - validators/content-accuracy-checks.ts (build-time accuracy checks)

Usage:
  python3 scripts/generate-fact-allowlists.py          # writes scripts/fact_allowlists.json
  python3 scripts/generate-fact-allowlists.py --print   # print to stdout instead
"""

import argparse
import csv
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / 'src' / 'data'


def find_latest_csv(prefix: str) -> Path | None:
    files = [f for f in DATA_DIR.glob(f'{prefix}*.csv') if 'archive' not in str(f)]
    if not files:
        return None

    def date_key(f: Path) -> tuple[int, int]:
        m = re.search(r'(\d{2})(\d{2})(\d{4})(_r(\d+))?\.csv$', f.name)
        if not m:
            return (0, 0)
        mm, dd, yyyy = m.group(1), m.group(2), m.group(3)
        rev = int(m.group(5)) if m.group(5) else 0
        return (int(yyyy + mm + dd), rev)

    return max(files, key=date_key)


def load_csv_rows(csv_path: Path) -> list[dict]:
    rows = []
    with open(csv_path, newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            rows.append(row)
    return rows


def build_allowlists() -> dict:
    # ── Load algorithm reference CSV ──────────────────────────────────────
    algo_csv = find_latest_csv('pqc_complete_algorithm_reference_')
    if not algo_csv:
        print('ERROR: No algorithm reference CSV found', file=sys.stderr)
        sys.exit(1)

    algo_rows = load_csv_rows(algo_csv)

    # ── FIPS-to-algorithm mappings ────────────────────────────────────────
    # Only include finalized FIPS standards (not drafts or N/A)
    fips_to_algorithm: dict[str, list[str]] = {}
    algorithm_to_fips: dict[str, str] = {}
    fips_pattern = re.compile(r'FIPS\s+(\d+)')

    # Classical algorithm families are NOT PQC — exclude from FIPS-to-PQC-algorithm map
    classical_families = {'Classical KEM', 'Classical Sig'}

    for row in algo_rows:
        fips_val = row.get('FIPS Standard', '').strip()
        algo_name = row.get('Algorithm', '').strip()
        family = row.get('Algorithm Family', '').strip()

        if not fips_val or fips_val == 'N/A' or 'Draft' in fips_val:
            continue
        if family in classical_families:
            continue  # Don't include classical FIPS (186, etc.) in PQC mappings

        m = fips_pattern.search(fips_val)
        if not m:
            continue

        fips_num = m.group(1)

        # Extract the base algorithm family name (e.g., ML-KEM from ML-KEM-512)
        base_name = re.sub(r'[-\s]+\d+[sf]?$', '', algo_name)  # ML-KEM-512 → ML-KEM
        base_name = re.sub(r'[-\s]+P-\d+$', '', base_name)  # ECDSA P-256 → ECDSA
        # Also handle SLH-DSA variants: SLH-DSA-SHA2-128s → SLH-DSA
        if base_name.startswith('SLH-DSA-'):
            base_name = 'SLH-DSA'

        if fips_num not in fips_to_algorithm:
            fips_to_algorithm[fips_num] = []
        if base_name not in fips_to_algorithm[fips_num]:
            fips_to_algorithm[fips_num].append(base_name)

        if base_name not in algorithm_to_fips:
            algorithm_to_fips[base_name] = fips_num

    # Flatten to primary algorithm name per FIPS
    fips_primary: dict[str, str] = {}
    for fips_num, algos in fips_to_algorithm.items():
        fips_primary[fips_num] = algos[0]  # first match is the canonical name

    # ── Canonical algorithm names ─────────────────────────────────────────
    canonical_names: set[str] = set()
    for row in algo_rows:
        algo_name = row.get('Algorithm', '').strip()
        if algo_name:
            canonical_names.add(algo_name)
            # Also add base name
            base = re.sub(r'-\d+[sf]?$', '', algo_name)
            if base.startswith('SLH-DSA-'):
                canonical_names.add('SLH-DSA')
            else:
                canonical_names.add(base)

    # ── Security level map ────────────────────────────────────────────────
    security_level_map: dict[str, int | str] = {}
    for row in algo_rows:
        algo_name = row.get('Algorithm', '').strip()
        level = row.get('NIST Security Level', '').strip()
        if algo_name and level and level != 'N/A':
            try:
                security_level_map[algo_name] = int(level)
            except ValueError:
                security_level_map[algo_name] = level

    # ── Key/signature sizes ───────────────────────────────────────────────
    size_map: dict[str, dict[str, str]] = {}
    for row in algo_rows:
        algo_name = row.get('Algorithm', '').strip()
        if not algo_name:
            continue
        sizes: dict[str, str] = {}
        for col in ['Public Key (bytes)', 'Private Key (bytes)',
                     'Signature/Ciphertext (bytes)', 'Shared Secret (bytes)']:
            val = row.get(col, '').strip()
            if val and val != 'N/A':
                sizes[col] = val
        if sizes:
            size_map[algo_name] = sizes

    # ── Non-PQC standards (must NOT be associated with PQC algorithms) ───
    # Standards that are NOT PQC and whose use with PQC algorithm names
    # (without contrast language) indicates a likely misattribution.
    # Note: FIPS 140-3 is intentionally excluded — it is a validation framework
    # that CAN legitimately co-occur with PQC algorithm names ("ML-KEM validated
    # under FIPS 140-3" is accurate).
    non_pqc_standards: dict[str, str] = {
        'RFC 8446': 'TLS 1.3 (2018) — does NOT include PQC algorithms',
        'RFC 5246': 'TLS 1.2 (2008) — does NOT include PQC algorithms',
        'RFC 4346': 'TLS 1.1 (2006) — does NOT include PQC algorithms',
        'FIPS 186': 'Digital Signature Standard (classical ECDSA/RSA/DSA) — NOT PQC',
        'SP 800-56A': 'Key agreement (classical ECDH) — NOT PQC',
        'SP 800-56B': 'Key transport (classical RSA) — NOT PQC',
    }

    # ── Key dates ─────────────────────────────────────────────────────────
    key_dates: dict[str, str] = {
        'FIPS 203 finalized': '2024-08-13',
        'FIPS 204 finalized': '2024-08-13',
        'FIPS 205 finalized': '2024-08-13',
        'CNSA 2.0 published': '2022-09-07',
        'NIST PQC Round 3 winners announced': '2022-07-05',
        'NIST PQC competition started': '2016-12-20',
    }

    # ── Load library CSV for RFC numbers ──────────────────────────────────
    lib_csv = find_latest_csv('library_')
    rfc_numbers: set[str] = set()
    if lib_csv:
        for row in load_csv_rows(lib_csv):
            ref_id = row.get('reference_id', '').strip()
            url = row.get('download_url', '').strip()
            # Extract RFC numbers from reference IDs
            m = re.match(r'RFC-?(\d+)', ref_id, re.IGNORECASE)
            if m:
                rfc_numbers.add(m.group(1))
            # Also from URLs
            m = re.search(r'rfc(\d+)', url, re.IGNORECASE)
            if m:
                rfc_numbers.add(m.group(1))

    # ── Assemble final output ─────────────────────────────────────────────
    return {
        '_meta': {
            'generated_from': {
                'algorithm_csv': algo_csv.name,
                'library_csv': lib_csv.name if lib_csv else None,
            },
            'description': 'Programmatic fact allowlists for content accuracy validation. '
                           'Auto-generated — do not edit manually.',
        },
        'fips_to_algorithm': fips_primary,
        'fips_all_variants': {k: v for k, v in fips_to_algorithm.items()},
        'algorithm_to_fips': algorithm_to_fips,
        'canonical_algorithm_names': sorted(canonical_names),
        'security_level_map': security_level_map,
        'size_map': size_map,
        'non_pqc_standards': non_pqc_standards,
        'key_dates': key_dates,
        'rfc_numbers': sorted(rfc_numbers),
    }


def main():
    parser = argparse.ArgumentParser(description='Generate fact allowlists from CSV data')
    parser.add_argument('--print', action='store_true', help='Print to stdout instead of file')
    args = parser.parse_args()

    allowlists = build_allowlists()

    output = json.dumps(allowlists, indent=2, ensure_ascii=False)

    if args.print:
        print(output)
    else:
        out_path = ROOT / 'scripts' / 'fact_allowlists.json'
        with open(out_path, 'w', encoding='utf-8') as f:
            f.write(output + '\n')
        print(f'Written: {out_path.relative_to(ROOT)}')
        print(f'  FIPS mappings: {len(allowlists["fips_to_algorithm"])}')
        print(f'  Canonical algorithm names: {len(allowlists["canonical_algorithm_names"])}')
        print(f'  Security level entries: {len(allowlists["security_level_map"])}')
        print(f'  Size map entries: {len(allowlists["size_map"])}')
        print(f'  RFC numbers: {len(allowlists["rfc_numbers"])}')


if __name__ == '__main__':
    main()
