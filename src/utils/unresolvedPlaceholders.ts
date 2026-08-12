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

/**
 * A bracketed STANDARDS CITATION, which is not a placeholder.
 *
 * These generators cite their sources inline — the Audit Readiness Checklist
 * writes "[NIST SP 800-57 Part 3]" and "[EO 14028 §4; OMB M-23-02]" after each
 * item. Those are Title Case and bracketed, so the original rule flagged them:
 * the checklist warned of "7 unfilled placeholders" and then listed
 * NIST SP 800-57 Part 3, FIPS 203/204/205 and CISA CBOM Guidance among them.
 *
 * Loudest on the tool with the most citations, and wrong there — which is the
 * worst place to spend a user's trust, because the same warning IS correct on
 * the Policy and Contract generators ("Effective Date", "YEAR", "FREQUENCY").
 * A warning that cries wolf on the best-cited document teaches people to
 * dismiss it on the one that matters. Found by reading an export, 2026-08-12.
 */
const CITATION =
  /^(NIST|FIPS|ISO|IEC|RFC|CISA|NSA|CNSA|EO|OMB|ANSSI|BSI|ETSI|OASIS|PCI|GDPR|DORA|NIS2|SP|IR|CSWP|ENISA)\b/i

/** True when the bracketed text designates a standard rather than a blank. */
function isCitation(token: string): boolean {
  if (CITATION.test(token)) return true
  // "SP 800-131A Rev 3 (draft)", "203/204/205" — a standard designator carries
  // digits with structure. A real placeholder ("Effective Date", "YEAR") does
  // not.
  return /\d/.test(token) && /[-/§.]/.test(token)
}

/**
 * A bracketed token that OPENS a line — optionally after a list marker — is a
 * label, not a blank.
 *
 * The Board Pitch writes its recommendations as "1. [IMMEDIATE] Complete a
 * cryptographic inventory". Those are priority headings the author put there on
 * purpose, and reporting them made the warning read "4 unfilled placeholders:
 * date, IMMEDIATE, SHORT-TERM, LONG-TERM" when exactly one was real.
 *
 * Decided by POSITION rather than by a list of known label words, because such
 * a list would have to guess: "TBD" is a blank, "DRAFT" is a label, and the
 * next tool will invent another. A blank appears where a value belongs —
 * mid-sentence, after a colon. A label appears where a heading belongs.
 */
function isLeadingLabel(text: string, matchStart: number): boolean {
  const lineStart = text.lastIndexOf('\n', matchStart - 1) + 1
  const before = text.slice(lineStart, matchStart)
  // Nothing but whitespace, a bullet, or an ordered-list marker in front of it.
  return /^\s*(?:[-*•]\s*|\d+[.)]\s*)?$/.test(before)
}

/** Unique unresolved placeholder tokens found in `text`, in first-seen order. */
export function findUnresolvedPlaceholders(text: string): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const m of text.matchAll(PLACEHOLDER)) {
    const token = m[1].trim()
    if (IGNORED.has(token.toLowerCase())) continue
    if (isMarkdownLink(text, (m.index ?? 0) + m[0].length)) continue
    if (isCitation(token)) continue
    if (isLeadingLabel(text, m.index ?? 0)) continue
    // ALL-CAPS ("[YEAR]"), Title Case ("[Effective Date]"), or a SINGLE
    // lowercase word ("[date]").
    //
    // That last case was missing, and it shipped: the Board Pitch's governance
    // section defaults to "...systems retiring before [date], etc." and that
    // string reached slide 9 of an exported .pptx — a board deck with an
    // unfilled blank in it, and no warning, because the rule demanded a
    // capital letter. Found by unzipping the actual .pptx, 2026-08-12.
    //
    // Multi-word lowercase stays excluded: "[see above]" and "[continued]" are
    // asides an author wrote deliberately, not blanks awaiting a value. One
    // word is a field name; a phrase is prose.
    const isAllCaps = token === token.toUpperCase()
    const isTitleCase = /^[A-Z]/.test(token)
    const isLowercaseField = /^[a-z][a-z0-9_-]*$/.test(token)
    if (!isAllCaps && !isTitleCase && !isLowercaseField) continue
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
