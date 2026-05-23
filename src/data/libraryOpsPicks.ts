// SPDX-License-Identifier: GPL-3.0-only
/**
 * Curated "Cert-relevant set" library picks for the ops persona
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
 *     which four PP-Modules are most cert-relevant for the ops persona. Once
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
      'The first finalised NIST post-quantum standard. Required for any FIPS 140-3 module that claims PQC key-establishment support.',
  },
  {
    referenceId: 'FIPS 204',
    label: 'FIPS 204 — ML-DSA',
    blurb:
      'Post-quantum digital signatures. ML-DSA-44/65/87 are the algorithms FIPS modules must implement to claim PQC signing support.',
  },
  {
    referenceId: 'FIPS 205',
    label: 'FIPS 205 — SLH-DSA',
    blurb:
      'Hash-based stateless signatures. Slower than ML-DSA but with stronger conservative-security claims — used in firmware and root-CA roles.',
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
      "The program-management bible: how FIPS 140-3 validations are submitted, reviewed, and tracked. Cert-relevant ops can't ship without internalising this.",
  },
  {
    referenceId: 'NIST-FIPS140-3-IG-PQC',
    label: 'FIPS 140-3 IG — Post-Quantum Cryptography',
    blurb:
      'The CMVP Implementation Guidance for PQC: defines how ML-KEM, ML-DSA, and SLH-DSA must be implemented to pass FIPS 140-3 validation. Pair with the CMVP Management Manual for the full submission lifecycle.',
  },
] as const

export function getLibraryOpsPicks(): readonly LibraryOpsPick[] {
  return LIBRARY_OPS_PICKS
}
