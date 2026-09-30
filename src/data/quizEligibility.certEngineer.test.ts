// SPDX-License-Identifier: GPL-3.0-only
/**
 * Certification & Validation Engineer quiz eligibility — the same floor the
 * GRC split set (quizEligibility.grc.test.ts): every checkpoint, the
 * Essentials pool and every individual checkpoint category must have at least
 * two eligible questions per supported mode, using the SAME eligibility
 * predicates as `Quiz/index.tsx`. No industry filter.
 *
 * Checkpoint category lists are read off PERSONAS['cert-engineer'].pathItems,
 * so this test cannot drift from the curriculum. Eligibility came from tagging
 * every existing question in the persona's 16 categories (pqcquiz_09292026.csv)
 * — no new questions were written for the persona.
 */
import { describe, it, expect } from 'vitest'
import { quizQuestions } from './quizDataLoader'
import { PERSONAS, essentialsQuizCategories, type PersonaId } from './learningPersonas'
import type { QuizQuestion } from '@/components/PKILearning/modules/Quiz/types'

const CERT: PersonaId = 'cert-engineer'

function isEligible(q: QuizQuestion, persona: PersonaId): boolean {
  // Mirrors Quiz/index.tsx's filteredQuestions persona predicate exactly.
  return q.personas.length === 0 || q.personas.includes(persona)
}

function countByMode(categories: string[]) {
  const pool = quizQuestions.filter((q) => categories.includes(q.category) && isEligible(q, CERT))
  const quick = pool.filter((q) => q.quizMode === 'quick' || q.quizMode === 'both').length
  const full = pool.filter((q) => q.quizMode === 'full' || q.quizMode === 'both').length
  return { quick, full, total: pool.length }
}

function checkpointCategories(id: string): string[] {
  const item = PERSONAS[CERT].pathItems.find((p) => p.type === 'checkpoint' && p.id === id)
  if (!item || item.type !== 'checkpoint') throw new Error(`checkpoint not found: ${id}`)
  return item.categories
}

describe('cert-engineer quiz eligibility — checkpoints', () => {
  const CHECKPOINTS = ['cert-algorithms-entropy', 'cert-module-scheme', 'cert-mastery']

  it.each(CHECKPOINTS)('%s has at least 2 eligible questions per mode (quick and full)', (id) => {
    const { quick, full, total } = countByMode(checkpointCategories(id))
    expect(total, `${id}: no eligible questions at all`).toBeGreaterThan(0)
    expect(quick, `${id}: quick-mode pool`).toBeGreaterThanOrEqual(2)
    expect(full, `${id}: full-mode pool`).toBeGreaterThanOrEqual(2)
  })
})

describe('cert-engineer quiz eligibility — Essentials pool', () => {
  it('the pooled Essentials category set has at least 2 eligible questions per mode', () => {
    const categories = essentialsQuizCategories(CERT)
    expect(categories.length).toBeGreaterThan(0)
    const { quick, full } = countByMode(categories)
    expect(quick).toBeGreaterThanOrEqual(2)
    expect(full).toBeGreaterThanOrEqual(2)
  })
})

describe('cert-engineer quiz eligibility — every individual category', () => {
  const allCategories = [
    ...new Set(
      PERSONAS[CERT].pathItems
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
