// SPDX-License-Identifier: GPL-3.0-only
/**
 * Detects template placeholders a user has not filled in before a generated
 * document leaves the app.
 *
 * The generators this guards produce documents with real-world consequence —
 * a cryptographic policy that gets signed, contract clauses that bind a
 * vendor. A 2026-08-10 audit counted 25 placeholder markers against 3
 * disclaimer markers in the Policy Template Generator and 10 against 4 in the
 * Contract Clause Generator, with nothing stopping `[Organization Name]` or
 * `[FREQUENCY]` reaching an exported PDF.
 *
 * Deliberately a WARNING, not a hard block: a user may legitimately want a
 * blank template to circulate for completion. What must not happen is
 * exporting one by accident.
 */

/**
 * Bracketed ALL-CAPS or Title-Case tokens — `[YEAR]`, `[Organization Name]`,
 * `[Effective Date]`. Requires the first character to be a letter so markdown
 * links (`[text](url)`) and citation brackets (`[32]`) are not caught.
 */
const PLACEHOLDER = /\[([A-Za-z][A-Za-z0-9 /_-]{2,40})\]/g

/**
 * A bracketed token immediately followed by `(` is a markdown link label, not
 * a placeholder.
 */
function isMarkdownLink(text: string, matchEnd: number): boolean {
  return text[matchEnd] === '('
}

/**
 * Placeholder tokens that are really prose conventions rather than something
 * the user is expected to replace.
 */
const IGNORED = new Set(['e.g', 'i.e', 'sic', 'etc', 'redacted', 'not applicable'])

/** Unique unresolved placeholder tokens found in `text`, in first-seen order. */
export function findUnresolvedPlaceholders(text: string): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const m of text.matchAll(PLACEHOLDER)) {
    const token = m[1].trim()
    if (IGNORED.has(token.toLowerCase())) continue
    if (isMarkdownLink(text, (m.index ?? 0) + m[0].length)) continue
    // Require either ALL-CAPS or Title Case — ordinary lowercase prose in
    // brackets ("[see above]") is an aside, not a fill-in.
    const isAllCaps = token === token.toUpperCase()
    const isTitleCase = /^[A-Z]/.test(token)
    if (!isAllCaps && !isTitleCase) continue
    if (seen.has(token)) continue
    seen.add(token)
    out.push(token)
  }
  return out
}

/** Convenience predicate for gating an export control. */
export function hasUnresolvedPlaceholders(text: string): boolean {
  return findUnresolvedPlaceholders(text).length > 0
}
