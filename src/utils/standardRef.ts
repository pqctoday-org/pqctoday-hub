// SPDX-License-Identifier: GPL-3.0-only
/**
 * Resolves a standards citation as it appears in prose ("FIPS 203",
 * "NIST SP 800-88", "SP 800-90B") to a real `/library?ref=` deep link.
 *
 * The business tools are dense with citations that go nowhere: a 2026-08-10
 * audit counted 49 standards references and zero external URLs in the Audit
 * Readiness Checklist alone, 57 against one URL in the Policy Template
 * Generator, 38 against one in the Contract Clause Generator. The documents
 * are in the library; nothing connected the two.
 *
 * Resolution is against the library's own `reference_id` column — the id the
 * Library detail drawer already accepts — so the mapping is derived, never
 * hand-maintained. Ids are not internally consistent ("FIPS 203" but
 * "FIPS-140-3", "FIPS 180" but "FIPS-180-4"), hence the normalisation below.
 *
 * A citation that does not resolve renders as plain text. A dead link is
 * worse than no link.
 */
import { libraryData } from '@/data/libraryData'

/** Lowercase, strip the NIST prefix, and collapse all separators. */
export function normalizeStandardRef(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/^nist\s+/, '')
    .replace(/[\s._-]+/g, '')
    .trim()
}

let index: Map<string, string> | null = null

/** normalized id -> the exact reference_id the Library route expects. */
function getIndex(): Map<string, string> {
  if (index) return index
  const map = new Map<string, string>()
  for (const row of libraryData) {
    const id = (row.referenceId ?? '').trim()
    if (!id) continue
    const key = normalizeStandardRef(id)
    // First writer wins so a more canonical id (e.g. "FIPS 203") is not
    // displaced by a variant that normalizes identically.
    if (!map.has(key)) map.set(key, id)
  }
  index = map
  return map
}

/** The library reference_id for a cited standard, or null if it has none. */
export function resolveStandardRef(citation: string): string | null {
  return getIndex().get(normalizeStandardRef(citation)) ?? null
}

/** `/library?ref=…` for a cited standard, or null when it does not resolve. */
export function standardRefHref(citation: string): string | null {
  const id = resolveStandardRef(citation)
  return id ? `/library?ref=${encodeURIComponent(id)}` : null
}

/** Test seam — the index is built once and memoised. */
export function __resetStandardRefIndexForTest(): void {
  index = null
}
