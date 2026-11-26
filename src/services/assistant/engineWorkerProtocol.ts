// SPDX-License-Identifier: AGPL-3.0-only
import type { PersonaId } from '@/data/personaIds'
import type { AssistantAnswer } from './contract'
import { answerOnThisThread, warmThisThread } from './engineHost'

/** What the page sends the worker. */
export type WorkerBody =
  | { kind: 'ask'; question: string; persona: PersonaId | null; page: string | null }
  | { kind: 'warm' }
export type WorkerRequest = WorkerBody & { id: number }

/** What the worker sends back: the answer, or that the knowledge files did not load. */
export type WorkerReply =
  { id: number; ok: true; answer?: AssistantAnswer } | { id: number; ok: false }

/** One request, answered. Kept apart from the worker's wiring so it can be tested without a worker. */
export async function handleWorkerRequest(msg: WorkerRequest): Promise<WorkerReply> {
  try {
    if (msg.kind === 'warm') {
      await warmThisThread()
      return { id: msg.id, ok: true }
    }
    return {
      id: msg.id,
      ok: true,
      answer: await answerOnThisThread(msg.question, { persona: msg.persona, page: msg.page }),
    }
  } catch {
    return { id: msg.id, ok: false }
  }
}
