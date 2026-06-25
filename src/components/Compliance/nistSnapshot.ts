// SPDX-License-Identifier: GPL-3.0-only
import type { ComplianceRecord } from './types'

// Fallback snapshot of REAL NIST CMVP (FIPS 140-3) and ACVP validations. Used only
// when the live NIST scrape returns nothing (e.g. a JS-rendered page) — see services.ts.
// In production the app loads the full scraped dataset from /data/compliance-data.json
// (2,400+ records); this curated subset is a small, accurate stand-in so the UI is never
// empty. Every id / link / certificate below is a real, verifiable CMVP or ACVP record,
// cross-checked against compliance-data.json on 2026-06-24. Note that most FIPS 140-3
// *module* validations do not yet carry PQC in their validated boundary (pqcCoverage:false);
// PQC is currently validated mainly at the algorithm (ACVP) level. Refresh from the
// scraper rather than hand-editing.
export const NIST_SNAPSHOT: ComplianceRecord[] = [
  // FIPS 140-3 validated modules (real CMVP certificates)
  {
    id: 'fips-4745',
    source: 'NIST',
    date: '2024-07-31',
    link: 'https://csrc.nist.gov/projects/cryptographic-module-validation-program/certificate/4745',
    type: 'FIPS 140-3',
    status: 'Active',
    pqcCoverage: false,
    productName: 'nShield 5s Hardware Security Module',
    productCategory: 'Hardware Security Module',
    vendor: 'Entrust',
  },
  {
    id: 'fips-5291',
    source: 'NIST',
    date: '2026-05-22',
    link: 'https://csrc.nist.gov/projects/cryptographic-module-validation-program/certificate/5291',
    type: 'FIPS 140-3',
    status: 'Active',
    pqcCoverage: false,
    productName: 'YubiKey 5 Cryptographic Module',
    productCategory: 'Hardware Token',
    vendor: 'Yubico, Inc.',
  },
  {
    id: 'fips-4800',
    source: 'NIST',
    date: '2024-09-16',
    link: 'https://csrc.nist.gov/projects/cryptographic-module-validation-program/certificate/4800',
    type: 'FIPS 140-3',
    status: 'Active',
    pqcCoverage: 'Potentially PQC (name match)',
    productName: 'PQCryptoLib',
    productCategory: 'Software Library',
    vendor: 'PQShield LTD',
  },
  {
    id: 'fips-5296',
    source: 'NIST',
    date: '2026-06-02',
    link: 'https://csrc.nist.gov/projects/cryptographic-module-validation-program/certificate/5296',
    type: 'FIPS 140-3',
    status: 'Active',
    pqcCoverage: false,
    productName: 'BoringCrypto',
    productCategory: 'Software Library',
    vendor: 'Google, LLC',
  },

  // ACVP algorithm validations (real PQC algorithm certificates)
  {
    id: 'acvp-A8481',
    source: 'NIST',
    date: '2026-06-03',
    link: 'https://csrc.nist.gov/projects/cryptographic-algorithm-validation-program/details?product=21289',
    type: 'ACVP',
    status: 'Active',
    pqcCoverage: 'ML-KEM-1024',
    productName: 'Caliptra ML-KEM-1024 KeyGen, encapDecap',
    productCategory: 'Algorithm Implementation',
    vendor: 'Advanced Micro Devices (AMD)',
  },
  {
    id: 'acvp-A6462',
    source: 'NIST',
    date: '2025-01-06',
    link: 'https://csrc.nist.gov/projects/cryptographic-algorithm-validation-program/details?product=19197',
    type: 'ACVP',
    status: 'Active',
    pqcCoverage: 'ML-DSA, ML-KEM',
    productName: 'Ah-Crypto library (AhP-Tech Quantum Computing Cloud Platform)',
    productCategory: 'Algorithm Implementation',
    vendor: 'AhP-Tech Inc.',
  },
]
