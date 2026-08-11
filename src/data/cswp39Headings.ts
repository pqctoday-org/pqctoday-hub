// SPDX-License-Identifier: GPL-3.0-only
/**
 * The real section headings of NIST CSWP 39-upd1, "Considerations for Achieving
 * Crypto Agility: Strategies and Practices" (published 2025-12-19; CSWP 39 was
 * withdrawn 2026-06-29 and superseded in its entirety by -upd1).
 *
 * Extracted verbatim from the publication PDF, not paraphrased. This exists so
 * that every §-reference the app renders can be checked against the document
 * instead of against another hand-authored file.
 *
 * Why: a 2026-08-10 audit found `cswp39Data.ts` attributing invented titles to
 * real section numbers — "§5.2 Inventory — CBOM and Information Repository"
 * when §5.2 is "Crypto Security Policy Enforcement", plus a "§5.5" that does
 * not exist (§5 runs 5.1–5.4). Full-text search of the publication returns zero
 * occurrences of "repository", "CBOM", "SBOM" or "bill of materials".
 *
 * Source: https://doi.org/10.6028/NIST.CSWP.39-upd1
 * Local evidence: pqctoday-priv/local-evidence-cache/library/NIST_CSWP_39.pdf
 * Extracted: 2026-08-10
 */

/** Every numbered heading in CSWP 39-upd1, ref → verbatim title. */
export const CSWP39_REAL_HEADINGS: Readonly<Record<string, string>> = {
  '§1': 'Introduction',
  '§2': 'Historic Transitions and Challenges',
  '§2.1': 'Long Period for a Transition',
  '§2.2': 'Backward Compatibility and Interoperability Challenges',
  '§2.3': 'Constant Needs of Transition',
  '§2.4': 'Resource and Performance Challenges',
  '§3': 'Crypto Agility for Security Protocols',
  '§3.1': 'Algorithm Identification',
  '§3.1.1': 'Mandatory-to-Implement Algorithms',
  '§3.1.2': 'Dependent Specifications',
  '§3.2': 'Algorithm Transitions',
  '§3.2.1': 'Preserving Protocol Interoperability',
  '§3.2.2': 'Providing Notices of Expected Changes',
  '§3.2.3': 'Integrity for Algorithm Negotiation',
  '§3.2.4': 'Hybrid Cryptographic Algorithms',
  '§3.3': 'Cryptographic Key Establishment',
  '§3.4': 'Balancing Security Strength and Protocol Complexity',
  '§3.4.1': 'Balancing the Security Strength of Algorithms in a Cipher Suite',
  '§3.4.2': 'Balancing Protocol Complexity',
  '§4': 'Crypto Agility in System Implementations',
  '§4.1': 'Using an API in a Crypto Library Application',
  '§4.2': 'Using APIs in the Operating System Kernel',
  '§4.3': 'Using Service Mesh in Cloud-Native Environments',
  '§4.4': 'Embedded Systems',
  '§4.5': 'Hardware',
  '§4.6': 'Using a Crypto Gateway for Legacy Systems',
  '§5': "Crypto Agility Strategic Plan for Managing Organizations' Crypto Risks",
  '§5.1': 'Cryptographic Standards, Regulations, and Mandates',
  '§5.2': 'Crypto Security Policy Enforcement',
  '§5.3': 'Technology Supply Chains',
  '§5.4': 'Cryptographic Architecture',
  '§6': 'Considerations for Future Works',
  '§6.1': 'Resource Considerations',
  '§6.2': 'Agility-Aware Design',
  '§6.3': 'Complexity and Security',
  '§6.4': 'Crypto Agility in the Cloud',
  '§6.5': 'Maturity Assessment for Crypto Agility',
  '§6.6': 'Common Crypto API',
  '§7': 'Conclusion',
}

/**
 * Terms that do NOT appear anywhere in CSWP 39-upd1, however plausible they
 * sound in a crypto-agility context. Guarded by test so they cannot be
 * reintroduced as attributed content.
 */
export const CSWP39_ABSENT_TERMS: readonly string[] = [
  'Information Repository',
  'CBOM',
  'SBOM',
  'bill of materials',
  '§5.5',
]

/** True when `ref` (e.g. "§5.2") is a real numbered heading in CSWP 39-upd1. */
export function isRealCswp39Ref(ref: string): boolean {
  return ref in CSWP39_REAL_HEADINGS
}
