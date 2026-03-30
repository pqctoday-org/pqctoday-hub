#!/usr/bin/env python3
"""
fix-migrate-accuracy.py
-----------------------
Reads quantum_safe_cryptographic_software_reference_03292026.csv,
applies accuracy corrections, adds evidence_flags column, and writes
quantum_safe_cryptographic_software_reference_03302026.csv.

Corrections:
  1a. Timeline impossibilities — qualify products claiming standardized PQC algos
      with release dates before FIPS 203/204/205 finalization (Aug 13, 2024)
  1b. FIPS scope clarification — distinguish certs covering PQC vs classical-only
  1c. OpenSSL version mismatches — fix incorrect OpenSSL version claims
  1d. Pre-standardization algorithm names — normalize to NIST standard names
  1e. Evidence flags column — machine-readable warning codes

Usage: python3 scripts/fix-migrate-accuracy.py
"""

import csv
import os
import re
import json
from datetime import date

SRC = 'src/data/quantum_safe_cryptographic_software_reference_03292026.csv'
DST = 'src/data/quantum_safe_cryptographic_software_reference_03302026.csv'
XREF = 'src/data/migrate_certification_xref_03272026.csv'
PRODUCTS_DIR = 'public/products/'

FIPS_STANDARD_DATE = '2024-08-13'  # FIPS 203/204/205 published
TODAY = '2026-03-30'

# Standardized PQC algorithm names (FIPS 203/204/205)
PQC_STANDARD_ALGOS = ['ML-KEM', 'ML-DSA', 'SLH-DSA']

# ---------------------------------------------------------------------------
# Load certification xref — identify which products have PQC in FIPS scope
# ---------------------------------------------------------------------------
def load_pqc_fips_products():
    """Returns set of product names whose FIPS certs cover PQC algorithms."""
    pqc_fips = set()
    all_fips = set()
    with open(XREF, newline='', encoding='utf-8') as f:
        for row in csv.DictReader(f):
            if row['cert_type'] == 'FIPS 140-3':
                all_fips.add(row['software_name'])
                algs = row.get('pqc_algorithms', '').strip()
                if algs and algs not in ('N/A', ''):
                    if any(a in algs for a in PQC_STANDARD_ALGOS + ['XMSS', 'LMS']):
                        pqc_fips.add(row['software_name'])
    return pqc_fips, all_fips


def load_all_xref_products():
    """Returns set of product names with ANY certification xref entry."""
    products = set()
    with open(XREF, newline='', encoding='utf-8') as f:
        for row in csv.DictReader(f):
            products.add(row['software_name'])
    return products


def load_product_doc_files():
    """Returns set of lowercase filenames (flat + in subdirs) in the products dir."""
    filenames = set()
    if not os.path.isdir(PRODUCTS_DIR):
        return filenames
    for root, _dirs, files in os.walk(PRODUCTS_DIR):
        for f in files:
            if f in ('manifest.json', 'skip-list.json'):
                continue
            filenames.add(f.lower())
    return filenames


def product_has_docs(name, all_doc_files):
    """Check if a product has any matching doc files by name matching."""
    name_lower = name.lower()
    # Build searchable variants
    slug_underscore = name_lower.replace(' ', '_').replace('/', '_')
    slug_dash = name_lower.replace(' ', '-').replace('/', '-')
    # Significant words (>3 chars) for fuzzy matching
    words = [w for w in re.split(r'[\s/()]+', name_lower) if len(w) > 3]

    for doc_f in all_doc_files:
        if slug_underscore in doc_f or slug_dash in doc_f:
            return True
        if any(w in doc_f for w in words):
            return True
    return False


# ---------------------------------------------------------------------------
# Date parsing helpers
# ---------------------------------------------------------------------------
def normalize_date(d):
    """Normalize partial dates: '2024' -> '2024-01-01', '2024-04' -> '2024-04-01'."""
    d = d.strip()
    if not d:
        return None
    if re.match(r'^\d{4}$', d):
        return d + '-01-01'
    if re.match(r'^\d{4}-\d{2}$', d):
        return d + '-01'
    if re.match(r'^\d{4}-\d{2}-\d{2}', d):
        return d[:10]
    return None


def is_pre_standard(release_date):
    """Check if a release date is before FIPS 203/204/205 publication."""
    norm = normalize_date(release_date)
    if norm is None:
        return False
    return norm < FIPS_STANDARD_DATE


