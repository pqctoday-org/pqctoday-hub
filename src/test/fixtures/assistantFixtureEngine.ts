// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Stand-in for the answer engine, for development and tests only. Same entry point as the real
 * engine: `answer(question, context)`, which never rejects. A question that is not canned has no
 * answer in the Hub's records; the question "fail" simulates data that did not load.
 */
import type { AssistantAnswer, AssistantContext } from '@/services/assistant/contract'
import { CANNED, dataNotLoaded, notHeld } from './assistantAnswers'

export async function answer(
  question: string,
  _context: AssistantContext
): Promise<AssistantAnswer> {
  void _context
  const key = question.trim().toLowerCase()
  if (key === 'fail') return dataNotLoaded(question)
  const canned = CANNED[key]
  return canned ? { ...canned, question } : { ...notHeld, question }
}
