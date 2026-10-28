// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Splits a sentence that carries in-app links written as `[words](/path?query)`.
 *
 * Only paths inside this app are links (they start with a single `/`); anything else in
 * square brackets stays plain text, so a stray bracket in prose never becomes a link.
 * The words of a link are the words of the sentence: removing the brackets and the path
 * leaves the same text a reader sees.
 */
export type LinkedTextPart = { text: string; to: string | null }

const LINK = /\[([^\]\n]+)\]\((\/(?!\/)[^)\s]*)\)/g

export function splitLinkedText(source: string): LinkedTextPart[] {
  const parts: LinkedTextPart[] = []
  let last = 0
  for (const match of source.matchAll(LINK)) {
    const start = match.index ?? 0
    if (start > last) parts.push({ text: source.slice(last, start), to: null })
    parts.push({ text: match[1], to: match[2] })
    last = start + match[0].length
  }
  if (last < source.length) parts.push({ text: source.slice(last), to: null })
  return parts
}
