// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useMemo } from 'react'
import { flushSync } from 'react-dom'
import { Link, useNavigate, useSearchParams } from 'react-router'
import {
  Printer,
  RotateCcw,
  Download,
  Pencil,
  Briefcase,
  BookOpen,
  Info,
  Compass,
  GraduationCap,
  Filter,
  X,
} from 'lucide-react'
import { useAssessmentStore } from '../../store/useAssessmentStore'
import { useMigrateSelectionStore } from '../../store/useMigrateSelectionStore'
import { useMigrationWorkflowStore } from '../../store/useMigrationWorkflowStore'
import { usePersonaStore } from '../../store/usePersonaStore'
import { useReportOwnershipStore } from '../../store/useReportOwnershipStore'
import {
  PERSONA_NAV_PATHS,
  ALWAYS_VISIBLE_PATHS,
  getReportSectionConfig,
  PERSONA_REPORT_CTAS,
} from '../../data/personaConfig'
import type { ReportSectionId, ReportCTA } from '../../data/personaConfig'
import { PERSONAS } from '../../data/learningPersonas'
import type { PersonaId } from '../../data/learningPersonas'
import { TopThreeActions } from '../common/TopThreeActions'
import { softwareData } from '../../data/migrateData'
import { ASSESS_TO_THREATS_INDUSTRY } from './ReportThreatsAppendix'
import { ReportCswp39Nav } from './ReportCswp39Nav'
import { ReportLockedOverlay } from './redesign/ReportLockedOverlay'
import { KpiEmptyState, KpiPreviewSkeleton } from './redesign/ReportKpiStates'
import { ReportVerdictBlock } from './redesign/ReportVerdictBlock'
import { ReportUpgradeNudge } from './redesign/ReportUpgradeNudge'
import { ReportControlDeck } from './redesign/ReportControlDeck'
import { useThreatsData } from '../../hooks/useThreatsData'
import { MigrationRoadmap } from './MigrationRoadmap'
import { MigrationToolkit } from './MigrationToolkit'
import { VendorRiskSection } from './sections/VendorRiskSection'
import { DiscoverySection } from './sections/DiscoverySection'
import { CbomSection } from './sections/CbomSection'
import { ReportMethodologyModal } from './ReportMethodologyModal'
import { ROICalculatorSection } from '../shared/ROICalculatorSection'
import type { ROISummary } from '../shared/ROICalculatorSection'
import { KPITrendingSection } from './KPITrendingSection'
import { BoardBriefSection } from './BoardBriefSection'
import { BoardPackExport } from './BoardPackExport'
import {
  REPORT_SECTION_ORDER,
  REPORT_SECTION_LABELS,
  REPORT_SECTION_TO_CSWP39,
} from '../../data/reportSectionToCswp39'
import { FRAMEWORK_PHASES } from '../../data/frameworkPhases'
import { usePhaseFilter } from '../../hooks/usePhaseFilter'
import { Button } from '../ui/button'
import { SectionExpandContext } from '@/contexts/sectionExpandContext'
import clsx from 'clsx'
import type { AssessmentResult } from '../../hooks/assessmentTypes'
import { SIGNING_ALGORITHMS } from '../../hooks/assessmentData'
import { NiceGapReportSection } from './NiceGapReportSection'
import { QRASection } from './sections/QRASection'
import {
  RiskBreakdownUnlocked,
  RiskBreakdownLocked,
  FrameworkRiskLensSection,
} from './sections/CategoryBreakdownSection'
import { AssessmentProfileSummary } from './sections/AssessmentProfileSection'
import {
  CountryTimelineSection,
  RiskScoreSection,
  KeyFindingsSection,
  ExecutiveSummarySection,
} from './sections/ReportOverviewSections'
import { SectionInfoTip, CollapsibleSection, CTA_ICONS } from './sections/reportContentShared'
import {
  HndlHnflWindowsSection,
  HndlNotQuantifiedWarning,
  HnflNotQuantifiedWarning,
} from './sections/HndlHnflSection'
import { AlgorithmMigrationSection } from './sections/AlgorithmMigrationSection'
import { ComplianceImpactSection } from './sections/ComplianceImpactSection'
import { RecommendedActionsSection } from './sections/RecommendedActionsSection'
import { ThreatLandscapeSection } from './sections/ThreatLandscapeSection'
import { SimulationOutcomesSection } from './sections/SimulationOutcomesSection'
import { printReport, exportAlgorithmMigrationsCsv } from './sections/reportContentActions'
import { findReferenceEstate } from '@/data/assessmentScenarios'

declare const __APP_VERSION__: string
const APP_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.0.0'

// Stable empty fallbacks for shared/example-view profile field overrides —
// see the `sharedView` derivation below. Reused so an absent field doesn't
// allocate a fresh array/object identity on every render.
const EMPTY_STRING_ARRAY: string[] = []
const EMPTY_SUBCATEGORIES: Record<string, string[]> = {}

