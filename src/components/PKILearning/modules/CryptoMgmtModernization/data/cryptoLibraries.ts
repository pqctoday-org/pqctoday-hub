// SPDX-License-Identifier: GPL-3.0-only
/**
 * Crypto library posture data for the LibraryCBOMBuilder workshop.
 * Version / EoL / FIPS 140-3 validation / PQC support / CVE posture.
 *
 * NOTE: EoL dates and CVE counts are illustrative for educational use. CMVP
 * certificate numbers, FIPS statuses and SP 800-90B ESV statuses were re-checked
 * against the CMVP certificate pages, the Modules-in-Process list and the ESV
 * certificate search on 2026-09-24 (rows marked lastVerified 2026-09-24). An ESV
 * status here means the vendor holds an entropy-source certificate for that
 * product line; check the module's Security Policy for which one it uses.
 * Always verify live against csrc.nist.gov/projects/
 * cryptographic-module-validation-program and the vendor's official pages.
 */

export type FipsStatus =
  | 'active' // validated cert currently active
  | 'active-pqc' // active cert covers FIPS 203/204/205
  | 'historical' // cert expired/superseded but still usable per SP 800-131B
  | 'revoked' // cert revoked
  | 'in-mip' // module in Modules-in-Process queue
  | 'not-validated' // no CMVP validation

export type EsvStatus =
  | 'active' // SP 800-90B ESV certificate currently active
  | 'historical' // ESV cert expired or superseded
  | 'revoked' // ESV cert revoked
  | 'in-mip' // ESV submission in NIST Entropy Source Validation Program queue
  | 'not-validated' // no SP 800-90B ESV submission

export type RiskColor = 'red' | 'yellow' | 'green'

export interface CryptoLibrary {
  id: string
  name: string
  vendor: string
  latestVersion: string
  eolDate: string | null // ISO date, null = actively supported
  fipsStatus: FipsStatus
  cmvpCertNumber: string | null
  esvStatus: EsvStatus // SP 800-90B entropy source validation status
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
    fipsStatus: 'active',
    cmvpCertNumber: '#4985 (OpenSSL FIPS Provider; FIPS 140-3 L1, 11 Mar 2025)',
    esvStatus: 'not-validated',
    pqcSupport:
      'ML-KEM, ML-DSA, SLH-DSA in OpenSSL 3.5; none is in the approved-algorithm list of #4985',
    openCveHigh: 1,
    lastVerified: '2026-09-24',
    posture: 'green',
    notes:
      'OpenSSL 3.5 LTS is the recommended production target. Its PQC algorithms are not yet inside a validated boundary: another OpenSSL FIPS Provider entry is on the CMVP Modules-in-Process list (Comment Resolution - Lab, 21 Sep 2026), which is not evidence of the outcome. No ESV certificate is held by the OpenSSL project itself; several distributions hold ESV certificates for their own OpenSSL jitter entropy sources.',
  },
  {
    id: 'openssl-1.1.1',
    name: 'OpenSSL',
    vendor: 'OpenSSL Project',
    latestVersion: '1.1.1w',
    eolDate: '2023-09-11',
    fipsStatus: 'historical',
    cmvpCertNumber: '#3622 (Canonical Ubuntu 18.04 OpenSSL module; FIPS 140-2, historical)',
    esvStatus: 'not-validated',
    pqcSupport: 'None',
    openCveHigh: 3,
    lastVerified: '2026-09-24',
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
    cmvpCertNumber: '#5244 (BoringCrypto; FIPS 140-3 L1, 18 Apr 2026)',
    esvStatus: 'active',
    pqcSupport:
      'Hybrid X25519MLKEM768 in Chrome/Android production; ML-DSA experimental; no PQC algorithm in the approved-algorithm list of #5244',
    openCveHigh: 0,
    lastVerified: '2026-09-24',
    posture: 'yellow',
    notes:
      'Google does not offer official external support contracts. FIPS validation bound to specific snapshot tags. ESV: E321 BoringCrypto Jitter Entropy (11 Mar 2026).',
  },
  {
    id: 'liboqs',
    name: 'liboqs',
    vendor: 'Open Quantum Safe',
    latestVersion: '0.12.0',
    eolDate: null,
    fipsStatus: 'not-validated',
    cmvpCertNumber: null,
    esvStatus: 'not-validated',
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
    fipsStatus: 'active',
    cmvpCertNumber: '#4718 (wolfCrypt; FIPS 140-3 L1)',
    esvStatus: 'active',
    pqcSupport:
      'ML-KEM, ML-DSA available in the library; not yet inside the FIPS 140-3 boundary (CMVP #4718 shows no PQC mechanisms)',
    openCveHigh: 0,
    lastVerified: '2026-09-24',
    posture: 'yellow',
    notes:
      'FIPS 140-3 boundary does not yet cover PQC algorithms per NIST CMVP. PQC APIs available outside the FIPS module; verify ACVP submission status at csrc.nist.gov. ESV: E335 wolfEntropy (1 Jul 2026).',
  },
  {
    id: 'bc-fips',
    name: 'Bouncy Castle FIPS (Java)',
    vendor: 'Legion of the Bouncy Castle',
    latestVersion: '2.0.0',
    eolDate: null,
    fipsStatus: 'active',
    cmvpCertNumber: '#4943 (BC-FJA v2.1.1; FIPS 140-3 L1)',
    esvStatus: 'active',
    pqcSupport:
      'ML-KEM, ML-DSA available (non-FIPS path); #4943 lists LMS SigVer as its only approved PQC-family algorithm',
    openCveHigh: 2,
    lastVerified: '2026-09-24',
    posture: 'yellow',
    notes:
      'ML-KEM and ML-DSA are not inside the #4943 boundary. A BC-FJA entry is on the CMVP Modules-in-Process list (Review, 4 Sep 2026), which is not evidence of the outcome. ESV: E266 Jentropy Engine (27 Jun 2025).',
  },
  {
    id: 'mbedtls',
    name: 'Mbed TLS',
    vendor: 'TrustedFirmware / Arm',
    latestVersion: '3.6.2 LTS',
    eolDate: '2027-07-01',
    fipsStatus: 'not-validated',
    cmvpCertNumber: null,
    esvStatus: 'not-validated',
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
    esvStatus: 'not-validated',
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
    fipsStatus: 'active-pqc',
    cmvpCertNumber: '#5298 / #5314 (AWS-LC 3, dynamic / static; FIPS 140-3 L1, June 2026)',
    esvStatus: 'active',
    pqcSupport:
      'ML-KEM (KeyGen, Encap/Decap) approved on #5298 and #5314; ML-DSA available in the library but not in their approved-algorithm list',
    openCveHigh: 0,
    lastVerified: '2026-09-24',
    posture: 'green',
    notes:
      'AWS support-backed library based on BoringSSL and OpenSSL code. Earlier AWS-LC certificates (#4631, #4816) list no PQC algorithm. AWS-LC 4 entries are on the CMVP Modules-in-Process list, which is not evidence of the outcome. ESV: E77 and E280 AWS-LC CPU Jitter entropy sources.',
  },
]
