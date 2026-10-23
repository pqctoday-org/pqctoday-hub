// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import type { LibraryItem } from '@/data/libraryData'
import { ruleBasedConfidenceLabel } from './ruleBasedConfidence'

const item = (over: Partial<LibraryItem>): LibraryItem => ({ ...over }) as LibraryItem

describe('ruleBasedConfidenceLabel', () => {
  it('labels a score set by the document-type rule', () => {
    expect(
      ruleBasedConfidenceLabel(
        item({
          confidenceScore: 80,
          dataQualityNotes: 'confidence 80 is rule-based (bucket: 80), not assessed per document',
        })
      )
    ).toBe('80 (set by document-type rule, not assessed per document)')
  })

  it('shows nothing for an assessed score', () => {
    expect(
      ruleBasedConfidenceLabel(item({ confidenceScore: 72, dataQualityNotes: 're-verified' }))
    ).toBeUndefined()
  })

  it('shows nothing when the note names a different score than the row holds', () => {
    expect(
      ruleBasedConfidenceLabel(
        item({
          confidenceScore: 65,
          dataQualityNotes: 'confidence 80 is rule-based (bucket: 80), not assessed per document',
        })
      )
    ).toBeUndefined()
  })

  it('shows nothing without a score', () => {
    expect(
      ruleBasedConfidenceLabel(item({ dataQualityNotes: 'confidence 80 is rule-based' }))
    ).toBeUndefined()
  })
})
