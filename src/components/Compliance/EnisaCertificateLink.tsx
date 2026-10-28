// SPDX-License-Identifier: AGPL-3.0-only
import type { MouseEvent, KeyboardEvent, ReactNode } from 'react'
import { ExternalLink } from 'lucide-react'

/**
 * The EUCC number of a Common Criteria Portal listing, as a link to ENISA's certificate page
 * (recordSemantics `euccEnisaListing()` decides when there is one). Opens in a new tab.
 *
 * `isolateEvents` is for a link inside a clickable row or card: the click and the Enter / Space
 * key must reach the link, not the card around it.
 */
export const EnisaCertificateLink = ({
  url,
  number,
  isolateEvents = false,
  children,
}: {
  url: string
  number: string
  isolateEvents?: boolean
  /** What to show; defaults to the number. */
  children?: ReactNode
}) => (
  <a
    href={url}
    target="_blank"
    rel="noopener noreferrer"
    aria-label={`${number} (ENISA certificate page, opens in a new tab)`}
    className="inline-flex max-w-full items-center gap-1 text-primary hover:underline"
    onClick={isolateEvents ? (e: MouseEvent) => e.stopPropagation() : undefined}
    onKeyDown={isolateEvents ? (e: KeyboardEvent) => e.stopPropagation() : undefined}
  >
    <span className="min-w-0 truncate">{children ?? number}</span>
    <ExternalLink size={10} className="shrink-0 opacity-60" aria-hidden="true" />
  </a>
)
