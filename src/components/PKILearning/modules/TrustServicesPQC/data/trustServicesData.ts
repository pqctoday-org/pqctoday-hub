// SPDX-License-Identifier: GPL-3.0-only
/**
 * Trust services, timestamping and long-term signature validity.
 *
 * Grounded in cached evidence, transcribed rather than recalled:
 *  - ETSI TS 119 312 V2.1.1 (2026-06) — Cryptographic Suites. Library
 *    `ETSI-TS-119-312-V2-1-1-Electronic-Signatures-and-Trust-Infra`.
 *  - ETSI EN 319 422 V1.1.1 (2016-03) — Time-stamping protocol and token
 *    profiles. Library `ETSI-EN-319-422-V1-1-1-Time-stamping-protocol-and-time-stamp`.
 *  - RFC 3161 — Time-Stamp Protocol. Library
 *    `RFC-3161-Internet-X-509-Public-Key-Infrastructure-Time-Stamp`.
 *  - eIDAS 1.0 (EU 910/2014) and eIDAS 2.0 (EU 2024/1183).
 */

/**
 * Version pairs where the newer edition introduces PQC. This is the module's
 * spine: crypto agility argued from documents rather than from principle.
 */
export interface SupersessionPair {
  family: string
  older: { label: string; date: string; algorithms: string; libraryRef?: string }
  newer: { label: string; date: string; algorithms: string; libraryRef?: string }
  lesson: string
}

export const SUPERSESSION_PAIRS: SupersessionPair[] = [
  {
    family: 'ETSI TS 119 312 — Cryptographic Suites',
    older: {
      label: 'V1.5.1',
      date: 'December 2024',
      algorithms: 'RSA, ECDSA — classical only',
    },
    newer: {
      label: 'V2.1.1',
      date: 'June 2026',
      algorithms: 'RSA, ECDSA + ML-DSA, SLH-DSA, LMS, XMSS, and hybrid modes',
      libraryRef: 'ETSI-TS-119-312-V2-1-1-Electronic-Signatures-and-Trust-Infra',
    },
    lesson:
      'Eighteen months apart, same standard, same committee. Anything built against V1.5.1 has no post-quantum path in it at all — not because the design was wrong, but because the suites document had not caught up yet. This is what standards evolution looks like from the inside.',
  },
  {
    family: 'ETSI TS 102 176-1 → TS 119 312',
    older: {
      label: 'TS 102 176-1 V2.1.1',
      date: 'July 2011',
      algorithms: 'Hash functions and asymmetric algorithms for secure e-signatures',
    },
    newer: {
      label: 'TS 119 312',
      date: 'current',
      algorithms: 'Cryptographic suites for e-signatures',
      libraryRef: 'ETSI-TS-119-312-V2-1-1-Electronic-Signatures-and-Trust-Infra',
    },
    lesson:
      'TS 119 312 V2.1.1 marks its predecessor explicitly: "Withdrawn; superseded by ETSI TS 119 312." Citing the withdrawn document is a live risk in this area, because it was the reference for years and is still widely linked.',
  },
]

/**
 * ETSI's hybrid signature rule, quoted from TS 119 312 V2.1.1 clause 6.4.1.
 * Deliberately paired with the Government & Defense module, where NSA takes
 * the opposite default for National Security Systems.
 */
export const HYBRID_RULE = {
  requirement:
    'For hybrid signatures, implementations shall combine a classical signature and a post-quantum signature. Acceptance requires both signatures to be valid.',
  contrast:
    'The same algorithms, two authorities, opposite defaults. ETSI specifies hybrid modes and the exact pairs to use; NSA does not require hybrids for National Security Systems and lists concrete objections to them. Neither is wrong — they are protecting different things over different lifetimes. Which one applies to you is a jurisdiction question, not a cryptography question.',
}

export interface HybridSuite {
  classical: string
  pqc: string
  useCase: string
}

