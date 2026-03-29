#!/usr/bin/env python3
# SPDX-License-Identifier: GPL-3.0-only
"""
audit-vendor-coverage.py

For every vendor in the migrate catalog, checks whether all their known
PQC-capable products are listed. Outputs a gap report to reports/vendor-coverage-gaps.md.

Usage:
    python3 scripts/audit-vendor-coverage.py [--output PATH]
"""

import argparse
import csv
import glob
import os
import re
from collections import defaultdict
from datetime import date
from pathlib import Path

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
ROOT = Path(__file__).parent.parent
DATA_DIR = ROOT / 'src' / 'data'
REPORTS_DIR = ROOT / 'reports'


def find_latest_csv(prefix: str) -> Path:
    pattern = str(DATA_DIR / f'{prefix}*.csv')
    files = [f for f in glob.glob(pattern) if 'archive' not in f]
    if not files:
        raise FileNotFoundError(f'No CSV found matching {pattern}')

    def date_key(p: str):
        m = re.search(r'_(\d{8})(?:_r(\d+))?\.csv$', p)
        if not m:
            return (0, 0)
        return (int(m.group(1)), int(m.group(2) or 0))

    return Path(max(files, key=date_key))


# ---------------------------------------------------------------------------
# Known portfolio gaps: products confirmed or highly suspected to exist but
# not in the catalog. Format:
#   vendor_id -> list of (product_name, category, notes)
# ---------------------------------------------------------------------------
KNOWN_GAPS: dict[str, list[tuple[str, str, str]]] = {
    'VND-007': [  # Check Point
        ('Check Point CloudGuard Network Security', 'Network Security Software',
         'Separate SKU from Check Point Quantum Gateways; cloud-native FW with PQC-capable TLS'),
        ('Check Point Harmony Connect (SASE)', 'Network Security Software',
         'SASE product line; TLS termination requires ML-KEM migration'),
        ('Check Point Quantum Maestro', 'Network Security Software',
         'Hyperscale network security; separate firmware/PQC roadmap from IOS XE'),
    ],
    'VND-008': [  # Cisco
        ('Cisco IOS XR', 'Network Operating Systems',
         'Service-provider OS (separate from IOS XE); PQC IPsec parity expected'),
        ('Cisco Catalyst 9000 Series', 'Network Security Software',
         'Enterprise switching platform; MACsec PQC upgrade path'),
        ('Cisco Catalyst Center (DNA Center)', 'Network Security Software',
         'Network management platform; TLS / PKI exposure'),
        ('Cisco Identity Services Engine (ISE)', 'Identity & Access Management (IAM)',
         'NAC and policy platform; certificate-dependent; PQC migration needed'),
    ],
    'VND-010': [  # Crypto4A
        ('Crypto4A QxEDGE', 'Hardware Security Module (HSM) Software',
         'Edge PQC security appliance; separate hardware SKU from QxHSM'),
        ('Crypto4A QASM', 'Cryptographic Agility Frameworks',
         'Quantum Agile Security Module software; listed separately on crypto4a.com'),
    ],
    'VND-012': [  # DigiCert
        ('DigiCert CertCentral', 'Certificate Lifecycle Management',
         'Core CLM SaaS platform; PQC certificate issuance capability'),
        ('DigiCert ONE', 'Certificate Lifecycle Management',
         'Enterprise CLM platform; separate from Trust Lifecycle Manager branding'),
    ],
    'VND-013': [  # Entrust
        ('Entrust Identity as a Service (IDaaS)', 'Identity & Access Management (IAM)',
         'Cloud IAM platform; classical auth flows require PQC key exchange migration'),
        ('Entrust Datacard Card Issuance', 'Smart Cards & Secure Elements',
         'Card personalization systems; may carry PQC key loading roadmap'),
    ],
    'VND-015': [  # Fortanix
        ('Fortanix Data Security Manager (DSM) SaaS', 'Key Management Systems (KMS)',
         'SaaS delivery of DSM; PQC key types available in cloud tier'),
        ('Fortanix Confidential AI', 'Confidential Computing',
         'Confidential computing product; quantum-safe key wrapping'),
    ],
    'VND-016': [  # Fortinet
        ('Fortinet FortiManager', 'Network Security Software',
         'Centralized management for FortiGate; TLS / certificate exposure'),
        ('Fortinet FortiAuthenticator', 'Identity & Access Management (IAM)',
         'Identity and MFA appliance; certificate-based auth requires PQC migration'),
    ],
    'VND-018': [  # Google
        ('Google Workspace Client-Side Encryption (CSE)', 'Cloud Encryption Gateways',
         'Customer-managed encryption keys; KMS integration path to PQC'),
    ],
    'VND-019': [  # IBM
        ('IBM z/OS Cryptographic Services (ICSF)', 'Cryptographic Libraries',
         'FIPS 140-3 mainframe crypto; CP Assist for Cryptographic Functions (CPACF) with PQC extensions'),
        ('IBM Db2 Transparent Data Encryption', 'Database Encryption Software',
         'Enterprise database TDE; quantum-safe key wrapping roadmap'),
        ('IBM MQ Advanced Message Security', 'Data Security & Protection',
         'Message-level encryption; PQC signing/KEM migration needed'),
        ('IBM Z Hardware Cryptographic Accelerator', 'Hardware Security and Semiconductors',
         'CEX8S crypto express card; on-chip ML-KEM/ML-DSA acceleration'),
    ],
    'VND-024': [  # Keyfactor — duplicate alert handled in Rule D
    ],
    'VND-027': [  # Microsoft
        ('Microsoft Teams End-to-End Encryption', 'Secure Messaging and Communication',
         'E2EE calls/messages; PQC key exchange roadmap tied to SymCrypt/CNG'),
        ('Azure API Management', 'API Security and JWT Libraries',
         'TLS termination; ML-KEM hybrid TLS planned via Azure infra'),
    ],
    'VND-031': [  # Palo Alto
        ('Palo Alto Prisma SASE', 'Network Security Software',
         'Cloud-delivered SASE; TLS inspection requires ML-KEM upgrade'),
        ('Palo Alto Prisma Cloud (CSPM)', 'Cloud Encryption Gateways',
         'Cloud security posture; certificate/key management exposure'),
    ],
    'VND-032': [  # Red Hat
        ('Red Hat OpenShift', 'Container Orchestration & Service Mesh',
         'Enterprise Kubernetes; service mesh TLS and secrets require PQC migration'),
        ('Red Hat Ansible Automation Platform', 'Cryptographic Libraries',
         'Vault/secrets integration; depends on underlying crypto stack'),
    ],
    'VND-033': [  # SAP
        ('SAP S/4HANA Database Encryption', 'Database Encryption Software',
         'Uses SAP Crypto Library internally; may warrant separate entry for visibility'),
        ('SAP HANA Cloud', 'Cloud Encryption Gateways',
         'Cloud database with key management; TLS + at-rest encryption exposure'),
    ],
    'VND-038': [  # Senetas
        ('Senetas CN6140', 'Network Encryptors',
         '10GbE encryptor; different model line from CN7000 Series'),
        ('Senetas SN3152', 'Network Encryptors',
         '100GbE encryptor; high-speed variant with separate PQC firmware'),
    ],
    'VND-039': [  # STMicroelectronics
        ('STMicroelectronics STSAFE-TPM', 'Hardware Security and Semiconductors',
         'Discrete TPM with PQC-ready architecture; separate from ST33G1M2 eSE'),
        ('STMicroelectronics ST33K1M5', 'Smart Cards & Secure Elements',
         'Quantum-ready secure element variant; listed separately in ST portfolio'),
    ],
    'VND-041': [  # Thales
        ('Thales SafeNet Authentication Service', 'Identity & Access Management (IAM)',
         'Cloud MFA platform; token-based auth; PQC roadmap not yet confirmed — needs verification'),
        ('Thales Trusted Cyber Technologies (TCT) ProtectV', 'Cloud Encryption Gateways',
         'US government cloud encryption appliance; separate from CipherTrust line'),
    ],
    'VND-042': [  # Utimaco
        ('Utimaco uHSM', 'Hardware Security Module (HSM) Software',
         'Embedded/IoT HSM variant; separate from SecurityServer and Athos'),
    ],
    'VND-044': [  # Yubico
        ('YubiKey 5 Series (PQC firmware roadmap)', 'Smart Cards & Secure Elements',
         'If Yubico confirms ML-DSA support in firmware — needs verification against roadmap'),
    ],
    'VND-054': [  # QuSecure
        ('QuSecure QuProtect Network', 'Cryptographic Agility Frameworks',
         'Network-level PQC orchestration; separate SKU from QuProtect R3 endpoint'),
    ],
    'VND-058': [  # HashiCorp
        # Terraform state encryption is not typically a PQC-relevant gap — skip
    ],
    'VND-065': [  # ISC — zero products
        ('ISC BIND 9.21+ (PQC DNSSEC)', 'Network Security Software',
         'BIND 9.21 supports DNSSEC with ML-DSA (draft-ietf-dnsop-dnssec-pqc); ISC is VND-065 with no products listed'),
    ],
    'VND-173': [  # GlobalSign
        ('GlobalSign Atlas CLM', 'Certificate Lifecycle Management',
         'Enterprise CLM platform; separate from Digital Signing Service'),
        ('GlobalSign MSSL (Managed SSL)', 'Certificate Lifecycle Management',
         'Managed certificate service; PQC certificate issuance capability'),
    ],
    'VND-181': [  # Sectigo
        ('Sectigo Certificate Manager (SCM)', 'Certificate Lifecycle Management',
         'Enterprise CLM platform; PQC certificate issuance; may be same as Certificate Manager entry'),
    ],
}

