// SPDX-License-Identifier: GPL-3.0-only
import { FileText } from 'lucide-react'
import type { ExecutiveDocumentType } from '@/services/storage/types'
import { revealText } from './revealText'

/**
 * SimArtifactReveal — a brief "document ready · what it is" card shown during the
 * Executive Overview walkthrough when a board document is generated at a deep stage
 * (charter, budget/ROI, board deck, risk register, roadmap, KPI pack, verification).
 * The line is sourced from the matching business tool; renders nothing when idle.
 */
export function SimArtifactReveal({
  type,
  variant,
}: {
  type: ExecutiveDocumentType | null
  /** mobile-ux-layer (WS-B1): the mobile call site passes 'mobile' — the card
   *  sits above SimAutoRunOverlay's transport bar (read from the
   *  `--sim-transport-h` var that overlay instance publishes when it's the
   *  visible one) instead of the desktop-only `bottom-24` guess that bar
   *  routinely covers on a phone, and gains a real max-height + scroll so a
   *  longer body is actually readable. The desktop call site passes nothing,
   *  keeping its exact original classes. */
  variant?: 'mobile'
}) {
  if (!type) return null
  const r = revealText(type)
  if (!r) return null
  const mobile = variant === 'mobile'
  return (
    <div
      className={
        mobile
          ? 'pointer-events-auto fixed right-4 z-[70] max-h-[40vh] max-w-xs overflow-y-auto rounded-lg border border-secondary/40 bg-card/95 p-3 shadow-lg backdrop-blur'
          : 'pointer-events-auto fixed bottom-24 right-4 z-[55] max-w-xs rounded-lg border border-secondary/40 bg-card/95 p-3 shadow-lg backdrop-blur'
      }
      style={mobile ? { bottom: 'calc(var(--sim-transport-h, 96px) + 0.75rem)' } : undefined}
      data-testid="artifact-reveal"
    >
      <div className="mb-1 flex items-center gap-1.5">
        <FileText size={13} className="shrink-0 text-secondary" aria-hidden="true" />
        <span className="text-[11px] font-bold uppercase tracking-wide text-secondary">
          Document ready · {r.title}
        </span>
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground">{r.body}</p>
    </div>
  )
}
