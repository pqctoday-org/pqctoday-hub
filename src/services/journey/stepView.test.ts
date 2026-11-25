// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import {
  describeStep,
  finishCondition,
  journeyHref,
  objectiveTitle,
  stepReason,
  SELF_ASSESSED_TITLE,
} from './stepView'
import { lessonByTag } from './lessons'
import { makeObjective } from './fixtures'

describe('step view', () => {
  const o = makeObjective()

  it('reads a lesson step from the lessons data: title, stage and where it leads', () => {
    const lesson = lessonByTag('LM-008')!
    const v = describeStep(o.steps[1], o)
    expect(v.title).toBe(lesson.title)
    expect(v.groupLabel).toBe(`Stage ${lesson.stage} · ${lesson.stageName}`)
    expect(v.to).toBe(`/learn/${lesson.id}`)
    expect(v.kindLabel).toBe('Module')
  })

  it('has its own words only for the self-assessed step, and opens it in Your journey', () => {
    const v = describeStep(o.steps[3], o)
    expect(v.title).toBe(SELF_ASSESSED_TITLE)
    expect(v.to).toBe(journeyHref({ objective: 'obj-t', step: 's4' }))
  })

  it('keeps a step whose tag the lessons data no longer holds reachable, and says so', () => {
    const gone = { ...o.steps[0], resourceTag: 'LM-999' }
    const v = describeStep(gone, o)
    expect(v.title).toBe('LM-999')
    expect(v.groupLabel).toBe('Not in the catalogue')
  })

  it('builds Your journey addresses', () => {
    expect(journeyHref()).toBe('/learn?mode=journey')
    expect(journeyHref({ view: 'role-map' })).toBe('/learn?mode=journey&jview=role-map')
    expect(journeyHref({ view: 'objectives', objective: 'a', step: 'b' })).toBe(
      '/learn?mode=journey&objective=a&step=b'
    )
  })

  it("states the finish condition from the objective's own lessons", () => {
    const text = finishCondition(o)
    expect(text).toContain('you record completion of “Review our TLS migration design”')
    expect(text).toContain(lessonByTag('LM-001')!.title)
    expect(text).toContain(` and ${lessonByTag('LM-012')!.title}`)
  })

  it('shortens a long goal for a heading and keeps the whole goal', () => {
    const long = makeObjective({ goal: 'x'.repeat(120) })
    expect(objectiveTitle(long).length).toBeLessThanOrEqual(80)
    expect(long.goal).toHaveLength(120)
  })

  it('gives the reason a step is next: what the learner just finished, a take-first, or the start', () => {
    const done = (t: string) => t === 'LM-001'
    expect(stepReason(o, o.steps[1], done)).toBe(`You finished ${lessonByTag('LM-001')!.title}.`)
    expect(stepReason(o, o.steps[0], () => false)).toBe('This is where the objective starts.')
    const takeFirst = { ...o.steps[2], origin: { type: 'take-first' as const, for: 'LM-008' } }
    const withTf = makeObjective({ steps: [o.steps[0], o.steps[1], takeFirst, o.steps[3]] })
    expect(stepReason(withTf, takeFirst, () => false)).toBe(
      `Take first for ${lessonByTag('LM-008')!.title}.`
    )
  })
})
