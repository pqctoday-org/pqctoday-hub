// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import type { LibraryItem } from '@/data/libraryData'
import { needsScopeVerification, paidSourceContext } from './libraryClaimSemantics'

const item = (overrides: Partial<LibraryItem> = {}) =>
  ({
    shortDescription: '',
    confidenceScore: 60,
    lastVerified: '',
    accessType: undefined,
    freeSummaryUrl: '',
    ...overrides,
  }) as LibraryItem

describe('library catalog claim semantics', () => {
  it('flags low-confidence obligation language', () => {
    expect(needsScopeVerification(item({ shortDescription: 'Products must support PQC.' }))).toBe(
      true
    )
  })

  it('does not warn for recently verified, high-confidence summaries', () => {
    expect(
      needsScopeVerification(
        item({
          shortDescription: 'The standard requires an approved mechanism.',
          confidenceScore: 90,
          lastVerified: '2026-10-17',
        })
      )
    ).toBe(false)
  })

  it('explains when a paid source has no separate free official summary', () => {
    expect(paidSourceContext(item({ accessType: 'paid' }))).toContain('publisher purchase page')
    expect(
      paidSourceContext(item({ accessType: 'paid', freeSummaryUrl: 'https://example.test/scope' }))
    ).toBeNull()
  })
})
