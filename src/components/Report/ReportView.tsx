// SPDX-License-Identifier: GPL-3.0-only
import React, { useEffect, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FileBarChart, ClipboardCheck, AlertCircle, ArrowRight } from 'lucide-react'
import { ReportContent } from './ReportContent'
import { useAssessmentStore } from '../../store/useAssessmentStore'
import { computeAssessment } from '../../hooks/assessmentUtils'
import { useModuleStore } from '../../store/useModuleStore'
import { useWorkflowPhaseTracker } from '@/hooks/useWorkflowPhaseTracker'
import { REGION_COUNTRIES_MAP } from '../../data/personaConfig'
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

export const ReportView: React.FC = () => {
  const { assessmentStatus, getInput, setResult, lastResult } = useAssessmentStore()
  useWorkflowPhaseTracker('assess')
  const input = getInput()
  const result =
    (assessmentStatus === 'complete' || assessmentStatus === 'in-progress') && input
      ? computeAssessment(input)
      : assessmentStatus === 'complete' && lastResult
        ? lastResult
        : null
  const persistedRef = useRef(false)
  const [searchParams] = useSearchParams()
  const hydratedRef = useRef(false)

  // Hydrate store from shared URL params on first mount
  useEffect(() => {
    if (hydratedRef.current) return
    const industry = searchParams.get('i')
    if (!industry) return
    hydratedRef.current = true

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

  // Empty state: no assessment started and no persisted result
  if (!result) {
    return (
      <div className="animate-fade-in">
        <div className="max-w-lg mx-auto text-center py-16">
          <div className="inline-flex items-center justify-center p-4 rounded-full bg-muted mb-6">
            <FileBarChart className="text-muted-foreground" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-3">No Report Yet</h1>
          <p className="text-muted-foreground mb-6">
            Complete the PQC Risk Assessment to generate your personalized report with risk scores,
            migration priorities, and actionable recommendations.
          </p>
          <Link
            to="/assess"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-secondary to-primary text-primary-foreground font-bold hover:opacity-90 hover:-translate-y-0.5 transition-all duration-200"
          >
            <ClipboardCheck size={18} />
            Start Assessment
            <ArrowRight size={16} />
          </Link>
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
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-gradient-to-r from-secondary to-primary text-primary-foreground rounded-lg hover:opacity-90 hover:-translate-y-0.5 transition-all duration-200 shrink-0"
            >
              Complete Assessment
              <ArrowRight size={12} />
            </Link>
          </div>
        </motion.div>
      )}

      {result ? (
        <ReportContent result={result} />
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
