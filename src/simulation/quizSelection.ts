// SPDX-License-Identifier: AGPL-3.0-only
/**
 * quizSelection (WP2.5) — deterministic per-module question pick for the
 * quiz-gated "Mark complete" flow. Reuses the REAL quiz bank that already
 * powers /learn/quiz (src/data/quizDataLoader.ts, 1005 questions) — no new
 * question authoring, no separate quiz system. `QuizQuestion.category`
 * mostly shares its vocabulary with Learn module ids (e.g. 'crypto-agility',
 * 'hybrid-crypto', 'quantum-threats').
 *
 * W1.6: "mostly" is the bug. Matching on `category === moduleId` alone left
 * `pki-workshop` (whose questions live under `pki-infrastructure`) with zero
 * eligible questions, and the caller then marked the module complete with no
 * check at all. Resolution now goes through an EXPLICIT alias map, and a
 * module with genuinely no coverage reports `unavailable` so the UI can say so
 * rather than silently granting completion.
 *
 * Filtered to single-answer types (multiple-choice, true-false) — this is a
 * quick comprehension check, not the full quiz experience multi-select math
 * (partial-credit scoring, etc.) is built for.
 */
import { quizQuestions } from '@/data/quizDataLoader'
import type { QuizQuestion } from '@/components/PKILearning/modules/Quiz/types'
import { mulberry32, sampleWith } from './rng'

/** FNV-1a — a small, dependency-free string hash for deriving a per-module
 *  sub-seed from the run seed (so a different phase/module never draws with
 *  the same stream as another). Exported for briefCheck.ts (sim-mobile-
 *  full-play WS-2), which needs the identical hash to pick a DIFFERENT
 *  question than this module's own gate question — reusing it rather than a
 *  second copy keeps both draws provably from the same hash family. */
export function hashString(s: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

/**
 * Learn module id → quiz-bank category, for the modules where the two
 * vocabularies genuinely differ. Keep this EXPLICIT: a silent fallback is what
 * produced an ungated "check" in the first place.
 *
 * Measured 2026-09-07 against pqcquiz_08172026_r2.csv: of the 43 unique Learn
 * modules the trees gate on, `pki-workshop` was the only one with no matching
 * category. Its questions are authored under `pki-infrastructure`.
 */
export const MODULE_QUIZ_CATEGORY: Readonly<Record<string, string>> = {
  'pki-workshop': 'pki-infrastructure',
}

/** The bank category a module's questions actually live under. */
export const quizCategoryFor = (moduleId: string): string =>
  MODULE_QUIZ_CATEGORY[moduleId] ?? moduleId

/** All gate-eligible questions for a Learn module (single-answer types only).
 *  Empty when the module genuinely has no quiz coverage. */
export function questionsForModule(moduleId: string): QuizQuestion[] {
  const category = quizCategoryFor(moduleId)
  return quizQuestions.filter(
    (q) => q.category === category && (q.type === 'multiple-choice' || q.type === 'true-false')
  )
}

/** Whether a module can be comprehension-checked, stated explicitly. A module
 *  with no bank coverage must be surfaced as "check unavailable" — never
 *  completed silently. */
export interface GateCoverage {
  state: 'checked' | 'unavailable'
  /** The category consulted (after alias resolution). */
  category: string
  questionCount: number
}

export function gateCoverageFor(moduleId: string): GateCoverage {
  const category = quizCategoryFor(moduleId)
  const questionCount = questionsForModule(moduleId).length
  return { state: questionCount > 0 ? 'checked' : 'unavailable', category, questionCount }
}

/**
 * Deterministically pick ONE question for a module within a run — the same
 * run seed + moduleId always draws the same question (replayable, and a
 * player can't reroll for an easier one by reopening the module), while
 * different runs and different modules draw independently. Null when the
 * module has no eligible questions (the caller falls back to self-attested
 * completion).
 */
export function pickQuizQuestion(moduleId: string, runSeed: number): QuizQuestion | null {
  const pool = questionsForModule(moduleId)
  if (pool.length === 0) return null
  const rng = mulberry32((runSeed ^ hashString(moduleId)) >>> 0)
  return sampleWith(rng, pool)
}
