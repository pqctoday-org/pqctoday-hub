// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Dated advisories from a standards or national body that change how an algorithm
 * should be used without changing its standards status. Publication and recommendation are separate assertions. ISO and historical
 * BSI parameter coverage vary by exact set (348864 is not in the ISO list
 * supplied by the scheme authors). What changed is the BSI's advice for
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
  documentDate?: string
  publishedAt?: string
  sourceHash?: string
}

export const BSI_CLASSIC_MCELIECE_ADVISORY: AlgorithmAdvisory = {
  label: 'BSI: not for new use',
  note: 'BSI advises against Classic McEliece for new developments. Its 29 Sep 2026 advisory, announced 1 Oct, reports an unreviewed key-recovery claim of 2^99–2^102 operations and expects further improvements. It reports no practical attack on the TR parameter sets; this does not remove the warning. Historical hybrid recommendations apply only to the listed sets; revision is expected early 2027.',
  documentDate: '2026-09-29',
  publishedAt: '2026-10-01',
  sourceHash: '2cde870a80059ca747391fec90e26be97c3ce81f23e16d15c60bdd349bc9ef89',
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
