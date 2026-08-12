// SPDX-License-Identifier: GPL-3.0-only
/**
 * Splits a run of prose into plain text and standards citations, so the
 * citations can be rendered as links to the document in this app's own library.
 *
 * `StandardRef` already links ONE citation when a component has it as a
 * separate value. Most of the business tools do not: the citation is baked into
 * a sentence ("ML-KEM (FIPS 203), ML-DSA (FIPS 204) tested in representative
 * environments") or into a checklist label built by string interpolation. A
 * 2026-08-10 audit counted 49 standards references and zero links in the Audit
 * Readiness Checklist alone. This is the seam for those.
 *
 * Compound citations are expanded. "FIPS 203/204/205" is three documents
 * written once, and linking only the first would be worse than linking none —
 * it reads as if 204 and 205 have no entry.
 *
 * A citation that does not resolve stays plain text. A dead link is worse than
 * no link.
 */
import { standardRefHref } from './standardRef'

export interface TextSegment {
  text: string
  /** `/library?ref=…` when this segment is a citation that resolves, else null. */
  href: string | null
}

/**
 * Matches one citation head: "FIPS 203", "SP 800-90B", "NIST SP 800-161r1".
 * The optional NIST prefix is consumed so it becomes part of the link text
 * rather than being orphaned in front of it.
 *
 * The trailing "/204/205" of a compound is deliberately NOT in this pattern.
 * Expressing it needed a quantified group inside a quantified group, which
 * `security/detect-unsafe-regex` flags — and since this runs over arbitrary
 * user-facing prose, a regex that is obviously linear is worth more than a
 * clever one. The tail is walked by hand in `readCompoundTail` below, where
 * the loop bound is plain to see.
 */
const CITATION = /\b(?:NIST\s+)?(FIPS|SP)\s?(\d[\dA-Za-z-]*)/g

/** Strip a trailing "-" the flat character class above can pick up. */
function trimSeparator(id: string): string {
  let end = id.length
  while (end > 0 && id[end - 1] === '-') end--
  return id.slice(0, end)
}

const DIGIT = /[0-9]/
const ID_CHAR = /[0-9A-Za-z-]/

/**
 * Read "/204/205" (optionally spaced) starting at `from`, one character at a
 * time. Returns the parts and where the tail ends. Consumes nothing unless a
 * separator is immediately followed by a digit, so ordinary prose slashes
 * ("either/or") are left alone.
 */
function readCompoundTail(text: string, from: number): { parts: string[]; end: number } {
  const parts: string[] = []
  let i = from

  for (;;) {
    let j = i
    while (j < text.length && (text[j] === ' ' || text[j] === '\t')) j++
    if (text[j] !== '/') break
    j++
    while (j < text.length && (text[j] === ' ' || text[j] === '\t')) j++
    if (j >= text.length || !DIGIT.test(text[j])) break

    const start = j
    while (j < text.length && ID_CHAR.test(text[j])) j++
    parts.push(text.slice(start, j))
    i = j
  }

  return { parts, end: i }
}

/**
 * Break `text` into consecutive segments. Concatenating every `text` field
 * reproduces the input exactly — no character is dropped or duplicated, which
 * is what lets this be used on arbitrary user-facing prose.
 */
export function splitCitations(text: string): TextSegment[] {
  const out: TextSegment[] = []
  let last = 0
  CITATION.lastIndex = 0
  let m: RegExpExecArray | null

  while ((m = CITATION.exec(text)) !== null) {
    const [head, family, id] = m
    // A previous iteration may already have consumed this match as part of a
    // compound tail; skip anything behind the write cursor.
    if (m.index < last) continue
    if (m.index > last) out.push({ text: text.slice(last, m.index), href: null })

    // The head keeps whatever prefix the author wrote ("NIST SP 800-88"), so
    // the visible text is unchanged; only the resolution is normalised.
    out.push({ text: head, href: standardRefHref(`${family} ${trimSeparator(id)}`) })
    last = m.index + head.length

    // "FIPS 203/204/205" is three documents written once. Linking only the
    // first would read as if 204 and 205 have no library entry.
    const { parts, end } = readCompoundTail(text, last)
    for (const part of parts) {
      const at = text.indexOf(part, last)
      out.push({ text: text.slice(last, at), href: null })
      out.push({ text: part, href: standardRefHref(`${family} ${trimSeparator(part)}`) })
      last = at + part.length
    }
    last = end
    CITATION.lastIndex = end
  }

  if (last < text.length) out.push({ text: text.slice(last), href: null })
  return out
}

/** True when `text` contains at least one citation that resolves to the library. */
export function hasResolvableCitation(text: string): boolean {
  return splitCitations(text).some((s) => s.href !== null)
}
