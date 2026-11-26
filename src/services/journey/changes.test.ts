// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import {
  computeObjectiveChanges,
  groupChanges,
  CHANGE_LABEL,
  type ObjectiveChange,
} from './changes'
import { buildBuiltOn, sectionsOfLesson, takeFirstTags } from './curriculum'
import { lessonByTag } from './lessons'
import type { BuiltOn, Objective, Step } from './types'

// TLS Basics (LM-008): takes pqc-101 and pqc-algorithms first, has sections, a Playground tool with a
// version and two sandbox scenarios (which have none). The business case lesson (LM-036) has business tools.
const TLS = 'LM-008'
const BUSINESS = 'LM-036'
const tls = lessonByTag(TLS)!
const sections = sectionsOfLesson(tls.id)

const step = (tag: string, n: number, extra: Partial<Step> = {}): Step => ({
  id: `o-s${n}`,
  position: n,
  kind: 'module',
  resourceTag: tag,
  required: true,
  origin: { type: 'match' },
  ...extra,
})

function objective(
  tags: string[],
  tweak: (b: BuiltOn) => void = () => {},
  o: Partial<Objective> = {}
) {
  const steps = tags.map((t, i) => step(t, i + 1))
  const builtOn = buildBuiltOn(steps, 'created', 1)
  // The objective already holds the lessons TLS lists to take first, so only what a test changes is new.
  builtOn.prerequisites[TLS] = takeFirstTags(TLS)
  tweak(builtOn)
  return {
    id: 'o',
    role: 'architect',
    goal: 'Review TLS',
    state: 'active',
    steps,
    checkpoint: { path: [], stepId: null },
    createdAt: 1,
    updatedAt: 1,
    builtOn,
    ...o,
  } as Objective
}
const withPrereqs = [...takeFirstTags(TLS), TLS]
const kinds = (cs: ObjectiveChange[]) => cs.map((c) => c.kind)

describe('an objective that is up to date', () => {
  it('reports nothing', () => {
    expect(computeObjectiveChanges(objective(withPrereqs))).toEqual([])
  })
})

describe('a new section', () => {
  it('is reported for a section the lesson now has and the objective was built without', () => {
    const o = objective(withPrereqs, (b) => {
      b.lessons[TLS].sections = b.lessons[TLS].sections.slice(1)
    })
    const [c, ...rest] = computeObjectiveChanges(o)
    expect(rest).toEqual([])
    expect(c.kind).toBe('new-section')
    expect(CHANGE_LABEL[c.kind]).toBe('New section')
    expect(c.subject).toBe(sections[0].label)
    expect(c.href).toBe(`/learn/${tls.id}?section=${sections[0].id}`)
    expect(c.stepId).toBe(o.steps.find((s) => s.resourceTag === TLS)!.id)
  })
})

