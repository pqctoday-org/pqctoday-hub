// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The one place the drawer reaches the answer engine.
 *
 * The engine is loaded on first use, never with the page. Nothing here loads a language model, a
 * model provider or a model file.
 */
import type { AssistantAnswer, AssistantContext } from '@/services/assistant/contract'
import { COPY } from './copy'

type Engine = {
  answer: (question: string, context: AssistantContext) => Promise<AssistantAnswer>
}

// The answer engine is loaded on the first question, never with the page.
async function defaultLoader(): Promise<Engine> {
  return import('@/services/assistant')
}

let loadEngine: () => Promise<Engine> = defaultLoader

/** For tests: choose the engine the client loads. Pass nothing to go back to the default. */
export function setAssistantEngineLoader(loader?: () => Promise<Engine>): void {
  loadEngine = loader ?? defaultLoader
}

/**
 * Ask one question. Always resolves: a failed load becomes the engine's own `data-not-loaded` state.
 */
export async function askAssistant(
  question: string,
  context: AssistantContext
): Promise<AssistantAnswer> {
  try {
    const engine = await loadEngine()
    return await engine.answer(question, context)
  } catch {
    return {
      state: 'data-not-loaded',
      question,
      message: COPY.failData,
      kept: COPY.failDataKept,
    }
  }
}
