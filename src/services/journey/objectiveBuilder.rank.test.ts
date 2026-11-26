// SPDX-License-Identifier: AGPL-3.0-only
/**
 * How the objective preview ranks lessons against the words of a goal, on a small made-up set of
 * lessons so each rule is tested alone (the real lessons data changes; these tests must not).
 */
import { describe, it, expect, vi } from 'vitest'
import type { TreeLesson } from './lessons'

vi.mock('./lessons', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./lessons')>()
  const make = (
    n: number,
    over: Partial<TreeLesson> & { title: string; description: string }
  ): TreeLesson =>
    ({
      id: `mod-${n}`,
      lmId: `LM-9${String(n).padStart(2, '0')}`,
      durationMin: 30,
      stage: 1,
      stageName: 'Stage',
      trackOrder: n,
      takeFirst: [],
      niceWorkRoles: [],
      taxonomyAlgorithms: [],
      taxonomyStandards: [],
      ...over,
    }) as unknown as TreeLesson
  // 30 lessons: filler ones say "throughput" (a common word) and nothing distinctive.
  const filler = Array.from({ length: 24 }, (_, i) =>
    make(i + 1, {
      title: `Topic${String.fromCharCode(97 + (i % 26))}${i}`,
      description:
        i < 12 ? 'Covers throughput and latency tradeoffs in practice.' : 'A short lesson.',
    })
  )
  const lessons: TreeLesson[] = [
    ...filler,
    // 25: names the rare word in its description (short, so a clear hit)
    make(25, { title: 'Token Interfaces', description: 'The zorbtoken interface and its calls.' }),
    // 26: tagged with the rare word only, and it has a prerequisite
    make(26, {
      title: 'Tagged Lesson',
      description: 'Nothing about it here.',
      taxonomyStandards: ['zorbtoken'],
      takeFirst: ['mod-27'],
    }),
    make(27, { title: 'Prerequisite Lesson', description: 'Basics.' }),
    // 28: names the rare word in its title
    make(28, { title: 'Quuxwidget Handling', description: 'How quuxwidgets are handled.' }),
    // 29: names quuxwidget only in a description, and a title elsewhere carries the word
    make(29, {
      title: 'Sideline',
      description: 'A mention of quuxwidget among other things.',
    }),
    // 30: its track holds the rare word 'gammatrack'
    make(30, { title: 'Filed Lesson', description: 'Other words.', track: 'Gammatrack' as never }),
  ]
  return {
    ...actual,
    TREE_LESSONS: lessons,
    lessonByTag: (tag: string) => lessons.find((l) => l.lmId === tag),
  }
})

import { buildPreview } from './objectiveBuilder'

const base = { persona: null, existing: [], isDone: () => false }
const required = (goal: string) =>
  buildPreview({ ...base, goal })
    .steps.filter((s) => s.required)
    .map((s) => s.tag)
const optional = (goal: string) =>
  buildPreview({ ...base, goal })
    .steps.filter((s) => !s.required)
    .map((s) => s.tag)

describe('ranking lessons against a goal', () => {
  it('a distinctive word named only in a description is a match by itself', () => {
    expect(required('zorbtoken')).toContain('LM-925')
  })

  it('a lesson only tagged with the word is optional and brings no take-first lesson', () => {
    const p = buildPreview({ ...base, goal: 'zorbtoken' })
    const req = p.steps.filter((s) => s.required).map((s) => s.tag)
    expect(req).not.toContain('LM-926')
    expect(req).not.toContain('LM-927') // the tagged lesson's prerequisite
    expect(optional('zorbtoken')).toContain('LM-926')
  })

  it('a common description word alone does not match', () => {
    const p = buildPreview({ ...base, goal: 'throughput' })
    expect(p.state).toBe('gap')
    expect(p.steps).toHaveLength(0)
  })

  it('a word a title carries makes a side mention in a description optional, not required', () => {
    const req = required('quuxwidget')
    expect(req).toContain('LM-928')
    expect(req).not.toContain('LM-929')
  })

  it('a lesson only filed under a track word is not required', () => {
    expect(required('gammatrack')).not.toContain('LM-930')
  })

  it('lists "mapped" lessons that are steps', () => {
    for (const goal of ['zorbtoken', 'quuxwidget', 'zorbtoken throughput']) {
      const p = buildPreview({ ...base, goal })
      const req = p.steps.filter((s) => s.required).map((s) => s.tag)
      for (const tag of p.mapped) expect(req).toContain(tag)
    }
  })
})
