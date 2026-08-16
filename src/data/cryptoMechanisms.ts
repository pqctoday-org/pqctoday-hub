// SPDX-License-Identifier: GPL-3.0-only
//
// Canonical crypto-mechanism vocabulary for the Industry Landscape source.
// Every `classical_mechanisms` / `pqc_mechanisms` / `mechanisms_referenced`
// value in the industry_landscape_* / industry_standards_* CSVs must resolve
// to a family defined here, and every family's members must exist in
// ALGORITHM_REGISTRY (the Detailed-comparison vocabulary) — both invariants
// are driftguard-tested so the tabs can never diverge.
//
// CycloneDX mapping: the CycloneDX 1.7 cryptography registry enumerates
// algorithm FAMILIES (`cryptoProperties.algorithmProperties.algorithmFamily`),
// not per-parameter-set identifiers — concrete sets like "ML-KEM-512" are
// carried in the free-text `parameterSetIdentifier`. `cycloneDxFamilies`
// therefore lists the registry's family enum values ([] = the registry has no
// entry, verified absent 2026-07-29: FN-DSA, HQC, FrodoKEM, Classic McEliece).
// OIDs: PQC parameter-set OIDs are from the NIST CSOR; the CycloneDX registry
// itself carries OIDs only on elliptic-curve entries (listed on ECDSA/ECDH).

import { ALGORITHM_REGISTRY } from './algorithmProperties'
import type { Freshness } from './contentFreshness'

export type MechanismKind = 'kem' | 'signature' | 'key-exchange' | 'encryption' | 'hash'

export interface CryptoMechanismFamily {
  /** Family label used verbatim in the industry-landscape CSVs. */
  family: string
  classical: boolean
  kinds: MechanismKind[]
  /**
   * Parameter-set members — keys into ALGORITHM_REGISTRY. Empty ONLY for
   * symmetric families (AES, SHA): ALGORITHM_REGISTRY is asymmetric-only (it
   * backs the Detailed Comparison tab, which doesn't cover symmetric crypto),
   * but real technical standards (PCI P2PE, ONC health-IT certification,
   * GSMA/ENISA PQC guidance) routinely name AES/SHA as the specific
   * mechanism — excluding them would misrepresent those standards as
   * "generic", the opposite of this vocabulary's purpose.
   */
  registryMembers: (keyof typeof ALGORITHM_REGISTRY)[]
  /** CycloneDX 1.7 registry algorithmFamily enum values; [] = no entry. */
  cycloneDxFamilies: string[]
  /** Verified OIDs (NIST CSOR for PQC sets; curve OIDs for ECC families). */
  oids: string[]
}

/**
 * Provenance of the CycloneDX mapping.
 *
 * CORRECTED 2026-08-15. This block previously claimed it was "checked by the
 * maintenance flow so a registry update surfaces as a freshness finding".
 * Nothing read it — no validator, no script, no freshness entry — while
 * `verifiedAgainst` was being rendered to readers on the Industry Landscape
 * tile as the mapping's provenance date. The claim is now true, via three
 * mechanisms rather than a comment:
 *
 *  1. `industryLandscape.driftguard.test.ts` asserts every `cycloneDxFamilies`
 *     value exists in the vendored registry (`cyclonedxCryptoRegistry.json`).
 *  2. The same file asserts the four deliberately-absent PQC families
 *     (FN-DSA, HQC, FrodoKEM, Classic McEliece) are STILL absent upstream —
 *     when CycloneDX adds one, that test fails and says to map it.
 *  3. `verifiedAgainst` is asserted equal to the vendored copy's own
 *     `lastUpdated`, and registered in `contentFreshness.ts` so the 90-day
 *     audit surfaces the pin when it ages.
 *
 * NOTE the ceiling on (3): `npm run audit:content-freshness` runs in CI with
 * `continue-on-error: true`. It reports; it does not gate.
 */
export const CYCLONEDX_REGISTRY = {
  specVersion: '1.7',
  landingPage: 'https://cyclonedx.org/registry/cryptography/',
  dataUrl: 'https://cyclonedx.org/schema/cryptography-defs.json',
  /** `lastUpdated` of the registry data file this mapping was verified against.
   *  This is the DATA's date, shown to readers as the mapping's provenance. */
  verifiedAgainst: '2026-02-24',
  /**
   * When a human last re-checked this mapping against the LIVE registry — a
   * different fact from `verifiedAgainst`, and the one the 90-day freshness
   * window applies to. An unchanged upstream still needs periodic confirmation
   * that it is unchanged; conflating the two made the manifest read the data's
   * age as our diligence.
   *
   * 2026-08-15: fetched https://cyclonedx.org/schema/cryptography-defs.json —
   * upstream `lastUpdated` still 2026-02-24, still 96 families, and FN-DSA,
   * HQC, FrodoKEM and Classic McEliece all still absent.
   */
  verifiedOn: '2026-08-15',
} as const

