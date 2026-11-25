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

// INTEGRATION SEAM. The real engine lives at `@/services/assistant`. Until it is connected this
// loads the stand-in engine, in development and tests only; a production build reports "data did
// not load" instead of showing canned answers. To connect the real engine, replace the body with:
//   return import('@/services/assistant')
async function defaultLoader(): Promise<Engine> {
  if (import.meta.env.DEV || import.meta.env.MODE === 'test') {
    return import('@/test/fixtures/assistantFixtureEngine')
  }
  throw new Error('The answer engine is not connected')
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