describe('a new tool', () => {
  it('is reported for a tool of the lesson the objective was built without, and counts business tools too', () => {
    const o = objective(withPrereqs, (b) => {
      delete b.lessons[TLS].tools['tls-simulator']
    })
    const [c] = computeObjectiveChanges(o)
    expect(c.kind).toBe('new-tool')
    expect(CHANGE_LABEL[c.kind]).toBe('New tool')
    expect(c.href).toBe('/playground/tls-simulator')

    const biz = objective([...takeFirstTags(BUSINESS), BUSINESS], (b) => {
      const tool = Object.keys(b.lessons[BUSINESS].tools)[0]
      delete b.lessons[BUSINESS].tools[tool]
    })
    const found = computeObjectiveChanges(biz).filter((x) => x.kind === 'new-tool')
    expect(found).toHaveLength(1)
    expect(found[0].href).toMatch(/^\/business\/tools\//)
  })
})

describe('an updated tool', () => {
  it('is reported when a tool the Hub versions is on a different version than when the objective was built', () => {
    const o = objective(withPrereqs, (b) => {
      b.lessons[TLS].tools['tls-simulator'] = '0.9.0'
    })
    const [c] = computeObjectiveChanges(o)
    expect(c.kind).toBe('tool-updated')
    expect(CHANGE_LABEL[c.kind]).toBe('Tool updated')
    expect(c.detail).toContain('was version 0.9.0')
    expect(c.id).toMatch(/^tool-updated:LM-008:tls-simulator@/)
  })

  it('is not reported for a tool the Hub gives no version (a sandbox scenario)', () => {
    const o = objective(withPrereqs, (b) => {
      b.lessons[TLS].tools['sbx-tls'] = '0.0.1'
    })
    expect(computeObjectiveChanges(o)).toEqual([])
  })
})

describe('an updated section', () => {
  const sectionTag = `${TLS}/s:${sections[0].id}`
  it('is reported for a section the learner commented on before the lesson was revised', () => {
    const o = objective(withPrereqs, (b) => {
      b.lessons[TLS].version = 0
    })
    const version = tls.contentVersion ?? 1
    const [c] = computeObjectiveChanges(o, [{ tag: sectionTag, contentVersion: version - 1 }])
    expect(c.kind).toBe('section-updated')
    expect(CHANGE_LABEL[c.kind]).toBe('Section updated')
    expect(c.subject).toBe(sections[0].label)
    expect(c.href).toBe(`/learn/${tls.id}?section=${sections[0].id}`)
  })

  it('is not reported for a comment on a section the lesson no longer has', () => {
    const o = objective(withPrereqs, (b) => {
      b.lessons[TLS].version = 0
      b.lessons[TLS].sections.push('section-removed-in-2026')
    })
    const version = tls.contentVersion ?? 1
    const cs = computeObjectiveChanges(o, [
      { tag: `${TLS}/s:section-removed-in-2026`, contentVersion: version - 1 },
    ])
    expect(cs.filter((c) => c.kind === 'section-updated')).toEqual([])
  })

  it('is not reported without a comment on that section: the Hub keeps no version per section', () => {
    const o = objective(withPrereqs, (b) => {
      b.lessons[TLS].version = 0
    })
    expect(computeObjectiveChanges(o)).toEqual([])
    expect(
      computeObjectiveChanges(o, [{ tag: sectionTag, contentVersion: tls.contentVersion ?? 1 }])
    ).toEqual([])
  })
})

describe('a new required step ("Curriculum changed")', () => {
  it('is reported for a prerequisite the lesson lists now and the objective was built without', () => {
    const [first, ...others] = takeFirstTags(TLS)
    const o = objective([...others, TLS], (b) => {
      b.prerequisites[TLS] = others
    })
    const cs = computeObjectiveChanges(o)
    expect(kinds(cs)).toEqual(['new-required-step'])
    expect(CHANGE_LABEL['new-required-step']).toBe('Curriculum changed')
    expect(cs[0].addTag).toBe(first)
    expect(cs[0].detail).toContain('now lists')
  })

  it('is not reported when the objective already has the lesson as a step', () => {
    const o = objective(withPrereqs, (b) => {
      b.prerequisites[TLS] = []
    })
    expect(computeObjectiveChanges(o)).toEqual([])
  })
})

describe('a retired step', () => {
  const retired = (extra: Partial<Step> = {}) => {
    const o = objective([...withPrereqs.slice(0, -1)])
    o.steps.push(step('LM-032', 9, extra))
    return o
  }

  it('is reported with the lesson that replaced it, the reason and the date', () => {
    const [c] = computeObjectiveChanges(retired())
    expect(c.kind).toBe('retired-step')
    expect(CHANGE_LABEL[c.kind]).toBe('Retired step')
    expect(c.replacement?.tag).toBe('LM-074')
    expect(c.retired?.date).toBe('2026-10-01')
    expect(c.detail).toContain('IoT & OT Security')
  })

  it('stays until the learner acts, and goes when the step is put off or marked seen', () => {
    expect(kinds(computeObjectiveChanges(retired()))).toEqual(['retired-step'])
    expect(computeObjectiveChanges(retired({ deferred: true }))).toEqual([])
    const o = retired()
    o.acknowledged = ['retired-step:LM-032']
    expect(computeObjectiveChanges(o)).toEqual([])
  })

  it('does not offer a swap for a lesson the objective already holds, and says which it is', () => {
    const o = retired()
    o.steps.push(step('LM-074', 10))
    const [c] = computeObjectiveChanges(o)
    expect(c.kind).toBe('retired-step')
    expect(c.replacement).toBeUndefined()
    expect(c.replacementHeld?.tag).toBe('LM-074')
    expect(c.href).toBe('/learn/iot-pqc')
  })

  it('names a retired lesson by its title, never by its tag (LM-042)', () => {
    const o = objective([...withPrereqs.slice(0, -1)])
    o.steps.push(step('LM-042', 9))
    const [c] = computeObjectiveChanges(o)
    expect(c.subject).toBe('Energy & Utilities PQC')
    expect(`${c.subject} ${c.detail} ${c.lessonTitle}`).not.toMatch(/LM-\d/)
  })

  it('is not reported for a tag the Hub does not list: it keeps its "Not in the catalogue" wording', () => {
    const o = objective(withPrereqs.slice(0, -1))
    o.steps.push(step('LM-999', 9))
    expect(computeObjectiveChanges(o)).toEqual([])
  })
})

describe('answering a change', () => {
  it('hides it once acknowledged, and only that one', () => {
    const o = objective(withPrereqs, (b) => {
      b.lessons[TLS].sections = b.lessons[TLS].sections.slice(2)
      b.lessons[TLS].tools['tls-simulator'] = '0.9.0'
    })
    const all = computeObjectiveChanges(o)
    expect(all.length).toBeGreaterThan(1)
    o.acknowledged = [all[0].id]
    expect(computeObjectiveChanges(o).map((c) => c.id)).toEqual(all.slice(1).map((c) => c.id))
  })
})

describe('an objective with no record of what it was built on', () => {
  it('reports no new sections, tools or steps: nothing earlier is guessed', () => {
    const o = objective(withPrereqs)
    delete o.builtOn
    expect(computeObjectiveChanges(o)).toEqual([])
  })
})

describe('the same change in several objectives', () => {
  const two = () => {
    const a = objective(withPrereqs, (b) => {
      b.lessons[TLS].sections = b.lessons[TLS].sections.slice(1)
    })
    const b = {
      ...objective(
        withPrereqs,
        (x) => (x.lessons[TLS].sections = x.lessons[TLS].sections.slice(1))
      ),
      id: 'o2',
    }
    return [a, b]
  }

  it('is one change for the informational kinds, naming every objective', () => {
    const all = two().flatMap((o) => computeObjectiveChanges(o))
    expect(all).toHaveLength(2)
    const groups = groupChanges(all)
    expect(groups).toHaveLength(1)
    expect(groups[0].objectiveIds).toEqual(['o', 'o2'])
  })

  it('stays one card per objective for a retired step and a new required step', () => {
    const mk = (id: string) => {
      const o = objective([...withPrereqs.slice(0, -1)], undefined, { id })
      o.steps.push(step('LM-032', 9))
      return o
    }
    const groups = groupChanges([mk('o'), mk('o2')].flatMap((o) => computeObjectiveChanges(o)))
    expect(groups.map((g) => g.objectiveIds)).toEqual([['o'], ['o2']])
  })
})
