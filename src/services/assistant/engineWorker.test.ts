// SPDX-License-Identifier: AGPL-3.0-only
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { answer, forgetAssistant, warmAssistant } from './adapter'
import { handleWorkerRequest, type WorkerReply, type WorkerRequest } from './engineWorkerProtocol'
import { stubKnowledgeFetch } from './testSupport'

/**
 * The engine's worker: the page asks it questions by message and gets the contract's answer back. There is no real
 * worker in the test environment, so a stand-in runs the worker's own request handler where a worker would.
 */
const QUESTION = 'When is the CNSA 2.0 deadline?'

class StandInWorker {
  static made: StandInWorker[] = []
  static mode: 'works' | 'data-down' | 'breaks' = 'works'
  static options: unknown[] = []
  onmessage: ((e: { data: WorkerReply }) => void) | null = null
  onerror: (() => void) | null = null
  onmessageerror: (() => void) | null = null
  terminated = false
  requests: WorkerRequest[] = []
  constructor(_url: URL, options?: unknown) {
    StandInWorker.options.push(options)
    StandInWorker.made.push(this)
  }
  postMessage(msg: WorkerRequest) {
    this.requests.push(msg)
    if (StandInWorker.mode === 'breaks') {
      queueMicrotask(() => this.onerror?.())
    } else if (StandInWorker.mode === 'data-down') {
      queueMicrotask(() => this.onmessage?.({ data: { id: msg.id, ok: false } }))
    } else {
      void handleWorkerRequest(msg).then((data) => this.onmessage?.({ data }))
    }
  }
  terminate() {
    this.terminated = true
  }
}

describe('the answer engine in a worker', () => {
  beforeAll(() => {
    stubKnowledgeFetch()
  })
  afterEach(() => {
    forgetAssistant()
    StandInWorker.made = []
    StandInWorker.options = []
    StandInWorker.mode = 'works'
    vi.unstubAllGlobals()
    stubKnowledgeFetch()
  })

  it('answers on this thread where there are no workers, and the answer is the same', async () => {
    const here = await answer(QUESTION)
    forgetAssistant()
    vi.stubGlobal('Worker', StandInWorker)
    const viaWorker = await answer(QUESTION)
    expect(StandInWorker.made).toHaveLength(1)
    expect(StandInWorker.options[0]).toEqual({ type: 'module' })
    expect(StandInWorker.made[0].requests[0]).toMatchObject({ kind: 'ask', question: QUESTION })
    expect(viaWorker).toEqual(here)
    expect(viaWorker.state).toBe('direct')
  }, 120_000)

  it('starts one worker and sends the learner role with each question', async () => {
    vi.stubGlobal('Worker', StandInWorker)
    expect(await warmAssistant()).toBe(true)
    await answer(QUESTION, { persona: 'architect' })
    await answer('Tell me something')
    expect(StandInWorker.made).toHaveLength(1)
    const asks = StandInWorker.made[0].requests.filter((r) => r.kind === 'ask')
    expect(asks.map((r) => (r as { persona: string | null }).persona)).toEqual(['architect', null])
  }, 120_000)

  it('goes on this thread when the worker cannot be made', async () => {
    vi.stubGlobal(
      'Worker',
      class {
        constructor() {
          throw new Error('no workers here')
        }
      }
    )
    expect((await answer(QUESTION)).state).toBe('direct')
  }, 120_000)

  it('goes on this thread when the worker breaks, and stays there', async () => {
    StandInWorker.mode = 'breaks'
    vi.stubGlobal('Worker', StandInWorker)
    expect((await answer(QUESTION)).state).toBe('direct')
    expect(StandInWorker.made[0].terminated).toBe(true)
    expect((await answer('Tell me something')).state).toBe('broad')
    expect(StandInWorker.made).toHaveLength(1)
  }, 120_000)

  it('says the data did not load when the worker could not load it, and keeps the worker for the next try', async () => {
    StandInWorker.mode = 'data-down'
    vi.stubGlobal('Worker', StandInWorker)
    const failed = await answer(QUESTION)
    expect(failed).toMatchObject({ state: 'data-not-loaded', question: QUESTION })
    expect(StandInWorker.made[0].terminated).toBe(false)
    StandInWorker.mode = 'works'
    expect((await answer(QUESTION)).state).toBe('direct')
    expect(StandInWorker.made).toHaveLength(1)
  }, 120_000)
})
