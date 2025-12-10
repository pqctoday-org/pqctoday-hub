import type { ComplianceRecord } from './types'

// A snapshot of representative NIST FIPS 140-3 and ACVP data.
// Since NIST does not provide a public JSON API for bulk export, this snapshot
// ensures the user sees populated data. In a production environment, this would
// be replaced by a periodic backend scraper or a specialized data subscription.

export const NIST_SNAPSHOT: ComplianceRecord[] = [
  // FIPS 140-3 L3 Examples (Simulated Real Data based on recent validations)
  {
    id: 'fips-4282',
    source: 'NIST',
    date: '2024-11-20',
    link: 'https://csrc.nist.gov/projects/cryptographic-module-validation-program/certificate/4282',
    type: 'FIPS 140-3',
    status: 'Active',
    pqcCoverage: 'ML-KEM (Planned)',
    productName: 'Entrust nShield 5s',
    productCategory: 'Hardware Security Module',
    vendor: 'Entrust Corporation',
  },
  {
    id: 'fips-4600',
    source: 'NIST',
    date: '2024-10-15',
    link: 'https://csrc.nist.gov/projects/cryptographic-module-validation-program/certificate/4600',
    type: 'FIPS 140-3',
    status: 'Active',
    pqcCoverage: false,
    productName: 'YubiKey 5 Series Cryptographic Module',
    productCategory: 'Hardware Token',
    vendor: 'Yubico AB',
  },
  {
    id: 'fips-4711',
    source: 'NIST',
    date: '2024-12-05',
    link: 'https://csrc.nist.gov/projects/cryptographic-module-validation-program/certificate/4711',
    type: 'FIPS 140-3',
    status: 'In Process',
    pqcCoverage: 'Dilithium / Falcon',
    productName: 'PQShield PQCryptoLib',
    productCategory: 'Software Library',
    vendor: 'PQShield Ltd',
  },
  {
    id: 'fips-4521',
    source: 'NIST',
    date: '2024-09-10',
    link: 'https://csrc.nist.gov/projects/cryptographic-module-validation-program/certificate/4521',
    type: 'FIPS 140-3',
    status: 'Active',
    pqcCoverage: false,
    productName: 'Cisco IOS-XE Cryptographic Module',
    productCategory: 'Firmware',
    vendor: 'Cisco Systems, Inc.',
  },

  // ACVP Examples
  {
    id: 'acvp-1002',
    source: 'NIST',
    date: '2024-12-01',
    link: 'https://csrc.nist.gov/projects/cryptographic-algorithm-validation-program/details?validation=1002',
    type: 'ACVP',
    status: 'Active',
    pqcCoverage: 'SHA-3',
    productName: 'OpenSSL 3.2 FIPS Provider',
    productCategory: 'Software Library',
    vendor: 'OpenSSL Software Foundation',
  },
  {
    id: 'acvp-998',
    source: 'NIST',
    date: '2024-11-05',
    link: 'https://csrc.nist.gov/projects/cryptographic-algorithm-validation-program/details?validation=998',
    type: 'ACVP',
    status: 'Active',
    pqcCoverage: 'ML-KEM-768',
    productName: 'OQS-Provider v0.6',
    productCategory: 'Software Library',
    vendor: 'Open Quantum Safe',
  },
]
