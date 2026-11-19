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
 *   1. Identifiers. The claim's identifiers are (a) names with a number attached,
 *      treated as ONE unit: "TLS 1.3", "RFC 9941", "SP 800-208", "FIPS 140-3",
 *      "ML-KEM-768", "SHA-512", and (b) bare numbers: 2035, 1184, 0-7.
 *      ONE cited sentence must contain all of them. A name is found when the
 *      sentence has the same name unit, or has the name word and the number
 *      ("FIPS 203/204/205" holds FIPS 203; "ML-KEM-512/768/1024" holds ML-KEM-768).
 *      Identifiers are never taken from the chunk id or the title, and pooling
 *      several references never supplies an identifier that no single cited
 *      sentence has.
 *   2. Content words. Take the claim's content words: lower case, letters only, at
 *      least three letters, not a function word, plural endings removed, units
 *      written in their canonical form (see UNIT_FORMS). At least
 *      RELEVANCE_MIN_COVERAGE (60%) must appear in the cited sentence(s) pooled,
 *      or in the chunk title. Pooling only tops up this word overlap.
 *   3. At least RELEVANCE_MIN_SENTENCE_TERMS (2) of those words must appear in the
 *      cited sentence(s) themselves. The title is the same for every sentence of a
 *      chunk, so it can name the subject but can never carry a claim on its own.
 *
 * Why 60%: a claim that restates its evidence shares 80 to 100% of its content
 * words with it; claims that sit near their evidence, or add a clause the sentence
 * does not state, mostly score under 40%. 60% is "three words in five", above the
 * half-way mark. See the bench page for the measurements.
 *
 * Known limits (by design): it is lexical, so it cannot tell a negation or a
 * changed relation from a restatement ("X is deprecated" vs "X is not deprecated"
 * pass); the existing fact and entity checks remain the defence for those. It cannot
 * see synonyms beyond the fixed unit table ("risk identified" vs "risk: Yes").
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

/**
 * Unit and abbreviation equivalence (the whole table). A short form is rewritten to
 * its canonical word only when it directly follows a number ("10 min", "1,184 B",
 * "32 s"); long forms ("minutes", "bytes", "kilobytes") already reduce to the same
 * word through plural stemming.
 */
export const UNIT_FORMS: Readonly<Record<string, string>> = {
  min: 'minute',
  mins: 'minute',
  s: 'second',
  sec: 'second',
  secs: 'second',
  ms: 'millisecond',
  h: 'hour',
  hr: 'hour',
  hrs: 'hour',
  b: 'byte',
  kb: 'kilobyte',
  kib: 'kilobyte',
  mb: 'megabyte',
  mib: 'megabyte',
  gb: 'gigabyte',
  gib: 'gigabyte',
}

/** Words that may carry a version number after a space ("Level 3", "Version 2.7.0", "rfc 9941"). Any ALL-CAPS word (TLS, RFC, SP, IR) may too. */
const NAME_WORDS = new Set(
  'rfc fips sp ir tls ssl iso iec ts tr level version draft release revision rev section annex part category type'.split(
    ' '
  )
)

const NUMBER = String.raw`\d+(?:\.\d+)*(?:-\d+)?(?:\/\d+(?:\.\d+)*)*`
// eslint-disable-next-line security/detect-non-literal-regexp -- built from fixed constants, never from input
const NAME_UNIT = new RegExp(String.raw`([A-Za-z]+)([-\s]?)(${NUMBER})`, 'g')
// eslint-disable-next-line security/detect-non-literal-regexp -- built from fixed constants, never from input
const BARE_NUMBER = new RegExp(NUMBER, 'g')
// eslint-disable-next-line security/detect-non-literal-regexp -- built from fixed constants, never from input
const UNIT_AFTER_NUMBER = new RegExp(
  String.raw`(\d)\s*(${Object.keys(UNIT_FORMS).join('|')})(?![a-z])`,
  'gi'
)

/** Remove plural endings only: "libraries" -> "library", "keys" -> "key", but not "class", "status", "analysis". */
function stem(word: string): string {
  if (word.length > 4 && word.endsWith('ies')) return `${word.slice(0, -3)}y`
  if (word.length > 3 && word.endsWith('s') && !/(ss|us|is)$/.test(word)) return word.slice(0, -1)
  return word
}

/** "203/204" -> ["203", "204"]; "140-3" -> ["140-3"] (the whole unit, parts are added separately). */
function numberVariants(token: string): string[] {
  return token.split('/')
}

function numberParts(token: string): string[] {
  return token.split(/[-/]/)
}

export interface TextTerms {
  /** Names with a number attached, as "word|number" units. */
  names: string[]
  /** Numbers that are not part of a name. */
  numbers: string[]
  /** Every number in the text, including those inside names and the parts of "140-3". */
  allNumbers: Set<string>
  /** Distinct content words after the stop list, unit forms and plural stemming. */
  words: string[]
  /** Every letter run, lower case, unstemmed (to find a name word). */
  letterWords: Set<string>
}

