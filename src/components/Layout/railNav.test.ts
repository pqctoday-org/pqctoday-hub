// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import type { PersonaId } from '@/data/learningPersonas'
import { NAV_PATH_LABELS, RAIL_HIDDEN_PATHS } from '@/data/personaConfig'
import { getRailSections, getRowTreatment, RAIL_ALWAYS_VISIBLE_PATHS } from './railNav'

const ALL_PERSONAS: PersonaId[] = [
  'executive',
  'developer',
  'architect',
  'researcher',
  'ops',
  'curious',
]

describe('getRailSections — hard reachability invariant', () => {
  const universe = Object.keys(NAV_PATH_LABELS)

  it.each([...ALL_PERSONAS, null])(
    'FOR YOU ∪ MORE ∪ always-visible ∪ hidden covers every NAV_PATH_LABELS key (persona=%s)',
    (persona) => {
      const { forYou, more } = getRailSections(persona)
      const union = new Set([
        ...forYou,
        ...more,
        ...RAIL_ALWAYS_VISIBLE_PATHS,
        ...RAIL_HIDDEN_PATHS,
      ])
      for (const path of universe) {
        expect(union.has(path)).toBe(true)
      }
    }
  )

  it.each([...ALL_PERSONAS, null])('FOR YOU and MORE never overlap (persona=%s)', (persona) => {
    const { forYou, more } = getRailSections(persona)
    const overlap = forYou.filter((p) => more.includes(p))
    expect(overlap).toEqual([])
  })

  it.each([...ALL_PERSONAS, null])(
    'MORE never contains a RAIL_HIDDEN_PATHS entry (persona=%s)',
    (persona) => {
      const { more, forYou } = getRailSections(persona)
      for (const hidden of RAIL_HIDDEN_PATHS) {
        expect(more).not.toContain(hidden)
        expect(forYou).not.toContain(hidden)
      }
    }
  )

  it('null persona (no selection) — FOR YOU is empty, MORE holds the full universe', () => {
    const { forYou, more } = getRailSections(null)
    expect(forYou).toEqual([])
    const expectedMore = universe.filter(
      (p) => !RAIL_ALWAYS_VISIBLE_PATHS.includes(p) && !RAIL_HIDDEN_PATHS.includes(p)
    )
    expect(new Set(more)).toEqual(new Set(expectedMore))
  })

  it('researcher — FOR YOU is empty (PERSONA_NAV_PATHS.researcher is null: no gating)', () => {
    const { forYou } = getRailSections('researcher')
    expect(forYou).toEqual([])
  })

  it('never renders /openssl as a rail row for any persona', () => {
    for (const persona of [...ALL_PERSONAS, null]) {
      const { forYou, more } = getRailSections(persona)
      expect(forYou).not.toContain('/openssl')
      expect(more).not.toContain('/openssl')
    }
  })

  // Spot-check a few concrete memberships so this test isn't purely circular
  // with getRailSections' own "more = complement" implementation.
  it('sanity-checks concrete per-persona memberships', () => {
    expect(getRailSections('executive').forYou).toContain('/migrate')
    expect(getRailSections('executive').forYou).toContain('/simulation')
    expect(getRailSections('curious').more).toContain('/business')
    expect(getRailSections('ops').more).toContain('/patents')
    expect(getRailSections('ops').more).toContain('/explore')
    expect(getRailSections('developer').more).toContain('/leaders')
  })
})

describe('getRowTreatment', () => {
  it('executive + /simulation is always "featured", even when inactive', () => {
    expect(getRowTreatment('executive', '/simulation', false)).toBe('featured')
    expect(getRowTreatment('executive', '/simulation', true)).toBe('featured')
  })

  it('marked rows stay "marked" even when active (dashed wins over solid active)', () => {
    expect(getRowTreatment('developer', '/simulation', true)).toBe('marked')
    expect(getRowTreatment('developer', '/simulation', false)).toBe('marked')
  })

  it('falls back to active/plain for unmarked, non-featured rows', () => {
    expect(getRowTreatment('developer', '/migrate', true)).toBe('active')
    expect(getRowTreatment('developer', '/migrate', false)).toBe('plain')
  })

  it('researcher has no marked rows and no featured row', () => {
    expect(getRowTreatment('researcher', '/simulation', false)).toBe('plain')
  })

  it('null persona never gets marked/featured treatment', () => {
    expect(getRowTreatment(null, '/simulation', false)).toBe('plain')
  })
})
