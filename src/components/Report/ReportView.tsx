// SPDX-License-Identifier: GPL-3.0-only
import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import { Link } from 'react-router'
import { motion } from 'framer-motion'
import { FileBarChart, ClipboardCheck, AlertCircle, ArrowRight } from 'lucide-react'
import { ReportContent } from './ReportContent'
import { ReportToc } from './ReportToc'
import { ReportNextSteps } from './ReportNextSteps'
import { useAssessmentStore } from '../../store/useAssessmentStore'
import { useAssessmentResultStore } from '../../store/useAssessmentResultStore'
import { computeAssessment } from '../../hooks/assessmentUtils'
import { computeAssessmentAsync } from '../../hooks/assessment/orchestrator'
import {
  WorkshopOperationLog,
  type LogEntry,
} from '@/components/PKILearning/common/WorkshopOperationLog'
import { useModuleStore } from '../../store/useModuleStore'
import { useWorkflowPhaseTracker } from '@/hooks/useWorkflowPhaseTracker'
import { useIsMobileShell } from '@/hooks/useIsMobileShell'
import { MobileReportView } from '@/components/Mobile/screens/MobileReportView'
import { PersonaPageNote } from '@/components/shared/PersonaPageNote'
import { useResolvedSharedReport } from '@/hooks/useResolvedSharedReport'
import { getReportSectionConfig, type ReportSectionId } from '../../data/personaConfig'
import { REPORT_SECTION_ORDER, REPORT_SECTION_LABELS } from '../../data/reportSectionToCswp39'
import { PageHeader } from '../common/PageHeader'
import { logReportViewed, logReportCta } from '@/utils/analytics'
import { EXAMPLE_REPORT_URL } from '@/data/exampleReport'
import { PersonaSuggestionCard } from '@/components/Assess/PersonaSuggestionCard'
import { getBeltTierLabel } from '@/data/personaConfig'
import { useAwarenessScore } from '@/hooks/useAwarenessScore'
import { usePersonaStore } from '@/store/usePersonaStore'
import { usePageActionsStore } from '@/store/usePageActionsStore'
import { buildReportShareUrl } from './sections/reportContentActions'

/**
 * Sections that render outside the persona-config-gated REPORT_SECTION_ORDER
 * list (QRA, ROI, KPI trending, NICE workforce gap) — they render
 * unconditionally, not through `getReportSectionConfig`, so they were
 * previously unreachable from the TOC entirely. Each entry names the
 * REPORT_SECTION_ORDER id it renders immediately after, in true page order.
 *
 * ACCURACY-0708-2: these entries used to only appear in the TOC when their
 * anchor id's own base entry survived the persona hidden-state filter (e.g.
 * the ROI/KPI-trending entries were nested under `vendorRisk`) — but the
 * sections they name render unconditionally regardless of that anchor's
 * visibility, so if any persona config ever hid `vendorRisk`, the TOC would
 * silently drop two sections still visible on the page. `tocSections` below
 * now appends these independently of the anchor's own filtered visibility.
 */
interface TocExtra {
  id: string
  label: string
  /** QRA and the NICE gap report both key off `getInput()` — the RECIPIENT's
   *  own live assessment input — so ReportContent skips rendering them
   *  entirely on a shared/example view (see the `shared` guards there) to
   *  avoid mixing the sender's result with the recipient's own inputs.
   *  Their TOC entries must be dropped too, or they'd point at an anchor
   *  that was never rendered. */
  hideWhenShared?: boolean
}

const EXTRA_TOC_AFTER: Partial<Record<ReportSectionId, TocExtra[]>> = {
  riskScore: [
    { id: 'report-section-qra', label: 'Quantum Readiness Assessment', hideWhenShared: true },
  ],
  vendorRisk: [
    { id: 'report-section-roiCalculator', label: 'ROI & Financial Case' },
    { id: 'report-section-kpiTrending', label: 'Progress Over Time' },
  ],
}

/** Renders after every other section (including threatLandscape) — appended
 *  at the end of the TOC unconditionally (except on a shared/example view —
 *  see `hideWhenShared` above). */
const TOC_TRAILING: TocExtra[] = [
  { id: 'report-section-niceGap', label: 'NICE Workforce Gap Report', hideWhenShared: true },
]

