// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { PERSONA_BLOCKS } from './personaBlocks'
import { claimedPersonasFor } from './claimedPersonas'
import { PERSONA_IDS } from '@/data/personaIds'
import { MANIFESTS } from '@/components/PKILearning/manifest/registry'
import { WORKSHOP_TOOLS } from '@/components/Playground/workshopRegistry'
import { BUSINESS_TOOLS } from '@/components/BusinessCenter/businessToolsRegistry'

const known = new Set([
  ...MANIFESTS.map((m) => `/learn/${m.id}`),
  ...WORKSHOP_TOOLS.filter((t) => !t.sandbox).map((t) => `/playground/${t.id}`),
  ...BUSINESS_TOOLS.map((t) => `/business/tools/${t.id}`),
])

describe('PERSONA_BLOCKS (round 9, wave 2)', () => {
  it('every route resolves and every persona listed is one the item claims', () => {
    for (const [route, blocks] of Object.entries(PERSONA_BLOCKS)) {
      expect(known.has(route), route).toBe(true)
      const claimed = new Set(claimedPersonasFor(route))
      for (const p of PERSONA_IDS) {
        if (blocks[p] === undefined) continue
        expect(claimed.has(p), `${route} lists ${p}, which it does not claim`).toBe(true)
        expect(blocks[p]!.length, `${route}/${p}`).toBeGreaterThanOrEqual(60)
        expect(blocks[p], `${route}/${p}`).toMatch(/[.!?]$/)
      }
    }
  })
  it('an item present here covers every persona it claims', () => {
    for (const [route, blocks] of Object.entries(PERSONA_BLOCKS)) {
      const missing = claimedPersonasFor(route).filter((p) => !blocks[p])
      expect(missing, route).toEqual([])
    }
  })
  it('claimedPersonasFor reads the registries', () => {
    expect(claimedPersonasFor('/playground/tee-channel')).toEqual(['architect', 'researcher'])
    expect(claimedPersonasFor('/business/tools/roi-calculator')).toEqual(['executive', 'grc'])
    expect(claimedPersonasFor('/learn/pqc-101').length).toBeGreaterThanOrEqual(5)
    expect(claimedPersonasFor('/nope')).toEqual([])
  })
})
