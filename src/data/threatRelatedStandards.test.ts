// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { threatStandardLinks } from './threatRelatedStandards'
import { threatsData } from './threatsData'
import { findStandard } from './standardsRegistry'

describe('threat related standards (COMP-2)', () => {
  it('reads the CSV column onto every threat', () => {
    expect(threatsData.some((t) => (t.relatedStandards ?? []).length > 0)).toBe(true)
  })

  it('links only ids the Library holds, each once, to the Library entry', () => {
    const anyKnown = threatsData
      .flatMap((t) => t.relatedStandards ?? [])
      .find((id) => findStandard(id))
    if (!anyKnown) return
    const links = threatStandardLinks({
      relatedStandards: [anyKnown, 'NOT-A-LIBRARY-ID', anyKnown],
    })
    expect(links.map((l) => l.id)).toEqual([anyKnown])
    expect(links[0].deepLink).toBe(`/library?ref=${encodeURIComponent(anyKnown)}`)
  })

  it('a threat with no related standards shows none', () => {
    expect(threatStandardLinks({ relatedStandards: [] })).toEqual([])
    expect(threatStandardLinks({})).toEqual([])
  })
})
