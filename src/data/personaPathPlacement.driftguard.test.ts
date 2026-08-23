// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable security/detect-object-injection */ // keys are trusted (PersonaId literals from PERSONAS)
//
// Driftguard for persona-path PLACEMENT — the half of discoverability that
// `moduleRegistration.test.ts` cannot see.
//
// That guard asks "is this module in *a* path?". B+ remediation WS8 (2026-08-21)
// established that membership alone is not the contract, because two consumers
// navigate by array INDEX, not by membership:
//
//   - `PKILearning/common/CuriousModuleView.tsx` — Previous/Next Module buttons
//     do `const idx = path.indexOf(moduleId)` then `path[idx - 1]`/`path[idx + 1]`.
//   - `PKILearning/PersonaPathView.tsx`'s `computeNextIncompleteModuleId` — walks
//     `pathItems` in order for the "Continue where you left off" card.
//   (`NextModuleCTA.tsx` does the same index walk and is what WS8's brief named,
//   but it is mounted nowhere today — ModuleShell's P2.3 footer replaced it with a
//   trackOrder-based handoff. Kept in the reasoning because the contract is the
//   same the moment anything re-mounts it.)
//
// `recommendedPath` arrays run 19-52 entries and always end in `'quiz'`, so a
// module appended just before `'quiz'` is only ever offered as "next" to a
// learner who has already finished the entire curriculum ahead of it — membership
// on paper, zero reach in practice. WS17's signals-to-score analysis measured the
// same thing from the other end: binary signal COUNT does not predict
// discoverability (r = -0.008 across 9 mechanisms); reach and position do.
//
// So this file pins three things a future edit could silently undo:
//   1. no learn module is orphaned from every path (floor, no escape hatch here);
//   2. the modules WS8 reinstated keep >= 2 personas AND their cluster-adjacent
//      insertion slots — not a tail append;
//   3. the set of single-path modules can shrink but never grow (ratchet).
//
// A failure here means a persona path was reordered or trimmed in a way that
// re-buries a module, not a bug in this file.

import { describe, expect, it } from 'vitest'
import { PERSONAS, type PersonaId } from './learningPersonas'
import { MODULE_CATALOG } from '@/components/PKILearning/moduleData'

/** Not learn content — the capstone terminator of every path. */
const QUIZ_ID = 'quiz'

const learnModuleIds = Object.keys(MODULE_CATALOG).filter((id) => id !== QUIZ_ID)
const personaEntries = Object.entries(PERSONAS) as [PersonaId, (typeof PERSONAS)[PersonaId]][]

/** module id -> the personas whose recommendedPath lists it. */
const reachByModule = new Map<string, PersonaId[]>()
for (const [personaId, persona] of personaEntries) {
  for (const moduleId of persona.recommendedPath) {
    if (moduleId === QUIZ_ID) continue
    reachByModule.set(moduleId, [...(reachByModule.get(moduleId) ?? []), personaId])
  }
}

const reachOf = (moduleId: string): PersonaId[] => reachByModule.get(moduleId) ?? []

/**
 * Modules that were in ZERO persona paths before WS8 and are the reason this
 * guard exists. `5g-security` and `trust-services-pqc` came from WS8's own
 * census; `government-defense-pqc` shipped 2026-07-30, AFTER that census, and
 * was caught by WS17's recount — the stale-census failure mode this guard is
 * meant to make impossible. Each must hold >= 2 personas.
 */
const WS8_REINSTATED = ['5g-security', 'trust-services-pqc', 'government-defense-pqc']

/**
 * The WS8 insertion contract: every added (module, persona) pair, and the module
 * it must sit immediately after in that persona's own `recommendedPath`. The
 * anchor IS the justification — each one is the nearest topical neighbour in
 * that path, which is what keeps the insertion inside a cluster instead of at
 * the tail. Changing an anchor is a content decision; it should change here too.
 */
