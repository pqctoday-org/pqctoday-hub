// SPDX-License-Identifier: GPL-3.0-only
/**
 * Inline badge that surfaces a live CMVP/CC/ANSSI match for a vendor + product
 * pair. Sits next to the illustrative cert number in CBOM tables so the user
 * sees both the teaching example and the real validation status side-by-side.
 *
 * Built on top of `useLiveCmvpStatus` which reads
 * `public/data/compliance-data.json` (refreshed daily by GitHub Actions).
 */
import { Radio } from 'lucide-react'
import type { LiveCmvpMatch } from '@/hooks/useLiveCmvpStatus'

export interface LiveCmvpBadgeProps {
  match: LiveCmvpMatch | null
}

export function LiveCmvpBadge({ match }: LiveCmvpBadgeProps) {
  if (!match) return null
  const tooltip = `Live ${match.source} match: ${match.matchedVendor} — ${match.matchedProductName} (${match.status}${match.date ? `, ${match.date}` : ''})`
  const content = (
    <span
      className="inline-flex items-center gap-1 rounded px-1 py-0 text-[9px] font-semibold uppercase tracking-wider bg-status-success/15 text-status-success border border-status-success/30 align-middle"
      title={tooltip}
    >
      <Radio size={9} aria-hidden />
      live · {match.source}
    </span>
  )
  if (!match.link) return content
  return (
    <a
      href={match.link}
      target="_blank"
      rel="noopener noreferrer"
      title={tooltip}
      className="hover:opacity-80"
    >
      {content}
    </a>
  )
}
