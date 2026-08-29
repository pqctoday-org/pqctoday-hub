// SPDX-License-Identifier: GPL-3.0-only
/**
 * briefCheck (sim-mobile-full-play WS-2) — picks the comprehension-check
 * question for a phone "Brief + check" completion (plan §4.2 step 3).
 *
 * v1 source is the existing quiz bank, reusing the same deterministic
 * pickQuizQuestion(moduleId, runSeed) every learn-kind "Mark complete" gate
 * already uses — no new question authoring. The category is one of the
 * activity's SIBLING learn steps (every activity that has an `activity` step
 * also has at least one `learn` step, per the framework tree data), chosen
 * deterministically so the same run always drafts the same check. The check
 * question is explicitly NOT the sibling module's own gate question — a
 * player who already passed that module's gate (or will later) shouldn't see
 * it repeated verbatim here.
 */
import { mulberry32, sampleWith } from './rng'
import { pickQuizQuestion, questionsForModule, hashString } from './quizSelection'
import type { TreeActivity } from './types'
import type { QuizQuestion } from '@/components/PKILearning/modules/Quiz/types'

export interface BriefCheckPick {
  /** The sibling learn module this check question is drawn from. */
  moduleId: string
  question: QuizQuestion
}

/**
 * Pick a check question for an `activity` step's Brief screen, drawn from one
 * of the parent activity's sibling `learn` steps.
 *
 * Deterministic per (activity, runSeed): the sibling module is chosen by
 * hashing the activity id, and — when that module has more than one eligible
 * question — the specific question is chosen from the pool EXCLUDING the
 * module's own gate question (pickQuizQuestion(moduleId, runSeed)), so the
 * Brief check never just repeats what "Mark complete" already asked. If the
 * chosen sibling module has only one eligible question total, that single
 * question is reused (still better than no check) rather than skipping the
 * module. Rotates through every sibling module (deterministically) before
 * giving up, so a module with zero quiz coverage doesn't fall through when
 * an activity has more than one learn sibling.
 *
 * Returns null only if the activity has no learn-kind sibling steps, or none
 * of them have any quiz coverage at all (should not happen — every activity
 * with an `activity` step has at least one `learn` sibling per the tree data;
 * a caller should treat null as "no check available", not an error).
 */
export function pickBriefCheckQuestion(act: TreeActivity, runSeed: number): BriefCheckPick | null {
  const moduleIds = Array.from(
    new Set(
      act.steps
        .filter((s): s is typeof s & { moduleId: string } => s.kind === 'learn' && !!s.moduleId)
        .map((s) => s.moduleId)
    )
  )
  if (moduleIds.length === 0) return null

  const start = hashString(act.id) % moduleIds.length
  for (let i = 0; i < moduleIds.length; i++) {
    const moduleId = moduleIds[(start + i) % moduleIds.length]!
    const pool = questionsForModule(moduleId)
    if (pool.length === 0) continue
    const gate = pickQuizQuestion(moduleId, runSeed)
    const alt = gate ? pool.filter((q) => q.id !== gate.id) : pool
    if (alt.length > 0) {
      const rng = mulberry32((runSeed ^ hashString(`${moduleId}:brief`)) >>> 0)
      return { moduleId, question: sampleWith(rng, alt) }
    }
    if (gate) return { moduleId, question: gate }
  }
  return null
}
