// SPDX-License-Identifier: GPL-3.0-only
/**
 * Inline badge linking to the official record (NIST CMVP / CAVP certificate
 * page, or the CC / EUCC / ANSSI record) for a certificate ID the caller
 * already holds. Sits next to the illustrative cert number in CBOM tables.
 *
 * Built on `useLiveCmvpStatus`, which matches by exact certificate ID only
 * and reads the published snapshot in `public/data/compliance-data.json` — a
 * periodic publication, not a live feed. Neutral styling on purpose: the badge
 * says "this record exists at the source", not "this product is validated".
 */
import { ExternalLink } from 'lucide-react'
import type { LiveCmvpMatch } from '@/hooks/useLiveCmvpStatus'
import { formatIsoDate } from '@/components/Compliance/recordSemantics'

export interface LiveCmvpBadgeProps {
  match: LiveCmvpMatch | null
}

function recordBadgeLabel(match: LiveCmvpMatch): string {
  if (match.source === 'NIST') return 'NIST record'
  if (match.type === 'CSPN') return 'ANSSI record'
  if (match.type === 'EUCC') return 'EUCC record'
  return 'CC record'
}

export function LiveCmvpBadge({ match }: LiveCmvpBadgeProps) {
  if (!match) return null
  const label = recordBadgeLabel(match)
  const dated = match.date ? `, dated ${formatIsoDate(match.date)}` : ''
  const tooltip = `${match.typeLabel} record #${match.certId} in the published snapshot: ${match.matchedVendor} — ${match.matchedProductName} (status ${match.status || 'not stated'}${dated}). Matched by certificate ID only.`
  const content = (
    <span
      className="inline-flex items-center gap-1 rounded border border-border bg-muted px-1 py-0 align-middle text-[9px] font-semibold uppercase tracking-wider text-muted-foreground"
      title={tooltip}
    >
      {label}
      {!match.isCurrent && match.status && <span className="normal-case">· {match.status}</span>}
      {match.link && <ExternalLink size={9} aria-hidden />}
    </span>
  )
  if (!match.link) return content
  return (
    <a
      href={match.link}
      target="_blank"
      rel="noopener noreferrer"
      title={tooltip}
      aria-label={`${label}: ${match.typeLabel} #${match.certId} (opens the official record)`}
      className="hover:opacity-80"
    >
      {content}
    </a>
  )
}