/** TS 119 312 V2.1.1, Table 3.3 — algorithm-level hybrid combinations. */
export const HYBRID_SUITES: HybridSuite[] = [
  { classical: 'RSA-PSS (≥ 3000 bit)', pqc: 'ML-DSA-65', useCase: 'General purpose, certificates' },
  { classical: 'RSA-PSS (≥ 3000 bit)', pqc: 'ML-DSA-87', useCase: 'High security, long term' },
  { classical: 'ECDSA (P-256/P-384)', pqc: 'ML-DSA-65', useCase: 'General purpose, certificates' },
  { classical: 'ECDSA (P-384/P-521)', pqc: 'ML-DSA-87', useCase: 'High security, long term' },
  { classical: 'EdDSA (Ed25519)', pqc: 'ML-DSA-65', useCase: 'General purpose, certificates' },
  { classical: 'EdDSA (Ed448)', pqc: 'ML-DSA-87', useCase: 'High security, long term' },
  {
    classical: 'ECDSA or EdDSA',
    pqc: 'SLH-DSA (Level 3 or 5)',
    useCase: 'Conservative, hash-based',
  },
]

/**
 * Why timestamping is the quiet hinge of the whole problem. RFC 3161 is
 * algorithm-agnostic: the signing algorithm comes from the TSA's certificate,
 * not from the protocol. That is what makes a PQC migration of timestamps
 * possible without changing the protocol at all.
 */
export const TIMESTAMP_FACTS = {
  protocol: 'RFC 3161 (August 2001, Standards Track), updated by RFC 5816 for ESSCertIDv2.',
  profile:
    'ETSI EN 319 422 V1.1.1 (March 2016) profiles RFC 3161 and RFC 5816 for European qualified timestamps. It names no algorithm itself — it defers to ETSI TS 119 312.',
  whyItMatters:
    'A timestamp is a proof of existence: a TSA signs a hash of your data plus a time. It is what lets a signature made with a certificate that has since been revoked — or with an algorithm since broken — still be evaluated against the moment it was made.',
  agilityPoint:
    'Because RFC 3161 carries the algorithm in the TSA certificate rather than in the protocol, a TSA can migrate to ML-DSA without a protocol change. The layer that has to move is the trust list and the validation policy, not the wire format.',
  updateDue:
    'The European Commission concluded in October 2025 that EN 319 422 needs updating for eIDAS 2.0; a replacement Technical Specification is targeted for 31 May 2027. Until then V1.1.1 remains the current published edition.',
}

export interface LtvStage {
  id: string
  label: string
  horizon: string
  risk: string
  action: string
}

/**
 * Long-term validation, framed by horizon. This is the content that genuinely
 * exists nowhere else in the catalogue.
 */
export const LTV_STAGES: LtvStage[] = [
  {
    id: 'creation',
    label: 'Signature creation',
    horizon: 'Day 0',
    risk: 'None yet — the certificate is valid and the algorithm is current.',
    action: 'Sign, and capture a qualified timestamp at the moment of signing.',
  },
  {
    id: 'cert-expiry',
    label: 'Certificate expiry',
    horizon: '1–3 years',
    risk: 'The signing certificate expires. Without evidence of when the signature was made, verification becomes ambiguous.',
    action: 'The timestamp from day 0 is what carries the signature past this point.',
  },
  {
    id: 'revocation-data',
    label: 'Revocation data ages out',
    horizon: '3–10 years',
    risk: 'CRLs and OCSP responses are no longer retrievable, so a verifier cannot establish that the certificate was good at signing time.',
    action: 'Archive revocation data alongside the signature (the LTV form of the signature).',
  },
  {
    id: 'algorithm-weakens',
    label: 'Signing algorithm weakens',
    horizon: '5–20 years',
    risk: 'The original algorithm is deprecated or broken. A CRQC breaks RSA and ECDSA outright.',
    action:
      'Re-timestamp with a current algorithm before the old one becomes untrustworthy. Each new timestamp attests to the whole previous structure, so the chain stays evaluable.',
  },
  {
    id: 'archival',
    label: 'Archival horizon',
    horizon: '20–30+ years',
    risk: 'Land registries, notarial deeds and medical consent can outlive several algorithm generations.',
    action:
      'A repeated re-timestamping policy is the only mechanism that survives this. It has to be planned at signing time — it cannot be retrofitted once the evidence is gone.',
  },
]

export const ARCHIVAL_WARNING =
  'The migration deadline for a 30-year signature is not the CRQC date. It is the date by which every signature you have already made must be re-timestamped under a quantum-safe algorithm — and that work is proportional to the archive, not to the flow of new signatures.'
