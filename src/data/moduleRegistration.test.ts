// SPDX-License-Identifier: GPL-3.0-only
/**
 * Registration guard — a new Learn module must be reachable by role, not just
 * routable.
 *
 * WHY THIS EXISTS. On 2026-07-30 two modules (government-defense-pqc,
 * trust-services-pqc) shipped fully working — manifest, route, SEO, sitemap,
 * frozen goldens, 1778 passing tests — and were invisible to every role
 * surface: no NICE work-role mapping, no persona path, no industry tags. The
 * whole suite stayed green, because exactly one registration surface
 * (phaseResourceMap) was guarded and the rest silently accepted absence.
 *
 * A module nobody's role surfaces is, for most learners, a module that does
 * not exist. These assertions make that a build failure instead of a
 * discovery months later.
 *
 * DESIGN NOTE. Both checks allow a documented exemption rather than demanding
 * universal coverage, because universal coverage is not currently true and
 * pretending otherwise would mean either a permanently-red test or silently
 * lowering the bar. An exemption is a deliberate, reviewed statement that a
 * module is intentionally not surfaced — which is precisely the decision that
 * was never made for the two modules above.
 */
import { describe, it, expect } from 'vitest'
import { MODULE_CATALOG } from '@/components/PKILearning/moduleData'
import { NICE_MODULE_MAP } from './niceModuleMapping'
import { PERSONAS } from './learningPersonas'

/** Not learn content — has no role or persona meaning. */
const NOT_A_LEARN_MODULE = new Set(['quiz'])

/**
 * Modules deliberately absent from NICE_MODULE_MAP. Pre-existing as of
 * 2026-07-30; recorded so the gap is visible and reviewable rather than
 * invisible. Removing an entry here is the fix; adding one needs a reason.
 */
// Empty as of 2026-09-01 (personas-nice content review): pqc-grc,
// skills-team-structure, and soc-implementation-pqc were the three
// "pre-existing gap, never mapped" entries this list existed to make
// visible — all three now have real NICE_MODULE_MAP entries.
const NICE_EXEMPT: Record<string, string> = {}

/**
 * Modules deliberately absent from every persona's recommendedPath.
 *
 * EMPTY as of B+ remediation WS8 (2026-08-21), and that is the point: all three
 * modules that used to sit here — `5g-security`, `trust-services-pqc` and
 * `government-defense-pqc`, the exact "AWAITING DECISION" entries this list was
 * created to make visible — now have real, content-justified path placements
 * (see the WS8 header comment in `learningPersonas.ts`). Every learn module is
 * reachable from at least one learning journey.
 *
 * Keep the mechanism, not the entries. An exemption is still the honest escape
 * hatch for a module that genuinely should not be in any path — but it costs a
 * written reason, which is what never happened for the three above. The stronger
 * placement contract WS8 established (>= 2 paths for the reinstated modules,
 * cluster-adjacent insertion positions, a no-regression ratchet on single-path
 * modules) lives in `personaPathPlacement.driftguard.test.ts`.
 */
const PERSONA_PATH_EXEMPT: Record<string, string> = {}

const learnModuleIds = Object.keys(MODULE_CATALOG).filter((id) => !NOT_A_LEARN_MODULE.has(id))

describe('module registration — every module is reachable by role', () => {
  it('finds a non-trivial catalogue (guards against an empty-map vacuous pass)', () => {
    expect(learnModuleIds.length).toBeGreaterThan(50)
  })

  it('every module has a NICE work-role mapping, or a documented exemption', () => {
    const mapped = new Set(NICE_MODULE_MAP.map((m) => m.moduleId))
    const unmapped = learnModuleIds.filter((id) => !mapped.has(id) && !(id in NICE_EXEMPT))
    expect(
      unmapped,
      `These modules have no entry in niceModuleMapping.ts, so no NICE work role ` +
        `surfaces them. Add an entry, or add the id to NICE_EXEMPT with a reason.`
    ).toEqual([])
  })

  it('every module appears in some persona path, or a documented exemption', () => {
    const inAPath = new Set(Object.values(PERSONAS).flatMap((p) => p.recommendedPath))
    const orphaned = learnModuleIds.filter((id) => !inAPath.has(id) && !(id in PERSONA_PATH_EXEMPT))
    expect(
      orphaned,
      `These modules are in no persona's recommendedPath, so no learning journey ` +
        `leads to them. Add them to a path (and update that persona's ` +
        `estimatedMinutes), or add the id to PERSONA_PATH_EXEMPT with a reason.`
    ).toEqual([])
  })

  it('every NICE mapping points at a module that exists', () => {
    const dangling = NICE_MODULE_MAP.map((m) => m.moduleId).filter((id) => !(id in MODULE_CATALOG))
    expect(dangling, 'niceModuleMapping.ts references modules that no longer exist').toEqual([])
  })

  it('exemption lists do not name modules that are actually registered', () => {
    // An exemption that is no longer needed is stale metadata pretending to be
    // a decision. Fail so it gets removed.
    const mapped = new Set(NICE_MODULE_MAP.map((m) => m.moduleId))
    const inAPath = new Set(Object.values(PERSONAS).flatMap((p) => p.recommendedPath))
    expect(
      Object.keys(NICE_EXEMPT).filter((id) => mapped.has(id)),
      'NICE_EXEMPT names modules that ARE mapped — remove them'
    ).toEqual([])
    expect(
      Object.keys(PERSONA_PATH_EXEMPT).filter((id) => inAPath.has(id)),
      'PERSONA_PATH_EXEMPT names modules that ARE in a path — remove them'
    ).toEqual([])
  })

  it('exemption lists do not name modules that no longer exist', () => {
    const stale = [...Object.keys(NICE_EXEMPT), ...Object.keys(PERSONA_PATH_EXEMPT)].filter(
      (id) => !(id in MODULE_CATALOG)
    )
    expect(stale, 'exemption lists name modules that are gone — remove them').toEqual([])
  })
})
