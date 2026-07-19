// SPDX-License-Identifier: GPL-3.0-only
/**
 * Guardrail (local-only, not run in CI): lists which Learn modules gating
 * program maturity have NO quiz-gate coverage (questionsForModule returns
 * empty), so they fall back to self-attested completion. This isn't a build
 * gate — new modules are added faster than quiz content, and that's fine —
 * it's a visible, checkable inventory so the gap is a known, tracked fact
 * instead of a silent one (WP2.5, simulation-mode-review-07182026.md).
 *
 * The one regression this DOES guard: a module that has coverage today must
 * keep it. If this test fails on the "known covered" assertion, something
 * removed quiz questions for a module the sim actively gates on — fix the
 * quiz bank, don't just update the expectation.
 */
import { describe, it, expect } from 'vitest'
import { SIM_TREES, flattenTree } from '@/simulation'
import { questionsForModule } from './quizSelection'
import type { PhaseId } from '@/data/frameworkPhases'

function allLearnModuleIds(): Set<string> {
  const ids = new Set<string>()
  for (const phase of Object.keys(SIM_TREES) as PhaseId[]) {
    // eslint-disable-next-line security/detect-object-injection
    const tree = SIM_TREES[phase]
    if (!tree) continue
    for (const step of flattenTree(tree)) {
      if (step.kind === 'learn' && step.moduleId) ids.add(step.moduleId)
    }
  }
  return ids
}

describe('quiz-gate coverage inventory', () => {
  it('reports which gating Learn modules have no quiz question (self-attested fallback)', () => {
    const moduleIds = [...allLearnModuleIds()].sort()
    const uncovered = moduleIds.filter((id) => questionsForModule(id).length === 0)
    // eslint-disable-next-line no-console
    console.log(
      `quiz-gate coverage: ${moduleIds.length - uncovered.length}/${moduleIds.length} modules covered.` +
        (uncovered.length ? ` Self-attested fallback: ${uncovered.join(', ')}` : '')
    )
    // Informational — not a failure. Coverage is expected to be high but not
    // necessarily 100%; this just makes the gap visible instead of silent.
    expect(moduleIds.length).toBeGreaterThan(0)
  })

  it('regression guard: every gating module except the one known gap has quiz coverage', () => {
    // 'pki-workshop' is the sole accepted gap as of 07182026 (see the inventory
    // test above). Every OTHER module the trees currently require must resolve
    // real quiz questions — if one doesn't, that's a genuine content regression
    // (questions removed or recategorized), not an expectation to relax.
    const KNOWN_GAP = new Set(['pki-workshop'])
    const shouldBeCovered = [...allLearnModuleIds()].filter((id) => !KNOWN_GAP.has(id)).sort()
    const dropped = shouldBeCovered.filter((id) => questionsForModule(id).length === 0)
    expect(dropped, `modules that lost quiz coverage: ${dropped.join(', ')}`).toEqual([])
  })
})
