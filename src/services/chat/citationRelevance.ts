// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Relevance guard for cite-by-sentence citations.
 *
 * A "<chunkId>#<n>" reference proves that the sentence exists. It does not prove
 * that the sentence supports the claim it is attached to. This module adds a
 * deterministic, lexical check (no model, no embedding) that a citation must pass
 * before it counts.
 *
 * The rule, in plain words:
 *   1. Every number in the claim (any run of digits: 203, 768, 2035, 1.3) must
 *      appear in the cited sentence(s), the chunk title or the chunk id. Numbers
 *      cannot be paraphrased, so a number that is nowhere in the evidence is
 *      unsupported by definition.
 *   2. Take the claim's content words: lower case, letters only, at least three
 *      letters, not a function word, plural endings removed. At least
 *      RELEVANCE_MIN_COVERAGE (60%) of them must appear in the cited sentence(s)
 *      or the chunk title.
 *   3. At least RELEVANCE_MIN_SENTENCE_TERMS (2) of those words must appear in the
 *      cited sentence(s) themselves. The title is the same for every sentence of a
 *      chunk, so it can name the subject but can never carry a claim on its own.
 *   Several references on one claim count together (their sentences are pooled).
 *
 * Why these values: a claim that restates its evidence shares nearly all of its
 * content words with it (verbatim and lightly reworded citations score 0.8 to 1.0).
 * Citations that merely sit near the claim, or that add a clause the sentence does
 * not state, score below half. 60% is "three words in five": above the half-way
 * mark, so a sentence that shares about half of the claim's words (the typical
 * "right chunk, wrong sentence" case) fails, and low enough that a paraphrase
 * which swaps a few words still passes. See the bench page for the measurements.
 *
 * Known limits (by design): it is lexical, so it cannot tell a negation or a
 * changed relation from a restatement ("X is deprecated" vs "X is not deprecated"
 * pass); the existing fact and entity checks remain the defence for those. It also
 * cannot see synonyms or abbreviations ("minutes" vs "min").
 */

export const RELEVANCE_MIN_COVERAGE = 0.6
export const RELEVANCE_MIN_SENTENCE_TERMS = 2

const STOP_WORDS = new Set(
  (
    'a an the and or but nor so yet of in on at to for from by with without into onto over under ' +
    'about between through during before after above below up down out off as than then that this ' +
    'these those it its itself they them their there here which who whom whose what when where why ' +
    'how not no do does did done is are was were be been being am has have had having can could may ' +
    'might must shall should will would also only just very more most such some any all each both ' +
    'other another same own per via within across against among etc if while because since until'
  ).split(' ')
)

/** Remove plural endings only: "libraries" -> "library", "keys" -> "key", but not "class", "status", "analysis". */
function stem(word: string): string {
  if (word.length > 4 && word.endsWith('ies')) return `${word.slice(0, -3)}y`
  if (word.length > 3 && word.endsWith('s') && !/(ss|us|is)$/.test(word)) return word.slice(0, -1)
  return word
}

export interface ClaimTerms {
  /** Digit runs, with decimal parts kept together ("1.3") and thousands commas removed. */
  numbers: string[]
  /** Distinct content words after the stop list and plural stemming. */
  words: string[]
}

export function extractTerms(text: string): ClaimTerms {
  const lower = text.toLowerCase().replace(/(?<=\d),(?=\d)/g, '')
  const numbers = [...new Set(lower.match(/\d[\d.]*\d|\d/g) ?? [])]
  const words = new Set<string>()
  for (const raw of lower.match(/\p{L}+/gu) ?? []) {
    const word = stem(raw)
    if (word.length >= 3 && !STOP_WORDS.has(word)) words.add(word)
  }
  return { numbers, words: [...words] }
}

export type SupportReason = 'supported' | 'missing-number' | 'low-coverage' | 'title-only'

export interface SupportAssessment {
  supported: boolean
  reason: SupportReason
  /** Claim numbers found nowhere in the sentences, titles or ids. */
  missingNumbers: string[]
  /** Content words in the claim. */
  claimWords: number
  /** Of those, how many appear in the cited sentence(s). */
  inSentences: number
  /** Of those, how many appear in the sentence(s) or the chunk title. */
  inSentencesOrTitle: number
  /** inSentencesOrTitle / claimWords (1 when the claim has no content words). */
  coverage: number
}

export interface SupportContext {
  /** Titles of the cited chunks. */
  titles: string[]
  /** Ids of the cited chunks (a source of numbers such as "RFC 9941" only). */
  ids: string[]
}

export function assessClaimSupport(
  claim: string,
  sentences: string[],
  context: SupportContext
): SupportAssessment {
  const claimTerms = extractTerms(claim)
  const evidence = extractTerms(sentences.join(' '))
  const title = extractTerms(context.titles.join(' '))
  const id = extractTerms(context.ids.join(' '))

  const sentenceWords = new Set(evidence.words)
  const titleWords = new Set(title.words)
  const knownNumbers = new Set([...evidence.numbers, ...title.numbers, ...id.numbers])

  const missingNumbers = claimTerms.numbers.filter((n) => !knownNumbers.has(n))
  const claimWords = claimTerms.words.length
  const inSentences = claimTerms.words.filter((w) => sentenceWords.has(w)).length
  const inSentencesOrTitle = claimTerms.words.filter(
    (w) => sentenceWords.has(w) || titleWords.has(w)
  ).length
  const coverage = claimWords === 0 ? 1 : inSentencesOrTitle / claimWords

  const base = { missingNumbers, claimWords, inSentences, inSentencesOrTitle, coverage }
  if (missingNumbers.length > 0) return { supported: false, reason: 'missing-number', ...base }
  if (claimWords === 0) return { supported: true, reason: 'supported', ...base }
  if (coverage < RELEVANCE_MIN_COVERAGE) {
    return { supported: false, reason: 'low-coverage', ...base }
  }
  if (inSentences < Math.min(RELEVANCE_MIN_SENTENCE_TERMS, claimWords)) {
    return { supported: false, reason: 'title-only', ...base }
  }
  return { supported: true, reason: 'supported', ...base }
}
