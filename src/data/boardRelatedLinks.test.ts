// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { boardRelatedLinks } from './boardRelatedLinks'
import { PERSONA_JOURNEY_BOARD_VARIANTS } from '@/data/generated/roleBoardContent.generated'
import { PERSONA_IDS } from '@/data/personaIds'

describe('boardRelatedLinks (round 9, wave 2)', () => {
  it('every variant id resolves to a titled link, and the boards together reach 30+ modules and 25+ Command Center tools', () => {
    const modules = new Set<string>()
    const business = new Set<string>()
    for (const p of PERSONA_IDS) {
      for (const v of PERSONA_JOURNEY_BOARD_VARIANTS[p]) {
        const links = boardRelatedLinks(v)
        expect(links.length, `${p}/${v.id}`).toBe(
          v.moduleIds.length + v.workshopIds.length + v.businessToolIds.length
        )
        for (const l of links) expect(l.name.length, l.to).toBeGreaterThan(2)
        links.filter((l) => l.kind === 'module').forEach((l) => modules.add(l.to))
        links.filter((l) => l.kind === 'business').forEach((l) => business.add(l.to))
      }
    }
    expect(modules.size).toBeGreaterThanOrEqual(30)
    expect(business.size).toBeGreaterThanOrEqual(25)
  })
})
