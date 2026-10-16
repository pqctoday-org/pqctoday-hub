// SPDX-License-Identifier: GPL-3.0-only
/**
 * Dated advisories from a standards or national body that change how an algorithm
 * should be used without changing its standards status. Classic McEliece stays a
 * published ISO/IEC 18033-2 Amd 2 standard and stays listed in BSI TR-02102-1
 * (2026-01), so its status tier is unchanged. What changed is the BSI's advice for
 * new work, and readers need to see that next to the algorithm.
 *
 * Each entry quotes its source. Wording must say "advises against new use", never
 * "withdrawn": the BSI has not removed the scheme from TR-02102-1.
 */

export interface AlgorithmAdvisory {
  /** Short badge label */
  label: string
  /** Tooltip / detail sentence */
  note: string
  /** Body that issued the advisory */
  issuer: string
  /** ISO date the advisory was published */
  date: string
  sourceUrl: string
}

export const BSI_CLASSIC_MCELIECE_ADVISORY: AlgorithmAdvisory = {
  label: 'BSI: not for new use',
  note: 'On 1 Oct 2026 the BSI advised against using Classic McEliece for new developments or new cryptographic applications, citing 2026 progress in its cryptanalysis. It reports no practical attack on the TR-02102-1 parameter sets. TR-02102-1 (2026-01) still lists it for hybrid use until its next revision.',
  issuer: 'BSI',
  date: '2026-10-01',
  sourceUrl:
    'https://www.bsi.bund.de/SharedDocs/Downloads/DE/BSI/Krypto/Hinweis_Classic_McEliece.html',
}

/** Matches "Classic-McEliece-460896", "Classic McEliece 6688128 (BSI Level 5)", "mceliece6960119". */
const CLASSIC_MCELIECE_RE = /(classic[\s-]?)?mceliece/i

export function getAlgorithmAdvisory(algorithmName: string): AlgorithmAdvisory | undefined {
  if (CLASSIC_MCELIECE_RE.test(algorithmName)) return BSI_CLASSIC_MCELIECE_ADVISORY
  return undefined
}