export function extractTerms(text: string): TextTerms {
  const source = text
    .replace(/(?<=\d),(?=\d{3}(?!\d))/g, '')
    .replace(UNIT_AFTER_NUMBER, (_m, digit: string, unit: string) => {
      const canonical = UNIT_FORMS[unit.toLowerCase()]
      return `${digit} ${canonical}`
    })

  const names = new Set<string>()
  const allNumbers = new Set<string>()
  const consumed: Array<[number, number]> = []
  for (const m of source.matchAll(NAME_UNIT)) {
    const [whole, word, sep, number] = m
    const lower = word.toLowerCase()
    const spaced = /\s/.test(sep)
    const allowed =
      !spaced || NAME_WORDS.has(lower) || (word.length >= 2 && word === word.toUpperCase())
    if (!allowed || STOP_WORDS.has(lower)) continue
    for (const variant of numberVariants(number)) {
      names.add(`${lower}|${variant}`)
      allNumbers.add(variant)
      for (const part of numberParts(variant)) allNumbers.add(part)
    }
    consumed.push([m.index, m.index + whole.length])
  }

  const numbers = new Set<string>()
  for (const m of source.matchAll(BARE_NUMBER)) {
    for (const variant of numberVariants(m[0])) {
      allNumbers.add(variant)
      for (const part of numberParts(variant)) allNumbers.add(part)
    }
    if (consumed.some(([from, to]) => m.index >= from && m.index < to)) continue
    for (const variant of numberVariants(m[0])) numbers.add(variant)
  }

  const words = new Set<string>()
  const letterWords = new Set<string>()
  for (const raw of source.toLowerCase().match(/\p{L}+/gu) ?? []) {
    letterWords.add(raw)
    const word = stem(raw)
    if (word.length >= 3 && !STOP_WORDS.has(word)) words.add(word)
  }
  return { names: [...names], numbers: [...numbers], allNumbers, words: [...words], letterWords }
}

function numberFound(number: string, sentence: TextTerms): boolean {
  if (sentence.allNumbers.has(number)) return true
  const parts = numberParts(number)
  return parts.length > 1 && parts.every((p) => sentence.allNumbers.has(p))
}

/** The claim identifiers that one sentence does not contain (empty = it holds them all). */
function missingFrom(claim: TextTerms, sentence: TextTerms): string[] {
  const sentenceNames = new Set(sentence.names)
  const missing: string[] = []
  for (const name of claim.names) {
    const [word, number] = name.split('|')
    const found =
      sentenceNames.has(name) || (sentence.letterWords.has(word) && numberFound(number, sentence))
    if (!found) missing.push(`${word} ${number}`)
  }
  for (const number of claim.numbers) {
    if (!numberFound(number, sentence)) missing.push(number)
  }
  return missing
}

export type SupportReason = 'supported' | 'missing-identifier' | 'low-coverage' | 'title-only'

export interface SupportAssessment {
  supported: boolean
  reason: SupportReason
  /** Claim identifiers missing from the cited sentence that holds the most of them. */
  missingIdentifiers: string[]
  /** Content words in the claim. */
  claimWords: number
  /** Of those, how many appear in the cited sentence(s), pooled. */
  inSentences: number
  /** Of those, how many appear in the sentence(s) or the chunk title. */
  inSentencesOrTitle: number
  /** inSentencesOrTitle / claimWords (1 when the claim has no content words). */
  coverage: number
}

export interface SupportContext {
  /** Titles of the cited chunks: they count for content words only. */
  titles: string[]
  /**
   * Measurement switch, off in the product: also let the titles supply names and
   * numbers (so "RFC 9881 standardizes ..." passes on the description sentence of
   * the RFC 9881 chunk). Chunk ids never count either way.
   */
  titleIdentifiers?: boolean
}

function mergeTerms(a: TextTerms, b: TextTerms): TextTerms {
  return {
    names: [...new Set([...a.names, ...b.names])],
    numbers: [...new Set([...a.numbers, ...b.numbers])],
    allNumbers: new Set([...a.allNumbers, ...b.allNumbers]),
    words: [...new Set([...a.words, ...b.words])],
    letterWords: new Set([...a.letterWords, ...b.letterWords]),
  }
}

export function assessClaimSupport(
  claim: string,
  sentences: string[],
  context: SupportContext
): SupportAssessment {
  const claimTerms = extractTerms(claim)
  const perSentence = sentences.map(extractTerms)
  const titleTerms = context.titles.map(extractTerms)

  // Each cited sentence is checked on its own for the identifiers; the best one decides.
  let missingIdentifiers: string[] = []
  if (claimTerms.names.length + claimTerms.numbers.length > 0) {
    const holders = context.titleIdentifiers
      ? perSentence.map((s) => titleTerms.reduce(mergeTerms, s))
      : perSentence
    const results = holders.map((s) => missingFrom(claimTerms, s))
    const best = results.reduce<string[] | null>(
      (acc, cur) => (acc === null || cur.length < acc.length ? cur : acc),
      null
    )
    missingIdentifiers = best ?? [
      ...claimTerms.names.map((n) => n.replace('|', ' ')),
      ...claimTerms.numbers,
    ]
  }

  // Content words may be pooled over every cited sentence.
  const sentenceWords = new Set(perSentence.flatMap((s) => s.words))
  const titleWords = new Set(titleTerms.flatMap((t) => t.words))
  const claimWords = claimTerms.words.length
  const inSentences = claimTerms.words.filter((w) => sentenceWords.has(w)).length
  const inSentencesOrTitle = claimTerms.words.filter(
    (w) => sentenceWords.has(w) || titleWords.has(w)
  ).length
  const coverage = claimWords === 0 ? 1 : inSentencesOrTitle / claimWords

  const base = { missingIdentifiers, claimWords, inSentences, inSentencesOrTitle, coverage }
  if (missingIdentifiers.length > 0)
    return { supported: false, reason: 'missing-identifier', ...base }
  if (claimWords === 0) return { supported: true, reason: 'supported', ...base }
  if (coverage < RELEVANCE_MIN_COVERAGE) {
    return { supported: false, reason: 'low-coverage', ...base }
  }
  if (inSentences < Math.min(RELEVANCE_MIN_SENTENCE_TERMS, claimWords)) {
    return { supported: false, reason: 'title-only', ...base }
  }
  return { supported: true, reason: 'supported', ...base }
}