# ---------------------------------------------------------------------------
# Duplicates: (product_name_a, product_name_b, vendor_id, reason)
# ---------------------------------------------------------------------------
KNOWN_DUPLICATES = [
    ('EJBCA', 'Keyfactor EJBCA', 'VND-024',
     'Same open-source PKI product; "EJBCA" is the community name, "Keyfactor EJBCA" is the commercial name'),
    ('Fortinet FortiOS', 'Fortinet FortiGate (FortiOS)', 'VND-016',
     'FortiOS is the OS; FortiGate is the hardware — but both entries describe the same software capabilities'),
    ('LUKS/dm-crypt', 'Linux LUKS / dm-crypt', 'VND-198',
     'Same Linux disk encryption subsystem listed under two slightly different names'),
]


def load_vendors(path: Path) -> dict[str, dict]:
    vendors = {}
    with open(path, newline='', encoding='utf-8') as f:
        for row in csv.DictReader(f):
            vendors[row['vendor_id'].strip()] = row
    return vendors


def load_products(path: Path) -> dict[str, list[dict]]:
    products: dict[str, list[dict]] = defaultdict(list)
    with open(path, newline='', encoding='utf-8') as f:
        for row in csv.DictReader(f):
            vid = row.get('vendor_id', '').strip()
            products[vid].append({
                'name': row['software_name'].strip(),
                'category': row['category_name'].strip(),
                'pqc': row['pqc_support'].strip(),
                'priority': row['pqc_migration_priority'].strip(),
            })
    return products


