// SPDX-License-Identifier: AGPL-3.0-only
import { afterAll, describe, expect, it, vi } from 'vitest'
import { PERSONAS } from '@/data/learningPersonas'
import { answer, forgetAssistant } from '@/services/assistant/adapter'
import { stubKnowledgeFetch } from '@/services/assistant/testSupport'
import { sectionsOfLesson } from '@/services/journey/curriculum'
import { TREE_LESSONS } from '@/services/journey/lessons'
import { NOT_ASKABLE, rankSuggestions, type SuggestionState } from './suggestionRanker'

/**
 * Only suggest a question the Hub can answer (requirement S05). Every question the ranker can make is asked of the real
 * engine on the real knowledge files of the checkout: it must answer with resources, and name the thing asked about.
 */
stubKnowledgeFetch()
afterAll(() => {
  vi.unstubAllGlobals()
  forgetAssistant()
})

const NOW = 1_000_000_000_000
const base: SuggestionState = {
  now: NOW,
  asked: [],
  finished: null,
  viewing: null,
  objective: null,
  role: null,
}

/** Every question the five rules can make for one lesson, with the rule that makes it. */
function questionsForLesson(tag: string, title: string): { rule: number; question: string }[] {
  const ref = { tag, title, order: 1 }
  const states: SuggestionState[] = [
    { ...base, finished: { ...ref, at: NOW } },
    { ...base, viewing: { tag, title, kind: 'lesson' } },
    {
      ...base,
      objective: {
        title: 'Goal',
        next: ref,
        prerequisites: [ref],
        updates: [{ ...ref, kindLabel: 'New section' }],
      },
    },
  ]
  return states.flatMap((s) => rankSuggestions(s).filter((x) => x.rule < 6))
}

const GOOD = new Set(['resources', 'direct'])

describe('every suggested question can be answered from the Hub', () => {
  it('answers each question made for each lesson of the catalog with resources', async () => {
    const bad: string[] = []
    let asked = 0
    for (const lesson of TREE_LESSONS) {
      for (const { rule, question } of questionsForLesson(lesson.lmId, lesson.title)) {
        const a = await answer(question)
        asked++
        const hasRows = a.state !== 'data-not-loaded' && a.groups.length > 0
        if (!GOOD.has(a.state) || !hasRows) bad.push(`rule ${rule}: ${question} -> ${a.state}`)
      }
    }
    expect(asked).toBeGreaterThan(TREE_LESSONS.length * 4)
    expect(bad).toEqual([])
  }, 300_000)

  it('answers the question made for each section, and the sections that cannot be asked about are exactly the listed ones', async () => {
    const fails: string[] = []
    for (const lesson of TREE_LESSONS) {
      for (const section of sectionsOfLesson(lesson.id)) {
        const tag = `${lesson.lmId}/s:${section.id}`
        // a tag outside the list, so the question is the section's own
        const [main] = rankSuggestions({
          ...base,
          viewing: {
            tag: `probe:${tag}`,
            title: section.label,
            kind: 'section',
            lessonTitle: lesson.title,
          },
        })
        const a = await answer(main.question)
        if (!GOOD.has(a.state)) fails.push(tag)
      }
    }
    expect(fails.sort()).toEqual([...NOT_ASKABLE].sort())
  }, 300_000)

  it('answers the question for each role, and the engine puts the role path in it', async () => {
    for (const [id, persona] of Object.entries(PERSONAS)) {
      const [main] = rankSuggestions({ ...base, role: { id, label: persona.label } })
      const a = await answer(main.question, { persona: id as never })
      expect(a.state, main.question).toBe('resources')
      const tags = a.state === 'resources' ? a.groups.flatMap((g) => g.rows.map((r) => r.tag)) : []
      expect(
        tags.some((t) => t === `PATH:${id}`),
        main.question
      ).toBe(true)
    }
  }, 120_000)

  it('answers the starting questions', async () => {
    for (const s of rankSuggestions(base)) {
      expect(['not-held']).not.toContain((await answer(s.question)).state)
    }
  }, 60_000)
})