interface AssessReportProps {
  result: AssessmentResult
  expandToken?: number
  collapseToken?: number
  /**
   * Present when rendering someone else's shared report or the curious-mode
   * example (ACCURACY-0708-2) — an ephemeral, read-only view. `persona` is
   * the sender's persona at share time, used only to reproduce their
   * section-gating in this view; it is never written to the recipient's own
   * `usePersonaStore`. When set, this component must not read or write the
   * recipient's own persisted assessment/persona state for anything that
   * would make the rendered report diverge from what the sender saw, or let
   * the recipient accidentally edit/reset/complete their own assessment
   * while looking at someone else's.
   */
  sharedView?: { persona: PersonaId | null }
}

export const ReportContent: React.FC<AssessReportProps> = ({
  result,
  expandToken = 0,
  collapseToken = 0,
  sharedView,
}) => {
  const shared = !!sharedView
  const navigate = useNavigate()
  const { data: threatsData } = useThreatsData()
  const { reset, editFromStep, getInput } = useAssessmentStore()
  const assessmentStatus = useAssessmentStore((s) => s.assessmentStatus)
  const { workflowActive, startWorkflow } = useMigrationWorkflowStore()
  // Recipient's own score history/timestamp — never relevant when viewing
  // someone else's shared/example report, so it's suppressed rather than
  // shown alongside the sender's score.
  const livePreviousRiskScore = useAssessmentStore((s) => s.previousRiskScore)
  const liveLastModifiedAt = useAssessmentStore((s) => s.lastModifiedAt)
  const previousRiskScore = shared ? null : livePreviousRiskScore
  const lastModifiedAt = shared ? null : liveLastModifiedAt
  const assessmentHistory = useAssessmentStore((s) => s.assessmentHistory)
  // ACCURACY-0708-2: for a shared/example view, every field the report
  // renders must come from the sender's snapshot (`result.assessmentProfile`)
  // rather than the recipient's own live assessment store — otherwise a
  // recipient with their own in-progress/completed assessment would see a
  // report mixing the sender's score with their own industry/crypto/etc.
  // Fallbacks use these stable module-level constants (not fresh `[]`/`{}`
  // literals) so `infrastructure`/`infrastructureSubCategories` keep a
  // stable reference across renders when unset — `relevantSoftware`'s
  // useMemo below depends on `infrastructure` and would otherwise recompute
  // on every render of a shared view.
  const profile = result.assessmentProfile
  const liveIndustry = useAssessmentStore((s) => s.industry)
  const liveCountry = useAssessmentStore((s) => s.country)
  const liveDataSensitivity = useAssessmentStore((s) => s.dataSensitivity)
  const liveCurrentCrypto = useAssessmentStore((s) => s.currentCrypto)
  const liveCryptoUnknown = useAssessmentStore((s) => s.cryptoUnknown)
  const liveInfrastructure = useAssessmentStore((s) => s.infrastructure)
  const liveInfrastructureSubCategories = useAssessmentStore((s) => s.infrastructureSubCategories)
  const industry = shared ? (profile?.industry ?? '') : liveIndustry
  // A SHARED report is the sender's; we deliberately do not claim their run was
  // a scenario just because the recipient happens to have one loaded.
  const liveScenarioId = useAssessmentStore((s) => s.scenarioEstateId)
  const scenarioEstate = shared ? undefined : findReferenceEstate(liveScenarioId)
  const country = shared ? (profile?.country ?? '') : liveCountry
  const dataSensitivity = shared
    ? (profile?.sensitivityLevels ?? EMPTY_STRING_ARRAY)
    : liveDataSensitivity
  const currentCrypto = shared
    ? (profile?.algorithmsSelected ?? EMPTY_STRING_ARRAY)
    : liveCurrentCrypto
  const cryptoUnknown = shared ? !!profile?.algorithmUnknown : liveCryptoUnknown
  const hasSigningAlgos =
    (currentCrypto ?? []).some((a) => SIGNING_ALGORITHMS.has(a)) || cryptoUnknown
  const infrastructure = shared
    ? (profile?.infrastructure ?? EMPTY_STRING_ARRAY)
    : liveInfrastructure
  const infrastructureSubCategories = shared
    ? (profile?.infrastructureSubCategories ?? EMPTY_SUBCATEGORIES)
    : liveInfrastructureSubCategories
  const hiddenThreats = useAssessmentStore((s) => s.hiddenThreats)
  const hideThreat = useAssessmentStore((s) => s.hideThreat)
  const restoreAllThreats = useAssessmentStore((s) => s.restoreAllThreats)
  const livePersona = usePersonaStore((s) => s.selectedPersona)
  // The sender's persona (ephemeral, from the token) drives section gating
  // for a shared/example view — never the recipient's own persona store.
  const selectedPersona = shared ? (sharedView.persona ?? null) : livePersona
  const hiddenProducts = useMigrateSelectionStore((s) => s.hiddenProducts)
  // Subscribe to each primitive field separately — a selector that builds a new
  // object every call breaks useSyncExternalStore's snapshot caching (zustand +
  // React 18) and can trigger "getSnapshot should be cached" render loops.
  const ownershipProgramOwner = useReportOwnershipStore((s) => s.programOwner)
  const ownershipBudgetOwner = useReportOwnershipStore((s) => s.budgetOwner)
  const ownershipAccountableExecutive = useReportOwnershipStore((s) => s.accountableExecutive)
  const ownership = useMemo(
    () => ({
      programOwner: ownershipProgramOwner,
      budgetOwner: ownershipBudgetOwner,
      accountableExecutive: ownershipAccountableExecutive,
    }),
    [ownershipProgramOwner, ownershipBudgetOwner, ownershipAccountableExecutive]
  )

  // Migration-Program phase overlay: when `?phase=` is active, narrow the report
  // to the sections that *communicate* that phase (per REPORT_SECTION_TO_CSWP39)
  // and surface a compact phase header. With no phase active, `activePhase` is
  // null and `phaseVisible` is `true` for every section — page is unchanged.
  const { activePhase, matches } = usePhaseFilter()
  const [searchParams, setSearchParams] = useSearchParams()
  const activePhaseDef = activePhase ? FRAMEWORK_PHASES[activePhase] : null

  /** `true` when a report section should show under the active phase filter. */
  const phaseVisible = (sectionId: ReportSectionId): boolean =>
    matches(REPORT_SECTION_TO_CSWP39[sectionId].frameworkPhase)

  /** Clears `?phase=` while preserving every other query param (deep-links). */
  const clearPhase = () => {
    const next = new URLSearchParams(searchParams)
    next.delete('phase')
    setSearchParams(next, { replace: true })
  }

  const hiddenForIndustryCount = useMemo(() => {
    if (!hiddenThreats.length || !industry) return 0
    // eslint-disable-next-line security/detect-object-injection
    const threatIndustryNames = ASSESS_TO_THREATS_INDUSTRY[industry] ?? []
    const industryThreatIds = new Set(
      threatsData.filter((t) => threatIndustryNames.includes(t.industry)).map((t) => t.threatId)
    )
    return hiddenThreats.filter((id) => industryThreatIds.has(id)).length
  }, [industry, hiddenThreats, threatsData])

  const [showFullReport, setShowFullReport] = useState(false)
  const [methodologyOpen, setMethodologyOpen] = useState(false)
  const [showBoardBrief, setShowBoardBrief] = useState(false)
  const [roiSummary, setRoiSummary] = useState<ROISummary | null>(null)

  /** Config-driven section state resolver. */
  const cfg = (sectionId: ReportSectionId) =>
    getReportSectionConfig(selectedPersona, sectionId, showFullReport)

  /** Whether the current persona has any hidden sections (enables summary/full toggle). */
  const hasSummaryMode = useMemo(() => {
    if (!selectedPersona) return false
    return REPORT_SECTION_ORDER.some(
      (id) => getReportSectionConfig(selectedPersona, id).state === 'hidden'
    )
  }, [selectedPersona, REPORT_SECTION_ORDER])

  /** Top migrate catalog products relevant to this assessment's industry + infrastructure. */
  const relevantSoftware = useMemo(() => {
    if (!industry || !softwareData?.length) return []
    const industryLower = industry.toLowerCase()
    const hiddenSet = new Set(hiddenProducts)
    return softwareData
      .filter((item) => {
        // Respect migrate page selections
        const key = item.productId
        if (hiddenSet.has(key)) return false
        const industryMatch = item.targetIndustries.toLowerCase().includes(industryLower)
        const infraMatch = (infrastructure ?? []).some((i) =>
          item.infrastructureLayer.toLowerCase().includes(i.toLowerCase().split(' ')[0])
        )
        const hasPqcSupport = item.pqcSupport.toLowerCase() !== 'none' && item.pqcSupport !== ''
        return (industryMatch || infraMatch) && hasPqcSupport
      })
      .sort((a, b) => {
        const order: Record<string, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 }
        return (order[a.pqcMigrationPriority] ?? 3) - (order[b.pqcMigrationPriority] ?? 3)
      })
      .slice(0, 5)
  }, [industry, infrastructure, hiddenProducts])

  /** Check if a given route is visible for the current persona's nav */
  const isPathVisible = (path: string): boolean => {
    if (!selectedPersona) return true
    const personaPaths = PERSONA_NAV_PATHS[selectedPersona]
    if (personaPaths === null) return true // researcher sees all
    const basePath = '/' + path.split('/').filter(Boolean)[0]
    return ALWAYS_VISIBLE_PATHS.includes(basePath) || personaPaths.includes(basePath)
  }

  // The true quick/full signal. NOT `result.categoryScores` — the engine emits
  // COARSE category scores even on the legacy/quick path (to feed the sim & KPIs),
  // so categoryScores is always present and can't distinguish the tracks. The
  // assessment profile mode is derived from `hasExtendedInput`, so it is the
  // honest gate for the locked/upgrade tiering.
  const isComprehensive = result.assessmentProfile?.mode === 'comprehensive'

  const handlePrint = printReport

  const handleCSVExport = () => exportAlgorithmMigrationsCsv(result)

  const generatedDate = new Date(result.generatedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const generatedDateTime = new Date(result.generatedAt).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  const assessUrl = `${window.location.origin}/assess`

  return (
    <SectionExpandContext.Provider value={{ expandToken, collapseToken }}>
      <div
        className={clsx('assess-report print:max-w-none', showBoardBrief && 'exec-brief-mode')}
        data-testid="report-content-ready"
      >
        {/* Print-only repeating header (position:fixed in CSS repeats on every page) */}
        <div className="hidden print-header" aria-hidden="true">
          <span style={{ fontWeight: 600 }}>PQC Today — v{APP_VERSION}</span>
          <span>
            {industry}
            {country && country !== 'Global' ? ` | ${country}` : ''}
          </span>
          <span>{generatedDateTime}</span>
        </div>

        {/* Print-only repeating footer */}
        <div className="hidden print-footer" aria-hidden="true">
          <span>{assessUrl}</span>
          <span>{generatedDateTime}</span>
        </div>

        {/* Invisible per-page spacer table — reserves header/footer space on EVERY print page.
          Chrome ignores html { margin-top } after page 1; thead/tfoot repeat reliably per-page. */}
        <table className="print-report-table">
          <thead aria-hidden="true">
            <tr>
              <td style={{ height: '14mm', padding: 0 }} />
            </tr>
          </thead>
          <tfoot aria-hidden="true">
            <tr>
              <td style={{ height: '10mm', padding: 0 }} />
            </tr>
          </tfoot>
          <tbody>
            <tr className="print:break-inside-auto">
              <td style={{ padding: 0 }}>
                <div className="assess-report-full-content">
                  <div className="space-y-6 print:space-y-4">
                    {/* Header */}
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <p className="text-sm text-muted-foreground print:text-muted-foreground">
                          Generated on {generatedDate}
                        </p>
                        <Button
                          variant="ghost"
                          onClick={() => setMethodologyOpen(true)}
                          className="p-1 h-auto w-auto rounded-lg hover:bg-muted/30 text-muted-foreground hover:text-foreground print:hidden"
                          aria-label="How this report works"
                        >
                          <Info size={15} />
                        </Button>
                      </div>
                      <span
                        className={clsx(
                          'inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border mt-2',
                          isComprehensive
                            ? 'border-primary/30 bg-primary/10 text-primary'
                            : 'border-border bg-muted/20 text-muted-foreground'
                        )}
                      >
                        {isComprehensive ? 'Comprehensive Assessment' : 'Quick Assessment'}
                      </span>
                    </div>

                    {/* Control deck (redesign) — derived track label + persona lens.
                      Hidden on shared/example views: the persona picker mutates the
                      recipient's own global persona, which must not happen while
                      they're looking at someone else's report. */}
                    <ReportControlDeck fullTrack={isComprehensive} shared={shared} />

                    {/* Persona verdict (redesign) — re-leads the result for the active role,
                      above the "Do this first" hero. */}
                    <ReportVerdictBlock persona={selectedPersona} result={result} />

                    {/* Fast-track upgrade nudge (redesign) — quick assessments only; ties the
                      locked sections to one clear unlock path. Suppressed on shared/example
                      views — a recipient shouldn't be prompted to finish someone else's
                      assessment. */}
                    {!isComprehensive && <ReportUpgradeNudge shared={shared} />}

                    {/* Top-3 actions hero (P15-P1-02) — teases the highest-priority
                      recommended actions before the full report scroll. Hidden in print. */}
                    {result.recommendedActions.length > 0 && (
                      <div className="print:hidden">
                        <TopThreeActions
                          source="report"
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
                            href: a.relatedModule
                              ? `/learn/${a.relatedModule}`
                              : '#report-section-recommendedActions',
                          }))}
                        />
                      </div>
                    )}

                    {/* CSWP.39 navigation legend — re-groups report sections under the 5-step
                      narrative shared with /business and /assess. Hidden in print. */}
                    <ReportCswp39Nav />

                    {/* Phase overlay header — only when `?phase=` is active. Names the
                      Applied Quantum phase the report is narrowed to and offers a
                      clear affordance back to the full report. Hidden in print. */}
                    {activePhaseDef && (
                      <div
                        className="glass-panel p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 print:hidden border-l-4 border-l-primary"
                        data-testid="report-phase-header"
                      >
                        <div className="flex items-start gap-2 text-sm">
                          <Filter size={16} className="text-primary shrink-0 mt-0.5" />
                          <div>
                            <span className="font-semibold text-foreground">
                              {activePhaseDef.number !== null
                                ? `Phase ${activePhaseDef.number} — ${activePhaseDef.name}`
                                : activePhaseDef.name}
                            </span>
                            <span className="block text-xs text-muted-foreground">
                              {activePhaseDef.tagline} · showing the report sections for this phase
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={clearPhase}
                          className="text-xs min-h-[44px] md:h-7 md:min-h-0 px-3 border border-border whitespace-nowrap gap-1.5"
                          aria-label="Clear phase filter and show the full report"
                        >
                          <X size={12} />
                          Clear phase
                        </Button>
                      </div>
                    )}

                    {/* Summary / full report toggle (shown when persona hides sections) */}
                    {hasSummaryMode && !showFullReport && (
                      <div className="glass-panel p-3 flex items-center justify-between print:hidden">
                        <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <Briefcase size={14} className="text-primary" />
                          Showing summary view
                        </span>
                        <Button
                          variant="link"
                          onClick={() => setShowFullReport(true)}
                          className="text-xs p-0 h-auto"
                        >
                          View full technical report
                        </Button>
                      </div>
                    )}
                    {hasSummaryMode && showFullReport && (
                      <div className="glass-panel p-3 flex items-center justify-between print:hidden">
                        <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <Briefcase size={14} className="text-primary" />
                          Showing full technical report
                        </span>
                        <Button
                          variant="link"
                          onClick={() => setShowFullReport(false)}
                          className="text-xs p-0 h-auto"
                        >
                          Switch to summary view
                        </Button>
                      </div>
                    )}

                    {/* Country PQC Migration Timeline */}
                    {phaseVisible('countryTimeline') &&
                      cfg('countryTimeline').state !== 'hidden' && (
                        <CountryTimelineSection
                          country={country}
                          defaultOpen={cfg('countryTimeline').state === 'open'}
                        />
                      )}

                    {/* B+ remediation 4.4 (2026-08-10): a report produced from
                        a REFERENCE ESTATE says so, at the top, before any
                        number. The report is exportable and an exported PDF has
                        no memory of how it was made — without this a scenario
                        run would eventually be quoted as a finding about a real
                        organisation. Not dismissible, for the same reason. */}
                    {scenarioEstate && (
                      <div className="rounded-lg border border-status-warning/40 bg-status-warning/10 p-3">
                        <p className="text-sm font-semibold text-foreground">
                          Reference estate: {scenarioEstate.label}
                        </p>
                        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                          {scenarioEstate.caveat}
                        </p>
                        <p className="mt-1 text-xs leading-relaxed text-muted-foreground/80">
                          {scenarioEstate.basis}
                        </p>
                      </div>
                    )}

                    {/* Risk Score */}
                    {phaseVisible('riskScore') && (
                      <RiskScoreSection
                        result={result}
                        previousRiskScore={previousRiskScore}
                        lastModifiedAt={lastModifiedAt}
                        defaultOpen={cfg('riskScore').state === 'open'}
                        industry={industry}
                      />
                    )}

                    {/* Quantum Readiness Assessment (QRA) — the framework's
                        communicate artifact (spec §6.1; Report #1). Phase 3.
                        Additive: only renders when an assessment exists (input
                        present) and respects the `?phase=` overlay. Skipped on a
                        shared/example view: `getInput()` is always the RECIPIENT's
                        own live input, which would mismatch a sender's `result`. */}
                    {!shared &&
                      matches('p3') &&
                      getInput() &&
                      (() => {
                        const qraInput = getInput()
                        return qraInput ? <QRASection input={qraInput} result={result} /> : null
                      })()}

                    {/* Key Findings */}
                    {phaseVisible('keyFindings') &&
                      result.keyFindings &&
                      result.keyFindings.length > 0 &&
                      cfg('keyFindings').state !== 'hidden' && (
                        <KeyFindingsSection
                          keyFindings={result.keyFindings}
                          defaultOpen={cfg('keyFindings').state === 'open'}
                        />
                      )}

                    {/* Category Score Breakdown — comprehensive-only; the lock model
                        owns this section, so a quick assessment shows a locked preview
                        (redesign) instead of omitting it. */}
                    {phaseVisible('riskBreakdown') &&
                      (isComprehensive && result.categoryScores ? (
                        <RiskBreakdownUnlocked
                          scores={result.categoryScores}
                          drivers={result.categoryDrivers}
                          riskScore={result.riskScore}
                          riskLevel={result.riskLevel}
                          industry={industry}
                          defaultOpen={cfg('riskBreakdown').state === 'open'}
                        />
                      ) : (
                        <RiskBreakdownLocked />
                      ))}

                    {/* Framework Risk Lens (Applied Quantum P3) — derived alongside the categories */}
                    {phaseVisible('riskBreakdown') &&
                      result.frameworkRisk &&
                      cfg('riskBreakdown').state !== 'hidden' && (
                        <FrameworkRiskLensSection frameworkRisk={result.frameworkRisk} />
                      )}

                    {/* Executive Summary */}
                    {phaseVisible('executiveSummary') &&
                      result.executiveSummary &&
                      cfg('executiveSummary').state !== 'hidden' && (
                        <ExecutiveSummarySection
                          executiveSummary={result.executiveSummary}
                          defaultOpen={cfg('executiveSummary').state === 'open'}
                        />
                      )}

                    {/* Assessment Profile */}
                    {phaseVisible('assessmentProfile') &&
                      result.assessmentProfile &&
                      cfg('assessmentProfile').state !== 'hidden' && (
                        <div id="report-section-assessmentProfile">
                          <AssessmentProfileSummary
                            profile={result.assessmentProfile}
                            defaultOpen={cfg('assessmentProfile').state === 'open'}
                          />
                        </div>
                      )}

                    {/* Consolidated HNDL / HNFL Risk Windows */}
                    {phaseVisible('hndlHnfl') &&
                      (result.hndlRiskWindow || result.tnflRiskWindow) &&
                      cfg('hndlHnfl').state !== 'hidden' && (
                        <HndlHnflWindowsSection
                          hndl={result.hndlRiskWindow}
                          hnfl={result.tnflRiskWindow}
                          defaultOpen={cfg('hndlHnfl').state === 'open'}
                        />
                      )}

                    {/* HNDL warning for quick assessments with high sensitivity */}
                    {!isComprehensive &&
                      !result.hndlRiskWindow &&
                      ((dataSensitivity ?? []).includes('critical') ||
                        (dataSensitivity ?? []).includes('high')) && <HndlNotQuantifiedWarning />}

                    {/* HNFL warning for quick assessments with signing algorithms */}
                    {!isComprehensive && !result.tnflRiskWindow && hasSigningAlgos && (
                      <HnflNotQuantifiedWarning />
                    )}

                    {/* Cryptographic Discovery */}
                    {phaseVisible('discovery') &&
                      cfg('discovery').state !== 'hidden' &&
                      result.assessmentProfile && (
                        <DiscoverySection
                          algorithmsSelected={result.assessmentProfile.algorithmsSelected}
                          algorithmCategories={result.assessmentProfile.algorithmCategories}
                          algorithmUnknown={result.assessmentProfile.algorithmUnknown}
                          defaultOpen={cfg('discovery').state === 'open'}
                        />
                      )}

                    {/* Cryptographic Bill of Materials (CBOM) — the Communicate
                        expression of Phase 2 (frameworkPhases.ts p2). Reads its
                        own saved artifact rather than assessment `result`, so it
                        isn't gated on `result.assessmentProfile` like Discovery. */}
                    {phaseVisible('cbom') && cfg('cbom').state !== 'hidden' && (
                      <CbomSection defaultOpen={cfg('cbom').state === 'open'} />
                    )}

                    {/* Algorithm Migration Matrix */}
                    {phaseVisible('algorithmMigration') &&
                      result.algorithmMigrations.length > 0 &&
                      cfg('algorithmMigration').state !== 'hidden' && (
                        <AlgorithmMigrationSection
                          algorithmMigrations={result.algorithmMigrations}
                          migrationEffort={result.migrationEffort}
                          industry={industry}
                          defaultOpen={cfg('algorithmMigration').state === 'open'}
                        />
                      )}

                    {/* Compliance Impact */}
                    {phaseVisible('complianceImpact') &&
                      result.complianceImpacts.length > 0 &&
                      cfg('complianceImpact').state !== 'hidden' && (
                        <ComplianceImpactSection
                          complianceImpacts={result.complianceImpacts}
                          industry={industry}
                          country={country}
                          defaultOpen={cfg('complianceImpact').state === 'open'}
                        />
                      )}

                    {/* Recommended Actions */}
                    {phaseVisible('recommendedActions') &&
                      cfg('recommendedActions').state !== 'hidden' && (
                        <RecommendedActionsSection
                          recommendedActions={result.recommendedActions}
                          maxItems={cfg('recommendedActions').maxItems}
                          industry={industry}
                          relevantSoftware={relevantSoftware}
                          isPathVisible={isPathVisible}
                          defaultOpen={cfg('recommendedActions').state === 'open'}
                        />
                      )}

                    {/* Migration Roadmap */}
                    {phaseVisible('migrationRoadmap') &&
                      cfg('migrationRoadmap').state !== 'hidden' && (
                        <div id="report-section-migrationRoadmap">
                          <MigrationRoadmap
                            actions={result.recommendedActions}
                            countryName={country || undefined}
                            defaultOpen={cfg('migrationRoadmap').state === 'open'}
                          />
                        </div>
                      )}

                    {/* Migration Toolkit — products from Migrate catalog */}
                    {phaseVisible('migrationToolkit') &&
                      cfg('migrationToolkit').state !== 'hidden' && (
                        <div id="report-section-migrationToolkit">
                          <MigrationToolkit
                            assessmentInfrastructure={infrastructure}
                            assessmentSubCategories={infrastructureSubCategories}
                            assessmentIndustry={industry}
                            defaultOpen={cfg('migrationToolkit').state === 'open'}
                          />
                        </div>
                      )}

                    {/* Third-Party & Vendor PQC Risk */}
                    {phaseVisible('vendorRisk') &&
                      cfg('vendorRisk').state !== 'hidden' &&
                      result.assessmentProfile && (
                        <VendorRiskSection
                          vendorDependency={result.assessmentProfile.vendorDependency}
                          vendorUnknown={result.assessmentProfile.vendorUnknown}
                          relevantSoftware={relevantSoftware}
                          defaultOpen={cfg('vendorRisk').state === 'open'}
                          quickTrack={!isComprehensive}
                        />
                      )}

                    {/* ROI Calculator */}
                    <ROICalculatorSection
                      result={result}
                      industry={industry}
                      defaultOpen={false}
                      onSummaryChange={setRoiSummary}
                      infoTip={<SectionInfoTip sectionId="roiCalculator" />}
                      quickTrack={!isComprehensive}
                    />

                    {/* KPI Trending — comprehensive-gated. Three states: locked on a
                        quick assessment, empty until ≥2 saved snapshots, populated
                        otherwise. */}
                    <div id="report-section-kpiTrending">
                      {isComprehensive ? (
                        assessmentHistory.length >= 2 ? (
                          <KPITrendingSection
                            history={assessmentHistory}
                            currentResult={result}
                            defaultOpen={false}
                          />
                        ) : (
                          <KpiEmptyState />
                        )
                      ) : (
                        <ReportLockedOverlay
                          reason="Track your risk score over time"
                          detail="Progress trends come from saved comprehensive assessments. Finish the full assessment to start tracking your risk score and crypto-agility over time."
                        >
                          <KpiPreviewSkeleton />
                        </ReportLockedOverlay>
                      )}
                    </div>

                    {/* Industry Threat Landscape */}
                    {phaseVisible('threatLandscape') &&
                      cfg('threatLandscape').state !== 'hidden' && (
                        <ThreatLandscapeSection
                          industry={industry}
                          currentCrypto={currentCrypto}
                          hiddenThreats={hiddenThreats}
                          hideThreat={hideThreat}
                          restoreAllThreats={restoreAllThreats}
                          hiddenForIndustryCount={hiddenForIndustryCount}
                          defaultOpen={cfg('threatLandscape').state === 'open'}
                        />
                      )}

                    {/* Simulation Outcomes — Wave 5 (WP5.1). Reads its own saved
                        artifact (the sim-roadmap doc), same independent-fetch
                        pattern as CbomSection above. */}
                    {phaseVisible('simulationOutcomes') &&
                      cfg('simulationOutcomes').state !== 'hidden' && (
                        <SimulationOutcomesSection
                          defaultOpen={cfg('simulationOutcomes').state === 'open'}
                        />
                      )}

                    {/* NICE Framework Workforce Gap Report. Skipped on a shared/example
                        view for the same reason as QRA above — `getInput()` is the
                        recipient's own live input, not the sender's. */}
                    {!shared && getInput() && (
                      <div id="report-section-niceGap" className="print:break-before-page">
                        <CollapsibleSection
                          title="NICE Framework Workforce Gap Report"
                          icon={<GraduationCap className="text-primary" size={20} />}
                          defaultOpen={false}
                        >
                          <NiceGapReportSection result={result} input={getInput()!} />
                        </CollapsibleSection>
                      </div>
                    )}

                    {/* Cross-view CTAs: Persona-specific next steps */}
                    {selectedPersona && PERSONAS[selectedPersona] && (
                      <div className="glass-panel p-4 print:hidden">
                        <p className="text-sm font-medium text-foreground mb-3">
                          Continue your PQC journey
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          {(PERSONA_REPORT_CTAS[selectedPersona] ?? []).map((cta: ReportCTA) => {
                            const Icon = CTA_ICONS[cta.icon] ?? BookOpen
                            return (
                              <Link
                                key={cta.label}
                                to={cta.path}
                                data-action={
                                  cta.path === '/business' ? 'visit-business-center' : undefined
                                }
                                className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
                              >
                                <Icon size={16} className="shrink-0" />
                                {cta.label}
                              </Link>
                            )
                          })}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          {PERSONAS[selectedPersona].label} learning path —{' '}
                          {PERSONAS[selectedPersona].recommendedPath.length - 1} modules, ~
                          {Math.round(PERSONAS[selectedPersona].estimatedMinutes / 60)} hours
                        </p>
                      </div>
                    )}

                    {/* Hidden-by-role footer (P15-P1-05) — surfaces sections this
                        persona is currently hiding, with a click-to-show toggle. */}
                    {selectedPersona &&
                      hasSummaryMode &&
                      !showFullReport &&
                      (() => {
                        const hidden = REPORT_SECTION_ORDER.filter(
                          (id) => getReportSectionConfig(selectedPersona, id).state === 'hidden'
                        )
                        if (hidden.length === 0) return null
                        return (
                          <div className="glass-panel p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 print:hidden border-l-4 border-l-muted-foreground/30">
                            <div className="text-xs text-muted-foreground leading-relaxed">
                              <span className="font-medium text-foreground">
                                {hidden.length} section{hidden.length !== 1 ? 's' : ''} hidden
                              </span>{' '}
                              for your {PERSONAS[selectedPersona].label} view:{' '}
                              <span className="italic">
                                {hidden.map((id) => REPORT_SECTION_LABELS[id] ?? id).join(' · ')}
                              </span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setShowFullReport(true)}
                              className="text-xs min-h-[44px] md:h-7 md:min-h-0 px-3 border border-border whitespace-nowrap"
                            >
                              Show full report
                            </Button>
                          </div>
                        )
                      })()}

                    {/* Migration Workflow activation CTA — starts the RECIPIENT's own
                      workflow, so it must not appear while they're looking at someone
                      else's shared/example report. */}
                    {!shared && !workflowActive && assessmentStatus === 'complete' && (
                      <div className="glass-panel p-4 print:hidden">
                        <div className="mt-0 pt-0 border-t border-border">
                          <Button
                            variant="gradient"
                            onClick={startWorkflow}
                            className="w-full sm:w-auto"
                          >
                            <Compass size={16} className="mr-2" />
                            Start Migration Planning Workflow
                          </Button>
                          <p className="text-xs text-muted-foreground mt-2">
                            Guided 4-step workflow: Assess → Comply → Migrate → Timeline
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col items-center gap-2 print:hidden">
                      <div className="flex flex-wrap items-center justify-center gap-3">
                        <Button
                          variant="ghost"
                          onClick={handlePrint}
                          className="gap-2 border border-border rounded-lg text-muted-foreground hover:text-foreground hover:border-primary/30"
                        >
                          <Printer size={16} />
                          Print / Save as PDF
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => {
                            flushSync(() => setShowBoardBrief(true))
                            window.print()
                            setShowBoardBrief(false)
                          }}
                          className="gap-2 border border-border rounded-lg text-muted-foreground hover:text-foreground hover:border-primary/30"
                        >
                          <Briefcase size={16} />
                          Print Executive Brief
                        </Button>
                        <BoardPackExport result={result} variant="outline" />
                        <Button
                          variant="ghost"
                          onClick={handleCSVExport}
                          className="gap-2 border border-border rounded-lg text-muted-foreground hover:text-foreground hover:border-primary/30"
                        >
                          <Download size={16} />
                          Export CSV
                        </Button>
                        {/* Edit/Reset act on the RECIPIENT's own store — hidden on a
                          shared/example view since there's no "your answers" here to
                          edit or reset. */}
                        {!shared && (
                          <>
                            <Button
                              variant="ghost"
                              onClick={() => {
                                editFromStep(0)
                                navigate('/assess')
                              }}
                              className="gap-2 border border-border rounded-lg text-muted-foreground hover:text-foreground hover:border-primary/30"
                            >
                              <Pencil size={16} />
                              Edit Answers
                            </Button>
                            <Button
                              variant="ghost"
                              onClick={() => {
                                reset()
                                navigate('/assess')
                              }}
                              className="gap-2 border border-border rounded-lg text-muted-foreground hover:text-foreground hover:border-primary/30"
                            >
                              <RotateCcw size={16} />
                              Start Over
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <BoardBriefSection
                  result={result}
                  industry={industry}
                  country={country}
                  roiSummary={roiSummary}
                  generatedAt={result.generatedAt}
                  visible={showBoardBrief}
                  ownership={ownership}
                />
              </td>
            </tr>
          </tbody>
        </table>

        <ReportMethodologyModal
          isOpen={methodologyOpen}
          onClose={() => setMethodologyOpen(false)}
        />
      </div>
    </SectionExpandContext.Provider>
  )
}
