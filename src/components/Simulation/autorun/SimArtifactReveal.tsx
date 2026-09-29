// SPDX-License-Identifier: GPL-3.0-only
import { FileText, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
  onDismiss,
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
  /** 09-28 nav remediation (WP3.4): the card had no way to close it — on a
   *  phone it covers up to 40vh of the board until the run moves on. */
  onDismiss?: () => void
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
          : 'pointer-events-auto fixed right-4 z-[55] max-w-xs rounded-lg border border-secondary/40 bg-card/95 p-3 shadow-lg backdrop-blur'
      }
      style={
        mobile
          ? { bottom: 'calc(var(--sim-transport-h, 96px) + 0.75rem)' }
          : // 09-28 (WP3.7): above the desktop play bar, not under it.
            { bottom: 'max(6rem, calc(var(--sim-transport-h-md, 0px) + 0.75rem))' }
      }
      data-testid="artifact-reveal"
    >
      <div className="mb-1 flex items-center gap-1.5">
        <FileText size={13} className="shrink-0 text-secondary" aria-hidden="true" />
        <span className="min-w-0 flex-1 text-[11px] font-bold uppercase tracking-wide text-secondary">
          Document ready · {r.title}
        </span>
        {onDismiss && (
          <Button
            type="button"
            variant="ghost"
            onClick={onDismiss}
            aria-label="Dismiss document card"
            className="h-auto shrink-0 rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X size={12} aria-hidden="true" />
          </Button>
        )}
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground">{r.body}</p>
    </div>
  )
}