/**
 * Structured freshness for the content-freshness manifest — pairs the pin above
 * with the live registry to re-verify it against.
 */
export const CYCLONEDX_MAPPING_FRESHNESS: Freshness = {
  // `verifiedOn`, NOT `verifiedAgainst` — the window measures when we last
  // looked, not how old the upstream data happens to be. A registry that has
  // not moved in six months is not a stale claim; an unchecked one is.
  asOf: CYCLONEDX_REGISTRY.verifiedOn,
  recheck: CYCLONEDX_REGISTRY.dataUrl,
}

export const CRYPTO_MECHANISMS: CryptoMechanismFamily[] = [
  {
    family: 'RSA',
    classical: true,
    kinds: ['signature', 'encryption', 'key-exchange'],
    registryMembers: ['RSA-2048', 'RSA-3072', 'RSA-4096'],
    // No generic "RSA" family exists in the registry — it is split by use.
    cycloneDxFamilies: ['RSASSA-PKCS1', 'RSASSA-PSS', 'RSAES-PKCS1', 'RSAES-OAEP'],
    oids: [],
  },
  {
    family: 'ECDSA',
    classical: true,
    kinds: ['signature'],
    registryMembers: ['ECDSA P-256', 'ECDSA P-384', 'ECDSA P-521'],
    cycloneDxFamilies: ['ECDSA'],
    // Curve OIDs from the registry's ellipticCurvesEnum (nist/P-256|384|521).
    oids: ['1.2.840.10045.3.1.7', '1.3.132.0.34', '1.3.132.0.35'],
  },
  {
    family: 'ECDH',
    classical: true,
    kinds: ['key-exchange'],
    registryMembers: ['ECDH P-256', 'ECDH P-384', 'ECDH P-521'],
    cycloneDxFamilies: ['ECDH'],
    oids: ['1.2.840.10045.3.1.7', '1.3.132.0.34', '1.3.132.0.35'],
  },
  {
    family: 'X25519',
    classical: true,
    kinds: ['key-exchange'],
    registryMembers: ['X25519'],
    // No family of its own — variant pattern "x25519" under ECDH, curve
    // entry other/Curve25519 (no OID in the registry).
    cycloneDxFamilies: ['ECDH'],
    oids: [],
  },
  {
    // Added 2026-08-16 — the actual signing scheme Solana, Cardano, and most
    // Ed25519-based chains use for account/transaction signatures. Absent
    // until now: any chain row citing "EdDSA" or "Ed25519" as its signing
    // mechanism could not be recorded, even though the algorithm itself has
    // been in ALGORITHM_REGISTRY (the Detailed Comparison vocabulary) since
    // before this family existed — a real, silent gap this closes.
    family: 'Ed25519',
    classical: true,
    kinds: ['signature'],
    registryMembers: ['Ed25519'],
    cycloneDxFamilies: ['EdDSA'],
    // RFC 8410 §3, verified against the RFC text directly, not recalled.
    oids: ['1.3.101.112'],
  },
  {
    // Added 2026-08-16 — Ethereum's consensus-layer validator signature
    // scheme (BLS12-381, min-pubkey-size variant) and the aggregation
    // primitive several other chains and DeFi threshold-signature schemes
    // build on. Not yet an ALGORITHM_REGISTRY member before this change —
    // added alongside (scripts/generate-algorithm-properties.ts,
    // pqc_complete_algorithm_reference_08162026.csv).
    family: 'BLS',
    classical: true,
    kinds: ['signature'],
    registryMembers: ['BLS12-381'],
    cycloneDxFamilies: ['BLS'],
    // No established OID for BLS12-381 signatures — pairing-based schemes
    // are not registered the way NIST/RFC curves are. Left empty rather than
    // invented; the CycloneDX family value carries the identity instead.
    oids: [],
  },
  {
    family: 'ML-KEM',
    classical: false,
    kinds: ['kem'],
    registryMembers: ['ML-KEM-512', 'ML-KEM-768', 'ML-KEM-1024'],
    cycloneDxFamilies: ['ML-KEM'],
    oids: ['2.16.840.1.101.3.4.4.1', '2.16.840.1.101.3.4.4.2', '2.16.840.1.101.3.4.4.3'],
  },
  {
    family: 'ML-DSA',
    classical: false,
    kinds: ['signature'],
    registryMembers: ['ML-DSA-44', 'ML-DSA-65', 'ML-DSA-87'],
    cycloneDxFamilies: ['ML-DSA'],
    oids: ['2.16.840.1.101.3.4.3.17', '2.16.840.1.101.3.4.3.18', '2.16.840.1.101.3.4.3.19'],
  },
  {
    family: 'SLH-DSA',
    classical: false,
    kinds: ['signature'],
    registryMembers: [
      'SLH-DSA-SHA2-128s',
      'SLH-DSA-SHA2-128f',
      'SLH-DSA-SHA2-192s',
      'SLH-DSA-SHA2-192f',
      'SLH-DSA-SHA2-256s',
      'SLH-DSA-SHA2-256f',
      'SLH-DSA-SHAKE-128s',
      'SLH-DSA-SHAKE-128f',
      'SLH-DSA-SHAKE-192s',
      'SLH-DSA-SHAKE-192f',
      'SLH-DSA-SHAKE-256s',
      'SLH-DSA-SHAKE-256f',
    ],
    cycloneDxFamilies: ['SLH-DSA'],
    // NIST CSOR: SHA2 variants .20–.25, SHAKE variants .26–.31.
    oids: [
      '2.16.840.1.101.3.4.3.20',
      '2.16.840.1.101.3.4.3.21',
      '2.16.840.1.101.3.4.3.22',
      '2.16.840.1.101.3.4.3.23',
      '2.16.840.1.101.3.4.3.24',
      '2.16.840.1.101.3.4.3.25',
      '2.16.840.1.101.3.4.3.26',
      '2.16.840.1.101.3.4.3.27',
      '2.16.840.1.101.3.4.3.28',
      '2.16.840.1.101.3.4.3.29',
      '2.16.840.1.101.3.4.3.30',
      '2.16.840.1.101.3.4.3.31',
    ],
  },
  {
    family: 'FN-DSA',
    classical: false,
    kinds: ['signature'],
    registryMembers: ['FN-DSA-512', 'FN-DSA-1024'],
    cycloneDxFamilies: [], // absent from the 1.7 registry (FIPS 206 pending)
    oids: [],
  },
  {
    family: 'HQC',
    classical: false,
    kinds: ['kem'],
    registryMembers: ['HQC-128', 'HQC-192', 'HQC-256'],
    cycloneDxFamilies: [], // absent from the 1.7 registry
    oids: [],
  },
  {
    family: 'FrodoKEM',
    classical: false,
    kinds: ['kem'],
    registryMembers: ['FrodoKEM-640', 'FrodoKEM-976', 'FrodoKEM-1344'],
    cycloneDxFamilies: [], // absent from the 1.7 registry
    oids: [],
  },
  {
    family: 'Classic-McEliece',
    classical: false,
    kinds: ['kem'],
    registryMembers: [
      'Classic-McEliece-348864',
      'Classic-McEliece-460896',
      'Classic-McEliece-8192128',
    ],
    cycloneDxFamilies: [], // absent from the 1.7 registry
    oids: [],
  },
  {
    family: 'LMS',
    classical: false,
    kinds: ['signature'],
    registryMembers: ['LMS-SHA256 (H20/W8)'],
    cycloneDxFamilies: ['LMS'],
    oids: [],
  },
  {
    family: 'XMSS',
    classical: false,
    kinds: ['signature'],
    registryMembers: ['XMSS-SHA2_20'],
    cycloneDxFamilies: ['XMSS'],
    oids: [],
  },
  {
    family: 'AES',
    classical: true,
    kinds: ['encryption'],
    registryMembers: [], // symmetric — see interface doc; not in ALGORITHM_REGISTRY
    cycloneDxFamilies: ['AES'],
    oids: [],
  },
  {
    family: 'SHA',
    classical: true,
    kinds: ['hash'],
    registryMembers: [], // symmetric/hash — see interface doc
    // Registry splits by generation (verified 2026-07-29); "SHA" here is the
    // umbrella label industry-landscape CSVs use for any SHA-2/SHA-3 mention.
    cycloneDxFamilies: ['SHA-1', 'SHA-2', 'SHA-3'],
    oids: [],
  },
]

const byFamily = new Map(CRYPTO_MECHANISMS.map((m) => [m.family, m]))

export function getMechanismFamily(family: string): CryptoMechanismFamily | undefined {
  return byFamily.get(family)
}

export function isKnownMechanism(family: string): boolean {
  return byFamily.has(family)
}

export const CLASSICAL_MECHANISM_FAMILIES = CRYPTO_MECHANISMS.filter((m) => m.classical)
export const PQC_MECHANISM_FAMILIES = CRYPTO_MECHANISMS.filter((m) => !m.classical)
