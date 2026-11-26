// SPDX-License-Identifier: AGPL-3.0-only
import { STARTING_SUGGESTIONS } from './copy'
import type { AnswerSuggestion } from './Suggestions'

/**
 * SEAM FOR THE SUGGESTION RANKER. The questions offered below the latest answer and in the empty
 * state. Today these are the fixed starting questions of the copy deck, minus any the learner has
 * already asked (a question asked is not offered again). The ranker (same state gives the same
 * questions; only questions the Hub can answer) replaces this function and keeps its signature.
 */
export function suggestionsFor(askedQuestions: readonly string[]): AnswerSuggestion[] {
  const asked = new Set(askedQuestions.map((q) => q.trim().toLowerCase()))
  return STARTING_SUGGESTIONS.filter((s) => !asked.has(s.question.toLowerCase())).map((s) => ({
    ...s,
  }))
}
