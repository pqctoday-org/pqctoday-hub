// SPDX-License-Identifier: GPL-3.0-only
/**
 * The two non-populated states for the "Progress over time" KPI section.
 * - EMPTY: a comprehensive assessment, but fewer than 2 saved snapshots — there's
 *   no trend to draw yet (distinct from "locked").
 * - PREVIEW: a static skeleton shown behind the locked overlay on a quick assessment.
 */
import { TrendingUp } from 'lucide-react'

export function KpiEmptyState() {
  return (
    <div className="glass-panel flex items-center gap-3 rounded-2xl p-4">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        <TrendingUp size={16} aria-hidden="true" />
      </span>
      <div>
        <p className="text-[13.5px] font-semibold text-foreground">
          Progress over time starts after your next assessment
        </p>
        <p className="mt-0.5 text-[12px] text-muted-foreground">
          We&apos;ve saved this assessment. Re-run it later (e.g. each quarter) and this section
          charts how your risk score and crypto-agility trend over time.
        </p>
      </div>
    </div>
  )
}

/** Non-numeric skeleton for the locked per-domain Risk Breakdown preview. Uses
 *  bars only — no fabricated scores — so nothing legible leaks behind the blur. */
export function CategoryBreakdownPreviewSkeleton() {
  return (
    <div className="glass-panel rounded-2xl p-4">
      <div className="mb-4 h-3 w-32 rounded bg-muted" />
      <div className="space-y-4">
        {[70, 52, 61, 44].map((w, i) => (
          <div key={i}>
            <div className="mb-1 flex items-center justify-between">
              <div className="h-2.5 w-28 rounded bg-muted/70" />
              <div className="h-2.5 w-8 rounded bg-muted/50" />
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-border">
              <div className="h-full rounded-full bg-primary/30" style={{ width: `${w}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/** Static skeleton used as the blurred preview behind the locked overlay. */
export function KpiPreviewSkeleton() {
  return (
    <div className="glass-panel rounded-2xl p-4">
      <div className="mb-3 h-3 w-40 rounded bg-muted" />
      <div className="flex h-24 items-end gap-2">
        {[60, 48, 40].map((h, i) => (
          <div key={i} className="flex-1 rounded-t bg-primary/30" style={{ height: `${h}%` }} />
        ))}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="h-10 rounded bg-muted/60" />
        <div className="h-10 rounded bg-muted/60" />
      </div>
    </div>
  )
}
