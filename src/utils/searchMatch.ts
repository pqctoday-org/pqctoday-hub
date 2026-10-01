// SPDX-License-Identifier: GPL-3.0-only
/**
 * Shared "match all the words" matching for the page-level search boxes
 * (Glossary drawer, Library filter, Learn browse-all).
 *
 * Those boxes used to test the whole query as ONE substring, so a natural
 * multi-word query such as "purdue model for OT" matched nothing even though
 * the Purdue Model entries exist ("model for OT" is not a contiguous phrase
 * anywhere). The query is now split into words, a small stopword list is
 * dropped, and EVERY remaining word must appear (case-insensitive substring)
 * somewhere in the searchable fields.
 *
 * Superset guarantee: any query that matched as a contiguous phrase before
 * still matches, because each token is a substring of that phrase.
 */

/** Words that carry no search intent in a natural-language query. */
export const SEARCH_STOPWORDS: ReadonlySet<string> = new Set([
  'for',
  'the',
  'a',
  'an',
  'of',
  'in',
  'on',
  'to',
  'and',
  'or',
  'with',
  'is',
  'are',
  'how',
  'what',
  'does',
  'do',
  'by',
  'from',
  'at',
  'as',
  'it',
  'its',
  'this',
  'that',
])

/** Characters that separate words (besides whitespace). Deliberately excludes
 *  + # . - _ / so tokens like "c++", "pkcs#11", "ml-kem", "node.js", "rfc/9180"
 *  keep working as a single substring exactly as they did before. */
const SPLIT_RE = /[\s,;:!?()[\]{}<>|"“”‘’]+/
/** Edge punctuation trimmed from each token ("model." -> "model"). */
const EDGE_RE = /^[.\-_'/]+|[.\-_'/]+$/g

/**
 * Lowercase the query, split it on whitespace/punctuation, trim edge
 * punctuation, and drop stopwords and tokens with no letter or digit.
 * An empty or stopword-only query returns [] (meaning "no filtering").
 */
export function tokenizeQuery(query: string): string[] {
  const tokens: string[] = []
  for (const raw of query.toLowerCase().split(SPLIT_RE)) {
    const t = raw.replace(EDGE_RE, '')
    if (!t || !/[\p{L}\p{N}]/u.test(t)) continue
    if (SEARCH_STOPWORDS.has(t)) continue
    tokens.push(t)
  }
  return tokens
}

/**
 * True when EVERY meaningful word of `query` appears (case-insensitive
 * substring) somewhere in `haystack`. `haystack` may be one string or an array
 * of field values; null/undefined/empty fields are ignored, and a word may be
 * satisfied by a different field than another word. An empty or stopword-only
 * query matches everything.
 */
export function matchesAllWords(
  haystack: string | ReadonlyArray<string | null | undefined>,
  query: string
): boolean {
  const tokens = tokenizeQuery(query)
  if (tokens.length === 0) return true
  const text = (
    typeof haystack === 'string' ? haystack : haystack.filter(Boolean).join('\n')
  ).toLowerCase()
  return tokens.every((t) => text.includes(t))
}
