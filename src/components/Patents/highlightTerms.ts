// SPDX-License-Identifier: AGPL-3.0-only

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

const MARK_OPEN = '<mark class="bg-primary/20 text-primary rounded px-0.5">'

/**
 * Returns `text` as HTML with each search word (longer than two characters)
 * wrapped in a fixed `<mark>`. Matching runs on the raw text and every
 * segment is escaped afterwards, so a word such as "amp" can never match
 * inside an escaped entity (`&amp;`) and break it into visible text.
 */
export function highlightTerms(text: string, query: string): string {
  if (!text) return ''
  const words = query
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 2)
    .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  if (words.length === 0) return escapeHtml(text)
  // A capturing split keeps the matches at the odd indices.
  // eslint-disable-next-line security/detect-non-literal-regexp -- words are regex-escaped above
  const parts = text.split(new RegExp(`(${words.join('|')})`, 'gi'))
  return parts
    .map((part, i) => (i % 2 === 1 ? `${MARK_OPEN}${escapeHtml(part)}</mark>` : escapeHtml(part)))
    .join('')
}
