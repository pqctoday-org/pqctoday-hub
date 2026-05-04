// SPDX-License-Identifier: GPL-3.0-only
import { Link } from 'react-router-dom'
import { Lightbulb, ArrowRight } from 'lucide-react'

/**
 * Static "Decision this quarter" card. v1 hard-codes the universal exec
 * decision (approve a transition plan); future revisions will key off
 * `useAssessmentStore` state — e.g. "Schedule the board PQC briefing" if no
 * assessment exists, "Approve mid-2026 plan target" if assessment in progress,
 * "Validate deployment milestones" if rolling out.
 */
export function NextDecisionCard() {
  return (
    <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-2">
      <div className="flex items-center gap-2">
        <Lightbulb size={14} className="text-primary" aria-hidden="true" />
        <span className="text-xs font-semibold uppercase tracking-wide text-primary">
          Decision this quarter
        </span>
      </div>
      <p className="text-sm font-medium text-foreground">Approve 2026 transition plan target</p>
      <p className="text-xs text-muted-foreground">
        Without an executive-approved plan target by end-2026, the 2030 cutover deadline becomes
        mathematically unreachable for most PKI / TLS estates. Use the assessment to size the
        program and produce a board-ready risk paper.
      </p>
      <Link
        to="/assess"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
      >
        Take board assessment
        <ArrowRight size={12} aria-hidden="true" />
      </Link>
    </div>
  )
}
