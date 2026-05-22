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
 * Deferred to a follow-up CSV-data task (none of these exist as of the
 * 05222026 library CSV; substituting unrelated IDs would dilute the panel):
 *
 *   - Four most-cited CC PP-Modules — Common Criteria Protection Profile
 *     Modules. Audit plan §P1 calls them out by category, not by specific
 *     ID, so the data task is twofold: (1) decide which four to ship, and
 *     (2) add their rows to the library CSV with proper enrichment.
 *   - `CMVP-IG-D.K` — NIST CMVP Implementation Guidance section D.K. The
 *     program-management peer of `CMVP-MGMT-MANUAL` (already in this list).
 *
 * Once those four-plus-one rows land in the CSV, append them here as picks
 * 7–11 to hit the audit plan's ~10-entry target.
 */
import type { LibraryCuriousPick } from './libraryCuriousPicks'

export type LibraryOpsPick = LibraryCuriousPick

export const LIBRARY_OPS_PICKS: readonly LibraryOpsPick[] = [
  {
    referenceId: 'FIPS 203',
    label: 'FIPS 203 — ML-KEM',
    blurb:
      "The first finalised NIST post-quantum standard. Required for any FIPS 140-3 module that claims PQC key-establishment support.",
  },
  {
    referenceId: 'FIPS 204',
    label: 'FIPS 204 — ML-DSA',
    blurb:
      "Post-quantum digital signatures. ML-DSA-44/65/87 are the algorithms FIPS modules must implement to claim PQC signing support.",
  },
  {
    referenceId: 'FIPS 205',
    label: 'FIPS 205 — SLH-DSA',
    blurb:
      "Hash-based stateless signatures. Slower than ML-DSA but with stronger conservative-security claims — used in firmware and root-CA roles.",
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
      "How to deploy KEMs safely: parameter selection, hybrid constructions, key-derivation rules. The how-to for FIPS 203 in real protocols.",
  },
  {
    referenceId: 'CMVP-MGMT-MANUAL',
    label: 'CMVP Management Manual',
    blurb:
      "The program-management bible: how FIPS 140-3 validations are submitted, reviewed, and tracked. Cert-relevant ops can't ship without internalising this.",
  },
] as const

export function getLibraryOpsPicks(): readonly LibraryOpsPick[] {
  return LIBRARY_OPS_PICKS
}
