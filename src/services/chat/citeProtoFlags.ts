// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Prototype switches for the citation experiment (branch proto/cite-by-sentence-1118).
 *
 *   a      the local prompt numbers each context sentence and asks for
 *          `evidenceRef` ("<chunkId>#<n>") instead of a copied `evidenceExcerpt`.
 *   guard  a reference only counts when the cited sentence(s) support the claim
 *          lexically (citationRelevance.ts); otherwise the citation is "weak-evidence".
 *   id     a chunk id that is not among this turn's chunks is resolved to the one
 *          retrieved chunk it names, when exactly one matches (citationIds.ts).
 *   b      a draft that fails the strict whole-answer check keeps its verified
 *          sentences ("partially-verified") instead of being rebuilt or refused.
 *          Left out of the recommended configuration (owner decision 2026-11-18).
 *
 * Read from the CITE_PROTO environment variable: a list of the tokens above joined
 * with "+" (for example `a+guard+id`), or `none`. The legacy values `a`, `b`, `ab`
 * keep their old meaning (`a` is change A alone, so earlier benchmark rows can be
 * reproduced). In a browser there is no `process`, and an unset variable means
 * `a+guard+id`: change A with the guard and the id check, B off.
 */
export interface CiteProtoFlags {
  /** Numbered-sentence prompt and evidenceRef citations. */
  bySentence: boolean
  /** Judge each citation, not the whole answer. */
  partial: boolean
  /** Require the cited sentence(s) to support the claim (reference citations only). */
  relevanceGuard: boolean
  /** Repair near-miss chunk ids in references. */
  idRepair: boolean
}

export const CITE_PROTO_DEFAULT = 'a+guard+id'

export function citeProtoFlags(): CiteProtoFlags {
  const proc = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process
  const raw = (proc?.env?.CITE_PROTO ?? CITE_PROTO_DEFAULT).toLowerCase().trim()
  const tokens = new Set(raw.split(/[+,\s]+/).filter(Boolean))
  if (tokens.has('ab')) {
    tokens.add('a')
    tokens.add('b')
  }
  return {
    bySentence: tokens.has('a'),
    partial: tokens.has('b'),
    relevanceGuard: tokens.has('guard'),
    idRepair: tokens.has('id'),
  }
}
