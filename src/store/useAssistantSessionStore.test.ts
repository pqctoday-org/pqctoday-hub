// SPDX-License-Identifier: AGPL-3.0-only
/* eslint-disable security/detect-non-literal-fs-filename -- reads the repo's own source files by fixed relative paths */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'
import type { AssistantAnswer } from '@/services/assistant/contract'
import { broadMatch, dataNotLoaded } from '@/test/fixtures/assistantAnswers'
import { useAssistantSessionStore } from './useAssistantSessionStore'
import { useAchievementStore } from './useAchievementStore'

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
  useAchievementStore.getState().resetAchievements()
})

const asked = () => useAchievementStore.getState().assistantQuestionCount

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

describe("the open card and each card's place", () => {
  it("opens the new question's card at once, and folds the earlier one by opening another", async () => {
    const first = store().ask('first', ctx)
    const firstId = store().turns[0].id
    expect(store().openTurnId).toBe(firstId)
    client.pending[0]({ ...broadMatch, question: 'first' })
    await first
    const second = store().ask('second', ctx)
    const secondId = store().turns[1].id
    expect(store().openTurnId).toBe(secondId)
    client.pending[1]({ ...broadMatch, question: 'second' })
    await second
    expect(store().openTurnId).toBe(secondId)
    store().setOpenTurn(firstId)
    expect(store().openTurnId).toBe(firstId)
  })

  it('opens the newest remaining card when the open one is removed because the data did not load', async () => {
    const first = store().ask('first', ctx)
    client.pending[0]({ ...broadMatch, question: 'first' })
    await first
    const firstId = store().turns[0].id
    const second = store().ask('second', ctx)
    client.pending[1](null)
    await second
    expect(store().openTurnId).toBe(firstId)
  })

  it('keeps a tab and position for each card, none by default', () => {
    expect(store().cardNav).toEqual({})
    store().setCardNav('a', { tab: 'learn', index: 2 })
    store().setCardNav('b', { tab: 'library', index: 0 })
    store().setCardNav('a', { tab: 'timeline', index: 1 })
    expect(store().cardNav).toEqual({
      a: { tab: 'timeline', index: 1 },
      b: { tab: 'library', index: 0 },
    })
  })

  it('reset clears the open card and every position', async () => {
    const p = store().ask('first', ctx)
    client.pending[0]({ ...broadMatch, question: 'first' })
    await p
    store().setCardNav('x', { tab: 'learn', index: 1 })
    store().reset()
    expect(store().openTurnId).toBeNull()
    expect(store().cardNav).toEqual({})
    expect(store().turns).toEqual([])
  })
})

describe('counting the questions asked (for the Conversation Starter badge)', () => {
  it('counts one for each question sent, once, when it is sent', async () => {
    const p = store().ask('first', ctx)
    expect(asked()).toBe(1) // counted on sending, not on the answer
    client.pending[0]({ ...broadMatch, question: 'first' })
    await p
    expect(asked()).toBe(1)
    const q = store().ask('second', ctx)
    client.pending[1]({ ...broadMatch, question: 'second' })
    await q
    expect(asked()).toBe(2)
  })

  it('counts a question once even when its answer comes back with data not loaded', async () => {
    const p = store().ask('first', ctx)
    client.pending[0](null)
    await p
    expect(asked()).toBe(1)
  })

  it('does not count an empty or blank question', async () => {
    await store().ask('', ctx)
    await store().ask('   \n ', ctx)
    expect(asked()).toBe(0)
    expect(client.pending).toHaveLength(0)
  })

  it('does not count "Try again" for the question that failed to load again', async () => {
    const p = store().ask('Tell me something', ctx)
    client.pending[0](null)
    await p
    expect(asked()).toBe(1)
    const r = store().retry(ctx)
    client.pending[1]({ ...broadMatch, question: 'Tell me something' })
    await r
    expect(asked()).toBe(1)
    expect(store().turns).toHaveLength(1)
  })

  it('does not count a retry with nothing held to retry', async () => {
    await store().retry(ctx)
    expect(asked()).toBe(0)
  })

  it('does not count the failed question again when it is sent from the box it was put back in', async () => {
    const p = store().ask('Tell me something', ctx)
    client.pending[0](null)
    await p
    const again = store().ask(store().draft, ctx)
    client.pending[1]({ ...broadMatch, question: 'Tell me something' })
    await again
    expect(asked()).toBe(1)
  })

  it('counts a different question asked after a failure, and the same one asked later again', async () => {
    const p = store().ask('one', ctx)
    client.pending[0](null)
    await p
    const q = store().ask('two', ctx)
    client.pending[1]({ ...broadMatch, question: 'two' })
    await q
    expect(asked()).toBe(2)
    const r = store().ask('one', ctx)
    client.pending[2]({ ...broadMatch, question: 'one' })
    await r
    expect(asked()).toBe(3)
  })

  it('keeps only a number: no question text reaches the device', async () => {
    const p = store().ask('a very private question about our HSM', ctx)
    client.pending[0]({ ...broadMatch, question: 'a very private question about our HSM' })
    await p
    expect(localStorage.getItem('pqc-achievements')).not.toMatch(/private|HSM|question text/)
    expect(
      JSON.parse(localStorage.getItem('pqc-achievements') ?? '{}').state.assistantQuestionCount
    ).toBe(1)
  })
})
