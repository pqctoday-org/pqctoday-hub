// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { toolsForRole } from './roleTools'
import { PERSONA_IDS } from '@/data/personaIds'
import { WORKSHOP_TOOLS } from '@/components/Playground/workshopRegistry'
import { BUSINESS_TOOLS } from '@/components/BusinessCenter/businessToolsRegistry'

describe('toolsForRole (round 9, wave 1.3)', () => {
  it('the seven role rows together reach every live playground tool and every business tool', () => {
    const pg = new Set<string>()
    const bt = new Set<string>()
    for (const p of PERSONA_IDS) {
      const r = toolsForRole(p)
      r.playground.forEach((t) => pg.add(t.id))
      r.business.forEach((t) => bt.add(t.id))
    }
    const missingPg = WORKSHOP_TOOLS.filter((t) => !t.sandbox && !t.wip && !pg.has(t.id)).map(
      (t) => t.id
    )
    const missingBt = BUSINESS_TOOLS.filter((t) => !bt.has(t.id)).map((t) => t.id)
    expect(missingPg).toEqual([])
    expect(missingBt).toEqual([])
  })
  it('a role sees only tools that name it, Start-here picks first, no duplicates', () => {
    for (const p of PERSONA_IDS) {
      const r = toolsForRole(p)
      for (const t of r.playground) expect(t.recommendedPersonas, `${p}: ${t.id}`).toContain(p)
      const firstNonPick = r.playground.findIndex((t) => !t.startHere?.includes(p))
      const lastPick = r.playground.map((t) => !!t.startHere?.includes(p)).lastIndexOf(true)
      if (firstNonPick !== -1 && lastPick !== -1) expect(lastPick).toBeLessThan(firstNonPick)
      expect(new Set(r.business.map((t) => t.id)).size).toBe(r.business.length)
    }
  })
})
