// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { parseFacets, serializeFacets, writeReplaceViewState } from './replaceTabParams'
import { NO_FACETS } from './workbenchCatalog'

describe('replaceTabParams', () => {
  it('serializes only non-default facets, and null when all are default', () => {
    expect(serializeFacets(NO_FACETS)).toBeNull()
    expect(serializeFacets({ population: 'all', pqc: 'available', certified: 'linked' })).toBe(
      'pqc:available,certified:linked'
    )
  })

  it('round-trips every facet', () => {
    const f = { population: 'migration_baseline', pqc: 'planned', certified: 'none' } as const
    expect(parseFacets(serializeFacets(f))).toEqual(f)
  })

  it('ignores unknown keys and values (degrades to all)', () => {
    expect(parseFacets('pqc:bogus,nope:1,certified:linked')).toEqual({
      ...NO_FACETS,
      certified: 'linked',
    })
    expect(parseFacets(null)).toEqual(NO_FACETS)
  })

  it('writes rq/facet, deleting them at their defaults, leaving undefined fields alone', () => {
    const sp = new URLSearchParams('domain=tls&rq=old&facet=pqc:none')
    writeReplaceViewState(sp, { filter: 'new' })
    expect(sp.get('rq')).toBe('new')
    expect(sp.get('facet')).toBe('pqc:none')
    writeReplaceViewState(sp, { filter: '', facets: NO_FACETS })
    expect(sp.toString()).toBe('domain=tls')
  })
})
