// SPDX-License-Identifier: AGPL-3.0-only
import type { AssistantAnswer, AssistantContext } from './contract'
import type { WorkerBody, WorkerReply } from './engineWorkerProtocol'

/**
 * The Hub adapter: one typed async function, `answer(question, context)`.
 *
 * The first call starts the engine: it fetches the two knowledge files, builds the indexes and answers, in a Web Worker
 * so the page does not freeze, or on the page's own thread where workers are not available (and if the worker cannot
 * start). Nothing is fetched or parsed before that, and nothing but this small file is part of the importing bundle:
 * the engine, its data files and the file builder are separate chunks. A failed load is never remembered: the call
 * resolves to the data-not-loaded state and the next call tries again.
 */

/** The fixed words of the failure notice (handoff 11.1). A test keeps them equal to the notes the engine reads. */
export const ASSISTANT_DATA_NOT_LOADED_MESSAGE = 'The Hub could not load the data for this answer.'
export const ASSISTANT_DATA_NOT_LOADED_KEPT =
  'Your question is kept in the box below. Nothing was lost. Try again, or keep browsing the Hub.'

const notLoaded = (question: string): AssistantAnswer => ({
  state: 'data-not-loaded',
  question,
  message: ASSISTANT_DATA_NOT_LOADED_MESSAGE,
  kept: ASSISTANT_DATA_NOT_LOADED_KEPT,
})

// ---------------------------------------------------------------- the worker, when there is one
/** `undefined`: not tried yet. `null`: not available here, use the page's own thread. */
let worker: Worker | null | undefined
let nextId = 0
const pending = new Map<number, { done: (reply: WorkerReply) => void; broken: () => void }>()

/** Thrown inside this file when the worker itself fails (not when the data does): the caller then answers on this thread. */
class WorkerUnavailable extends Error {}

function dropWorker(): void {
  worker?.terminate()
  worker = null
  const waiting = [...pending.values()]
  pending.clear()
  for (const p of waiting) p.broken()
}

function getWorker(): Worker | null {
  if (worker !== undefined) return worker
  worker = null
  try {
    if (typeof Worker === 'undefined') return null
    const w = new Worker(new URL('./engine.worker.ts', import.meta.url), { type: 'module' })
    w.onmessage = (event: MessageEvent<WorkerReply>) => {
      const waiting = pending.get(event.data.id)
      pending.delete(event.data.id)
      waiting?.done(event.data)
    }
    w.onerror = () => dropWorker()
    w.onmessageerror = () => dropWorker()
    worker = w
  } catch {
    worker = null
  }
  return worker
}

function send(w: Worker, request: WorkerBody): Promise<WorkerReply> {
  return new Promise((resolve, reject) => {
    const id = nextId++
    pending.set(id, { done: resolve, broken: () => reject(new WorkerUnavailable()) })
    try {
      w.postMessage({ ...request, id })
    } catch {
      pending.delete(id)
      reject(new WorkerUnavailable())
    }
  })
}

// ---------------------------------------------------------------- the page's own thread
let host: Promise<typeof import('./engineHost')> | null = null
const onThisThread = () => (host ??= import('./engineHost'))

/**
 * Answers one question. It never rejects: when the knowledge files do not load, it resolves to the data-not-loaded
 * state, and asking again tries again.
 */
export async function answer(
  question: string,
  ctx: AssistantContext = {}
): Promise<AssistantAnswer> {
  const w = getWorker()
  if (w) {
    try {
      const reply = await send(w, {
        kind: 'ask',
        question,
        persona: ctx.persona ?? null,
        page: ctx.page ?? null,
      })
      return reply.ok && reply.answer ? reply.answer : notLoaded(question)
    } catch (e) {
      if (!(e instanceof WorkerUnavailable)) return notLoaded(question)
      // the worker could not run: go on the page's own thread, for this and every later question
    }
  }
  try {
    return await (await onThisThread()).answerOnThisThread(question, ctx)
  } catch {
    return notLoaded(question)
  }
}

/** Starts loading the knowledge files and the engine now (call when the drawer first opens). Never rejects. */
export async function warmAssistant(): Promise<boolean> {
  const w = getWorker()
  if (w) {
    try {
      return (await send(w, { kind: 'warm' })).ok
    } catch {
      // fall through to this thread
    }
  }
  try {
    await (await onThisThread()).warmThisThread()
    return true
  } catch {
    return false
  }
}

/** Forgets the started engine and the worker (tests, and a deliberate reset). */
export function forgetAssistant(): void {
  dropWorker()
  worker = undefined
  void host?.then((h) => h.forgetThisThread())
}
