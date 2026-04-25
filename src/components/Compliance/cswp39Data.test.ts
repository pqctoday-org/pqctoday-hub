// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { CSWP39_SOURCE_METADATA } from './cswp39Data'

describe('CSWP39_SOURCE_METADATA staleness', () => {
  it('nextReviewBy must not be in the past — re-verify the upstream NIST doc and bump dataExtractedAt + nextReviewBy', () => {
    const today = new Date().toISOString().slice(0, 10)
    expect(CSWP39_SOURCE_METADATA.nextReviewBy >= today).toBe(true)
  })

  it('dataExtractedAt must be on or before nextReviewBy', () => {
    expect(CSWP39_SOURCE_METADATA.dataExtractedAt <= CSWP39_SOURCE_METADATA.nextReviewBy).toBe(true)
  })

  it('all date fields are ISO YYYY-MM-DD', () => {
    const iso = /^\d{4}-\d{2}-\d{2}$/
    expect(iso.test(CSWP39_SOURCE_METADATA.publicationDate)).toBe(true)
    expect(iso.test(CSWP39_SOURCE_METADATA.dataExtractedAt)).toBe(true)
    expect(iso.test(CSWP39_SOURCE_METADATA.nextReviewBy)).toBe(true)
  })

  it('sourceUrl points at the canonical NIST CSWP.39 PDF', () => {
    expect(CSWP39_SOURCE_METADATA.sourceUrl).toMatch(
      /^https:\/\/nvlpubs\.nist\.gov\/.+CSWP\.39\.pdf$/
    )
  })
})
