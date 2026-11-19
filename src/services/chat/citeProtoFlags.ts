// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Prototype switches for the citation experiment (branch proto/cite-by-sentence-1118).
 *
 *   A: the local prompt numbers each context sentence and asks for
 *      `evidenceRef` ("<chunkId>#<n>") instead of a copied `evidenceExcerpt`.
 *   B: a draft that fails the strict whole-answer check keeps its verified
 *      sentences ("partially-verified") instead of being rebuilt or refused.
 *
 * Read from the CITE_PROTO environment variable (`none` | `a` | `b` | `ab`) so
 * one build covers every configuration in the benchmark harness. In a browser
 * there is no `process`, so the default (both on) applies.
 */
export interface CiteProtoFlags {
  /** Numbered-sentence prompt and evidenceRef citations. */
  bySentence: boolean
  /** Judge each citation, not the whole answer. */
  partial: boolean
}

export function citeProtoFlags(): CiteProtoFlags {
  const proc = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process
  const raw = (proc?.env?.CITE_PROTO ?? 'ab').toLowerCase().trim()
  return {
    bySentence: raw === 'a' || raw === 'ab',
    partial: raw === 'b' || raw === 'ab',
  }
}
