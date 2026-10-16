// SPDX-License-Identifier: AGPL-3.0-only
/**
 * W0.5 regression — a comprehension gate must never silently grant itself.
 *
 * `quizSelection` matched questions by `category === moduleId`. The bank has no
 * `pki-workshop` category (its questions live under `pki-infrastructure`), so
 * that gate returned null and the caller fell through to marking the module
 * complete with no check and, on the mobile path, no visible label either.
 *
 * The invariant: every gated Learn module either has a real check, or is
 * EXPLICITLY reported as having none. Silence is the defect.
 */
import { describe, it, expect } from 'vitest'
import { questionsForModule, pickQuizQuestion, gateCoverageFor } from './quizSelection'
import { SIM_TREES } from './index'
import { flattenTree, isGatingStep } from './types'

/** Every module id the trees actually gate on. */
const gatedModuleIds = (): string[] => {
  const ids = new Set<string>()
  for (const tree of Object.values(SIM_TREES)) {
    if (!tree) continue
    for (const s of flattenTree(tree)) {
      if (isGatingStep(s) && s.kind === 'learn' && s.moduleId) ids.add(s.moduleId)
    }
  }
  return [...ids].sort()
}

describe('quiz gating (W0.5 regression)', () => {
  it('resolves a check for pki-workshop via its real question category', () => {
    // The bank stores these under 'pki-infrastructure'; the module id differs.
    expect(questionsForModule('pki-workshop').length).toBeGreaterThan(0)
    expect(pickQuizQuestion('pki-workshop', 1234)).not.toBeNull()
  })

  it('gives every gated Learn module an explicit coverage state', () => {
    // No module may be silently uncovered: either it has a check, or the
    // coverage report names it as unavailable so the UI can say so.
    for (const id of gatedModuleIds()) {
      const cov = gateCoverageFor(id)
      expect(cov, `no coverage state for ${id}`).toBeDefined()
      expect(['checked', 'unavailable'], id).toContain(cov.state)
      if (cov.state === 'checked') expect(cov.questionCount, id).toBeGreaterThan(0)
    }
  })

  it('keeps the draw deterministic per run seed and module', () => {
    const a = pickQuizQuestion('pki-workshop', 42)
    const b = pickQuizQuestion('pki-workshop', 42)
    expect(a?.id).toBe(b?.id)
  })
})
