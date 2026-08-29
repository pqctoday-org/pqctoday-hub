// SPDX-License-Identifier: GPL-3.0-only
import { useMemo } from 'react'
import { Link } from 'react-router'
import { AlertTriangle, ClipboardCheck, FileBarChart } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAssessmentStore } from '@/store/useAssessmentStore'
import { usePersonaStore } from '@/store/usePersonaStore'
import { computeAssessment } from '@/hooks/assessment/orchestrator'
import { TopThreeActions } from '@/components/common/TopThreeActions'
import { ReportUpgradeNudge } from '@/components/Report/redesign/ReportUpgradeNudge'
import { REPORT_SECTION_ORDER, REPORT_SECTION_LABELS } from '@/data/reportSectionToCswp39'
import { EXAMPLE_REPORT_URL } from '@/data/exampleReport'
import { riskConfig as RISK_TIER } from '@/data/riskConfig'

/**
 * Mobile Report (handoff Phase 8 — Workflow set, design handoff §12).
 *
 * The target screenshot is a plausible-looking pastiche — most individual
 * elements are real, but wired together in an order/wording the real page
 * doesn't use (confirmed by research before writing any UI). Real
 * corrections: the "top five actions" conflates two different real things —
 * a "Do this first" hero capped at 3 (TopThreeActions), and a separate,
 * uncapped "Recommended Actions" section (5 only for the executive persona,
 * titled "(Top 5)", sitting 12th of 17 sections, nowhere near the top). The
 * 5-pill CSWP.39 row is real but is cross-navigation to the Command Center
 * (/business#step-X), not an internal report nav. None of the screenshot's 5
 * example action strings exist anywhere in the codebase — real generated
 * actions read plainer ("Conduct a cryptographic asset inventory…", "Migrate
 * TLS endpoints to hybrid PQC key exchange (ML-KEM + X25519).").
 *
 * Scope confirmed with the user given the real page's size (~950-line
 * content file, 17 real sections): highlights + a real section index, not a
 * full section-by-section reader. Real risk score/tier, the real Quick-vs-
 * Comprehensive distinction and its exact real banner copy, "Do this first"
 * and "Recommended Actions" both real, and all 17 real section names as an
 * index — full section bodies stated as a laptop-only cut. Share is NOT
 * rendered on this screen (2026-08-27 remediation): it lives only in
 * MobileHeader's top bar, which reads the same self-contained `?share=` deep
 * link ReportView.tsx already registers via usePageActionsStore.
 *
 * Reuses real desktop logic/components verbatim (Rule 2): computeAssessment
 * (the same pure scoring pipeline ReportView.tsx calls — desktop's async
 * wrapper only adds a progress-log UI, decoration this screen skips),
 * TopThreeActions and ReportUpgradeNudge (both explicitly generic
 * components with no baked-
 * in desktop-only layout — imported directly rather than re-implemented),
 * and REPORT_SECTION_ORDER/REPORT_SECTION_LABELS (the real 17 sections, in
 * real order). 2 ESLint exceptions (TopThreeActions, ReportUpgradeNudge —
 * genuinely reusable components, not desktop views).
 */
