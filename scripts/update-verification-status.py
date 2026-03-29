#!/usr/bin/env python3
"""
One-time script to update verification_status for 29 products based on
web research conducted 2026-03-28.

Reads pqc_product_catalog_03282026_r20.csv, applies updates,
writes pqc_product_catalog_03282026_r21.csv.
"""

import csv
import os

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INPUT = os.path.join(BASE, 'src/data/pqc_product_catalog_03282026_r20.csv')
OUTPUT = os.path.join(BASE, 'src/data/pqc_product_catalog_03282026_r21.csv')

# Research results: product_name -> (new_status, updated_brief_suffix, pqc_support_update)
UPDATES = {
    # --- Verified ---
    'IBM Cloud HSM (Utimaco)': {
        'verification_status': 'Verified',
        'last_verified_date': '2026-03-28',
        'pqc_support': 'Yes (via Utimaco Quantum Protect: ML-KEM, ML-DSA, LMS, XMSS)',
    },
    'STMicroelectronics ST33G1M2 TPM': {
        'verification_status': 'Verified',
        'last_verified_date': '2026-03-28',
        'pqc_support': 'Planned (PQC-ready successor ST33KTPM supports ML-DSA via firmware; FIPS 140-3 certified)',
    },
    'Delinea Secret Server': {
        'verification_status': 'Verified',
        'last_verified_date': '2026-03-28',
        'pqc_support': 'Yes (QuantumLock with CRYSTALS-Kyber-1024/ML-KEM, GA since March 2024)',
    },
    'Zscaler Zero Trust Exchange': {
        'verification_status': 'Verified',
        'last_verified_date': '2026-03-28',
        'pqc_support': 'Yes (PQC traffic inspection with ML-KEM support; three-phase PQC roadmap)',
    },
    'Palo Alto Cortex XDR': {
        'verification_status': 'Verified',
        'last_verified_date': '2026-03-28',
        'pqc_support': 'Yes (via Palo Alto Quantum-Safe Security platform, GA Jan 2026; ML-KEM cipher translation)',
    },
    'Citrix Virtual Apps and Desktops': {
        'verification_status': 'Verified',
        'last_verified_date': '2026-03-28',
        'pqc_support': 'Yes (hybrid X25519 + ML-KEM-768 via NetScaler 14.1.51; ACVP validated ML-DSA/ML-KEM/SLH-DSA)',
    },
    'Microsoft Remote Desktop Services (RDS)': {
        'verification_status': 'Verified',
        'last_verified_date': '2026-03-28',
        'pqc_support': 'Planned (Windows Server 2025 ML-KEM/ML-DSA CNG APIs GA; RDS in CNSA 2.0 roadmap targeting 2027)',
    },
    'Palo Alto GlobalProtect': {
        'verification_status': 'Verified',
        'last_verified_date': '2026-03-28',
        'pqc_support': 'Planned (PAN-OS supports quantum-safe IKEv2 with ML-KEM; GlobalProtect ML-KEM hybrid committed)',
    },
    'Samsung Networks 5G Core': {
        'verification_status': 'Verified',
        'last_verified_date': '2026-03-28',
        'pqc_support': 'Yes (S3SSE2A hardware PQC Secure Element with ML-DSA; ACVP validated ML-DSA/ML-KEM/SLH-DSA; CC EAL6+)',
    },
    'Broadcom Avi (NSX ALB)': {
        'verification_status': 'Verified',
        'last_verified_date': '2026-03-28',
        'pqc_support': 'Yes (Avi LB 31.2: ML-KEM + ML-DSA for TLS 1.3; FIPS 140-2 L1 #3550)',
    },

    # --- Monitoring ---
    'CREDEBL': {
        'verification_status': 'Monitoring',
        'last_verified_date': '2026-03-28',
        'pqc_support': 'Planned (modular architecture for future PQC; depends on W3C VC and IETF JOSE PQC standards)',
    },
    'Qualcomm Snapdragon Trusted Execution Environment': {
        'verification_status': 'Monitoring',
        'last_verified_date': '2026-03-28',
        'pqc_support': 'Planned (FALCON/FN-DSA backing; CNSA 2.0 alignment; no concrete product timeline)',
    },
    'JumpCloud Directory Platform': {
        'verification_status': 'Monitoring',
        'last_verified_date': '2026-03-28',
        'pqc_support': 'No (engaged in NIST PQC working groups but no product-level PQC)',
    },
    'CrowdStrike Falcon': {
        'verification_status': 'Monitoring',
        'last_verified_date': '2026-03-28',
        'pqc_support': 'No (PQC readiness announced for sensor-to-cloud TLS; no GA PQC sensor)',
    },
    'Snort IDS/IPS': {
        'verification_status': 'Monitoring',
        'last_verified_date': '2026-03-28',
        'pqc_support': 'No (PQC detection rules for ML-KEM hybrid TLS planned for Snort 3.2+; not yet released)',
    },
    'Arista EOS (Extensible Operating System)': {
        'verification_status': 'Monitoring',
        'last_verified_date': '2026-03-28',
        'pqc_support': 'Planned (ML-KEM management TLS and ML-DSA BGPsec on roadmap; FIPS 140-3 L3 certified)',
    },
    'Suricata IDS/IPS': {
        'verification_status': 'Monitoring',
        'last_verified_date': '2026-03-28',
        'pqc_support': 'No (PQC-aware TLS fingerprinting in development for 8.x; detection role only)',
    },
    'Mavenir Cloud RAN': {
        'verification_status': 'Monitoring',
        'last_verified_date': '2026-03-28',
        'pqc_support': 'No (PQC depends on 3GPP Rel-20/21 SA3 specifications; no standalone PQC roadmap)',
    },
    'NEC 5G Core': {
        'verification_status': 'Monitoring',
        'last_verified_date': '2026-03-28',
        'pqc_support': 'No (active quantum research with NTT/Toshiba; PQC via 3GPP Rel-20/21; no product release)',
    },
    'Robust Intelligence AI Firewall': {
        'verification_status': 'Monitoring',
        'last_verified_date': '2026-03-28',
        'pqc_support': 'No (acquired by Cisco Oct 2024; Cisco corporate PQC roadmap applies; no product-level PQC)',
    },

    # --- No PQC Roadmap ---
    'Intel Platform Trust Technology (PTT)': {
        'verification_status': 'No PQC Roadmap',
        'last_verified_date': '2026-03-28',
        'pqc_support': 'No (firmware TPM 2.0; no PQC firmware/microcode update announced)',
    },
    'BeyondTrust Privilege Management': {
        'verification_status': 'No PQC Roadmap',
        'last_verified_date': '2026-03-28',
        'pqc_support': 'No (relies on TLS 1.3 transport; no PQC announcements)',
    },
    'VMware Horizon': {
        'verification_status': 'No PQC Roadmap',
        'last_verified_date': '2026-03-28',
        'pqc_support': 'No (Broadcom has PQC at infrastructure level but no Horizon-specific roadmap)',
    },
    'AnyDesk': {
        'verification_status': 'No PQC Roadmap',
        'last_verified_date': '2026-03-28',
        'pqc_support': 'No (proprietary DeskRT codec with classical TLS; expected to follow BSI TR-02102)',
    },
    'Rakuten Symphony (Symworld)': {
        'verification_status': 'No PQC Roadmap',
        'last_verified_date': '2026-03-28',
        'pqc_support': 'No (cloud-native telecom OS; PQC depends on infrastructure and 3GPP timelines)',
    },
    'Cranium AI Security Platform': {
        'verification_status': 'No PQC Roadmap',
        'last_verified_date': '2026-03-28',
        'pqc_support': 'No (AI governance/security platform; no cryptographic infrastructure)',
    },
    'FusionAuth': {
        'verification_status': 'No PQC Roadmap',
        'last_verified_date': '2026-03-28',
        'pqc_support': 'No (classical RSA/ECDSA for JWT signing; self-hosted depends on customer TLS)',
    },
    'Descope': {
        'verification_status': 'No PQC Roadmap',
        'last_verified_date': '2026-03-28',
        'pqc_support': 'No (cloud CIAM with classical token signing; no PQC announcements)',
    },
    'Stytch': {
        'verification_status': 'No PQC Roadmap',
        'last_verified_date': '2026-03-28',
        'pqc_support': 'No (API-first auth with classical RSA/ECDSA JWTs; no PQC announcements)',
    },
}


def main():
    with open(INPUT, newline='') as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        rows = list(reader)

    updated = 0
    for row in rows:
        name = row['software_name']
        if name in UPDATES:
            for field, value in UPDATES[name].items():
                row[field] = value
            updated += 1

    remaining = sum(1 for r in rows if r.get('verification_status') == 'Needs Verification')
    print(f'Updated: {updated}/{len(UPDATES)} products')
    print(f'Remaining "Needs Verification": {remaining}')

    with open(OUTPUT, 'w', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, lineterminator='\n')
        writer.writeheader()
        writer.writerows(rows)

    print(f'Written to: {OUTPUT}')


if __name__ == '__main__':
    main()
