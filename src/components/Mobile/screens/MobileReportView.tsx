// SPDX-License-Identifier: AGPL-3.0-only
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
import type { SharedReportView } from '@/hooks/useResolvedSharedReport'
import { BoardPackExport } from '@/components/common/BoardPackExport'

interface MobileReportViewProps {
  /** Resolved once in `ReportView.tsx` (via `useResolvedSharedReport`) and
   *  passed down so mobile renders the identical shared/example report a
   *  desktop reader on the same `?share=`/`?example=1` link would see,
   *  instead of always falling back to the viewer's own live assessment
   *  (2026-09-07 fix — this screen previously had no shared/example
   *  resolution at all). `undefined`/`null` means "no shared link active." */
  sharedView?: SharedReportView | null
}

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
 * index — full section bodies stated as a laptop-only cut. The Share BUTTON
 * is NOT rendered on this screen (2026-08-27 remediation): it lives only in
 * MobileHeader's top bar, which reads the same self-contained `?share=` deep
 * link ReportView.tsx already registers via usePageActionsStore.
 *
 * RECEIVING a shared/example link, by contrast, IS this screen's job
 * (2026-09-07 fix): `sharedView` is resolved once in `ReportView.tsx` (via
 * `useResolvedSharedReport`, shared with desktop) and passed down as a prop
 * — before this fix, this screen only ever read the viewer's own live
 * assessment store, so opening a `?share=`/`?example=1` link on a phone
 * always landed on "No Report Yet" regardless of what the link promised.
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
export function MobileReportView({ sharedView }: MobileReportViewProps = {}) {
  const store = useAssessmentStore()
  const livePersona = usePersonaStore((s) => s.selectedPersona)

  const ownResult = useMemo(() => {
    if (store.assessmentStatus !== 'complete') return null
    const input = store.getInput()
    return input ? computeAssessment(input) : null
    // eslint-disable-next-line react-hooks/exhaustive-deps -- input is re-read fresh each recompute; only the completion transition needs to retrigger this
  }, [store.assessmentStatus])

  // A shared/example link renders its own ephemeral result, never the
  // viewer's own live one — same precedence as desktop's ReportView.
  const result = sharedView ? sharedView.result : ownResult
  const selectedPersona = sharedView ? sharedView.persona : livePersona

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
            : 'Complete the PQC Risk Assessment to generate an educational priority report with transparent assumptions and candidate next steps — or open a worked example first.'}
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
  // Read sensitivity from the RESOLVED result's own profile, not the live
  // store — for a shared/example view that must reflect the sender's data,
  // never the viewer's own unrelated assessment inputs.
  const dataSensitivity = sharedView
    ? (result.assessmentProfile?.sensitivityLevels ?? [])
    : (store.dataSensitivity ?? [])
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

      {sharedView?.sample && (
        <div className="mb-3 rounded-xl border border-primary/40 bg-primary/10 p-3">
          <p className="text-[11.5px] leading-relaxed text-foreground">
            This is a sample report for a fictional US bank. Run your own assessment to see yours.
          </p>
          <Link
            to="/assess"
            className="mt-2 inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-secondary to-primary px-4 text-[12px] font-bold text-primary-foreground"
          >
            <ClipboardCheck size={14} aria-hidden="true" />
            Start Assessment
          </Link>
        </div>
      )}

      {!['developer', 'ops', 'researcher'].includes(selectedPersona ?? '') && (
        <section className="mb-3 rounded-xl border border-border p-3">
          <h2 className="text-sm font-semibold">Inspect the report&apos;s figures</h2>
          <p className="my-2 text-xs text-muted-foreground">
            {sharedView?.sample
              ? 'Download this fictional worked example'
              : 'Download this learning report, built from the answers entered,'}{' '}
            with its figure sources, methods and caveats. The pack does not establish organizational
            readiness or compliance.
          </p>
          <BoardPackExport
            result={result}
            variant="outline"
            persona={selectedPersona}
            shared={Boolean(sharedView)}
            sample={sharedView?.sample}
          />
        </section>
      )}
      <div className={cn('rounded-2xl border p-4 text-center', tier.border, tier.bg)}>
        <p className={cn('text-[38px] font-extrabold leading-none', tier.color)}>
          {result.riskScore}
        </p>
        <p className={cn('mt-1 text-[11px] font-bold uppercase tracking-wide', tier.color)}>
          {tier.label}
        </p>
        <p className="mt-2 text-[10.5px] leading-relaxed text-muted-foreground">
          Educational priority index from self-reported answers—not a scan, compliance grade, or
          breach probability.
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
            <p className="text-[12px] font-bold text-foreground">HNDL Window Not Modelled</p>
            <p className="mt-0.5 text-[10.5px] leading-relaxed text-muted-foreground">
              This quick assessment did not include data retention information. The exposure window
              cannot be modelled. Run a full assessment and replace assumptions with documented
              retention evidence.
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