export function MobileReportView() {
  const store = useAssessmentStore()
  const selectedPersona = usePersonaStore((s) => s.selectedPersona)

  const result = useMemo(() => {
    if (store.assessmentStatus !== 'complete') return null
    const input = store.getInput()
    return input ? computeAssessment(input) : null
    // eslint-disable-next-line react-hooks/exhaustive-deps -- input is re-read fresh each recompute; only the completion transition needs to retrigger this
  }, [store.assessmentStatus])

  if (!result) {
    const isCurious = selectedPersona === 'curious'
    return (
      <div className="flex flex-col items-center gap-3 px-4 pb-4 pt-12 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <FileBarChart size={22} className="text-muted-foreground" aria-hidden="true" />
        </div>
        <h1 className="text-[16px] font-extrabold text-foreground">No Report Yet</h1>
        <p className="max-w-xs text-[11.5px] leading-relaxed text-muted-foreground">
          {isCurious
            ? 'Curious what a finished report looks like? Browse an example before committing to the assessment — or jump straight in.'
            : 'Complete the PQC Risk Assessment to generate your personalized report with risk scores, migration priorities, and actionable recommendations — or open a worked example first.'}
        </p>
        <div className="mt-1 flex flex-col gap-2">
          <Link
            to={EXAMPLE_REPORT_URL}
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border border-border bg-card px-5 text-[12px] font-semibold text-foreground"
          >
            <FileBarChart size={14} aria-hidden="true" />
            See an example report
          </Link>
          <Link
            to="/assess"
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-secondary to-primary px-5 text-[12.5px] font-bold text-primary-foreground"
          >
            <ClipboardCheck size={14} aria-hidden="true" />
            Start Assessment
          </Link>
        </div>
      </div>
    )
  }

  const isComprehensive = result.assessmentProfile?.mode === 'comprehensive'
  const dataSensitivity = store.dataSensitivity ?? []
  const showHndlWarning =
    !isComprehensive &&
    !result.hndlRiskWindow &&
    (dataSensitivity.includes('critical') || dataSensitivity.includes('high'))
  const tier = RISK_TIER[result.riskLevel]

  return (
    <div className="px-4 pb-4 pt-4">
      <div className="mb-1">
        <h1 className="sr-only">Report</h1>
      </div>
      <p className="mb-4 text-[10.5px] font-bold uppercase tracking-wide text-primary">
        {isComprehensive ? 'Comprehensive Assessment' : 'Quick Assessment'}
      </p>

      <div className={cn('rounded-2xl border p-4 text-center', tier.border, tier.bg)}>
        <p className={cn('text-[38px] font-extrabold leading-none', tier.color)}>
          {result.riskScore}
        </p>
        <p className={cn('mt-1 text-[11px] font-bold uppercase tracking-wide', tier.color)}>
          {tier.label}
        </p>
      </div>

      {!isComprehensive && (
        <div className="mt-3">
          <ReportUpgradeNudge />
        </div>
      )}

      {showHndlWarning && (
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-warning/40 bg-warning/10 p-3">
          <AlertTriangle size={15} className="mt-0.5 shrink-0 text-warning" aria-hidden="true" />
          <div>
            <p className="text-[12px] font-bold text-foreground">HNDL Risk Not Quantified</p>
            <p className="mt-0.5 text-[10.5px] leading-relaxed text-muted-foreground">
              This quick assessment did not include data retention information.
              Harvest-Now-Decrypt-Later risk cannot be calculated. For sensitive long-lived data,
              run a Comprehensive Assessment to quantify this exposure.
            </p>
          </div>
        </div>
      )}

      {result.recommendedActions.length > 0 && (
        <div className="mt-4">
          <TopThreeActions
            source="report-mobile"
            heading="Do this first"
            actions={result.recommendedActions.slice(0, 3).map((a) => ({
              id: `action-${a.priority}`,
              label: a.action,
              description:
                a.category === 'immediate'
                  ? 'Immediate · do now'
                  : a.category === 'short-term'
                    ? 'Short-term · this quarter'
                    : 'Long-term · plan it',
              href: a.relatedModule ? `/learn/${a.relatedModule}` : '#mobile-recommended-actions',
            }))}
          />
        </div>
      )}

      <h2
        id="mobile-recommended-actions"
        className="mb-2 mt-5 text-[12px] font-bold uppercase tracking-wide text-muted-foreground"
      >
        Recommended actions
      </h2>
      <div className="flex flex-col gap-2">
        {result.recommendedActions.map((a) => (
          <div key={a.priority} className="glass-panel flex items-start gap-2.5 p-3">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[10px] font-bold text-primary">
              {a.priority}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[12px] leading-snug text-foreground">{a.action}</p>
              <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                {a.category === 'immediate'
                  ? 'Immediate'
                  : a.category === 'short-term'
                    ? 'Short-term'
                    : 'Long-term'}
              </p>
            </div>
          </div>
        ))}
      </div>

      <h2 className="mb-2 mt-5 text-[12px] font-bold uppercase tracking-wide text-muted-foreground">
        Sections
      </h2>
      <div className="flex flex-col divide-y divide-border rounded-xl border border-border">
        {REPORT_SECTION_ORDER.map((id) => (
          <div key={id} className="px-3 py-2.5 text-[12px] text-foreground">
            {REPORT_SECTION_LABELS[id]}
          </div>
        ))}
      </div>

      <p className="mt-4 border-t border-border pt-3 text-[10.5px] leading-relaxed text-muted-foreground">
        Full detail for each section above — country timeline, risk breakdown, CBOM, migration
        roadmap and the rest — plus the CSWP.39 nav and print/PDF export, are on a laptop.
      </p>
    </div>
  )
}
