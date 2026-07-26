// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { newestFirstMs } from './useLibraryPipeline'

describe('newestFirstMs', () => {
  it('prefers lastUpdateDate when present', () => {
    const ms = newestFirstMs({ lastUpdateDate: '2026-06-01', initialPublicationDate: '2020-01-01' })
    expect(ms).toBe(new Date('2026-06-01').getTime())
  })

  it('falls back to initialPublicationDate when lastUpdateDate is blank', () => {
    // The real shape of a freshly add_row.py'd stub: only the initial
    // publication date is ever set. Before this fix, sorting on
    // lastUpdateDate alone parsed '' as an invalid date and the row silently
    // fell out of "Newest first" / the Recently Changed carousel despite
    // being the most recent addition to the catalog — reproduced live
    // 2026-07-26 with a real new library row (N-PAMP).
    const ms = newestFirstMs({ lastUpdateDate: '', initialPublicationDate: '2026-07-26' })
    expect(ms).toBe(new Date('2026-07-26').getTime())
  })

  it('a brand-new stub row sorts ahead of an older, real-lastUpdateDate row', () => {
    const brandNewStub = { lastUpdateDate: '', initialPublicationDate: '2026-07-26' }
    const olderButUpdated = { lastUpdateDate: '2026-06-01', initialPublicationDate: '2020-01-01' }
    const sorted = [olderButUpdated, brandNewStub].sort(
      (a, b) => newestFirstMs(b) - newestFirstMs(a)
    )
    expect(sorted[0]).toBe(brandNewStub)
  })

  it('sorts an item with neither date last, not first or NaN-broken', () => {
    const noDates = { lastUpdateDate: '', initialPublicationDate: '' }
    const dated = { lastUpdateDate: '2020-01-01', initialPublicationDate: '2020-01-01' }
    const sorted = [noDates, dated].sort((a, b) => newestFirstMs(b) - newestFirstMs(a))
    expect(sorted[0]).toBe(dated)
    expect(newestFirstMs(noDates)).toBe(0)
  })
})
