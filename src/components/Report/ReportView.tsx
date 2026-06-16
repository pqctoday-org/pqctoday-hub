// SPDX-License-Identifier: GPL-3.0-only
import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FileBarChart, ClipboardCheck, AlertCircle, ArrowRight } from 'lucide-react'
import { ReportContent } from './ReportContent'
import { ReportToc } from './ReportToc'
import { useAssessmentStore } from '../../store/useAssessmentStore'
import { computeAssessment } from '../../hooks/assessmentUtils'
import { computeAssessmentAsync } from '../../hooks/assessment/orchestrator'
import {
  WorkshopOperationLog,
  type LogEntry,
} from '@/components/PKILearning/common/WorkshopOperationLog'
import { useModuleStore } from '../../store/useModuleStore'
import { useWorkflowPhaseTracker } from '@/hooks/useWorkflowPhaseTracker'
import { REGION_COUNTRIES_MAP, getReportSectionConfig } from '../../data/personaConfig'
import type { ReportSectionId } from '../../data/personaConfig'
import { REPORT_SECTION_LABELS } from '../../data/reportSectionToCswp39'
import {
  AVAILABLE_INDUSTRIES,
  AVAILABLE_ALGORITHMS,
  AVAILABLE_COMPLIANCE,
  AVAILABLE_USE_CASES,
  AVAILABLE_INFRASTRUCTURE,
} from '../../hooks/assessmentData'
import type { AssessmentInput } from '../../hooks/assessmentTypes'
import { PageHeader } from '../common/PageHeader'
import { WorkflowBreadcrumb } from '../shared/WorkflowBreadcrumb'
import { logReportViewed, logReportShareLinkOpened, logReportCta } from '@/utils/analytics'
import { EXAMPLE_REPORT_URL } from '@/data/exampleReport'
import { PersonaSuggestionCard } from '@/components/Assess/PersonaSuggestionCard'
import { MaturitySummaryCard } from '@/components/Assess/MaturitySummaryCard'
import { getBeltTierLabel } from '@/data/personaConfig'
import { useAwarenessScore } from '@/hooks/useAwarenessScore'
import { decodeShareToken } from '@/utils/reportShareToken'
import { usePersonaStore } from '@/store/usePersonaStore'

const VALID_SENSITIVITIES = new Set(['low', 'medium', 'high', 'critical'])
const VALID_MIGRATIONS = new Set(['started', 'planning', 'not-started', 'unknown'])
const VALID_RETENTION = new Set(['under-1y', '1-5y', '5-10y', '10-25y', '25-plus', 'indefinite'])
const VALID_SYSTEM_COUNT = new Set(['1-10', '11-50', '51-200', '200-plus'])
const VALID_TEAM_SIZE = new Set(['1-10', '11-50', '51-200', '200-plus'])
const VALID_AGILITY = new Set(['fully-abstracted', 'partially-abstracted', 'hardcoded', 'unknown'])
const VALID_VENDOR = new Set(['heavy-vendor', 'open-source', 'mixed', 'in-house'])
const VALID_PRESSURE = new Set([
  'within-1y',
  'within-2-3y',
  'internal-deadline',
  'no-deadline',
  'unknown',
])
const VALID_INDUSTRIES = new Set(AVAILABLE_INDUSTRIES)
const VALID_ALGORITHMS = new Set(AVAILABLE_ALGORITHMS)
const VALID_COMPLIANCE = new Set(AVAILABLE_COMPLIANCE)
const VALID_USE_CASES = new Set(AVAILABLE_USE_CASES)
const VALID_INFRA = new Set(AVAILABLE_INFRASTRUCTURE)
const VALID_COUNTRIES = new Set(Object.values(REGION_COUNTRIES_MAP).flat())

