// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import type { PersonaId } from '@/data/learningPersonas'
import {
  NAV_PATH_LABELS,
  RAIL_HIDDEN_PATHS,
  PERSONA_NAV_PATHS,
  PERSONA_ABSENT_PATHS,
} from '@/data/personaConfig'
import {
  getRailSections,
  getRowTreatment,
  getForYouGroups,
  getGroupAbsences,
  getUngatedGroupablePaths,
  RAIL_ALWAYS_VISIBLE_PATHS,
  RAIL_SELF_PLACED_PATHS,
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

  // B+ remediation 1.3 (2026-08-10): PERSONA_ABSENT_PATHS joins the union.
  // An absent path renders NO rail row at all — that is what distinguishes it
  // from a demoted MORE row — so coverage now means "every path is either
  // reachable from the rail, or explicitly accounted for as an absence with a
  // reason on screen". Nothing may fall out of both.
  it.each([...ALL_PERSONAS, null])(
    'FOR YOU ∪ MORE ∪ always-visible ∪ hidden ∪ absent covers every NAV_PATH_LABELS key (persona=%s)',
    (persona) => {
      const { forYou, more } = getRailSections(persona)
      const absent = persona ? Object.keys(PERSONA_ABSENT_PATHS[persona] ?? {}) : []
      const union = new Set([
        ...forYou,
        ...more,
        ...RAIL_ALWAYS_VISIBLE_PATHS,
        ...RAIL_HIDDEN_PATHS,
        ...absent,
      ])
      for (const path of universe) {
        expect(union.has(path)).toBe(true)
      }
    }
  )

  it.each(ALL_PERSONAS)('an absent path renders no rail row at all (persona=%s)', (persona) => {
    const { forYou, more } = getRailSections(persona)
    for (const path of Object.keys(PERSONA_ABSENT_PATHS[persona] ?? {})) {
      expect(forYou).not.toContain(path)
      expect(more).not.toContain(path)
    }
  })

  it.each(ALL_PERSONAS)(
    'every absence is rendered in exactly one group footer, and points somewhere this persona can reach (persona=%s)',
    (persona) => {
      const { forYou, more } = getRailSections(persona)
      const reachable = new Set([...forYou, ...more, ...RAIL_ALWAYS_VISIBLE_PATHS])
      const declared = Object.keys(PERSONA_ABSENT_PATHS[persona] ?? {})
      const rendered = (['workflow', 'practice', 'reference', 'other'] as const).flatMap((g) =>
        getGroupAbsences(persona, g)
      )
      expect(rendered.map((a) => a.path).sort()).toEqual([...declared].sort())
      for (const absence of rendered) {
        // An absence notice that points at another closed door is worse than
        // no notice at all.
        expect(reachable.has(absence.insteadPath)).toBe(true)
        expect(absence.reason.length).toBeGreaterThan(20)
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
    // No persona means no absences either: we know nothing about this visitor,
    // so nothing is withheld from them.
    const expectedMore = universe.filter(
      (p) => !RAIL_ALWAYS_VISIBLE_PATHS.includes(p) && !RAIL_HIDDEN_PATHS.includes(p)
    )
    expect(new Set(more)).toEqual(new Set(expectedMore))
  })

  it('researcher — FOR YOU is the full nav universe, so it gets the standard grouped rail (2026-08-02)', () => {
    const { forYou, more } = getRailSections('researcher')
    // researcher used to fall into the same flat "Everything, unfiltered" +
    // MORE fallback a brand-new no-persona visitor gets. It is an explicit
    // choice, so it now gets the same grouped rail as every other persona.
    expect(forYou.length).toBeGreaterThan(0)
    // Two deliberate leftovers in `more`, both inert because MORE does not
    // render for a persona with a populated FOR YOU:
    //  - '/business/tools' — MainLayout render-adds it to Practice by path
    //    literal, so keeping it out of FOR YOU avoids a duplicate row.
    //  - '/revisions' — dropped from the rail entirely on 2026-08-01.
    expect(more).toEqual(['/business/tools', '/revisions'])
    // PERSONA_NAV_PATHS.researcher stays null — ReportContent and GuidedTour
    // branch on that null to mean "sees everything". Only the rail changed.
    expect(PERSONA_NAV_PATHS.researcher).toBeNull()
  })

  it('no persona — FOR YOU is still empty (flat fallback unchanged)', () => {
    expect(getRailSections(null).forYou).toEqual([])
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
    expect(getRailSections('ops').more).toContain('/explore')
    // B+ remediation 1.3 (2026-08-10): these three moved from MORE to absent.
    // They previously rendered as ordinary MORE rows — i.e. the hub offered
    // curious the Command Center it gates them out of, and ops the patent
    // database its own O1 decision says is not an ops task. Now no row renders
    // and the group footer states the reason instead.
    expect(getRailSections('curious').more).not.toContain('/business')
    expect(getRailSections('ops').more).not.toContain('/patents')
    expect(getRailSections('developer').more).not.toContain('/leaders')
    // …and curious's own rail no longer leads with a patent database.
    expect(getRailSections('curious').forYou).not.toContain('/patents')
    // /leaders is DEMOTED for curious, not absent — still one click away.
    expect(getRailSections('curious').more).toContain('/leaders')
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

  it('empty FOR YOU (no persona) yields no groups at all', () => {
    expect(getForYouGroups(getRailSections(null).forYou)).toEqual([])
  })

  it('researcher gets real sub-groups, same as every other persona (2026-08-02)', () => {
    const groups = getForYouGroups(getRailSections('researcher').forYou)
    expect(groups.length).toBeGreaterThan(1)
    // The standard buckets every other persona renders.
    const ids = groups.map((g) => g.id)
    expect(ids).toContain('workflow')
    expect(ids).toContain('reference')
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

describe('getUngatedGroupablePaths — mobile shell fallback for no-persona', () => {
  it('excludes every self-placed and hidden path', () => {
    const paths = getUngatedGroupablePaths()
    for (const p of RAIL_SELF_PLACED_PATHS) expect(paths).not.toContain(p)
    for (const p of RAIL_HIDDEN_PATHS) expect(paths).not.toContain(p)
  })

  it('matches exactly what researcher (the existing "sees everything" persona) gets in FOR YOU', () => {
    const { forYou } = getRailSections('researcher')
    expect(new Set(getUngatedGroupablePaths())).toEqual(new Set(forYou))
  })

  it('every returned path resolves to a real group via getForYouGroups, or lands in the "other" catch-all', () => {
    const paths = getUngatedGroupablePaths()
    const groups = getForYouGroups(paths)
    const grouped = new Set(groups.flatMap((g) => g.paths))
    expect(grouped).toEqual(new Set(paths))
  })
})