def pqc_status(prods: list[dict]) -> tuple[int, int, int]:
    yes = sum(1 for p in prods if p['pqc'].lower().startswith('yes'))
    planned = sum(1 for p in prods if 'planned' in p['pqc'].lower())
    other = len(prods) - yes - planned
    return yes, planned, other


def main():
    parser = argparse.ArgumentParser(description='Audit vendor PQC product coverage')
    parser.add_argument('--output', default=str(REPORTS_DIR / 'vendor-coverage-gaps.md'))
    args = parser.parse_args()

    product_csv = find_latest_csv('pqc_product_catalog_')
    vendor_csv = find_latest_csv('vendors_')

    print(f'Products: {product_csv.name}')
    print(f'Vendors:  {vendor_csv.name}')

    vendors = load_vendors(vendor_csv)
    products = load_products(product_csv)

    total_products = sum(len(v) for v in products.values())
    today = date.today().isoformat()

    lines: list[str] = []

    lines += [
        f'# PQC Vendor Coverage Gap Report',
        f'',
        f'**Date:** {today}  ',
        f'**Products CSV:** `{product_csv.name}`  ',
        f'**Vendors CSV:** `{vendor_csv.name}`  ',
        f'**Total vendors:** {len(vendors)} | **Total products:** {total_products}',
        f'',
        '---',
        '',
    ]

    # -----------------------------------------------------------------------
    # Rule D — Duplicates (surface first, highest-confidence finding)
    # -----------------------------------------------------------------------
    lines += ['## Duplicates to Resolve', '']
    dup_count = 0
    all_names = {p['name'] for prods in products.values() for p in prods}
    for name_a, name_b, vid, reason in KNOWN_DUPLICATES:
        a_found = name_a in all_names
        b_found = name_b in all_names
        vname = vendors.get(vid, {}).get('vendor_name', vid)
        if a_found and b_found:
            status = '⚠️ **BOTH PRESENT**'
            dup_count += 1
        elif a_found:
            status = f'Only `{name_a}` present'
        elif b_found:
            status = f'Only `{name_b}` present'
        else:
            status = 'Neither present (may have been fixed)'
        lines.append(f'- **{vname}** ({vid}): `{name_a}` vs `{name_b}` — {status}')
        lines.append(f'  > {reason}')
        lines.append('')

    if dup_count == 0:
        lines.append('_No active duplicates detected._')
        lines.append('')

    lines += ['---', '']

    # -----------------------------------------------------------------------
    # Rule A — Vendors with zero products
    # -----------------------------------------------------------------------
    lines += ['## Priority 3 — Vendors With No Products Listed', '']
    no_product_vendors = [vid for vid in vendors if vid not in products or len(products[vid]) == 0]
    if no_product_vendors:
        for vid in sorted(no_product_vendors):
            v = vendors[vid]
            lines.append(
                f'- **{v["vendor_name"]}** ({vid}) — '
                f'`pqc_commitment={v.get("pqc_commitment","?")}` — '
                f'website: {v.get("website","")}'
            )
            # Show known gap entries if any
            for pname, pcat, pnotes in KNOWN_GAPS.get(vid, []):
                lines.append(f'  - Suspected product: **{pname}** ({pcat})')
                lines.append(f'    > {pnotes}')
    else:
        lines.append('_All vendors have at least one product._')
    lines += ['', '---', '']

    # -----------------------------------------------------------------------
    # Rule C — Priority 1: Confirmed / high-confidence gaps for known vendors
    # -----------------------------------------------------------------------
    lines += ['## Priority 1 — Confirmed / High-Confidence Gaps', '']
    p1_vids = [vid for vid in KNOWN_GAPS if KNOWN_GAPS[vid] and vid not in no_product_vendors]

    for vid in sorted(p1_vids, key=lambda v: vendors.get(v, {}).get('vendor_name', v)):
        v = vendors.get(vid, {})
        vname = v.get('vendor_name', vid)
        prods = products.get(vid, [])
        yes, planned, other = pqc_status(prods)
        lines.append(f'### {vname} ({vid})')
        lines.append(f'**Current coverage:** {len(prods)} products ({yes} Yes, {planned} Planned, {other} other)  ')
        lines.append('**Currently listed:**')
        for p in prods:
            pqc_badge = '✅' if p['pqc'].lower().startswith('yes') else ('🔜' if 'planned' in p['pqc'].lower() else '❌')
            lines.append(f'  - {pqc_badge} {p["name"]} ({p["category"]})')
        lines.append('')
        lines.append('**Suspected missing:**')
        for pname, pcat, pnotes in KNOWN_GAPS[vid]:
            lines.append(f'  - **{pname}** — *{pcat}*')
            lines.append(f'    > {pnotes}')
        lines.append('')

    lines += ['---', '']

    # -----------------------------------------------------------------------
    # Rule B — Priority 2: Active-commitment vendors with 1 product
    # -----------------------------------------------------------------------
    lines += ['## Priority 2 — Single-Product Active Vendors (Needs Research)', '']
    lines += [
        'These vendors have `pqc_commitment = Active` but only one product listed.',
        'They likely have additional PQC-capable products that should be added.',
        '',
    ]

    single_active = []
    for vid, prods in products.items():
        if len(prods) != 1:
            continue
        v = vendors.get(vid, {})
        if v.get('pqc_commitment', '') == 'Active':
            single_active.append((v.get('vendor_name', vid), vid, prods[0]))

    single_active.sort(key=lambda x: x[0])

    lines.append(f'**Count: {len(single_active)} vendors**')
    lines.append('')
    lines.append('| Vendor | VND | Product | Category | PQC Support |')
    lines.append('|--------|-----|---------|----------|-------------|')
    for vname, vid, prod in single_active:
        pqc_short = prod["pqc"][:50] + ('…' if len(prod["pqc"]) > 50 else '')
        lines.append(f'| {vname} | {vid} | {prod["name"]} | {prod["category"]} | {pqc_short} |')

    lines += ['', '---', '']

    # -----------------------------------------------------------------------
    # Appendix — Full vendor × product matrix
    # -----------------------------------------------------------------------
    lines += ['## Appendix — Full Vendor Coverage Matrix', '']
    lines.append('| Vendor | VND | Products | Yes | Planned | Categories |')
    lines.append('|--------|-----|----------|-----|---------|------------|')

    for vid, prods in sorted(products.items(), key=lambda x: -len(x[1])):
        v = vendors.get(vid, {})
        vname = v.get('vendor_name', vid) if v else vid
        yes, planned, _ = pqc_status(prods)
        cats = ', '.join(sorted({p['category'] for p in prods}))
        cats_short = cats[:80] + ('…' if len(cats) > 80 else '')
        lines.append(f'| {vname} | {vid} | {len(prods)} | {yes} | {planned} | {cats_short} |')

    lines.append('')

    # -----------------------------------------------------------------------
    # Write output
    # -----------------------------------------------------------------------
    out_path = Path(args.output)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text('\n'.join(lines), encoding='utf-8')
    print(f'Report written to: {out_path}')
    print(f'  Duplicates flagged: {dup_count}')
    print(f'  Vendors with no products: {len(no_product_vendors)}')
    print(f'  Priority 1 vendors with gaps: {len(p1_vids)}')
    print(f'  Priority 2 single-product Active vendors: {len(single_active)}')


if __name__ == '__main__':
    main()
