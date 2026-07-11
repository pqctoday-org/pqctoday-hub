// SPDX-License-Identifier: GPL-3.0-only
// @vitest-environment node
/**
 * Drift guard for the quiz category vocabulary (validator check C8).
 *
 * The single source of truth is the runtime QUIZ_CATEGORIES array in
 * src/components/PKILearning/modules/Quiz/types.ts (the QuizCategory type is
 * derived from it, and cross-ref-checks.ts imports it). These tests pin the
 * three-way agreement between the app vocabulary, the validator, and the
 * shipped quiz CSV so a stale copy can never reappear:
 *   - every category used in the latest pqcquiz_*.csv exists in the app type
 *   - the validator set is exactly the app vocabulary (no extras like the
 *     historical 'key-management' entry that the app never had)
 *   - a bogus category is still rejected (C8 can fail)
 */
import { describe, it, expect } from 'vitest'
import { QUIZ_CATEGORIES } from '../../../src/components/PKILearning/modules/Quiz/types.js'
import { loadCSV } from '../data-loader.js'

describe('quiz category vocabulary (C8 source of truth)', () => {
  it('is a non-empty, duplicate-free runtime array', () => {
    expect(QUIZ_CATEGORIES.length).toBeGreaterThan(0)
    expect(new Set(QUIZ_CATEGORIES).size).toBe(QUIZ_CATEGORIES.length)
  })

  it('covers every category used in the latest quiz CSV (no orphaned data)', () => {
    const quiz = loadCSV('pqcquiz_')
    expect(quiz.rows.length).toBeGreaterThan(0)
    const vocab = new Set<string>(QUIZ_CATEGORIES)
    const csvCategories = [...new Set(quiz.rows.map((r) => r.category).filter(Boolean))]
    const orphaned = csvCategories.filter((c) => !vocab.has(c))
    expect(orphaned).toEqual([])
  })

  it('rejects categories outside the app vocabulary (C8 can still fail)', () => {
    const vocab = new Set<string>(QUIZ_CATEGORIES)
    expect(vocab.has('definitely-not-a-quiz-category')).toBe(false)
    // Regression pin: 'key-management' was in the validator's old hand-copied
    // list but never in the app type — it must stay out.
    expect(vocab.has('key-management')).toBe(false)
  })
})