const REPORT_SECTION_ORDER: ReportSectionId[] = [
  'countryTimeline',
  'riskScore',
  'keyFindings',
  'riskBreakdown',
  'executiveSummary',
  'assessmentProfile',
  'hndlHnfl',
  'algorithmMigration',
  'complianceImpact',
  'recommendedActions',
  'migrationRoadmap',
  'migrationToolkit',
  'threatLandscape',
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

export const ReportView: React.FC = () => {
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

  const result = computeState.result
  const reportComputing = computeState.computing
  const reportLogEntries = computeState.log
  const persistedRef = useRef(false)
  const [searchParams] = useSearchParams()

  const [expandToken, setExpandToken] = useState(0)
  const [collapseToken, setCollapseToken] = useState(0)
  const handleExpandAll = useCallback(() => setExpandToken((t) => t + 1), [])
  const handleCollapseAll = useCallback(() => setCollapseToken((t) => t + 1), [])

  const selectedPersona = usePersonaStore((s) => s.selectedPersona)
  const tocSections = useMemo(
    () =>
      REPORT_SECTION_ORDER.filter(
        (id) => getReportSectionConfig(selectedPersona, id).state !== 'hidden'
      ).map((id) => ({ id: `report-section-${id}`, label: REPORT_SECTION_LABELS[id] })),
    [selectedPersona]
  )
  const hydratedRef = useRef(false)

  // Hydrate store from shared URL params on first mount
  useEffect(() => {
    if (hydratedRef.current) return

    // New compact token path: ?share=<base64token>
    const shareToken = searchParams.get('share')
    if (shareToken) {
      hydratedRef.current = true
      const schema = decodeShareToken(shareToken)
      if (schema) {
        logReportShareLinkOpened()
        const store = useAssessmentStore.getState()
        if (schema.industry && VALID_INDUSTRIES.has(schema.industry))
          store.setIndustry(schema.industry)
        if (schema.country && VALID_COUNTRIES.has(schema.country)) store.setCountry(schema.country)
        if (schema.currentCrypto) {
          schema.currentCrypto
            .filter((a) => VALID_ALGORITHMS.has(a))
            .forEach((a) => {
              if (!store.currentCrypto.includes(a)) store.toggleCrypto(a)
            })
        }
        if (schema.dataSensitivity) {
          schema.dataSensitivity
            .filter((s) => VALID_SENSITIVITIES.has(s))
            .forEach((s) => {
              if (!store.dataSensitivity.includes(s)) store.toggleDataSensitivity(s)
            })
        }
        if (schema.complianceRequirements) {
          schema.complianceRequirements
            .filter((f) => VALID_COMPLIANCE.has(f))
            .forEach((f) => {
              if (!store.complianceRequirements.includes(f)) store.toggleCompliance(f)
            })
        }
        if (schema.migrationStatus && VALID_MIGRATIONS.has(schema.migrationStatus)) {
          store.setMigrationStatus(schema.migrationStatus as AssessmentInput['migrationStatus'])
        }
        if (schema.persona) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          usePersonaStore.getState().setPersona(schema.persona as any)
        }
        store.setAssessmentMode('comprehensive')
        store.markComplete()
      }
      return
    }

    // Legacy individual-param path: ?i=&cy=&c=&d=&f=&m=…
    const industry = searchParams.get('i')
    if (!industry) return
    hydratedRef.current = true
    logReportShareLinkOpened()

    const store = useAssessmentStore.getState()
    if (VALID_INDUSTRIES.has(industry)) store.setIndustry(industry)

    const countryParam = searchParams.get('cy')
    if (countryParam) {
      const decoded = decodeURIComponent(countryParam)
      if (VALID_COUNTRIES.has(decoded)) store.setCountry(decoded)
    }

    const crypto = searchParams.get('c')
    if (crypto) {
      crypto
        .split(',')
        .filter((a) => VALID_ALGORITHMS.has(a))
        .forEach((a) => {
          if (!store.currentCrypto.includes(a)) store.toggleCrypto(a)
        })
    }

    const sensitivity = searchParams.get('d')
    if (sensitivity) {
      sensitivity
        .split(',')
        .filter((s) => VALID_SENSITIVITIES.has(s))
        .forEach((s) => {
          if (!store.dataSensitivity.includes(s)) store.toggleDataSensitivity(s)
        })
    }

    const frameworks = searchParams.get('f')
    if (frameworks) {
      frameworks
        .split(',')
        .filter((f) => VALID_COMPLIANCE.has(f))
        .forEach((f) => {
          if (!store.complianceRequirements.includes(f)) store.toggleCompliance(f)
        })
    }

    const migration = searchParams.get('m')
    if (migration && VALID_MIGRATIONS.has(migration)) {
      if (migration === 'unknown') {
        store.setMigrationUnknown(true)
      } else {
        store.setMigrationStatus(migration as AssessmentInput['migrationStatus'])
      }
    }

    const useCases = searchParams.get('u')
    if (useCases) {
      useCases
        .split(',')
        .filter((uc) => VALID_USE_CASES.has(uc))
        .forEach((uc) => {
          if (!store.cryptoUseCases.includes(uc)) store.toggleCryptoUseCase(uc)
        })
    }

    const retention = searchParams.get('r')
    if (retention) {
      retention
        .split(',')
        .filter((v) => VALID_RETENTION.has(v))
        .forEach((v) => {
          if (!store.dataRetention.includes(v)) store.toggleDataRetention(v)
        })
    }

    const sysCount = searchParams.get('s')
    if (sysCount && VALID_SYSTEM_COUNT.has(sysCount)) {
      store.setSystemCount(sysCount as NonNullable<AssessmentInput['systemCount']>)
    }

    const tSize = searchParams.get('t')
    if (tSize && VALID_TEAM_SIZE.has(tSize)) {
      store.setTeamSize(tSize as NonNullable<AssessmentInput['teamSize']>)
    }

    const agility = searchParams.get('a')
    if (agility && VALID_AGILITY.has(agility)) {
      if (agility === 'unknown') {
        store.setAgilityUnknown(true)
      } else {
        store.setCryptoAgility(agility as NonNullable<AssessmentInput['cryptoAgility']>)
      }
    }

    const infra = searchParams.get('n')
    if (infra) {
      infra
        .split(',')
        .filter((item) => VALID_INFRA.has(item))
        .forEach((item) => {
          if (!store.infrastructure.includes(item)) store.toggleInfrastructure(item)
        })
    }

    const vendor = searchParams.get('v')
    if (vendor && VALID_VENDOR.has(vendor)) {
      store.setVendorDependency(vendor as NonNullable<AssessmentInput['vendorDependency']>)
    }

    const pressure = searchParams.get('p')
    if (pressure && VALID_PRESSURE.has(pressure)) {
      if (pressure === 'unknown') {
        store.setTimelineUnknown(true)
      } else {
        store.setTimelinePressure(pressure as NonNullable<AssessmentInput['timelinePressure']>)
      }
    }

    store.setAssessmentMode('comprehensive')
    store.markComplete()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Persist result and mark module complete
  useEffect(() => {
    if (assessmentStatus === 'not-started') {
      persistedRef.current = false
      return
    }
    if (result && !persistedRef.current) {
      persistedRef.current = true
      logReportViewed(useAssessmentStore.getState().industry, result.riskLevel)
      setResult(result)
      if (assessmentStatus === 'complete' && result.categoryScores) {
        const store = useAssessmentStore.getState()
        store.pushSnapshot({
          completedAt: store.completedAt ?? result.generatedAt,
          riskScore: result.riskScore,
          categoryScores: result.categoryScores,
          riskLevel: result.riskLevel,
          industry: store.industry,
          preBoostScore: result.preBoostScore,
          boosts: result.boosts,
        })
      }
    }
  }, [assessmentStatus, result, setResult])

  useEffect(() => {
    if (assessmentStatus !== 'complete') return
    useModuleStore.getState().updateModuleProgress('assess', {
      status: 'completed',
      completedSteps: ['assessment-completed'],
    })
  }, [assessmentStatus])

  // Active compute state: assessment exists, result still pending. Show
  // the progress log so users see the 10-stage pipeline grinding rather
  // than a blank page or stale spinner.
  if (!result && reportComputing) {
    return (
      <div className="animate-fade-in">
        <div className="max-w-xl mx-auto py-12">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center p-4 rounded-full bg-muted mb-4">
              <FileBarChart className="text-primary" size={28} />
            </div>
            <h1 className="text-xl font-bold text-foreground mb-2">Generating your report…</h1>
            <p className="text-sm text-muted-foreground">
              Running the 10-stage scoring pipeline. This takes 0.5–2 seconds on most machines.
            </p>
          </div>
          <WorkshopOperationLog entries={reportLogEntries} className="max-h-72" />
        </div>
      </div>
    )
  }

  // Empty state: no assessment started and no persisted result
  if (!result) {
    const isCurious = selectedPersona === 'curious'
    return (
      <div className="animate-fade-in">
        <div className="max-w-lg mx-auto text-center py-16">
          <div className="inline-flex items-center justify-center p-4 rounded-full bg-muted mb-6">
            <FileBarChart className="text-muted-foreground" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-3">No Report Yet</h1>
          <p className="text-muted-foreground mb-6">
            {isCurious
              ? 'Curious what a finished report looks like? Browse an example before committing to the assessment — or jump straight in.'
              : 'Complete the PQC Risk Assessment to generate your personalized report with risk scores, migration priorities, and actionable recommendations.'}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {isCurious && (
              <Link
                to={EXAMPLE_REPORT_URL}
                onClick={() => logReportCta('view-example')}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-border bg-card text-foreground font-medium hover:border-primary/40 hover:bg-muted transition-colors"
              >
                <FileBarChart size={16} />
                See an example report
              </Link>
            )}
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
      <WorkflowBreadcrumb current="report" />
      <PageHeader
        icon={FileBarChart}
        pageId="report"
        title="PQC Assessment Report"
        description="Your personalized post-quantum cryptography risk report with scores, priorities, and recommendations."
        shareTitle="PQC Assessment Report — Post-Quantum Cryptography Risk Analysis"
        shareText="View your personalized PQC risk score, migration priorities, and actionable recommendations."
      />

      <MaturityTierChip />

      <MaturitySummaryCard />

      <PersonaSuggestionCard />

      {/* Banner when viewing a shared report */}
      {searchParams.get('share') && (
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

      {/* Banner when assessment is in-progress */}
      {assessmentStatus === 'in-progress' && (
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

      {result ? (
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
            />
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <p>Unable to generate report. Please complete all required fields.</p>
          <Link to="/assess" className="text-primary hover:underline mt-2 inline-block">
            Go to Assessment
          </Link>
        </div>
      )}
    </div>
  )
}

export default ReportView
