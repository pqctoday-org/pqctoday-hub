// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import {
  COPY,
  backTarget,
  barSteps,
  completeCheck,
  focusAfterPause,
  followingStep,
  isReadingAhead,
  nextControl,
  nowStep,
  optionalSteps,
  previousStep,
  requiredProgress,
  stepStatuses,
} from './stepRules'
import { makeObjective } from './fixtures'

const none = () => false
const doneOf =
  (...tags: string[]) =>
  (t: string) =>
    tags.includes(t)

describe('step status', () => {
  it('has exactly one step Now while any counted step is open', () => {
    const o = makeObjective()
    const st = stepStatuses(o, doneOf('LM-001'))
    expect([...st.values()].filter((v) => v === 'now')).toHaveLength(1)
    expect(st.get('s1')).toBe('completed')
    expect(st.get('s2')).toBe('now')
    expect(st.get('s3')).toBe('not-started')
  })

  it('has no Now step when every counted step is done, and lists optional steps apart', () => {
    const o = makeObjective()
    const all = doneOf('LM-001', 'LM-008', 'LM-012', 'obj-t/outcome')
    expect(nowStep(o, all)).toBeNull()
    expect(barSteps(o).map((s) => s.id)).toEqual(['s1', 's2', 's3', 's4'])
    expect(optionalSteps(o).map((s) => s.id)).toEqual(['s5'])
  })

  it('counts "n of m required" without the optional steps and without deferred ones', () => {
    const o = makeObjective()
    expect(requiredProgress(o, doneOf('LM-001'))).toEqual({ done: 1, total: 4 })
    const deferred = makeObjective({
      steps: makeObjective().steps.map((s) => (s.id === 's3' ? { ...s, deferred: true } : s)),
    })
    expect(requiredProgress(deferred, doneOf('LM-001'))).toEqual({ done: 1, total: 3 })
    expect(nowStep(deferred, doneOf('LM-001', 'LM-008'))?.id).toBe('s4')
  })

  it('credits a tag once, however many objectives hold it', () => {
    const a = makeObjective()
    const b = makeObjective({ id: 'obj-u', goal: 'Brief the board' })
    const shared = doneOf('LM-008')
    expect(stepStatuses(a, shared).get('s2')).toBe('completed')
    expect(stepStatuses(b, shared).get('s2')).toBe('completed')
  })
})

describe('Next gating (handoff 5.2)', () => {
  it('is off until the current step is done, with the hint', () => {
    const o = makeObjective()
    const n = nextControl(o, 's1', none)
    expect(n).toMatchObject({ kind: 'next', enabled: false, hint: COPY.stepHint })
  })

  it('opens the following step once the current one is done', () => {
    const o = makeObjective()
    const n = nextControl(o, 's1', doneOf('LM-001'))
    expect(n).toMatchObject({ kind: 'next', enabled: true, targetStepId: 's2', hint: null })
  })

  it('becomes "Complete the objective…" on the last step, with the earlier-steps hint while blocked', () => {
    const o = makeObjective()
    expect(nextControl(o, 's4', none)).toMatchObject({
      kind: 'complete',
      enabled: true,
      hint: COPY.stepLastBlocked,
    })
    expect(nextControl(o, 's4', doneOf('LM-001', 'LM-008', 'LM-012')).hint).toBeNull()
  })

  it('keeps steps readable but turns Next off, and says why, on a paused or completed objective', () => {
    expect(nextControl(makeObjective({ state: 'paused' }), 's1', doneOf('LM-001'))).toMatchObject({
      enabled: false,
      hint: COPY.paused,
    })
    expect(
      nextControl(makeObjective({ state: 'completed' }), 's1', doneOf('LM-001'))
    ).toMatchObject({
      enabled: false,
      hint: COPY.completed,
    })
  })

  it('finds the previous and following step in the bar', () => {
    const o = makeObjective()
    expect(previousStep(o, 's1')).toBeNull()
    expect(previousStep(o, 's3')?.id).toBe('s2')
    expect(followingStep(o, 's4')).toBeNull()
    expect(followingStep(o, 's1')?.id).toBe('s2')
  })

  it('flags a not-started step as read ahead, but not the Now step', () => {
    const o = makeObjective()
    expect(isReadingAhead(o, 's3', none)).toBe(true)
    expect(isReadingAhead(o, 's1', none)).toBe(false)
  })
})

describe('Back goes to where the learner started, never to the previous step', () => {
  it('names the origin', () => {
    expect(backTarget('journey')).toEqual({
      to: '/learn?mode=journey',
      label: 'Back to Your journey',
    })
    expect(backTarget('all-modules')).toEqual({
      to: '/learn?mode=browse',
      label: 'Back to All modules',
    })
    expect(backTarget('link')).toEqual({ to: 'history', label: 'Back' })
  })
})

describe('the complete panel (handoff 6.5)', () => {
  it('is blocked on the module steps, names the first unfinished step, and uses the review wording', () => {
    const c = completeCheck(makeObjective(), doneOf('LM-001'))
    expect(c.state).toBe('blocked-review')
    expect(c.goStep?.id).toBe('s2')
    expect(c.note).toBe(COPY.completeBlockedReview)
    expect(c.blockers.map((s) => s.id)).toEqual(['s2', 's3'])
  })

  it('uses the other blocked wording when a blocker is not a module', () => {
    const o = makeObjective({
      steps: makeObjective().steps.map((s) =>
        s.id === 's2' ? { ...s, kind: 'business-tool' as const } : s
      ),
    })
    const c = completeCheck(o, doneOf('LM-001'))
    expect(c.state).toBe('blocked')
    expect(c.note).toBe(COPY.completeBlocked)
    expect(c.goStep?.id).toBe('s2')
  })

  it('is allowed when every other required step is done; the last step is confirmed by the learner', () => {
    const c = completeCheck(makeObjective(), doneOf('LM-001', 'LM-008', 'LM-012'))
    expect(c.state).toBe('allowed')
    expect(c.confirmStep?.id).toBe('s4')
    expect(c.note).toBe(COPY.completeAllowed)
  })

  it('does not count a deferred step as a blocker', () => {
    const o = makeObjective({
      steps: makeObjective().steps.map((s) => (s.id === 's3' ? { ...s, deferred: true } : s)),
    })
    expect(completeCheck(o, doneOf('LM-001', 'LM-008')).state).toBe('allowed')
  })
})

describe('pausing', () => {
  it('moves focus to the next active objective of the same role', () => {
    const a = makeObjective({ id: 'a' })
    const b = makeObjective({ id: 'b' })
    const other = makeObjective({ id: 'c', role: 'executive' })
    expect(focusAfterPause([a, b, other], 'a')).toBe('b')
    expect(focusAfterPause([a, other], 'a')).toBeNull()
    expect(focusAfterPause([a, makeObjective({ id: 'b', state: 'paused' })], 'a')).toBeNull()
  })
})