def claims_standard_pqc(pqc_support, pqc_desc):
    """Check if the product claims standardized PQC algorithm support."""
    combined = (pqc_support + ' ' + pqc_desc).upper()
    return any(a.upper() in combined for a in PQC_STANDARD_ALGOS)


def claims_yes_pqc(pqc_support):
    """Check if pqc_support starts with 'Yes'."""
    return pqc_support.strip().startswith('Yes')


# ---------------------------------------------------------------------------
# Algorithm name normalization
# ---------------------------------------------------------------------------
PRE_STANDARD_NAMES = {
    'CRYSTALS-Kyber': 'ML-KEM',
    'Kyber': 'ML-KEM',
    'CRYSTALS-Dilithium': 'ML-DSA',
    'Dilithium': 'ML-DSA',
}

# Only replace SPHINCS+ when clearly referring to the NIST standard (not the original)
SPHINCS_PATTERN = re.compile(r'\bSPHINCS\+\b')


def normalize_algo_names(text, field_name=''):
    """Replace pre-standardization algorithm names with NIST standard names."""
    if not text:
        return text

    result = text
    for old, new in PRE_STANDARD_NAMES.items():
        if old in result:
            # Don't replace 'Kyber' if it's part of 'ML-KEM' already nearby or in a product name
            if old == 'Kyber' and 'ML-KEM' in result:
                continue
            if old == 'Dilithium' and 'ML-DSA' in result:
                continue
            # First occurrence: add "(formerly X)" note
            result = result.replace(old, f'{new} (formerly {old})', 1)
            # Subsequent occurrences: just replace
            result = result.replace(old, new)
    return result


