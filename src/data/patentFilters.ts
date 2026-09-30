// SPDX-License-Identifier: GPL-3.0-only
/**
 * Pure patent link-filter matching shared by desktop (Patents/usePatentResults'
 * filterPatents) and the phone screen (Mobile/screens/MobilePatentsView), so
 * `?inventor=` and `?patentIds=` select exactly the same patents on both.
 * No JSX, no component imports — Mobile may import it.
 */
import type { PatentItem } from '@/types/PatentTypes'

function inventorWords(s: string): string[] {
  return s
    .replace(/\bet\s+al\.?\s*$/i, '')
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
}

/** patents.inventors is raw USPTO/Google-Patents format — "Surname; Givenname
 * et al." — inverted order from a leader's "Givenname Surname" and truncated
 * to the first-named inventor. An exact-equality match (like assignee uses)
 * can never work here, so this compares normalized word sets instead: every
 * word in the filter name must appear among the record's inventor-field
 * words, order-independent. Mirrors leaders_patents_xref.py's normalization
 * on the Python side (lowercase, strip "et al.", strip punctuation). */
export function inventorMatches(inventorsField: string, filterName: string): boolean {
  const recordWords = new Set(inventorWords(inventorsField))
  const filterWords = inventorWords(filterName)
  return filterWords.length > 0 && filterWords.every((w) => recordWords.has(w))
}

/** `?patentIds=` value → the set of ids it names (comma list, trimmed). */
export function parsePatentIds(value: string): Set<string> {
  return new Set(
    value
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  )
}

/** A patent is wanted when its number is listed US-prefixed or bare. */
export function patentIdMatches(patentNumber: string, wanted: Set<string>): boolean {
  return wanted.has(patentNumber) || wanted.has(patentNumber.replace(/^US/i, ''))
}

/** Applies just the `?inventor` / `?patentIds` link filters, with
 *  filterPatents' semantics: an empty string is off; any other value filters
 *  (so a value naming no usable id/word matches nothing). */
export function filterByPatentLinkParams(
  patents: PatentItem[],
  inventor: string,
  patentIds: string
): PatentItem[] {
  if (!inventor && !patentIds) return patents
  const wanted = parsePatentIds(patentIds)
  return patents.filter(
    (p) =>
      (!inventor || inventorMatches(p.inventors, inventor)) &&
      (!patentIds || patentIdMatches(p.patentNumber, wanted))
  )
}
