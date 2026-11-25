// SPDX-License-Identifier: AGPL-3.0-only
/* eslint-disable security/detect-non-literal-fs-filename -- reads the repo's own source files by fixed relative paths */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'
import type { AssistantAnswer } from '@/services/assistant/contract'
import { broadMatch, dataNotLoaded } from '@/test/fixtures/assistantAnswers'
import { useAssistantSessionStore } from './useAssistantSessionStore'

const client = vi.hoisted(() => ({
  pending: [] as Array<(a: AssistantAnswer | null) => void>,
}))
vi.mock('@/components/Assistant/assistantClient', () => ({
  askAssistant: (question: string) =>
    new Promise<AssistantAnswer>((resolve) =>
      client.pending.push((a) => resolve(a ?? dataNotLoaded(question)))
    ),
}))

const ctx = { persona: null }
const store = () => useAssistantSessionStore.getState()

beforeEach(() => {
  client.pending = []
  store().reset()
})

describe('assistant session', () => {
  it('shows a loading turn, then the answer', async () => {
    const p = store().ask('Tell me something', ctx)
    expect(store().turns).toMatchObject([{ question: 'Tell me something', status: 'loading' }])
    client.pending[0]({ ...broadMatch, question: 'Tell me something' })
    await p
    expect(store().turns).toMatchObject([{ status: 'done' }])
    expect(store().draft).toBe('')
  })

  it('holds the question and puts it back in the box when data did not load; retry asks it again', async () => {
    const p = store().ask('Tell me something', ctx)
    client.pending[0](null)
    await p
    expect(store().turns).toEqual([])
    expect(store().draft).toBe('Tell me something')
    expect(store().failedQuestion).toBe('Tell me something')

    const r = store().retry(ctx)
    expect(store().failedQuestion).toBeNull()
    client.pending[1]({ ...broadMatch, question: 'Tell me something' })
    await r
    expect(store().turns).toHaveLength(1)
    expect(store().draft).toBe('')
  })

  it('keeps each answer with its own question when two are asked quickly', async () => {
    const first = store().ask('first', ctx)
    const second = store().ask('second', ctx)
    client.pending[1]({ ...broadMatch, question: 'second' })
    await second
    client.pending[0]({ ...broadMatch, question: 'first' })
    await first
    expect(store().turns.map((t) => [t.question, t.status])).toEqual([
      ['first', 'done'],
      ['second', 'done'],
    ])
  })

  it('does not hold an older failed question over a newer one', async () => {
    const first = store().ask('first', ctx)
    const second = store().ask('second', ctx)
    client.pending[1]({ ...broadMatch, question: 'second' })
    await second
    client.pending[0](null)
    await first
    expect(store().failedQuestion).toBeNull()
    expect(store().turns.map((t) => t.question)).toEqual(['second'])
  })

  it('does nothing for an empty question', async () => {
    await store().ask('   ', ctx)
    expect(store().turns).toEqual([])
    expect(client.pending).toHaveLength(0)
  })

  it('is in memory only: not persisted, and not in the list of stores synced to the Drive', () => {
    const own = readFileSync(join(process.cwd(), 'src/store/useAssistantSessionStore.ts'), 'utf8')
    expect(own).not.toMatch(/persist\s*\(/)
    const synced = readFileSync(join(process.cwd(), 'src/store/syncWatchedStores.ts'), 'utf8')
    expect(synced).not.toMatch(/AssistantSession|AssistantReturn/)
  })
})
