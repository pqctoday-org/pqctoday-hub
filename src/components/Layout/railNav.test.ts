// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import type { PersonaId } from '@/data/learningPersonas'
import { NAV_PATH_LABELS, RAIL_HIDDEN_PATHS } from '@/data/personaConfig'
import {
  getRailSections,
  getRowTreatment,
  getForYouGroups,
  RAIL_ALWAYS_VISIBLE_PATHS,
} from './railNav'

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

describe('getForYouGroups — rail declutter follow-up (2026-08-01)', () => {
  it.each([...ALL_PERSONAS, null])(
    "every group's paths, combined, exactly equal FOR YOU with no drops or dupes (persona=%s)",
    (persona) => {
      const { forYou } = getRailSections(persona)
      const groups = getForYouGroups(forYou)
      const flattened = groups.flatMap((g) => g.paths)
      expect(new Set(flattened)).toEqual(new Set(forYou))
      expect(flattened.length).toBe(forYou.length) // no dupes across groups
    }
  )

  it('groups render in a fixed Workflow → Practice → Reference order', () => {
    const groups = getForYouGroups(getRailSections('executive').forYou)
    expect(groups.map((g) => g.id)).toEqual(['workflow', 'practice', 'reference'])
  })

  it('omits a group entirely when the persona has no rows in it (curious has no /business)', () => {
    const groups = getForYouGroups(getRailSections('curious').forYou)
    const workflow = groups.find((g) => g.id === 'workflow')
    expect(workflow?.paths).not.toContain('/business')
    // curious still has other workflow rows (compliance/assess/report/migrate),
    // so the group itself isn't omitted — just missing that one path.
    expect(workflow?.paths.length).toBeGreaterThan(0)
  })

  it('empty FOR YOU (researcher / no persona) yields no groups at all', () => {
    expect(getForYouGroups(getRailSections('researcher').forYou)).toEqual([])
    expect(getForYouGroups(getRailSections(null).forYou)).toEqual([])
  })

  it('sanity-checks concrete per-persona group membership', () => {
    const executive = getForYouGroups(getRailSections('executive').forYou)
    expect(executive.find((g) => g.id === 'workflow')?.paths).toEqual(
      expect.arrayContaining(['/migrate', '/compliance', '/business', '/assess', '/report'])
    )
    expect(executive.find((g) => g.id === 'practice')?.paths).toEqual(
      expect.arrayContaining(['/simulation', '/playground'])
    )
    // /revisions was dropped from every persona's PERSONA_NAV_PATHS
    // (2026-08-01 follow-up: "remove more and revisions from the left bar") —
    // it's no longer part of FOR YOU for anyone, so it's absent here now.
    expect(executive.find((g) => g.id === 'reference')?.paths).toEqual(
      expect.arrayContaining(['/algorithms', '/library', '/leaders', '/patents'])
    )
    expect(executive.find((g) => g.id === 'reference')?.paths).not.toContain('/revisions')
  })
})

describe('getRowTreatment', () => {
  it('executive + /simulation is always "featured", even when inactive', () => {
    expect(getRowTreatment('executive', '/simulation', false)).toBe('featured')
    expect(getRowTreatment('executive', '/simulation', true)).toBe('featured')
  })

  it('marked rows stay "marked" even when active (dashed wins over solid active)', () => {
    // executive's '/playground' is the current marked row (a genuine "Labs
    // preview, not yet exec-tailored" row) — developer/architect/ops's
    // '/simulation' was DEmarked in the 2026-08-01 final self-review once the
    // general console's "Exit to hub" affordance was confirmed already
    // shipped (see personaConfig.ts's PERSONA_MARKED_NAV_PATHS doc comment).
    expect(getRowTreatment('executive', '/playground', true)).toBe('marked')
    expect(getRowTreatment('executive', '/playground', false)).toBe('marked')
  })

  it('falls back to active/plain for unmarked, non-featured rows', () => {
    expect(getRowTreatment('developer', '/migrate', true)).toBe('active')
    expect(getRowTreatment('developer', '/migrate', false)).toBe('plain')
  })

  it('developer/architect/ops give /simulation the plain (non-marked) treatment — the exit-affordance dependency that used to justify "marked" already shipped', () => {
    expect(getRowTreatment('developer', '/simulation', false)).toBe('plain')
    expect(getRowTreatment('developer', '/simulation', true)).toBe('active')
    expect(getRowTreatment('architect', '/simulation', false)).toBe('plain')
    expect(getRowTreatment('ops', '/simulation', false)).toBe('plain')
  })

  it('researcher has no marked rows and no featured row', () => {
    expect(getRowTreatment('researcher', '/simulation', false)).toBe('plain')
  })

  it('null persona never gets marked/featured treatment', () => {
    expect(getRowTreatment(null, '/simulation', false)).toBe('plain')
  })
})
