// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import {
  PERSONA_FEATURED_TOOL_IDS,
  featurePlaygroundsFor,
  FEATURE_PLAYGROUNDS,
} from './cryptoLabMeta'
import { WORKSHOP_TOOLS } from './workshopRegistry'
import { PERSONA_IDS } from '@/data/personaIds'

describe('per-persona marquee (round 9, wave 1.5)', () => {
  it('every featured id is a live tool that names that persona', () => {
    for (const p of PERSONA_IDS) {
      for (const id of PERSONA_FEATURED_TOOL_IDS[p]) {
        const t = WORKSHOP_TOOLS.find((x) => x.id === id)
        expect(t, `${p}: ${id}`).toBeDefined()
        expect(t!.sandbox, id).toBeFalsy()
        expect(t!.wip, `${p}: ${id} is WIP`).toBeFalsy()
        expect(t!.recommendedPersonas, `${p}: ${id}`).toContain(p)
      }
    }
    for (const id of PERSONA_FEATURED_TOOL_IDS.none) {
      expect(
        WORKSHOP_TOOLS.some((x) => x.id === id && !x.sandbox),
        id
      ).toBe(true)
    }
  })
  it('every persona gets the four full playgrounds first, then two to four picks, no duplicates', () => {
    for (const p of [...PERSONA_IDS, null]) {
      const cards = featurePlaygroundsFor(p)
      expect(cards.slice(0, 4).map((c) => c.to)).toEqual(
        FEATURE_PLAYGROUNDS.filter((f) => f.to !== '/playground/hsm-capacity').map((f) => f.to)
      )
      expect(cards.length).toBeGreaterThanOrEqual(6)
      expect(cards.length).toBeLessThanOrEqual(8)
      expect(new Set(cards.map((c) => c.to)).size).toBe(cards.length)
      for (const c of cards.slice(4)) expect(c.tag.length).toBeGreaterThan(0)
    }
  })
  it('the persona sets together feature at least 16 distinct tools', () => {
    const all = new Set(Object.values(PERSONA_FEATURED_TOOL_IDS).flat())
    expect(all.size).toBeGreaterThanOrEqual(16)
  })
})
