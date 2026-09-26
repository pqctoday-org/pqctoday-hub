// SPDX-License-Identifier: GPL-3.0-only
/**
 * Canonical evidence-class taxonomy for every validation test result.
 *
 * Source of truth: ACVP/validation remediation plan (2026-09-24) §2.1
 * "Evidence classes are not interchangeable". Every test result carries
 * exactly ONE primary evidence class, and the only public wording allowed for
 * a passing result is that class's `permittedClaim`.
 *
 * The ids are mirrored as an enum in validationCaseManifest.schema.json; the
 * manifest gate (scripts/audit-validation-manifest.ts) fails if the two lists
 * ever drift apart.
 *
 * `UNVERIFIED` is deliberately NOT an evidence class: it marks a vector file
 * or case whose provenance could not be established. Such an entry must be
 * `status: 'quarantined'` in the manifest and never receives an evidence
 * badge (see `evidenceBadgeFor`).
 */

export const EVIDENCE_CLASS_IDS = [
  'nist-acvp-reference-sample',
  'acvts-issued-vector',
  'published-standard-kat',
  'independent-oracle',
  'cross-implementation-differential',
  'functional-round-trip',
  'oasis-profile-case',
  'product-mechanism-probe',
] as const

export type EvidenceClassId = (typeof EVIDENCE_CLASS_IDS)[number]

/** Marker for an entry whose provenance is unknown. Not an evidence class. */
export const UNVERIFIED = 'unverified' as const
export type ManifestEvidenceClass = EvidenceClassId | typeof UNVERIFIED

export interface EvidenceClassMeta {
  id: EvidenceClassId
  /** Short badge label. */
  label: string
  /** What the class means (plan §2.1 "Meaning"). */
  meaning: string
  /**
   * The only claim a passing result of this class may make (plan §2.1
   * "Permitted claim"). Angle-bracket placeholders are filled from the case
   * record (vector-set id, oracle name/version).
   */
  permittedClaim: string
}

export const EVIDENCE_CLASSES: Record<EvidenceClassId, EvidenceClassMeta> = {
  'nist-acvp-reference-sample': {
    id: 'nist-acvp-reference-sample',
    label: 'NIST ACVP-Server reference sample',
    meaning:
      'Expected values copied from the public NIST ACVP-Server repository with immutable source identity.',
    permittedClaim: 'Passes this public NIST ACVP-Server reference sample',
  },
  'acvts-issued-vector': {
    id: 'acvts-issued-vector',
    label: 'ACVTS-issued vector',
    meaning:
      'Prompt issued to an authorized ACVTS test session and executed without changing the prompt.',
    permittedClaim: 'Executed ACVTS-issued vector set <id>; no validation claim until accepted',
  },
  'published-standard-kat': {
    id: 'published-standard-kat',
    label: 'Published standard KAT',
    // Boundary settled 2026-09-26, so it is not re-argued per source: this class
    // admits vectors printed in a formal standard (NIST FIPS/SP, ISO, an OASIS
    // Standard) AND in a consensus RFC, INCLUDING IRTF/Informational ones — e.g.
    // RFC 8439 §2.4.2/§2.8.2 (ChaCha20, AEAD_CHACHA20_POLY1305), RFC 9180 App. A
    // (HPKE), RFC 8032 §7 (EdDSA), RFC 7748 §5.2/§6 (X25519/X448). Several of
    // those are Informational rather than Standards Track, and excluding them
    // would have discarded good published vectors on a document-status
    // technicality while we already rely on RFC 9180 and RFC 8032 elsewhere.
    // What it does NOT admit: values from a third-party project that no standard
    // prints (Google/C2SP Wycheproof is `independent-oracle`, not this), or from
    // a draft with no consensus status. The citation must name the document and
    // the section the values appear in, so a reader can check them.
    meaning: 'Expected values printed in a cited standard or consensus RFC.',
    permittedClaim: "Passes the cited standard's example/KAT",
  },
  'independent-oracle': {
    id: 'independent-oracle',
    label: 'Independent oracle',
    meaning: 'Expected values produced by a separately identified implementation such as OpenSSL.',
    permittedClaim: 'Agrees with <oracle/version> for this case',
  },
  'cross-implementation-differential': {
    id: 'cross-implementation-differential',
    label: 'Cross-implementation differential',
    meaning: 'Two implementations agree for the same inputs.',
    permittedClaim: 'C++ and Rust agree for this case',
  },
  'functional-round-trip': {
    id: 'functional-round-trip',
    label: 'Functional round-trip',
    meaning:
      'Output produced by an implementation is consumed by the same or paired implementation.',
    permittedClaim: 'Completes this round-trip; no external correctness claim',
  },
  'oasis-profile-case': {
    id: 'oasis-profile-case',
    label: 'OASIS profile case',
    meaning: 'An identified OASIS PKCS#11 Profiles test case is replayed.',
    permittedClaim: 'Passes this named OASIS profile case',
  },
  'product-mechanism-probe': {
    id: 'product-mechanism-probe',
    label: 'Product mechanism probe',
    meaning: 'A PQC Today-authored test of a cited PKCS#11 behavior.',
    permittedClaim: 'Passes this product-authored probe',
  },
}

/** Chip text per class — the same words on the workbench, Algorithms and Learn. */
export const EVIDENCE_CLASS_SHORT: Record<EvidenceClassId, string> = {
  'nist-acvp-reference-sample': 'NIST ACVP sample',
  'acvts-issued-vector': 'ACVTS-issued',
  'published-standard-kat': 'Standard KAT',
  'independent-oracle': 'Oracle comparison',
  'cross-implementation-differential': 'Differential',
  'functional-round-trip': 'Functional',
  'oasis-profile-case': 'OASIS case',
  'product-mechanism-probe': 'Product probe',
}

export function isEvidenceClassId(value: unknown): value is EvidenceClassId {
  return typeof value === 'string' && (EVIDENCE_CLASS_IDS as readonly string[]).includes(value)
}

/**
 * The badge a manifest entry may display, or `undefined` when it must show
 * none: quarantined and unverified entries never receive an evidence badge
 * (plan B-2 acceptance criterion).
 */
export function evidenceBadgeFor(entry: {
  evidenceClass: ManifestEvidenceClass
  status: 'active' | 'quarantined'
}): EvidenceClassMeta | undefined {
  if (entry.status !== 'active') return undefined
  if (!isEvidenceClassId(entry.evidenceClass)) return undefined
  return EVIDENCE_CLASSES[entry.evidenceClass]
}
