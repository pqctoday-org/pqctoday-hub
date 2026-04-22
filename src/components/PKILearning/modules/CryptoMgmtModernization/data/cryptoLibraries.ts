// SPDX-License-Identifier: GPL-3.0-only
/**
 * Crypto library posture data for the LibraryCBOMBuilder workshop.
 * Version / EoL / FIPS 140-3 validation / PQC support / CVE posture.
 *
 * NOTE: CMVP cert numbers, status values, and EoL dates are illustrative for
 * educational use. Always verify live against csrc.nist.gov/projects/
 * cryptographic-module-validation-program and the vendor's official pages.
 */

export type FipsStatus =
  | 'active' // validated cert currently active
  | 'active-pqc' // active cert covers FIPS 203/204/205
  | 'historical' // cert expired/superseded but still usable per SP 800-131B
  | 'revoked' // cert revoked
  | 'in-mip' // module in Modules-in-Process queue
  | 'not-validated' // no CMVP validation

export type RiskColor = 'red' | 'yellow' | 'green'

export interface CryptoLibrary {
  id: string
  name: string
  vendor: string
  latestVersion: string
  eolDate: string | null // ISO date, null = actively supported
  fipsStatus: FipsStatus
  cmvpCertNumber: string | null
  pqcSupport: string // short description
  openCveHigh: number // count of high/critical CVEs in the last year
  lastVerified: string // ISO date
  posture: RiskColor
  notes: string
}

export const CRYPTO_LIBRARIES: CryptoLibrary[] = [
  {
    id: 'openssl-3.5',
    name: 'OpenSSL',
    vendor: 'OpenSSL Project',
    latestVersion: '3.5.0 LTS',
    eolDate: '2030-04-08',
    fipsStatus: 'active-pqc',
    cmvpCertNumber: '#4985 (FIPS provider, PQC hybrid)',
    pqcSupport: 'ML-KEM, ML-DSA via FIPS 3.5 provider; SLH-DSA pending',
    openCveHigh: 1,
    lastVerified: '2026-04-15',
    posture: 'green',
    notes: 'OpenSSL 3.5 LTS is the recommended production target with PQC-capable FIPS provider.',
  },
  {
    id: 'openssl-1.1.1',
    name: 'OpenSSL',
    vendor: 'OpenSSL Project',
    latestVersion: '1.1.1w',
    eolDate: '2023-09-11',
    fipsStatus: 'historical',
    cmvpCertNumber: '#3622 (historical)',
    pqcSupport: 'None',
    openCveHigh: 3,
    lastVerified: '2026-04-15',
    posture: 'red',
    notes:
      'EoL since Sep 2023. Any 1.1.1 deployment is crypto-debt. Premium support contracts available for a fee but do not restore FIPS validity.',
  },
  {
    id: 'boringssl',
    name: 'BoringSSL / BoringCrypto',
    vendor: 'Google',
    latestVersion: '20250310',
    eolDate: null,
    fipsStatus: 'active',
    cmvpCertNumber: '#4816 (BoringCrypto)',
    pqcSupport: 'Hybrid X25519MLKEM768 in Chrome/Android production; ML-DSA experimental',
    openCveHigh: 0,
    lastVerified: '2026-04-18',
    posture: 'yellow',
    notes:
      'Google does not offer official external support contracts. FIPS validation bound to specific snapshot tags.',
  },
  {
    id: 'liboqs',
    name: 'liboqs',
    vendor: 'Open Quantum Safe',
    latestVersion: '0.12.0',
    eolDate: null,
    fipsStatus: 'not-validated',
    cmvpCertNumber: null,
    pqcSupport:
      'All NIST PQC families (ML-KEM, ML-DSA, SLH-DSA, Falcon, FrodoKEM, HQC, Classic McEliece)',
    openCveHigh: 0,
    lastVerified: '2026-04-19',
    posture: 'yellow',
    notes:
      'No FIPS validation (intentional — research/reference library). Use behind a FIPS-validated provider shim for regulated workloads.',
  },
  {
    id: 'wolfcrypt-fips',
    name: 'wolfCrypt FIPS',
    vendor: 'wolfSSL',
    latestVersion: '5.2.1',
    eolDate: null,
    fipsStatus: 'active-pqc',
    cmvpCertNumber: '#4718',
    pqcSupport: 'ML-KEM, ML-DSA (FIPS 203/204); SLH-DSA on roadmap',
    openCveHigh: 0,
    lastVerified: '2026-04-17',
    posture: 'green',
    notes:
      'One of the first FIPS 140-3 validated modules with PQC coverage. Bound to specific build and platform list.',
  },
  {
    id: 'bc-fips',
    name: 'Bouncy Castle FIPS (Java)',
    vendor: 'Legion of the Bouncy Castle',
    latestVersion: '2.0.0',
    eolDate: null,
    fipsStatus: 'active',
    cmvpCertNumber: '#4616',
    pqcSupport: 'ML-KEM, ML-DSA available (non-FIPS path); FIPS IG update pending',
    openCveHigh: 2,
    lastVerified: '2026-04-10',
    posture: 'yellow',
    notes:
      'PQC APIs available but not inside the validated module boundary; ACVP re-certification after Sept 2025 IG update required.',
  },
  {
    id: 'mbedtls',
    name: 'Mbed TLS',
    vendor: 'TrustedFirmware / Arm',
    latestVersion: '3.6.2 LTS',
    eolDate: '2027-07-01',
    fipsStatus: 'not-validated',
    cmvpCertNumber: null,
    pqcSupport: 'Experimental ML-KEM; no FIPS path',
    openCveHigh: 1,
    lastVerified: '2026-04-14',
    posture: 'yellow',
    notes:
      'Common in IoT/embedded. FIPS not part of the project charter; regulated workloads must pair with a validated module.',
  },
  {
    id: 'rustcrypto',
    name: 'RustCrypto suite',
    vendor: 'Rust Crypto project',
    latestVersion: 'rsa-0.10, ed25519-dalek-2.x',
    eolDate: null,
    fipsStatus: 'not-validated',
    cmvpCertNumber: null,
    pqcSupport: 'ml-kem, ml-dsa crates (beta); SLH-DSA in progress',
    openCveHigh: 0,
    lastVerified: '2026-04-16',
    posture: 'yellow',
    notes:
      'Pure-Rust; no CMVP validation. Good for greenfield Rust stacks; combine with aws-lc-rs if FIPS boundary needed.',
  },
  {
    id: 'aws-lc',
    name: 'AWS-LC / aws-lc-rs',
    vendor: 'Amazon Web Services',
    latestVersion: '1.38.x',
    eolDate: null,
    fipsStatus: 'active',
    cmvpCertNumber: '#4631',
    pqcSupport: 'ML-KEM, ML-DSA via post-quantum API surface',
    openCveHigh: 0,
    lastVerified: '2026-04-18',
    posture: 'green',
    notes:
      'AWS support-backed fork of BoringSSL. Active CMVP path for AWS customers; PQC algorithms currently outside the FIPS boundary pending IG alignment.',
  },
]
