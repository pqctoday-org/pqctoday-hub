// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { pickBriefCheckQuestion } from './briefCheck'
import { pickQuizQuestion, questionsForModule } from './quizSelection'
import type { TreeActivity } from './types'

// Real activity shape (p0 "0.1 Frame the Business Case") — 3 learn siblings +
// an activity step, the exact pattern every activity-step Brief+check draws
// its question from.
const ACT_WITH_LEARN_SIBLINGS: TreeActivity = {
  id: '0.1',
  title: 'Frame the Business Case',
  steps: [
    {
      kind: 'learn',
      label: 'Learn: PQC Business Case',
      to: '/learn/pqc-business-case',
      moduleId: 'pqc-business-case',
    },
    {
      kind: 'learn',
      label: 'Learn: Executive Quantum Impact',
      to: '/learn/exec-quantum-impact',
      moduleId: 'exec-quantum-impact',
    },
    {
      kind: 'learn',
      label: 'Learn: Compliance & Regulatory Strategy',
      to: '/learn/compliance-strategy',
      moduleId: 'compliance-strategy',
    },
    {
      kind: 'activity',
      label: 'Build: Program Charter',
      to: '/business/tools/program-charter',
      artifactType: 'program-charter',
    },
  ],
}

const ACT_NO_LEARN_SIBLINGS: TreeActivity = {
  id: '9.9',
  title: 'No learn siblings',
  steps: [
    {
      kind: 'activity',
      label: 'Build: something',
      to: '/business/tools/x',
      artifactType: 'program-charter',
    },
  ],
}

describe('pickBriefCheckQuestion', () => {
  it('returns null when the activity has no learn-kind sibling steps', () => {
    expect(pickBriefCheckQuestion(ACT_NO_LEARN_SIBLINGS, 12345)).toBeNull()
  })

  it('picks a question from one of the sibling modules', () => {
    const siblingIds = ['pqc-business-case', 'exec-quantum-impact', 'compliance-strategy']
    const pick = pickBriefCheckQuestion(ACT_WITH_LEARN_SIBLINGS, 42)
    expect(pick).not.toBeNull()
    expect(siblingIds).toContain(pick!.moduleId)
    expect(pick!.question.category).toBe(pick!.moduleId)
  })

  it("excludes the sibling module's own gate question when it has more than one eligible question", () => {
    const pick = pickBriefCheckQuestion(ACT_WITH_LEARN_SIBLINGS, 7)
    expect(pick).not.toBeNull()
    const pool = questionsForModule(pick!.moduleId)
    const gate = pickQuizQuestion(pick!.moduleId, 7)
    if (pool.length > 1 && gate) {
      expect(pick!.question.id).not.toBe(gate.id)
    }
  })

  it('is deterministic for the same activity + run seed', () => {
    const a = pickBriefCheckQuestion(ACT_WITH_LEARN_SIBLINGS, 999)
    const b = pickBriefCheckQuestion(ACT_WITH_LEARN_SIBLINGS, 999)
    expect(a).toEqual(b)
  })

  it('a module with zero quiz coverage is skipped in favor of a sibling that has coverage', () => {
    const actWithDeadModule: TreeActivity = {
      id: '0.1',
      title: 'Frame the Business Case',
      steps: [
        {
          kind: 'learn',
          label: 'Learn: nonexistent module',
          to: '/learn/does-not-exist-xyz',
          moduleId: 'does-not-exist-xyz',
        },
        {
          kind: 'learn',
          label: 'Learn: PQC Business Case',
          to: '/learn/pqc-business-case',
          moduleId: 'pqc-business-case',
        },
      ],
    }
    const pick = pickBriefCheckQuestion(actWithDeadModule, 3)
    expect(pick).not.toBeNull()
    expect(pick!.moduleId).toBe('pqc-business-case')
  })
})
