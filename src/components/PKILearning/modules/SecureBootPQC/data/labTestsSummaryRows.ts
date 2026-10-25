// SPDX-License-Identifier: AGPL-3.0-only

/** One case in the "What the lab tests" summary. Each row restates a quotation in part 2. */
export interface LabTestsSummaryRow {
  id: string
  /** The product or signer the case is about */
  who: string
  /** What the NSA expects for it */
  expects: string
  /** Where the full quotation is */
  quoted: string
}

export const LAB_TESTS_SUMMARY_ROWS: readonly LabTestsSummaryRow[] = [
  {
    id: 'verifier-only',
    who: 'Code that only verifies signatures',
    expects: 'CAVP is all the NSA expects.',
    quoted: 'Part 2, CNSA 2.0 FAQ p. 11',
  },
  {
    id: 'signer-nss',
    who: 'A signer that is itself a National Security System (NSS)',
    expects: 'Must follow SP 800-208, hardware validated by CMVP, waivers not granted.',
    quoted: 'Part 2, CNSA 2.0 FAQ pp. 11-12',
  },
  {
    id: 'niap-verify-only',
    who: 'A product under a NIAP protection profile that only verifies, signing done outside it',
    expects: 'Profile requirements apply to verification only, so CAVP, not CMVP, is expected.',
    quoted: 'Part 2, CNSA 2.0 FAQ p. 12',
  },
]
