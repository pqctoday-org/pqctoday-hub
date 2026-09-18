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
  /**
   * The classical families this PQC family is the standards-track successor
   * to (2026-09-17). PQC families only. Until this edge existed the
   * classical→PQC pairing lived nowhere: the landscape tile put "Classical"
   * chips beside "PQC" chips and left the reader to pair them — 16 TLS rows
   * showed ECDSA beside a PQC column holding only ML-KEM, which reads as
   * "ECDSA → ML-KEM". Every entry must be a classical family of a matching
   * kind (a KEM replaces key-exchange/encryption families, a signature
   * scheme replaces signature families) — driftguard-tested.
   */
  replaces?: string[]
  /**
   * Classical families with NO standardised PQC successor say why, so the
   * driftguard's "every classical asymmetric family is replaced" rule can
   * admit them explicitly rather than by omission (BLS, Schnorr).
   */
  noReplacementReason?: string
  /**
   * Symmetric/hash families are not replaced — they are re-sized. Rendered
   * where a reader might otherwise look for the missing PQC chip.
   */
  quantumSafeNote?: string
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
    // Split from a single `RSA` family on 2026-09-17. One family spanning
    // signature AND key transport made the classical→PQC pairing
    // uncomputable: a row's "RSA" could not say whether ML-KEM or ML-DSA was
    // its successor. CycloneDX already draws the same line (RSASSA vs RSAES).
    family: 'RSA-sig',
    classical: true,
    kinds: ['signature'],
    registryMembers: ['RSA-2048', 'RSA-3072', 'RSA-4096'],
    cycloneDxFamilies: ['RSASSA-PKCS1', 'RSASSA-PSS'],
    oids: [],
  },
  {
    // RSA key transport / key wrapping: TLS 1.2 RSA key exchange, RSAES-OAEP
    // wrapping in KMS/HSM/PKCS#11, S/MIME and OpenPGP encrypt-to, PKINIT.
    family: 'RSA-kex',
    classical: true,
    kinds: ['key-exchange', 'encryption'],
    registryMembers: ['RSA-2048', 'RSA-3072', 'RSA-4096'],
    cycloneDxFamilies: ['RSAES-PKCS1', 'RSAES-OAEP'],
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
    //
    // NAMED 'EdDSA', not 'Ed25519' — caught by testing before writing any
    // content against it. verify-mechanism-proofs.py's MECHANISM_PATTERNS
    // (the grounding gate's own matcher) keys this family "EdDSA" and every
    // other family here already equals its matcher key by convention
    // (ML-KEM↔ML-KEM, X25519↔X25519). Naming it 'Ed25519' would have made
    // every real, correctly-cited Ed25519 claim compute as UNSUPPORTED — a
    // silent false negative on genuinely proven data, not a content error.
    family: 'EdDSA',
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
    noReplacementReason:
      'No standardised PQC successor for pairing-based aggregate signatures; chains using BLS are researching lattice aggregation, none is on a standards track.',
  },
  {
    // Added 2026-08-16 — Polkadot/Substrate's default account-signing scheme
    // (sr25519 / Schnorrkel: Schnorr signatures over Ristretto-compressed
    // Curve25519), also used for BABE consensus. A genuinely distinct
    // mechanism from EdDSA and ECDSA — not just another curve choice for an
    // existing family — confirmed by checking Polkadot's own wiki, which
    // lists sr25519, Ed25519, and ECDSA as three SEPARATE account options.
    // The same family also covers Bitcoin's BIP-340 Taproot signatures and
    // FROST (RFC 9591) threshold signatures used in DeFi MPC custody — found
    // both while researching this addition but scoped out of this session's
    // rows; flagged for the vocabulary-gaps audit instead of built now.
    family: 'Schnorr',
    classical: true,
    kinds: ['signature'],
    // sr25519 added to ALGORITHM_REGISTRY alongside this change
    // (scripts/generate-algorithm-properties.ts,
    // pqc_complete_algorithm_reference_08162026.csv) — byte sizes verified
    // against w3f/schnorrkel's own PUBLIC_KEY_LENGTH/SIGNATURE_LENGTH
    // constants, not assumed.
    registryMembers: ['sr25519'],
    // No 'Schnorr' entry in the CycloneDX 1.7 cryptography registry.
    cycloneDxFamilies: [],
    // No established OID — Schnorrkel is a Web3 Foundation implementation,
    // not an IETF/NIST curve registration.
    oids: [],
    noReplacementReason:
      'Schnorr/sr25519 have no standardised PQC successor; the practical successor is a signature-scheme change (ML-DSA/SLH-DSA) at the chain level, which the chain rows claim directly.',
  },
  {
    // Added 2026-08-16 — confirmed real via the industry-landscape gap
    // audit's telecom vocabulary-gap lead, then verified against the actual
    // ETSI spec text (not just a search summary): ETSI TS 135 216 V17.0.0,
    // "Specification of the 3GPP Confidentiality and Integrity Algorithms
    // UEA2 & UIA2; Document 2: SNOW 3G specification". A stream cipher, not
    // a signature/KEM family — symmetric, like AES/SHA (no
    // ALGORITHM_REGISTRY member; see SYMMETRIC_EXEMPT in the driftguard).
    family: 'SNOW3G',
    classical: true,
    kinds: ['encryption'],
    registryMembers: [],
    cycloneDxFamilies: ['SNOW3G'],
    oids: [],
    quantumSafeNote:
      'Symmetric stream cipher — no PQC replacement; the 3GPP uplift is the 256-bit Snow-5G family (TS 35.240).',
  },
  {
    // Added 2026-08-16 — same audit lead as SNOW3G, the 5G-carried sibling
    // algorithm. Verified against ETSI TS 135 222 V17.0.0, "Specification
    // of the 3GPP Confidentiality and Integrity Algorithms EEA3 & EIA3;
    // Document 2: ZUC specification" (fetched and read, not assumed).
    family: 'ZUC',
    classical: true,
    kinds: ['encryption'],
    registryMembers: [],
    cycloneDxFamilies: ['ZUC'],
    oids: [],
    quantumSafeNote:
      'Symmetric stream cipher — no PQC replacement; the 3GPP uplift is 256-bit ZUC (TS 35.246).',
  },
  {
    // Added 2026-08-16 — confirmed real via the industry-landscape gap
    // audit's payments vocabulary-gap lead. China's national ('ShangMi')
    // signature algorithm; verified against RFC 8998 (SM2 §3.2.1, TLS 1.3
    // profile) and RFC 9563 (SM2 for DNSSEC — source of the byte sizes
    // below), both fetched and read directly, not assumed from a search
    // summary.
    family: 'SM2',
    classical: true,
    kinds: ['signature'],
    // Added to ALGORITHM_REGISTRY alongside this change
    // (scripts/generate-algorithm-properties.ts,
    // pqc_complete_algorithm_reference_08162026.csv) — 64-byte uncompressed
    // public key (x||y), 32-byte private key, 64-byte signature (r||s),
    // verified against RFC 9563 §4.1/§4.2 directly.
    registryMembers: ['SM2'],
    cycloneDxFamilies: ['SM2'],
    // GM/T 0006-2012 (China); confirmed present in the CycloneDX 1.7
    // registry's own OID field for SM2.
    oids: ['1.2.156.10197.1.301'],
  },
  {
    family: 'ML-KEM',
    classical: false,
    kinds: ['kem'],
    registryMembers: ['ML-KEM-512', 'ML-KEM-768', 'ML-KEM-1024'],
    cycloneDxFamilies: ['ML-KEM'],
    oids: ['2.16.840.1.101.3.4.4.1', '2.16.840.1.101.3.4.4.2', '2.16.840.1.101.3.4.4.3'],
    replaces: ['ECDH', 'X25519', 'RSA-kex'],
  },
  {
    family: 'ML-DSA',
    classical: false,
    kinds: ['signature'],
    registryMembers: ['ML-DSA-44', 'ML-DSA-65', 'ML-DSA-87'],
    cycloneDxFamilies: ['ML-DSA'],
    oids: ['2.16.840.1.101.3.4.3.17', '2.16.840.1.101.3.4.3.18', '2.16.840.1.101.3.4.3.19'],
    replaces: ['RSA-sig', 'ECDSA', 'EdDSA', 'SM2'],
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
    replaces: ['RSA-sig', 'ECDSA', 'EdDSA', 'SM2'],
  },
  {
    family: 'FN-DSA',
    classical: false,
    kinds: ['signature'],
    registryMembers: ['FN-DSA-512', 'FN-DSA-1024'],
    cycloneDxFamilies: [], // absent from the 1.7 registry (FIPS 206 pending)
    oids: [],
    replaces: ['RSA-sig', 'ECDSA', 'EdDSA', 'SM2'],
  },
  {
    family: 'HQC',
    classical: false,
    kinds: ['kem'],
    registryMembers: ['HQC-128', 'HQC-192', 'HQC-256'],
    cycloneDxFamilies: [], // absent from the 1.7 registry
    oids: [],
    replaces: ['ECDH', 'X25519', 'RSA-kex'],
  },
  {
    family: 'FrodoKEM',
    classical: false,
    kinds: ['kem'],
    registryMembers: ['FrodoKEM-640', 'FrodoKEM-976', 'FrodoKEM-1344'],
    cycloneDxFamilies: [], // absent from the 1.7 registry
    oids: [],
    replaces: ['ECDH', 'X25519', 'RSA-kex'],
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
    replaces: ['ECDH', 'X25519', 'RSA-kex'],
  },
  {
    family: 'LMS',
    classical: false,
    kinds: ['signature'],
    registryMembers: ['LMS-SHA256 (H20/W8)'],
    cycloneDxFamilies: ['LMS'],
    oids: [],
    // Stateful: firmware/code signing profiles only (SP 800-208, CNSA 2.0),
    // never general-purpose protocol authentication.
    replaces: ['RSA-sig', 'ECDSA'],
  },
  {
    family: 'XMSS',
    classical: false,
    kinds: ['signature'],
    registryMembers: ['XMSS-SHA2_20'],
    cycloneDxFamilies: ['XMSS'],
    oids: [],
    // Stateful: firmware/code signing profiles only (SP 800-208, CNSA 2.0),
    // never general-purpose protocol authentication.
    replaces: ['RSA-sig', 'ECDSA'],
  },
  {
    family: 'AES',
    classical: true,
    kinds: ['encryption'],
    registryMembers: [], // symmetric — see interface doc; not in ALGORITHM_REGISTRY
    cycloneDxFamilies: ['AES'],
    oids: [],
    quantumSafeNote:
      'Not replaced — re-sized. Grover halves the effective key length, so AES-256 stays at 128-bit post-quantum strength.',
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
    quantumSafeNote:
      'Not replaced — re-sized. Use SHA-384 or SHA3-384+ where 192-bit post-quantum collision strength is required; SHA-1 is broken classically.',
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

/** PQC families that name `classicalFamily` in their `replaces` edge. */
export function pqcReplacementsFor(classicalFamily: string): CryptoMechanismFamily[] {
  return PQC_MECHANISM_FAMILIES.filter((m) => m.replaces?.includes(classicalFamily))
}

/**
 * The kind a family is grouped under on the landscape tile: KEMs and
 * key-exchange families share one row because a KEM is what replaces a key
 * exchange; everything else groups by its first declared kind.
 */
export type MechanismGroup = 'key-exchange' | 'signature' | 'symmetric'
export function mechanismGroup(family: string): MechanismGroup {
  const def = byFamily.get(family)
  if (!def) return 'symmetric'
  if (def.kinds.includes('signature')) return 'signature'
  if (def.kinds.includes('kem') || def.kinds.includes('key-exchange')) return 'key-exchange'
  return 'symmetric'
}
