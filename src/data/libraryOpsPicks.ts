// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Curated "Certification starter set" Library picks for the ops persona
 * (P04 audit — persona-overwhelm-p0, PR 2 / P1).
 *
 * Ops engineers driving FIPS / CMVP / CC certification work want a tight
 * set of standards plus the program-management references that govern how
 * validations are run.  Surfaced above the main library grid on `/library`
 * when the active persona is ops.
 *
 * `referenceId` values match `LibraryItem.referenceId` in the canonical CSV.
 *
 * Audit plan called for ~10 picks; this file ships 7. The `CMVP-IG-D.K`
 * placeholder from the original plan is satisfied by `NIST-FIPS140-3-IG-PQC`
 * — the FIPS 140-3 Implementation Guidance for PQC, which is the canonical
 * CMVP IG document covering ML-KEM / ML-DSA / SLH-DSA validation rules.
 * It was already in the library CSV; the audit plan just used a less-precise
 * shorthand.
 *
 * Still deferred (would bring this list to ~11):
 *
 *   - Four most-cited CC Protection Profile Modules. The audit plan calls
 *     them out by category, not by specific ID. Naming them requires either
 *     (a) CC citation data we don't currently track, or (b) product input on
 *     which four PP-Modules are most useful to certification learners. Once
 *     decided, the data task is to add their rows to the library CSV (with
 *     proper enrichment) and append them here as picks 8–11.
 */
import type { LibraryCuriousPick } from './libraryCuriousPicks'

export type LibraryOpsPick = LibraryCuriousPick

export const LIBRARY_OPS_PICKS: readonly LibraryOpsPick[] = [
  {
    referenceId: 'FIPS 203',
    label: 'FIPS 203 — ML-KEM',
    blurb:
      'One of NIST’s first three final post-quantum standards, published in August 2024. It specifies ML-KEM; a module implementing ML-KEM must follow FIPS 203 and the applicable FIPS 140-3 validation guidance.',
  },
  {
    referenceId: 'FIPS 204',
    label: 'FIPS 204 — ML-DSA',
    blurb:
      'Specifies the ML-DSA-44, ML-DSA-65 and ML-DSA-87 post-quantum signature parameter sets. Read it when a module implements or claims conformance to ML-DSA; it is not the only NIST-approved post-quantum signature standard.',
  },
  {
    referenceId: 'FIPS 205',
    label: 'FIPS 205 — SLH-DSA',
    blurb:
      'Specifies twelve SLH-DSA stateless hash-based signature parameter sets. It offers a different mathematical foundation from ML-DSA, with larger signatures and different performance trade-offs.',
  },
  {
    referenceId: 'NIST SP 800-208',
    label: 'NIST SP 800-208 — Stateful Signatures',
    blurb:
      'LMS / HSS / XMSS stateful hash-based signatures. Required reading for boot-loader, firmware-signing, and HSM teams.',
  },
  {
    referenceId: 'NIST SP 800-227',
    label: 'NIST SP 800-227 — KEM Recommendations',
    blurb:
      'How to deploy KEMs safely: parameter selection, hybrid constructions, key-derivation rules. The how-to for FIPS 203 in real protocols.',
  },
  {
    referenceId: 'CMVP-MGMT-MANUAL',
    label: 'CMVP Management Manual',
    blurb:
      'Explains CMVP roles, submission, review, certificate issuance and maintenance. It describes the validation programme process; it is not an algorithm specification or a validation result.',
  },
  {
    referenceId: 'NIST-FIPS140-3-IG-PQC',
    label: 'FIPS 140-3 IG — Post-Quantum Cryptography',
    blurb:
      'CMVP implementation guidance applying FIPS 140-3 to ML-KEM, ML-DSA and SLH-DSA, including self-test and KEM guidance. Pair it with the Management Manual to understand the submission lifecycle.',
  },
] as const

export function getLibraryOpsPicks(): readonly LibraryOpsPick[] {
  return LIBRARY_OPS_PICKS
}
