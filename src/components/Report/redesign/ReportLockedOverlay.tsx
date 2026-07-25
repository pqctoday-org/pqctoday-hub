// SPDX-License-Identifier: GPL-3.0-only
/**
 * ReportLockedOverlay — the redesign's "you can see what you're missing" pattern.
 * Wraps a blurred preview of a comprehensive-only section with a lock, a specific
 * reason, and an Unlock CTA that routes back into the wizard to finish the extra
 * questions. Replaces the live page silently OMITTING these sections on a quick
 * assessment.
 */
import { Link } from 'react-router'
import { Lock, ArrowRight } from 'lucide-react'

interface ReportLockedOverlayProps {
  /** Headline reason, e.g. "Per-domain scores need the full assessment". */
  reason: string
  /** One-line explanatory copy. */
  detail: string
  /** Blurred preview content shown behind the overlay. */
  children: React.ReactNode
}

export function ReportLockedOverlay({ reason, detail, children }: ReportLockedOverlayProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl">
      <div aria-hidden="true" className="pointer-events-none select-none blur-[3px] saturate-50">
        {children}
      </div>
      <div
        className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/90 p-6 text-center backdrop-blur-[2px]"
        role="group"
        aria-label={`Locked section: ${reason}`}
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-warning/15 text-warning">
          <Lock size={16} aria-hidden="true" />
        </span>
        <h3 className="text-[14px] font-bold text-foreground">{reason}</h3>
        <p className="max-w-sm text-[12.5px] text-muted-foreground">{detail}</p>
        <Link
          to="/assess?mode=comprehensive"
          className="mt-1 inline-flex items-center gap-1.5 rounded-lg bg-warning px-4 py-2 text-[13px] font-bold text-warning-foreground hover:opacity-90"
        >
          Unlock — ~5 min
          <ArrowRight size={14} aria-hidden="true" />
        </Link>
      </div>
    </div>
  )
}
