// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { autoRunWalkthroughQueue } from './simAutoRun'
import { EXEC_TOUR_STAGES, EXEC_TOUR_REVEAL_TYPES } from './execTourConfig'

describe('autoRunWalkthroughQueue', () => {
  const queue = autoRunWalkthroughQueue()

  it('is non-empty and normalizes every item to level 1', () => {
    expect(queue.length).toBeGreaterThan(0)
    expect(queue.every((it) => it.level === 1)).toBe(true)
  })

  it('visits phases as a subsequence of the configured stage order (phase-major)', () => {
    const order = EXEC_TOUR_STAGES.map((s) => s.phase)
    const seenPhases = [...new Set(queue.map((it) => it.phase))]
    let i = -1
    for (const p of seenPhases) {
      const next = order.indexOf(p, i + 1)
      expect(next, `phase ${p} out of configured order`).toBeGreaterThan(i)
      i = next
    }
  })

  it('REVEAL INVARIANT: every reveal artifact type has a generating activity step in the queue', () => {
    const queueArtifacts = new Set(
      queue.filter((it) => it.step.kind === 'activity').map((it) => it.step.artifactType)
    )
    for (const t of EXEC_TOUR_REVEAL_TYPES) {
      expect(queueArtifacts.has(t), `reveal '${t}' has no generating step`).toBe(true)
    }
  })

  it('contributes each light stage hand-picked step', () => {
    for (const stage of EXEC_TOUR_STAGES) {
      if (stage.depth !== 'light' || !stage.lightStep) continue
      const { kind, ref } = stage.lightStep
      const present = queue.some(
        (it) =>
          it.phase === stage.phase &&
          it.step.kind === kind &&
          (it.step.moduleId === ref || it.step.refId === ref || it.step.catalogId === ref)
      )
      expect(present, `${stage.phase} light step '${ref}' missing`).toBe(true)
    }
  })

  it('has no duplicate steps', () => {
    const keys = queue.map(
      (it) =>
        `${it.step.kind}:${it.step.moduleId ?? it.step.refId ?? it.step.artifactType ?? it.step.catalogId ?? it.step.workshopId}`
    )
    expect(new Set(keys).size).toBe(keys.length)
  })
})
