// SPDX-License-Identifier: GPL-3.0-only
/**
 * ?highlight=<name>[,<name>…] matching, shared by the Detailed and Transition
 * tables (which tint matching rows) and useAlgorithmExplorer (which widens
 * filters when a highlighted row would otherwise be hidden, and reports
 * names that match no row at all). One definition so "is this row
 * highlighted" and "is the highlighted row visible" can never disagree.
 */

/** Split a raw ?highlight value into trimmed, non-empty names. */
export function parseHighlight(raw: string | null | undefined): string[] {
  if (!raw) return []
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

/**
 * Detailed-Comparison row match: two-way case-insensitive substring, so
 * `ML-KEM` lights up every ML-KEM parameter set and `ML-KEM-768 (FIPS 203)`
 * still finds `ML-KEM-768`.
 */
export function algoMatchesHighlight(algoName: string, h: string): boolean {
  const a = algoName.toLowerCase()
  const q = h.toLowerCase()
  return a.includes(q) || q.includes(a)
}

/** PQC name of a transition row, without its trailing "(…)" qualifier. */
export function transitionPqcName(pqc: string): string {
  return pqc.split(/\s*\(/)[0].trim()
}

/**
 * Transition-Guide row match. Highlight sets mix classical names (RSA, ECDH)
 * and PQC names (ML-KEM-768), so both columns are checked: classical two-way
 * substring, PQC exact.
 */
export function transitionMatchesHighlight(
  t: { classical: string; pqc: string },
  h: string
): boolean {
  const q = h.toLowerCase()
  const classical = t.classical.toLowerCase()
  return (
    classical.includes(q) || q.includes(classical) || transitionPqcName(t.pqc).toLowerCase() === q
  )
}

/** Stable `data-deeplink-id` for a transition row (no ID column exists). */
export function transitionRowId(t: { function: string; classical: string; pqc: string }): string {
  return `${t.function}|${t.classical}|${t.pqc}`
}

/**
 * Selector for a deep-linked table row. Detailed and Transition render the
 * same id on a desktop `<tr>` and a phone card (`md:hidden`); the shared
 * scroll hook takes the first match, so pick the element for the layout that
 * is actually showing (Tailwind `md` = 768px).
 */
export function highlightRowSelector(escapedAttrSelector: string): string {
  const desktop =
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia('(min-width: 768px)').matches
      : true
  return desktop ? `tr${escapedAttrSelector}` : `div${escapedAttrSelector}`
}
