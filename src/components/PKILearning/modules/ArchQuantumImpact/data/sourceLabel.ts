// SPDX-License-Identifier: AGPL-3.0-only
import { findStandard } from '@/data/standardsRegistry'

export const SHORT_TITLE_MAX = 58

/**
 * A readable label for a Library row: its document title, with site-name suffixes after " | "
 * dropped and the rest cut at a word boundary. A row not (yet) in the Library falls back to its id.
 * The id stays in the link target and the title attribute.
 */
export function sourceLabel(id: string): { short: string; full: string } {
  const full = findStandard(id)?.title?.trim() || id
  const head = full.split(/\s+\|\s+/)[0].trim()
  const base = head.length >= 12 ? head : full
  if (base.length <= SHORT_TITLE_MAX) return { short: base, full }
  const cut = base.slice(0, SHORT_TITLE_MAX)
  const at = cut.lastIndexOf(' ')
  const trimmed = (at > 30 ? cut.slice(0, at) : cut).replace(/[\s,;:|(-]+$/, '')
  return { short: `${trimmed}…`, full }
}
