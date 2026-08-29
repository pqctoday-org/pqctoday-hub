// SPDX-License-Identifier: GPL-3.0-only
/**
 * quizSelection (WP2.5) — deterministic per-module question pick for the
 * quiz-gated "Mark complete" flow. Reuses the REAL quiz bank that already
 * powers /learn/quiz (src/data/quizDataLoader.ts, 1005 questions) — no new
 * question authoring, no separate quiz system. `QuizQuestion.category`
 * already shares its vocabulary with Learn module ids (e.g. 'crypto-agility',
 * 'hybrid-crypto', 'quantum-threats'), so filtering by category === moduleId
 * finds the questions written for that exact module.
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

/** All gate-eligible questions for a Learn module (category === moduleId,
 *  single-answer types only). Empty when the module has no quiz coverage. */
export function questionsForModule(moduleId: string): QuizQuestion[] {
  return quizQuestions.filter(
    (q) => q.category === moduleId && (q.type === 'multiple-choice' || q.type === 'true-false')
  )
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
