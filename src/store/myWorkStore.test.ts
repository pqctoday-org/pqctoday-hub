// SPDX-License-Identifier: AGPL-3.0-only
/**
 * My work store: conventions (version, migration, load guard), idempotent writes, edit and delete rules,
 * and the failure states of handoff 11.1 (A21): a failed write changes nothing in memory and a retry commits once.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'
import {
  useMyWorkStore,
  migrateMyWork,
  MY_WORK_KEY,
  MY_WORK_VERSION,
  EMPTY_MY_WORK,
  MAX_COMMENT_LENGTH,
} from './useMyWorkStore'
import { useModuleStore } from './useModuleStore'
import { currentContentVersion } from '@/services/myWork/tags'

const api = () => useMyWorkStore.getState()
const reset = () => {
  localStorage.clear()
  useMyWorkStore.setState({ ...EMPTY_MY_WORK })
}
const stored = () => JSON.parse(localStorage.getItem(MY_WORK_KEY) ?? 'null')

beforeEach(reset)
afterEach(() => vi.restoreAllMocks())

describe('conventions', () => {
  it('declares a version, a migration and a load guard (like persist stores must)', () => {
    const src = readFileSync(join(process.cwd(), 'src/store/useMyWorkStore.ts'), 'utf8')
    expect(MY_WORK_VERSION).toBeGreaterThanOrEqual(1)
    expect(src).toMatch(/MY_WORK_VERSION/)
    expect(src).toMatch(/migrateMyWork/)
    expect(src).toMatch(/readEnvelope/)
  })

  it('writes a versioned envelope', () => {
    api().addComment({ id: 'c1', tag: 'LM-008', body: 'hello' })
    expect(stored().version).toBe(MY_WORK_VERSION)
    expect(stored().state.comments).toHaveLength(1)
  })
})

describe('migration', () => {
  it('reads an empty or unknown shape as empty', () => {
    expect(migrateMyWork(null, 0)).toEqual(EMPTY_MY_WORK)
    expect(migrateMyWork('nonsense', 3)).toEqual(EMPTY_MY_WORK)
    expect(migrateMyWork({}, 1)).toEqual(EMPTY_MY_WORK)
  })

  it('keeps every readable record and drops only a damaged one', () => {
    const migrated = migrateMyWork(
      {
        comments: [
          {
            id: 'a',
            tag: 'LM-008',
            body: 'kept',
            contentVersion: 17,
            createdAt: '2026-11-03T10:00:00.000Z',
          },
          { id: 'b' },
          null,
          { id: 'c', tag: 'LM-008/s:handshake', body: 'older shape, no stamps' },
        ],
        answers: [
          { id: 'x', question: 'q', savedAt: '2026-11-24T10:00:00.000Z', payload: { a: 1 } },
          7,
        ],
        references: [{ id: 'r', tag: 'GL:ml-kem' }],
        outputs: [{ id: 'bad' }],
      },
      0
    )
    expect(migrated.comments.map((c) => c.id)).toEqual(['a', 'c'])
    expect(migrated.comments[0]).toMatchObject({
      contentVersion: 17,
      edited: false,
      anchorKind: 'module',
    })
    expect(migrated.comments[1]).toMatchObject({ contentVersion: 1, anchorKind: 'section' })
    expect(migrated.answers).toHaveLength(1)
    expect(migrated.references[0]).toMatchObject({ title: 'GL:ml-kem', savedFrom: 'page' })
    expect(migrated.outputs).toHaveLength(0)
  })

  it('loads an older stored version through the migration', () => {
    localStorage.setItem(
      MY_WORK_KEY,
      JSON.stringify({ version: 0, state: { comments: [{ id: 'o', tag: 'LM-008', body: 'old' }] } })
    )
    expect(api().rehydrate()).toBe('migrated')
    expect(api().comments.map((c) => c.id)).toEqual(['o'])
  })

  it('does not crash on unreadable stored text, and keeps a copy of it', () => {
    localStorage.setItem(MY_WORK_KEY, '{not json')
    expect(api().rehydrate()).toBe('recovered')
    expect(localStorage.getItem(`${MY_WORK_KEY}.unreadable`)).toBe('{not json')
  })
})

describe('comments (C01 to C07)', () => {
  it('stamps the comment with the lesson version now, and the lesson, section and step all work (C01, C03)', () => {
    const v = currentContentVersion('LM-008')
    expect(v).toBeGreaterThan(1)
    const a = api().addComment({ id: '1', tag: 'LM-008', body: 'module' })
    const b = api().addComment({ id: '2', tag: 'LM-008/s:handshake', body: 'section' })
    const c = api().addComment({ id: '3', tag: 'LM-008/w:simulate', body: 'step' })
    for (const r of [a, b, c]) expect(r.ok && r.value.contentVersion).toBe(v)
    expect(api().comments.map((x) => x.anchorKind)).toEqual(['module', 'section', 'step'])
  })

  it('refuses empty text, a tag that is not a lesson part, and over-long text, writing nothing', () => {
    expect(api().addComment({ id: '1', tag: 'LM-008', body: '   ' })).toEqual({
      ok: false,
      reason: 'invalid',
    })
    expect(api().addComment({ id: '2', tag: 'GL:ml-kem', body: 'x' })).toEqual({
      ok: false,
      reason: 'invalid',
    })
    expect(
      api().addComment({ id: '3', tag: 'LM-008', body: 'x'.repeat(MAX_COMMENT_LENGTH + 1) })
    ).toEqual({ ok: false, reason: 'invalid' })
    expect(localStorage.getItem(MY_WORK_KEY)).toBeNull()
  })

  it('the same comment id is one comment (J08)', () => {
    api().addComment({ id: 'same', tag: 'LM-008', body: 'once' })
    api().addComment({ id: 'same', tag: 'LM-008', body: 'once' })
    expect(api().comments).toHaveLength(1)
  })

  it('editing re-stamps with the current version, marks it edited and keeps the count (A19)', () => {
    const v = currentContentVersion('LM-008')
    useMyWorkStore.setState({
      comments: [
        {
          id: 'old',
          tag: 'LM-008/s:handshake',
          anchorKind: 'section',
          body: 'written long ago',
          createdAt: '2026-11-03T10:00:00.000Z',
          updatedAt: '2026-11-03T10:00:00.000Z',
          contentVersion: v - 1,
          edited: false,
        },
      ],
    })
    const r = api().editComment('old', 'written again')
    expect(r.ok).toBe(true)
    expect(api().comments).toHaveLength(1)
    expect(api().comments[0]).toMatchObject({
      body: 'written again',
      contentVersion: v,
      edited: true,
      createdAt: '2026-11-03T10:00:00.000Z',
    })
  })

  it('deleting removes it, and deleting a gone comment is not an error', () => {
    api().addComment({ id: 'd', tag: 'LM-008', body: 'bye' })
    expect(api().deleteComment('d').ok).toBe(true)
    expect(api().comments).toHaveLength(0)
    expect(stored().state.comments).toHaveLength(0)
    expect(api().deleteComment('d').ok).toBe(true)
  })

  it('never changes progress (C04): the module store is untouched by comment writes', () => {
    const before = JSON.stringify(useModuleStore.getState().modules)
    api().addComment({ id: 'p', tag: 'LM-008', body: 'progress?' })
    api().editComment('p', 'still no')
    api().deleteComment('p')
    expect(JSON.stringify(useModuleStore.getState().modules)).toBe(before)
  })
})

describe('storage failures (A21, handoff 11.1)', () => {
  const failWith = (name: string) =>
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('no', name)
    })

  it('a full device: add, edit and delete each fail with the reason, and memory is unchanged', () => {
    api().addComment({ id: 'keep', tag: 'LM-008', body: 'saved before' })
    const before = JSON.stringify(api().comments)
    const spy = failWith('QuotaExceededError')
    expect(api().addComment({ id: 'n', tag: 'LM-008', body: 'new' })).toEqual({
      ok: false,
      reason: 'quota',
    })
    expect(api().editComment('keep', 'changed')).toEqual({ ok: false, reason: 'quota' })
    expect(api().deleteComment('keep')).toEqual({ ok: false, reason: 'quota' })
    expect(JSON.stringify(api().comments)).toBe(before)
    spy.mockRestore()
    // The retry commits once.
    expect(api().addComment({ id: 'n', tag: 'LM-008', body: 'new' }).ok).toBe(true)
    expect(api().addComment({ id: 'n', tag: 'LM-008', body: 'new' }).ok).toBe(true)
    expect(api().comments.filter((c) => c.id === 'n')).toHaveLength(1)
    expect(api().editComment('keep', 'changed').ok).toBe(true)
    expect(api().deleteComment('keep').ok).toBe(true)
    expect(api().comments.map((c) => c.id)).toEqual(['n'])
  })

  it('storage blocked by the browser is reported as blocked', () => {
    failWith('SecurityError')
    expect(api().addComment({ id: 'b', tag: 'LM-008', body: 'x' })).toEqual({
      ok: false,
      reason: 'blocked',
    })
    expect(api().comments).toHaveLength(0)
  })

  it('storage that throws even to look at it is blocked, and loading does not crash', () => {
    const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')!
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      get() {
        throw new DOMException('denied', 'SecurityError')
      },
    })
    try {
      expect(api().addComment({ id: 'z', tag: 'LM-008', body: 'x' })).toEqual({
        ok: false,
        reason: 'blocked',
      })
      expect(api().rehydrate()).toBe('blocked')
    } finally {
      Object.defineProperty(globalThis, 'localStorage', original)
    }
  })
})

describe('tracked outputs (O01 to O08)', () => {
  const input = {
    kind: 'technical' as const,
    producer: { toolId: 'tls-simulator', route: '/playground/tls-simulator' },
    ref: { type: 'history-event' as const, id: 'evt-1' },
    title: 'TLS simulation',
    storage: 'link' as const,
    runId: 'run:evt-1',
  }

  it('one record per tool run, however often it is registered (A13, O07)', () => {
    api().registerOutput(input)
    api().registerOutput(input)
    api().registerOutputs([input, input])
    expect(api().outputs).toHaveLength(1)
  })

  it('a regenerated document refreshes the same record (A15)', () => {
    api().registerOutput({
      ...input,
      runId: 'doc:a::b',
      ref: { type: 'executive-document', id: 'd1' },
    })
    api().registerOutput({
      ...input,
      runId: 'doc:a::b',
      ref: { type: 'executive-document', id: 'd2' },
      title: 'Draft review notes',
    })
    expect(api().outputs).toHaveLength(1)
    expect(api().outputs[0]).toMatchObject({ title: 'Draft review notes', ref: { id: 'd2' } })
  })

  it('filing under an objective, and keeping it not filed, are choices the learner can change (O03)', () => {
    const r = api().registerOutput(input)
    if (!r.ok) throw new Error('unreachable')
    api().fileOutput(r.value.id, 'obj-1', 'LM-008')
    expect(api().outputs[0]).toMatchObject({ objectiveId: 'obj-1', stepTag: 'LM-008' })
    api().fileOutput(r.value.id, null)
    expect(api().outputs[0].objectiveId).toBeUndefined()
  })
})