/**
 * Persona-flavored maturity tier chip rendered just under the page header
 * (P15-P1-04). Only renders for personas with a tier-label override
 * (executive, curious) per CC-13.
 */
function MaturityTierChip() {
  const selectedPersona = usePersonaStore((s) => s.selectedPersona)
  const { hasStarted, belt } = useAwarenessScore()
  if (!hasStarted) return null
  const tier = getBeltTierLabel(selectedPersona, belt.name)
  if (!tier) return null
  return (
    <div className="mb-4 -mt-2 flex justify-center sm:justify-start">
      <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border border-border bg-muted/30 text-muted-foreground">
        <span
          aria-hidden="true"
          className="inline-block w-2 h-2 rounded-full"
          style={{ backgroundColor: belt.color === '#F5F5F5' ? '#9CA3AF' : belt.color }}
        />
        <span className="text-foreground font-medium">{tier}</span>
        <span className="text-muted-foreground">· {belt.name}</span>
      </span>
    </div>
  )
}

export const ReportView: React.FC<{ simEmbed?: boolean }> = ({ simEmbed = false }) => {
  // simEmbed: rendered headless inside the simulation — the page chrome
  // (breadcrumb + PageHeader) is hidden so the sim's own header stays on top.
  // ReportView only reads searchParams (no writes), so no URL isolation is needed.
  const isMobileShell = useIsMobileShell()
  const { assessmentStatus, getInput, setResult, lastResult } = useAssessmentStore()
  useWorkflowPhaseTracker('assess')
  const input = getInput()
  // `getInput()` builds a fresh AssessmentInput on every store read, so plain
  // useMemo([input]) never hits. Key on a stable serialization instead — the
  // input is ~30 small primitive/array fields, so stringify is cheap relative
  // to the 10-stage computeAssessment pipeline this guards against re-running
  // on every render (was firing on every persona toggle, module-store update,
  // or unrelated remount).
  const inputKey = input ? JSON.stringify(input) : null

  // Async report-compute path: runs the 10-stage pipeline with yields between
  // stages so React can paint a progress log while the pipeline grinds.
  // First-mount on a comprehensive assessment is 800-1500ms on slow machines;
  // each yield gives the browser ~16ms to paint, so the bar animates.
  const [computeState, setComputeState] = useState<{
    inputKey: string | null
    result: ReturnType<typeof computeAssessment> | null
    log: LogEntry[]
    computing: boolean
  }>({ inputKey: null, result: null, log: [], computing: false })

  useEffect(() => {
    let cancelled = false
    if ((assessmentStatus === 'complete' || assessmentStatus === 'in-progress') && input) {
      // Re-using a previously-computed result if the inputKey is unchanged
      // (avoids re-running the pipeline on every render — same purpose the
      // earlier useMemo served).
      if (computeState.inputKey === inputKey && computeState.result) return
      setComputeState((prev) => ({
        inputKey,
        result: null,
        log: [],
        computing: true,
        // Keep the previously-computed result while we re-run so the UI
        // doesn't flicker an empty state between persona toggles.
        ...(prev.inputKey === inputKey ? { result: prev.result } : {}),
      }))
      computeAssessmentAsync(input, (label, durationMs) => {
        if (cancelled) return
        setComputeState((prev) => ({
          ...prev,
          log: [...prev.log, { status: 'success', message: label, durationMs }],
        }))
      })
        .then((r) => {
          if (cancelled) return
          setComputeState((prev) => ({ ...prev, result: r, computing: false }))
        })
        .catch((err) => {
          if (cancelled) return
          setComputeState((prev) => ({
            ...prev,
            computing: false,
            log: [
              ...prev.log,
              {
                status: 'error',
                message: `Assessment failed — ${err instanceof Error ? err.message : String(err)}`,
              },
            ],
          }))
        })
    } else if (assessmentStatus === 'complete' && lastResult) {
      setComputeState({
        inputKey: null,
        result: lastResult,
        log: [],
        computing: false,
      })
    } else {
      setComputeState({ inputKey: null, result: null, log: [], computing: false })
    }
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputKey, assessmentStatus, lastResult])

  const ownResult = computeState.result
  const reportComputing = computeState.computing
  const reportLogEntries = computeState.log
  const persistedRef = useRef(false)
  const [expandToken, setExpandToken] = useState(0)
  const [collapseToken, setCollapseToken] = useState(0)
  const handleExpandAll = useCallback(() => setExpandToken((t) => t + 1), [])
  const handleCollapseAll = useCallback(() => setCollapseToken((t) => t + 1), [])

  const livePersona = usePersonaStore((s) => s.selectedPersona)

  // ACCURACY-0708-2: a shared/example report is an ephemeral, in-memory view
  // — decoding a `?share=` link NEVER writes into the recipient's own
  // persisted assessment or persona store (no `markComplete`, no
  // `setPersona`), so it's safe to render regardless of whatever the
  // recipient's own assessment state already is. `approximate` is true for
  // pre-snapshot links (v1 token or the even older per-param format), which
  // have no sender score to honor and must be recomputed best-effort.
  //
  // Resolution itself lives in `useResolvedSharedReport` (shared with
  // MobileReportView, passed down as a prop below) — extracted 2026-09-07
  // both so mobile stops having no shared/example resolution at all, and so
  // a same-route `?share=`/`?example=` change re-resolves instead of being
  // missed by a mount-only guard.
  const sharedView = useResolvedSharedReport(livePersona)

  const selectedPersona = sharedView ? sharedView.persona : livePersona
  const isShared = !!sharedView
  const tocSections = useMemo(() => {
    const keep = (extra: TocExtra) => !(extra.hideWhenShared && isShared)
    const base = REPORT_SECTION_ORDER.flatMap((id) => [
      ...(getReportSectionConfig(selectedPersona, id).state !== 'hidden'
        ? [{ id: `report-section-${id}`, label: REPORT_SECTION_LABELS[id] }]
        : []),
      // These extras render unconditionally on the page (see EXTRA_TOC_AFTER
      // doc comment) — always include them here too, independent of whether
      // their anchor id's own entry survived the hidden-state filter above.
      // eslint-disable-next-line security/detect-object-injection
      ...(EXTRA_TOC_AFTER[id] ?? []).filter(keep),
    ])
    return [...base, ...TOC_TRAILING.filter(keep)]
  }, [selectedPersona, isShared])

  // Persist result and mark module complete. Deliberately keyed on
  // `ownResult` (the recipient's own live-store-driven compute), never on
  // `sharedView` — a shared/example view must not write into the
  // recipient's own persisted result/history.
  useEffect(() => {
    if (assessmentStatus === 'not-started') {
      persistedRef.current = false
      return
    }
    if (ownResult && !persistedRef.current) {
      persistedRef.current = true
      logReportViewed(useAssessmentStore.getState().industry, ownResult.riskLevel)
      setResult(ownResult)
      // Tag with the input that produced this result so the sim's self-unlock
      // effect can tell it's already current and skip its own (coarser) recompute.
      useAssessmentResultStore.setState({ sourceInputKey: inputKey })
      // Only comprehensive assessments feed the progress trend — the legacy path
      // emits coarse categoryScores for the sim/KPIs, so gate on the profile mode
      // (not categoryScores presence) to avoid polluting the trend with quick runs.
      if (
        assessmentStatus === 'complete' &&
        ownResult.assessmentProfile?.mode === 'comprehensive' &&
        ownResult.categoryScores
      ) {
        const store = useAssessmentStore.getState()
        store.pushSnapshot({
          completedAt: store.completedAt ?? ownResult.generatedAt,
          riskScore: ownResult.riskScore,
          categoryScores: ownResult.categoryScores,
          riskLevel: ownResult.riskLevel,
          industry: store.industry,
          preBoostScore: ownResult.preBoostScore,
          boosts: ownResult.boosts,
        })
      }
    }
  }, [assessmentStatus, ownResult, setResult])

  useEffect(() => {
    if (assessmentStatus !== 'complete') return
    useModuleStore.getState().updateModuleProgress('assess', {
      status: 'completed',
      completedSteps: ['assessment-completed'],
    })
  }, [assessmentStatus])

  // What actually renders: the sender's ephemeral snapshot when viewing a
  // shared/example link, otherwise the recipient's own live result.
  const result = sharedView ? sharedView.result : ownResult

  // Register this page's Share URL with the global top bar (BUG FIX,
  // Grade-A remediation Phase 2 — top-bar Share, per
  // PLAN-02-CORE-FUNNEL.md/PLAN-00-TOP-CONNECTING-PLAN.md §6): the top bar's
  // ShareButton (rendered in MainLayout.tsx) otherwise falls back to
  // `window.location.href`, which on /report is just the bare `/report`
  // path — a recipient who opens it lands on "No Report Yet" while the
  // sender gets a success toast implying it worked. `buildReportShareUrl` is
  // the same token-minting mechanism `shareReport` uses for the native share
  // sheet (mobile's MobileHeader calls this same top-bar registration — see
  // reportContentActions.ts). Gated on `!simEmbed`, same pattern as
  // ThreatsDashboard/TimelineView, and on `result` being present — with no
  // report yet there is nothing meaningful to share, so the top bar keeps
  // its generic bare-path fallback.
  useEffect(() => {
    if (simEmbed || !result) return
    const { setPageActions, clearPageActions } = usePageActionsStore.getState()
    setPageActions({
      title: 'PQC Assessment Report',
      url: buildReportShareUrl(result, isShared),
    })
    return () => clearPageActions()
  }, [simEmbed, result, isShared])

  // Placed after every hook above (React rules; the desktop-only ones just
  // run and are discarded) but before ALL desktop JSX — including the
  // loading and empty states below, both of which this screen replaces with
  // its own (its own computeAssessment() call is synchronous, so the
  // desktop-only progress-log loading UI is decoration this screen skips
  // entirely) — a pure early return with zero risk to the flag-off path
  // (Rule 1). ReportEmbed.tsx renders this same component inside the
  // simulation via simEmbed, so simEmbed must win over isMobileShell
  // regardless of viewport width, same as Threats/Library/Compliance/
  // Migrate/Assess.
  if (isMobileShell && !simEmbed) {
    // sharedView resolved once above (useResolvedSharedReport), not
    // re-derived here — mobile gets the identical shared/example report a
    // desktop reader on the same link would see, instead of none at all.
    return <MobileReportView sharedView={sharedView} />
  }

  // Active compute state: assessment exists, result still pending. Show
  // the progress log so users see the 10-stage pipeline grinding rather
  // than a blank page or stale spinner. Never applies to a shared view —
  // that result is already fully computed.
  if (!sharedView && !result && reportComputing) {
    return (
      <div className="animate-fade-in">
        <div className="max-w-xl mx-auto py-12">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center p-4 rounded-full bg-muted mb-4">
              <FileBarChart className="text-primary" size={28} />
            </div>
            {/* h2, not h1: this loading message isn't the page's primary
                heading (PageHeader owns that) — matters when simEmbed
                (WP5.7) since this branch renders regardless of simEmbed and
                an embedded pane must stay headless. */}
            <h2 className="text-xl font-bold text-foreground mb-2">Generating your report…</h2>
            <p className="text-sm text-muted-foreground">
              Running the 10-stage scoring pipeline. This takes 0.5–2 seconds on most machines.
            </p>
          </div>
          <WorkshopOperationLog entries={reportLogEntries} className="max-h-72" />
        </div>
      </div>
    )
  }

  // Empty state: no assessment started, no persisted result, and no
  // decodable shared/example link either (an undecodable token is ignored
  // rather than surfaced as an error — falls through to this same screen).
  if (!result) {
    const isCurious = selectedPersona === 'curious'
    return (
      <div className="animate-fade-in">
        <div className="max-w-lg mx-auto text-center py-16">
          <div className="inline-flex items-center justify-center p-4 rounded-full bg-muted mb-6">
            <FileBarChart className="text-muted-foreground" size={32} />
          </div>
          {/* Wave A (2026-09-18): on the standalone route this empty state IS
              the page, so it carries the h1 (axe `page-has-heading-one`).
              Inside the simulation (simEmbed) the pane stays headless — h2,
              as WP5.7 required. */}
          {simEmbed ? (
            <h2 className="text-2xl font-bold text-foreground mb-3">No Report Yet</h2>
          ) : (
            <h1 className="text-2xl font-bold text-foreground mb-3">No Report Yet</h1>
          )}
          <p className="text-muted-foreground mb-6">
            {isCurious
              ? 'Curious what a finished report looks like? Browse an example before committing to the assessment — or jump straight in.'
              : 'Complete the PQC Risk Assessment to generate your personalized report with risk scores, migration priorities, and actionable recommendations — or open a worked example first.'}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {/* RP-5: the worked example used to render only for the curious
                persona. Every other persona hit this screen with no way to
                see one — including an executive arriving from the persona
                board's own "See a finished example" CTA, which pointed at
                bare `/report`. That CTA now deep-links to `?example=1`, and
                the link below is ungated so the empty state is never a dead
                end for anyone who lands here by another route. */}
            <Link
              to={EXAMPLE_REPORT_URL}
              onClick={() => logReportCta('view-example')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-border bg-card text-foreground font-medium hover:border-primary/40 hover:bg-muted transition-colors"
            >
              <FileBarChart size={16} />
              See an example report
            </Link>
            <Link
              to="/assess"
              onClick={() => logReportCta('start-assessment')}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-secondary to-primary text-primary-foreground font-bold hover:opacity-90 hover:-translate-y-0.5 transition-all duration-200"
            >
              <ClipboardCheck size={18} />
              Start Assessment
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      {!simEmbed && (
        <PageHeader
          icon={FileBarChart}
          title="PQC Assessment Report"
          description="Your personalized post-quantum cryptography risk report with scores, priorities, and recommendations."
        />
      )}

      {!simEmbed && <PersonaPageNote route="/report" className="mb-4" />}

      {!sharedView && <MaturityTierChip />}

      {!sharedView && <PersonaSuggestionCard />}

      {/* ACCURACY-0708-2: this is now literally true — a shared/example view
          is rendered entirely from `sharedView.result`, never written into
          the recipient's own persisted assessment/persona state (see the
          hydration effect above), so "unaffected" no longer depends on the
          recipient happening to have no assessment of their own yet. */}
      {sharedView && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4"
        >
          <div className="glass-panel p-3 border-l-4 border-l-primary flex items-center gap-3">
            <FileBarChart size={16} className="text-primary shrink-0" />
            <span className="text-sm text-foreground">
              Viewing a shared report. This is a read-only snapshot — your own assessment is
              unaffected.
            </span>
          </div>
        </motion.div>
      )}

      {/* Older links (pre-dating score snapshotting) have no sender score to
          honor — say so plainly rather than silently passing off a
          recomputed approximation as the sender's exact report. */}
      {sharedView?.approximate && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4"
        >
          <div className="glass-panel p-3 border-l-4 border-l-warning flex items-center gap-3">
            <AlertCircle size={16} className="text-warning shrink-0" />
            <span className="text-sm text-foreground">
              This is an older share link — an approximate view recomputed from what it carries,
              which may not exactly match the score the sender saw.
            </span>
          </div>
        </motion.div>
      )}

      {/* Banner when assessment is in-progress — about the recipient's own
          in-progress assessment, so it never applies while viewing someone
          else's shared/example report. */}
      {!sharedView && assessmentStatus === 'in-progress' && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4"
        >
          <div className="glass-panel p-3 border-l-4 border-l-warning flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm">
              <AlertCircle size={16} className="text-warning shrink-0" />
              <span className="text-foreground">
                Assessment in progress — report reflects your current answers.
              </span>
            </div>
            <Link
              to="/assess"
              onClick={() => logReportCta('complete-assessment')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-gradient-to-r from-secondary to-primary text-primary-foreground rounded-lg hover:opacity-90 hover:-translate-y-0.5 transition-all duration-200 shrink-0"
            >
              Complete Assessment
              <ArrowRight size={12} />
            </Link>
          </div>
        </motion.div>
      )}

      {/* `result` is guaranteed truthy here — the `!result` early-return above
          covers the only case where it isn't, so this never had a reachable
          else branch. */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        <ReportToc
          sections={tocSections}
          onExpandAll={handleExpandAll}
          onCollapseAll={handleCollapseAll}
        />
        <div className="flex-1 min-w-0 w-full">
          <ReportContent
            result={result}
            expandToken={expandToken}
            collapseToken={collapseToken}
            sharedView={sharedView ? { persona: sharedView.persona } : undefined}
          />
        </div>
      </div>

      {result && !simEmbed && !sharedView && <ReportNextSteps result={result} />}
    </div>
  )
}

export default ReportView
