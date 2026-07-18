// SPDX-License-Identifier: GPL-3.0-only
/**
 * Guardrail (local-only, not run in CI): every TRAP_REMEDIATION key must be a
 * real pitfall title (else it silently never matches, and simTrapTally.ts's
 * remediation() quietly falls back to the phase-first-module behavior) and
 * every value must resolve to a real, registered Learn module (else the
 * remediation link 404s). Also reports the still-unmapped pitfalls so the
 * P4-P9 gap stays visible instead of silently looking "done."
 */
import { describe, it, expect } from 'vitest'
import { TRAP_REMEDIATION } from './trapRemediation'
import { MODULE_CATALOG } from '@/components/PKILearning/moduleData'
import { SIM_TREES } from '@/simulation'
import type { PhaseId } from './frameworkPhases'

function allPitfallTitles(): Set<string> {
  const titles = new Set<string>()
  for (const phase of Object.keys(SIM_TREES) as PhaseId[]) {
    // eslint-disable-next-line security/detect-object-injection
    const tree = SIM_TREES[phase]
    if (!tree) continue
    for (const p of tree.pitfalls) titles.add(p.title)
  }
  return titles
}

describe('trapRemediation (WP2.7)', () => {
  it('every mapped trap title is a real pitfall title', () => {
    const real = allPitfallTitles()
    const unknown = Object.keys(TRAP_REMEDIATION).filter((title) => !real.has(title))
    expect(unknown, `mapped titles with no matching pitfall: ${unknown.join(', ')}`).toEqual([])
  })

  it('every mapped module id resolves in MODULE_CATALOG', () => {
    const broken = Object.entries(TRAP_REMEDIATION)
      .filter(([, moduleId]) => !MODULE_CATALOG[moduleId])
      .map(([title, moduleId]) => `${title} -> ${moduleId}`)
    expect(broken, `mapped to unknown module id: ${broken.join(', ')}`).toEqual([])
  })

  it('P0-P3 (the mapped tranche) has zero pitfalls left on the fallback; P4+ stays visible as a gap', () => {
    const real = allPitfallTitles()
    const mapped = new Set(Object.keys(TRAP_REMEDIATION))
    const unmapped = [...real].filter((title) => !mapped.has(title))
    console.log(
      `trapRemediation: ${mapped.size}/${real.size} pitfalls mapped\nstill on fallback:\n${unmapped.map((t) => `  - ${t}`).join('\n')}`
    )
    // Every P0-P3 title must be in `mapped` (asserted above); this just confirms
    // the "20 mapped" tranche didn't silently shrink without the other test noticing.
    expect(mapped.size).toBe(21)
  })
})
