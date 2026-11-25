// SPDX-License-Identifier: AGPL-3.0-only
import { readFileSync, writeFileSync } from 'node:fs'
import { afterAll, describe, expect, it, vi } from 'vitest'
import type { PersonaId } from '@/data/personaIds'
import { answer, forgetAssistant } from './adapter'
import type { AssistantAnswer } from './contract'
import { stubKnowledgeFetch } from './testSupport'

/**
 * A probe, not a test: runs the Hub's own adapter and engine over a file of questions and writes what the drawer would
 * render for each. It is skipped unless both variables are set:
 *
 *   ASSISTANT_PROBE_QUESTIONS  path of a JSON file: a list of questions, each a string or {id?, question, persona?},
 *                              or an object with such a list under `questions`
 *   ASSISTANT_PROBE_OUT        path to write the result JSON to
 *
 * The knowledge files are served from `public/data/` of the checkout it runs in, so the result is the one for that
 * checkout's data. Example:
 *   ASSISTANT_PROBE_QUESTIONS=q.json ASSISTANT_PROBE_OUT=out.json npx vitest run src/services/assistant/assistantProbe.test.ts
 */
const input = process.env.ASSISTANT_PROBE_QUESTIONS
const output = process.env.ASSISTANT_PROBE_OUT

interface ProbeQuestion {
  id?: string
  question: string
  persona?: PersonaId | null
}

/** The blocks the drawer draws for an answer, in order (design note section 5), with the tags of the rows in each group. */
export function renderedBlocks(a: AssistantAnswer): string[] {
  if (a.state === 'data-not-loaded') return ['question', 'failure-notice']
  const blocks = ['question', 'answer-text', 'note']
  if (a.state === 'not-held') return blocks
  if (a.state === 'direct') blocks.push('direct-answer', 'evidence-line', 'source-line')
  if (a.state === 'resources' && a.source) blocks.push('source-line')
  if (a.state === 'name') blocks.push('name-card')
  if (a.state === 'choices') blocks.push('named-choices')
  for (const g of a.groups) blocks.push(`group:${g.name}:${g.rows.map((r) => r.tag).join(',')}`)
  if (a.groups.some((g) => g.more.length)) blocks.push('show-more')
  return blocks
}

function readQuestions(path: string): ProbeQuestion[] {
  const raw = JSON.parse(readFileSync(path, 'utf8')) as unknown
  const list = Array.isArray(raw) ? raw : (raw as { questions?: unknown }).questions
  if (!Array.isArray(list)) throw new Error('the question file holds no list of questions')
  return list.map((q: unknown) => (typeof q === 'string' ? { question: q } : (q as ProbeQuestion)))
}

describe.skipIf(!input || !output)('the Assistant probe', () => {
  afterAll(() => {
    vi.unstubAllGlobals()
    forgetAssistant()
  })

  it('writes the rendered result of every question in the file', async () => {
    const questions = readQuestions(input as string)
    stubKnowledgeFetch()
    const t0 = performance.now()
    const results = []
    let loadMs = 0
    for (const q of questions) {
      const t = performance.now()
      const a = await answer(q.question, { persona: q.persona ?? null })
      const ms = Math.round(performance.now() - t)
      if (!results.length) loadMs = ms
      results.push({
        id: q.id ?? null,
        question: q.question,
        persona: q.persona ?? null,
        ms,
        blocks: renderedBlocks(a),
        answer: a,
      })
    }
    writeFileSync(
      output as string,
      JSON.stringify(
        {
          schema: 'assistant-probe/1',
          count: results.length,
          firstAnswerMs: loadMs,
          totalMs: Math.round(performance.now() - t0),
          results,
        },
        null,
        1
      )
    )
    expect(results).toHaveLength(questions.length)
    expect(results.some((r) => r.answer.state === 'data-not-loaded')).toBe(false)
  }, 3_600_000)
})