const WS8_PLACEMENTS: { module: string; persona: PersonaId; after: string; why: string }[] = [
  // --- the two collapsed-discoverability modules (0 paths before WS8) ---
  {
    module: '5g-security',
    persona: 'developer',
    after: 'web-gateway-pqc',
    why: 'joins the protocol cluster (tls-basics -> vpn-ssh-pqc -> mls-group-messaging -> web-gateway-pqc); SUCI/5G-AKA is protocol-implementation work',
  },
  {
    module: '5g-security',
    persona: 'architect',
    after: 'mls-group-messaging',
    why: 'same protocol cluster in this path; 3GPP security architecture is an architecture-review topic',
  },
  {
    module: 'trust-services-pqc',
    persona: 'executive',
    after: 'compliance-strategy',
    why: 'qualified signatures, TSP conformity and 30-year archival liability are compliance content',
  },
  {
    module: 'trust-services-pqc',
    persona: 'architect',
    after: 'digital-id',
    why: 'digital-id (EUDI Wallet/eIDAS) is the closest existing content match for long-term validation',
  },
  // --- the third zero-path module, found after WS8's census (WS17 correction) ---
  {
    module: 'government-defense-pqc',
    persona: 'executive',
    after: 'standards-bodies',
    why: 'the CNSA 2.0 / OMB / statute mandate stack belongs with the standards-and-compliance cluster',
  },
  {
    module: 'government-defense-pqc',
    persona: 'researcher',
    after: 'aerospace-pqc',
    why: 'completes this path’s industry-vertical cluster; defense is the vertical adjacent to aerospace',
  },
  // --- the narrow-reach modules, one content-justified persona each ---
  {
    module: 'ai-security-pqc',
    persona: 'executive',
    after: 'pqc-risk-management',
    why: 'AI-security governance is risk-scanning content, so it sits with the risk module',
  },
  {
    module: 'sbom',
    persona: 'executive',
    after: 'crypto-mgmt-modernization',
    why: 'SBOM/EO 14028 is a board-and-compliance topic; mirrors the CBOM cluster order used elsewhere',
  },
  {
    module: 'crypto-registry',
    persona: 'executive',
    after: 'sbom',
    why: 'a cryptography registry is a governance/CBOM artifact; adjacent to sbom everywhere they co-occur',
  },
  {
    module: 'digital-assets',
    persona: 'executive',
    after: 'vendor-risk',
    why: 'digital-asset custody risk sits on the same board risk register as vendor risk',
  },
  {
    module: 'platform-eng-pqc',
    persona: 'architect',
    after: 'confidential-computing',
    why: 'end of the infra cluster this persona already walks; platform choices are architecture choices',
  },
  {
    module: 'confidential-computing',
    persona: 'ops',
    after: 'secure-boot-pqc',
    why: 'joins the hardware/infra cluster; confidential computing is deployed and operated infrastructure',
  },
  {
    module: 'vendor-risk',
    persona: 'ops',
    after: 'crypto-registry',
    why: 'joins the supply-chain/CBOM cluster; vendor PQC roadmaps are tracked operationally day to day',
  },
]

/**
 * Modules that legitimately reach exactly ONE persona today. Five are the
 * `*QuantumImpact` role guides — single-persona BY DESIGN, since a persona
 * overview belongs to its own persona and nowhere else. The rest are a recorded
 * residual for a later pass (WS17), not an endorsement. This list is a RATCHET:
 * a module may leave it by gaining reach, but nothing may join it.
 */
const SINGLE_PATH_MODULES = new Set([
  'exec-quantum-impact',
  'dev-quantum-impact',
  'arch-quantum-impact',
  'research-quantum-impact',
  'ops-quantum-impact',
  'skills-team-structure',
  'pqc-grc',
  'soc-implementation-pqc',
  'emv-payment-pqc',
  'automotive-pqc',
])

/**
 * `mls-group-messaging` is deliberately left at 3/6 (developer, architect,
 * researcher) — see the WS8 header comment in `learningPersonas.ts`. It is
 * protocol-implementation content for one messaging spec (RFC 9420) and those
 * three ARE its audience; widening it would be the blanket rule WS8 rejects.
 * Pinned exactly so a later "fix the narrow module" sweep has to read the
 * reasoning before changing it, in either direction.
 */
