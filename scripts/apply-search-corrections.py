#!/usr/bin/env python3
"""
apply-search-corrections.py
----------------------------
Applies corrections from web search verification of 72 flagged products.
Reads the 03302026 CSV (with evidence_flags) and writes a corrected version.

Corrections based on vendor source verification (2026-03-30):
- INCORRECT claims → fix or set to Unknown
- UNCONFIRMED claims → set to Unknown + Needs Verification
- OUTDATED claims → update to current status
- NEEDS UPDATE → clarify descriptions

Usage: python3 scripts/apply-search-corrections.py
"""

import csv

SRC = 'src/data/quantum_safe_cryptographic_software_reference_03302026.csv'
DST = 'src/data/quantum_safe_cryptographic_software_reference_03302026.csv'  # overwrite in place

VERIFIED_DATE = '2026-03-30'

# ---------------------------------------------------------------------------
# Corrections dict: software_name → {field: new_value}
# ---------------------------------------------------------------------------
CORRECTIONS = {
    # === INCORRECT claims ===
    '01 Quantum IronCAP': {
        'pqc_support': 'Yes (Goppa code-based, McEliece family — proprietary variant)',
        'pqc_capability_description': lambda v: v.replace('Classic McEliece', 'Goppa code-based (McEliece family, proprietary — not the specific Classic McEliece NIST candidate)')
            if 'Classic McEliece' in v else v,
        'last_verified_date': VERIFIED_DATE,
    },
    'ID Quantique Quantis QRNG': {
        'pqc_support': 'Yes (Quantum entropy source for PQC keygen)',
        'pqc_capability_description': lambda v: v.replace('ML-KEM', 'entropy source used with ML-KEM implementations')
            if 'ML-KEM' in v and 'entropy' not in v.lower() else v,
        'last_verified_date': VERIFIED_DATE,
    },
    'Quantinuum Quantum Origin': {
        'pqc_support': 'Yes (Quantum entropy for PQC keygen; NIST-validated QRNG)',
        'pqc_capability_description': lambda v: v + ' Note: Quantum Origin is an entropy source — it strengthens randomness feeding PQC keygen but does not implement ML-KEM directly.'
            if 'entropy source' not in v.lower() else v,
        'last_verified_date': VERIFIED_DATE,
    },
    'Node.js': {
        'pqc_support': 'Yes (ML-KEM + ML-DSA via OpenSSL 3.5 in v24.7+)',
        'pqc_capability_description': 'Node.js 24.7.0 (Aug 2025) ships OpenSSL 3.5 with ML-KEM via crypto.encapsulate()/decapsulate() and ML-DSA via crypto.sign()/verify(). Full PQC support in TLS and crypto APIs.',
        'release_date': '2025-08',
        'verification_status': 'Verified',
        'last_verified_date': VERIFIED_DATE,
    },

    # === UNCONFIRMED → Unknown ===
    'Ciena WaveLogic 6 Extreme': {
        'pqc_support': 'Unknown (vendor confirms NIST PQC generically; specific ML-KEM not publicly documented)',
        'verification_status': 'Needs Verification',
        'last_verified_date': VERIFIED_DATE,
    },
    'PQC-LEO': {
        'pqc_support': 'Unknown (no product by this name found; may reference ESA INT-UQKD project)',
        'verification_status': 'Needs Verification',
        'last_verified_date': VERIFIED_DATE,
    },
    'Quantum Bridge Subsea QKD': {
        'pqc_support': 'Unknown (product name not found; Quantum Bridge makes SDS platform with DSKE+PQC+QKD)',
        'verification_status': 'Needs Verification',
        'last_verified_date': VERIFIED_DATE,
    },
    'DigiCert SigningHub': {
        'pqc_support': 'Unknown (no SigningHub-specific PQC roadmap publicly documented)',
        'verification_status': 'Needs Verification',
        'last_verified_date': VERIFIED_DATE,
    },
    'IBM Guardium Key Lifecycle Manager': {
        'pqc_support': 'Unknown (GKLM 5.1x released but no public PQC documentation found)',
        'verification_status': 'Needs Verification',
        'last_verified_date': VERIFIED_DATE,
    },
    'Wind River VxWorks': {
        'pqc_support': 'Unknown (no public PQC announcements; ships OpenSSL 1.1.1)',
        'verification_status': 'Needs Verification',
        'last_verified_date': VERIFIED_DATE,
    },
    'QuSecure QuProtect R3': {
        'pqc_support': 'Unknown (PQC migration platform; specific algorithms not publicly documented)',
        'verification_status': 'Needs Verification',
        'last_verified_date': VERIFIED_DATE,
    },

    # === OUTDATED → update to current status ===
    'Cisco IOS XE PQC': {
        'pqc_support': 'Partial (SKIP quantum-safe key transport; native ML-KEM IKEv2 planned IOS-XE 10.0.10 2026)',
        'last_verified_date': VERIFIED_DATE,
    },
    'Fortanix Data Security Manager': {
        'pqc_support': 'Yes (ML-KEM; ML-DSA via FX 2200 appliance + PQC Central migration)',
        'verification_status': 'Verified',
        'last_verified_date': VERIFIED_DATE,
    },
    'Azure Dedicated HSM (Marvell LiquidSecurity)': {
        'pqc_support': 'Planned (service retiring Jul 2028; successor Azure Cloud HSM uses Marvell LS2 with PQC)',
        'last_verified_date': VERIFIED_DATE,
    },
    'Oracle TDE': {
        'pqc_support': 'Yes (ML-KEM + ML-DSA for TLS connections; AES-256 TDE at rest)',
        'pqc_capability_description': lambda v: v + ' Note: ML-KEM/ML-DSA are for TLS in-transit encryption (Oracle 26ai). TDE data-at-rest uses AES-256 (quantum-resistant symmetric).'
            if 'TLS' not in v else v,
        'last_verified_date': VERIFIED_DATE,
    },
    'Marvell LiquidSecurity 2': {
        'pqc_support': 'Planned (firmware-updatable for PQC; ML-KEM/ML-DSA Beta not publicly substantiated)',
        'verification_status': 'Partially Verified',
        'last_verified_date': VERIFIED_DATE,
    },
    'Alpine Linux': {
        'pqc_support': 'Yes (OpenSSL 3.5 native in Alpine 3.22; ML-KEM + ML-DSA)',
        'verification_status': 'Verified',
        'last_verified_date': VERIFIED_DATE,
    },
    'Fedora Linux': {
        'pqc_support': 'Yes (ML-KEM ML-DSA native via OpenSSL 3.5 in Fedora 43; liboqs in earlier)',
        'verification_status': 'Verified',
        'last_verified_date': VERIFIED_DATE,
    },

    # === Keysight Inspector ML-KEM is pre-release ===
    'Keysight Inspector': {
        'pqc_support': 'Yes (ML-DSA; SLH-DSA full; ML-KEM pre-release)',
        'last_verified_date': VERIFIED_DATE,
    },
}


def main():
    rows = []
    fixes = 0
    with open(SRC, newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        for row in reader:
            name = row['software_name']
            if name in CORRECTIONS:
                for field, value in CORRECTIONS[name].items():
                    old = row.get(field, '')
                    if callable(value):
                        new = value(old)
                    else:
                        new = value
                    if new != old:
                        row[field] = new
                        fixes += 1
            rows.append(row)

    with open(DST, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, quoting=csv.QUOTE_MINIMAL)
        writer.writeheader()
        writer.writerows(rows)

    print(f'Rows: {len(rows)}')
    print(f'Field corrections applied: {fixes}')
    print(f'Products corrected: {len(CORRECTIONS)}')

    # Count unknowns
    unknowns = sum(1 for r in rows if r.get('pqc_support', '').startswith('Unknown'))
    print(f'Products now marked Unknown: {unknowns}')
    print(f'Output: {DST}')


if __name__ == '__main__':
    main()