# ---------------------------------------------------------------------------
# Specific product fixes (manual corrections)
# ---------------------------------------------------------------------------
MANUAL_FIXES = {
    'SoftHSM2': {
        'release_date': '2025',
        'pqc_capability_description': lambda v: v if 'pqctoday/softhsmv3' in v else
            v + ' PQC support via pqctoday/softhsmv3 fork (2025+) using OpenSSL 3.x EVP backend.',
    },
    'Nginx': {
        'pqc_capability_description': lambda v: v.replace('OpenSSL 3.2+', 'OpenSSL 3.5+ (ML-KEM added in 3.5)')
            if 'OpenSSL 3.2+' in v else v.replace('OpenSSL 3.2', 'OpenSSL 3.5+ (ML-KEM added in 3.5)')
            if 'OpenSSL 3.2' in v else v,
    },
    'Fedora Linux': {
        'pqc_capability_description': lambda v: v.replace('OpenSSL 3.3+', 'OpenSSL 3.5+ (ML-KEM/ML-DSA added in 3.5)')
            if 'OpenSSL 3.3+' in v else v.replace('OpenSSL 3.3', 'OpenSSL 3.5+ (ML-KEM/ML-DSA added in 3.5)')
            if 'OpenSSL 3.3' in v else v,
    },
}


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main():
    pqc_fips_products, all_fips_products = load_pqc_fips_products()
    all_xref_products = load_all_xref_products()
    all_doc_files = load_product_doc_files()

    print(f'Products with PQC in FIPS scope: {len(pqc_fips_products)}')
    print(f'Products with classical-only FIPS: {len(all_fips_products - pqc_fips_products)}')
    print(f'Products with any cert xref: {len(all_xref_products)}')
    print(f'Product doc files: {len(all_doc_files)}')
    print()

    rows_in = 0
    rows_out = 0
    flags_added = 0
    fixes_applied = 0

    with open(SRC, newline='', encoding='utf-8') as fin:
        reader = csv.DictReader(fin)
        fieldnames = list(reader.fieldnames) + ['evidence_flags']

        with open(DST, 'w', newline='', encoding='utf-8') as fout:
            writer = csv.DictWriter(fout, fieldnames=fieldnames, quoting=csv.QUOTE_MINIMAL)
            writer.writeheader()

            for row in reader:
                rows_in += 1
                name = row['software_name']
                pqc_support = row.get('pqc_support', '').strip()
                pqc_desc = row.get('pqc_capability_description', '').strip()
                release_date = row.get('release_date', '').strip()
                fips_val = row.get('fips_validated', '').strip()
                source_type = row.get('source_type', '').strip()
                verification = row.get('verification_status', '').strip()
                flags = []

                # ----- 1a. Timeline impossibility check -----
                if (is_pre_standard(release_date)
                        and claims_yes_pqc(pqc_support)
                        and claims_standard_pqc(pqc_support, pqc_desc)):
                    flags.append('pre-standard-date')
                    # Qualify the description if not already qualified
                    if 'pre-standard' not in pqc_desc.lower() and 'predates FIPS' not in pqc_desc:
                        row['pqc_capability_description'] = (
                            pqc_desc + ' [Note: release date predates FIPS 203/204/205 finalization'
                            ' (Aug 2024); may reference draft/pre-standard algorithms.]'
                        )
                    # Downgrade verification if needed
                    if verification == 'Verified':
                        row['verification_status'] = 'Partially Verified'
                        fixes_applied += 1

                # ----- 1b. FIPS scope clarification -----
                if (fips_val
                        and fips_val.lower() not in ('no', 'n/a', '')
                        and name in all_fips_products
                        and name not in pqc_fips_products):
                    flags.append('fips-classical-only')
                    # Append scope note if not already present
                    if 'classical' not in fips_val.lower():
                        row['fips_validated'] = fips_val + ' (classical algorithms only; PQC not in FIPS scope)'
                        fixes_applied += 1

                # ----- 1c. OpenSSL version mismatch -----
                if name in MANUAL_FIXES:
                    for field, fix in MANUAL_FIXES[name].items():
                        old_val = row.get(field, '')
                        if callable(fix):
                            new_val = fix(old_val)
                        else:
                            new_val = fix
                        if new_val != old_val:
                            row[field] = new_val
                            fixes_applied += 1

                # Check for OpenSSL version mismatch in description
                desc_lower = (row.get('pqc_capability_description', '') + ' ' + pqc_support).lower()
                if ('openssl 3.2' in desc_lower or 'openssl 3.3' in desc_lower or 'openssl 3.4' in desc_lower):
                    if any(a.lower() in desc_lower for a in ['ml-kem', 'ml-dsa', 'slh-dsa']):
                        if 'openssl-version-mismatch' not in flags:
                            flags.append('openssl-version-mismatch')

                # ----- 1d. Algorithm name normalization -----
                for field in ('pqc_support', 'pqc_capability_description'):
                    old_val = row.get(field, '')
                    new_val = normalize_algo_names(old_val, field)
                    if new_val != old_val:
                        row[field] = new_val
                        fixes_applied += 1

                # ----- 1e. Evidence flags -----

                # no-cert-backing: only for commercial products claiming Yes PQC
                if (claims_yes_pqc(pqc_support)
                        and name not in all_xref_products
                        and source_type in ('Trusted Vendor', 'Commercial')
                        and 'reference' not in name.lower()
                        and 'liboqs' not in name.lower()):
                    flags.append('no-cert-backing')

                # no-vendor-docs: only for Critical/High priority commercial products
                priority = row.get('pqc_migration_priority', '').strip()
                if (claims_yes_pqc(pqc_support)
                        and priority in ('Critical', 'High')
                        and source_type in ('Trusted Vendor', 'Commercial')
                        and not product_has_docs(name, all_doc_files)):
                    flags.append('no-vendor-docs')

                # Write evidence_flags
                row['evidence_flags'] = '; '.join(flags) if flags else ''
                if flags:
                    flags_added += 1

                writer.writerow(row)
                rows_out += 1

    print(f'Rows read: {rows_in}')
    print(f'Rows written: {rows_out}')
    print(f'Fixes applied: {fixes_applied}')
    print(f'Products with evidence flags: {flags_added}')
    print()

    # Print flag distribution
    flag_counts = {}
    with open(DST, newline='', encoding='utf-8') as f:
        for row in csv.DictReader(f):
            ef = row.get('evidence_flags', '').strip()
            if ef:
                for flag in ef.split(';'):
                    flag = flag.strip()
                    if flag:
                        flag_counts[flag] = flag_counts.get(flag, 0) + 1

    print('Flag distribution:')
    for flag, count in sorted(flag_counts.items(), key=lambda x: -x[1]):
        print(f'  {flag}: {count}')

    print(f'\nOutput: {DST}')


if __name__ == '__main__':
    main()