const MLS_EXEMPT_PERSONAS: PersonaId[] = ['developer', 'architect', 'researcher']

describe('persona-path placement driftguard (WS8)', () => {
  it('finds a non-trivial catalogue and all six personas (no vacuous pass)', () => {
    expect(learnModuleIds.length).toBeGreaterThan(50)
    expect(personaEntries).toHaveLength(6)
    expect(reachByModule.size).toBeGreaterThan(50)
  })

  it('every persona path is terminated by the quiz capstone', () => {
    for (const [personaId, persona] of personaEntries) {
      expect(persona.recommendedPath.at(-1), `${personaId} recommendedPath ends in quiz`).toBe(
        QUIZ_ID
      )
    }
  })

  it('no learn module is orphaned from every persona path', () => {
    const orphaned = learnModuleIds.filter((id) => reachOf(id).length === 0)
    expect(
      orphaned,
      `These modules are in no persona recommendedPath, so no learning journey reaches ` +
        `them — the exact failure WS8 repaired for 5g-security / trust-services-pqc / ` +
        `government-defense-pqc. Give each one a content-justified path placement.`
    ).toEqual([])
  })

  it('every module WS8 reinstated reaches at least two personas', () => {
    for (const moduleId of WS8_REINSTATED) {
      expect(learnModuleIds, `${moduleId} is a real catalogue module`).toContain(moduleId)
      expect(reachOf(moduleId).length, `${moduleId} persona reach`).toBeGreaterThanOrEqual(2)
    }
  })

  it('every WS8 insertion sits immediately after its topical-cluster anchor', () => {
    for (const { module, persona, after, why } of WS8_PLACEMENTS) {
      const path = PERSONAS[persona].recommendedPath
      const anchorIdx = path.indexOf(after)
      expect(anchorIdx, `${persona} path still contains the anchor "${after}"`).toBeGreaterThan(-1)
      expect(
        path[anchorIdx + 1],
        `"${module}" must sit immediately after "${after}" in the ${persona} path (${why})`
      ).toBe(module)
    }
  })

  it('no WS8 insertion was pushed to the tail of its path', () => {
    // `path.at(-1)` is always 'quiz', so the last real module is at -2. A module
    // parked there is only ever "next" for someone who finished everything else —
    // membership without reach, which is what WS8 exists to prevent.
    for (const { module, persona } of WS8_PLACEMENTS) {
      const path = PERSONAS[persona].recommendedPath
      expect(
        path.at(-2),
        `"${module}" is the last module before the quiz in the ${persona} path — ` +
          `CuriousModuleView / computeNextIncompleteModuleId walk this path in order, so ` +
          `a tail slot ` +
          `means it only ever surfaces after the whole curriculum. Re-insert it at ` +
          `its topical cluster.`
      ).not.toBe(module)
    }
  })

  it('the single-persona-reach set is a ratchet — it may shrink, never grow', () => {
    const singles = learnModuleIds.filter((id) => reachOf(id).length === 1)
    const newlyNarrow = singles.filter((id) => !SINGLE_PATH_MODULES.has(id))
    expect(
      newlyNarrow,
      `These modules dropped to a single persona path. Either restore their reach, or ` +
        `add them to SINGLE_PATH_MODULES with the reason it is correct.`
    ).toEqual([])
  })

  it('mls-group-messaging stays deliberately at 3/6 (written exemption)', () => {
    expect(
      [...reachOf('mls-group-messaging')].sort(),
      `mls-group-messaging is a WRITTEN exemption, not an oversight: RFC 9420 group ` +
        `messaging is developer/architect/researcher content and WS8 records why it is ` +
        `not widened. If this is being changed deliberately, update the reasoning in ` +
        `learningPersonas.ts and this guard together.`
    ).toEqual([...MLS_EXEMPT_PERSONAS].sort())
  })
})
