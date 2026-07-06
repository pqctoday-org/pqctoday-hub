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

describe('autoRunWalkthroughQueue(includeDeepDive=true) — Executive Overview Deep Dive', () => {
  const standard = autoRunWalkthroughQueue(false)
  const deep = autoRunWalkthroughQueue(true)

  // NOTE: as of this writing, only P6 carries any `deepDive` content, and P6 is
  // configured as a 'light'-depth exec-tour stage (not 'deep') — so today the two
  // queues happen to be IDENTICAL (deep-dive is only pulled for 'deep' stages, by
  // design — see the plan). That's correct current behavior, not something these
  // tests should assume away: they check the queue never SHRINKS or drops
  // anything (>=, not >), and separately prove the underlying mechanism actually
  // works using `autoRunDeepQueue` (deepQueue.test.ts), which walks every phase
  // regardless of exec-tour curation.
  it('is a superset of the standard queue (equal today, until a "deep" stage phase gets deep-dive content)', () => {
    expect(deep.length).toBeGreaterThanOrEqual(standard.length)
    const standardKeys = new Set(standard.map((it) => `${it.phase}:${it.step.kind}:${it.step.to}`))
    for (const key of standardKeys) {
      expect(deep.some((it) => `${it.phase}:${it.step.kind}:${it.step.to}` === key)).toBe(true)
    }
  })

  it('any added items are optional (deep-dive) and normalized to level 1', () => {
    const standardTos = new Set(standard.map((it) => it.step.to))
    const added = deep.filter((it) => !standardTos.has(it.step.to))
    for (const it of added) {
      expect(it.level).toBe(1)
      expect(it.step.optional, `${it.step.to} should be stamped optional`).toBe(true)
    }
  })

  it('data fact the assertions above rely on: p6 (the only phase with deepDive content) is a light stage', () => {
    // If this ever flips (p6 becomes a 'deep' stage, or a 'deep' stage phase
    // gains deepDive content), the superset test above starts asserting a real
    // inequality instead of an equality — no test change needed either way. The
    // actual inclusion MECHANISM is proven directly in deepQueue.test.ts via
    // `autoRunDeepQueue`, which walks every phase regardless of exec-tour curation.
    const p6Stage = EXEC_TOUR_STAGES.find((s) => s.phase === 'p6')
    expect(p6Stage?.depth).toBe('light')
  })

  it('light-depth stages are unaffected by includeDeepDive (still one hand-picked step)', () => {
    for (const stage of EXEC_TOUR_STAGES) {
      if (stage.depth !== 'light') continue
      const standardCount = standard.filter((it) => it.phase === stage.phase).length
      const deepCount = deep.filter((it) => it.phase === stage.phase).length
      expect(deepCount, `${stage.phase}: light stage grew under includeDeepDive`).toBe(
        standardCount
      )
    }
  })
})
