// SPDX-License-Identifier: GPL-3.0-only
/**
 * ReportUpgradeNudge — shown on a QUICK-assessment report only. One prominent
 * affordance that ties together the locked sections: finish the remaining
 * questions to unlock the full report. Routes back into the wizard's
 * comprehensive flow. Hidden in print and for shared (read-only) reports.
 */
import { Link } from 'react-router-dom'
import { Lock, ArrowRight } from 'lucide-react'

interface ReportUpgradeNudgeProps {
  /** Suppress on shared read-only reports — a recipient shouldn't finish someone else's assessment. */
  shared?: boolean
}

export function ReportUpgradeNudge({ shared = false }: ReportUpgradeNudgeProps) {
  if (shared) return null
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-warning/40 bg-warning/10 px-3.5 py-2.5 print:hidden">
      <Lock size={14} className="shrink-0 text-warning" aria-hidden="true" />
      <span className="text-[13px] font-semibold text-foreground">
        You&apos;re viewing the fast report.
      </span>
      <span className="text-[12.5px] text-muted-foreground">
        Four deeper sections — per-domain scores, your algorithm map, a dated roadmap and trend
        tracking — unlock with the full assessment.
      </span>
      <Link
        to="/assess?mode=comprehensive"
        className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-warning px-3.5 py-1.5 text-[12.5px] font-bold text-warning-foreground hover:opacity-90"
      >
        Unlock full report — ~5 min
        <ArrowRight size={13} aria-hidden="true" />
      </Link>
    </div>
  )
}
