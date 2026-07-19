// SPDX-License-Identifier: GPL-3.0-only
/**
 * Guardrail (local-only, not run in CI): the correct decision card must not
 * be guessable by grammatical FORM alone — a task-shaped label ("Learn: X",
 * "Practice: Y", "Run Z") sitting next to strategy-shaped trap titles let a
 * player pattern-match the answer without engaging with the content
 * (simulation-mode-review-07182026.md, WP2.6). Every gating activity now
 * carries a `decision` phrasing (sections.tsx prefers it over the raw step
 * label) — this asserts none of them regress into a task-label shape.
 */
import { describe, it, expect } from 'vitest'
import { SIM_TREES } from '@/simulation'
import type { PhaseId } from '@/data/frameworkPhases'

// The genuinely distinctive, mechanically-detectable "this is a menu item, not
// a strategy" signature: the L()/W()/R() generator helpers always prefix a
// step label with its kind name + a colon ("Learn: X", "Practice: X",
// "Reference: X"). A()/C() (activity/catalog) helpers already write natural
// action sentences with no such marker, so ordinary imperative verbs like
// "Run"/"Build"/"Draft" are NOT flagged here — those are exactly how a good
// decision phrasing should read; only the colon-tagged category prefix is
// the actual pattern a trap title never uses.
const TASK_LABEL_PREFIXES = ['Learn:', 'Practice:', 'Reference:']

describe('decision-card form blindness (WP2.6)', () => {
  it('every gating activity has a decision phrasing', () => {
    const missing: string[] = []
    for (const phase of Object.keys(SIM_TREES) as PhaseId[]) {
      // eslint-disable-next-line security/detect-object-injection
      const tree = SIM_TREES[phase]
      if (!tree) continue
      for (const band of tree.levels) {
        for (const act of band.activities) {
          if (!act.decision) missing.push(`${phase} ${act.id}`)
        }
      }
    }
    expect(missing, `activities with no decision phrasing: ${missing.join(', ')}`).toEqual([])
  })

  it('no decision phrasing starts with a task-shaped prefix (the exact pattern a trap never uses)', () => {
    const offenders: string[] = []
    for (const phase of Object.keys(SIM_TREES) as PhaseId[]) {
      // eslint-disable-next-line security/detect-object-injection
      const tree = SIM_TREES[phase]
      if (!tree) continue
      for (const band of tree.levels) {
        for (const act of band.activities) {
          if (!act.decision) continue
          if (TASK_LABEL_PREFIXES.some((p) => act.decision!.startsWith(p))) {
            offenders.push(`${phase} ${act.id}: "${act.decision}"`)
          }
        }
      }
    }
    expect(offenders, `task-shaped decision phrasings: ${offenders.join('\n')}`).toEqual([])
  })

  it('every decision phrasing is a genuinely different string from the raw step label it replaces', () => {
    const identical: string[] = []
    for (const phase of Object.keys(SIM_TREES) as PhaseId[]) {
      // eslint-disable-next-line security/detect-object-injection
      const tree = SIM_TREES[phase]
      if (!tree) continue
      for (const band of tree.levels) {
        for (const act of band.activities) {
          if (!act.decision) continue
          const firstStepLabel = act.steps[0]?.label
          if (act.decision === firstStepLabel) identical.push(`${phase} ${act.id}`)
        }
      }
    }
    expect(identical, `decision identical to step label: ${identical.join(', ')}`).toEqual([])
  })
})
