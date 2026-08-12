// SPDX-License-Identifier: GPL-3.0-only
/**
 * The weight line is only useful if it actually reaches rows. A silent
 * regression here — a moved manifest path, a renamed field — would blank the
 * line on every card while every other test stayed green, so coverage itself
 * is asserted rather than assumed.
 */
import { describe, it, expect } from 'vitest'
import { documentWeight, documentWeightCoverage } from './libraryDocumentWeight'
import { libraryData } from './libraryData'

describe('documentWeight', () => {
  it('resolves a weight for a substantial share of the live library', () => {
    // Guards the failure mode where the manifest glob stops matching and every
    // card silently loses its length line.
    expect(documentWeightCoverage()).toBeGreaterThan(100)
    const withWeight = libraryData.filter((i) => documentWeight(i.referenceId) !== null)
    expect(withWeight.length).toBeGreaterThan(libraryData.length * 0.5)
  })

  it('returns null rather than guessing for an unknown reference', () => {
    expect(documentWeight('NOT-A-REAL-REFERENCE-ID')).toBeNull()
  })

  it('classifies a large PDF as a reference document, not a read', () => {
    // FIPS 140-3 IG is 2.5 MB in the shipped manifest — the canonical "do not
    // read this end to end" case.
    const w = documentWeight('NIST-FIPS140-3-IG-PQC')
    expect(w).not.toBeNull()
    expect(w!.format).toBe('PDF')
    expect(w!.weight).toBe('reference')
    expect(w!.label).toMatch(/PDF · .* · a reference document/)
  })

  it('never claims a page COUNT it does not have', () => {
    // "Web page" is a format, not a count — what must never appear is a number
    // of pages, which nothing in the manifest can support.
    for (const item of libraryData.slice(0, 200)) {
      const w = documentWeight(item.referenceId)
      if (!w) continue
      expect(w.label).not.toMatch(/\d+\s*(pages?|pp\.)/i)
      expect(w.label).not.toMatch(/(≈|~|about)\s*\d+\s*pages?/i)
    }
  })
})
