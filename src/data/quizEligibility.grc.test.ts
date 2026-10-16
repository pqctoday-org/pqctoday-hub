// SPDX-License-Identifier: AGPL-3.0-only
/**
 * GRC quiz eligibility (plan §4 point 4, executive-grc-split-plan.md):
 * every checkpoint and the Essentials pool must have at least two eligible
 * questions per supported mode, using the SAME eligibility predicates as
 * `Quiz/index.tsx` (persona filter, unrestricted rows, quiz_mode pooling —
 * see that file's `filteredQuestions`/`handleStart`). No industry filter:
 * plan §4 point 4 requires this "without an industry filter."
 *
 * Checkpoint category lists are read directly off PERSONAS.grc.pathItems
 * rather than duplicated here, so this test can never drift from the real
 * curriculum.
 *
 * crypto-registry, sbom, cbom and crypto-agility were individually below the
 * 2-per-mode floor at first tagging (grc-quiz-tagging-draft.md's "coverage
 * gaps" section) — the first three had zero Executive-tagged candidates to
 * retag at all, so no amount of tagging could have closed them. Closed
 * 2026-09-08 by authoring 8 new scenario questions (plan §4 point 5:
 * Executive/GRC scenario framing, grounded in facts already established by
 * sibling rows in the same category, no new claims). The per-category test
 * below now asserts the floor directly instead of only reporting it.
 */
import { describe, it, expect } from 'vitest'
import { quizQuestions } from './quizDataLoader'
import { PERSONAS, essentialsQuizCategories, type PersonaId } from './learningPersonas'
import type { QuizQuestion } from '@/components/PKILearning/modules/Quiz/types'

const GRC: PersonaId = 'grc'

function isEligible(q: QuizQuestion, persona: PersonaId): boolean {
  // Mirrors Quiz/index.tsx's filteredQuestions persona predicate exactly.
  return q.personas.length === 0 || q.personas.includes(persona)
}

function countByMode(categories: string[]) {
  const pool = quizQuestions.filter((q) => categories.includes(q.category) && isEligible(q, GRC))
  const quick = pool.filter((q) => q.quizMode === 'quick' || q.quizMode === 'both').length
  const full = pool.filter((q) => q.quizMode === 'full' || q.quizMode === 'both').length
  return { quick, full, total: pool.length }
}

function checkpointCategories(id: string): string[] {
  const item = PERSONAS[GRC].pathItems.find((p) => p.type === 'checkpoint' && p.id === id)
  if (!item || item.type !== 'checkpoint') throw new Error(`checkpoint not found: ${id}`)
  return item.categories
}

describe('GRC quiz eligibility — checkpoints', () => {
  const CHECKPOINTS = ['grc-risk-obligations', 'grc-governance-inventory', 'grc-assurance-closure']

  it.each(CHECKPOINTS)('%s has at least 2 eligible questions per mode (quick and full)', (id) => {
    const { quick, full, total } = countByMode(checkpointCategories(id))
    expect(total, `${id}: no eligible questions at all`).toBeGreaterThan(0)
    expect(quick, `${id}: quick-mode pool`).toBeGreaterThanOrEqual(2)
    expect(full, `${id}: full-mode pool`).toBeGreaterThanOrEqual(2)
  })
})

describe('GRC quiz eligibility — Essentials pool', () => {
  it('the pooled Essentials category set has at least 2 eligible questions per mode', () => {
    const categories = essentialsQuizCategories(GRC)
    expect(categories.length).toBeGreaterThan(0)
    const { quick, full } = countByMode(categories)
    expect(quick).toBeGreaterThanOrEqual(2)
    expect(full).toBeGreaterThanOrEqual(2)
  })
})

describe('GRC quiz eligibility — every individual category', () => {
  const allCategories = [
    ...new Set(
      PERSONAS[GRC].pathItems
        .filter((p) => p.type === 'checkpoint')
        .flatMap((p) => (p.type === 'checkpoint' ? p.categories : []))
    ),
  ]

  it.each(allCategories)('%s has at least 2 eligible questions per mode on its own', (cat) => {
    const { quick, full } = countByMode([cat])
    expect(quick, `${cat}: quick-mode pool`).toBeGreaterThanOrEqual(2)
    expect(full, `${cat}: full-mode pool`).toBeGreaterThanOrEqual(2)
  })
})
