// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import {
  PERSONA_FEATURED_PAGES,
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
  it('every persona gets the four full playgrounds and two to four picks, no duplicates', () => {
    const base = FEATURE_PLAYGROUNDS.filter((f) => f.to !== '/playground/hsm-capacity').map(
      (f) => f.to
    )
    for (const p of [...PERSONA_IDS, null]) {
      const cards = featurePlaygroundsFor(p)
      // eslint-disable-next-line security/detect-object-injection -- p is the typed PersonaId union
      const own = (p && PERSONA_FEATURED_PAGES[p]) || []
      // The four full playgrounds lead, unless the role has featured pages of its own.
      const start = own.length > 0 ? own.length + PERSONA_FEATURED_TOOL_IDS[p!].length : 0
      expect(cards.slice(start, start + 4).map((c) => c.to)).toEqual(base)
      expect(cards.length).toBeGreaterThanOrEqual(6)
      expect(cards.length).toBeLessThanOrEqual(9)
      expect(new Set(cards.map((c) => c.to)).size).toBe(cards.length)
      for (const c of cards) expect(c.tag.length).toBeGreaterThan(0)
    }
  })
  it('the certification engineer leads with the validation workbench and the conformance runner', () => {
    const cards = featurePlaygroundsFor('cert-engineer')
    expect(cards[0].to).toBe('/playground/hsm?tab=build&dtab=acvp')
    expect(cards[1].to).toBe('/playground/hsm?tab=build&dtab=conformance')
    expect(cards.slice(2, 5).map((c) => c.to)).toEqual(
      PERSONA_FEATURED_TOOL_IDS['cert-engineer'].map((id) => `/playground/${id}`)
    )
    // Only roles with a card of their own lead with it; everyone else is unchanged.
    expect(Object.keys(PERSONA_FEATURED_PAGES)).toEqual(['cert-engineer'])
    expect(featurePlaygroundsFor('developer')[0].to).toBe('/playground/interactive')
  })
  it('the persona sets together feature at least 16 distinct tools', () => {
    const all = new Set(Object.values(PERSONA_FEATURED_TOOL_IDS).flat())
    expect(all.size).toBeGreaterThanOrEqual(16)
  })
})
