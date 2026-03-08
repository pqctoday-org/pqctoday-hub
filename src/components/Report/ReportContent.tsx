// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useMemo } from 'react'
import { flushSync } from 'react-dom'
import { Link, useNavigate } from 'react-router-dom'
import {
  Printer,
  Share2,
  RotateCcw,
  Download,
  Pencil,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  ShieldAlert,
  BarChart3,
  Briefcase,
  Calendar,
  FlaskConical,
  BookOpen,
  Info,
  Package,
  Terminal,
  Layers,
  Compass,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useAssessmentStore } from '../../store/useAssessmentStore'
import { useMigrateSelectionStore } from '../../store/useMigrateSelectionStore'
import { useMigrationWorkflowStore } from '../../store/useMigrationWorkflowStore'
import { usePersonaStore } from '../../store/usePersonaStore'
import {
  PERSONA_NAV_PATHS,
  ALWAYS_VISIBLE_PATHS,
  getReportSectionConfig,
  PERSONA_REPORT_CTAS,
} from '../../data/personaConfig'
import type { ReportSectionId, ReportCTA } from '../../data/personaConfig'
import { PERSONAS } from '../../data/learningPersonas'
import { complianceFrameworks } from '../../data/complianceData'
import { softwareData } from '../../data/migrateData'
import { ReportTimelineStrip } from './ReportTimelineStrip'
import { ReportThreatsAppendix, ASSESS_TO_THREATS_INDUSTRY } from './ReportThreatsAppendix'
import { threatsData } from '../../data/threatsData'
import { MigrationRoadmap } from './MigrationRoadmap'
import { MigrationToolkit } from './MigrationToolkit'
import { ReportMethodologyModal } from './ReportMethodologyModal'
import { SectionInfoModal } from './SectionInfoModal'
import { ROICalculatorSection } from '../shared/ROICalculatorSection'
import type { ROISummary } from '../shared/ROICalculatorSection'
import { KPITrendingSection } from './KPITrendingSection'
import { BoardBriefSection } from './BoardBriefSection'
import { Button } from '../ui/button'
import { CollapsibleSection as BaseCollapsibleSection } from '../ui/CollapsibleSection'
import { HNDLHNFLSection as SharedHNDLHNFLSection } from '../shared/HNDLHNFLSection'
import { AskAssistantButton } from '../ui/AskAssistantButton'
import clsx from 'clsx'
import type {
  AssessmentResult,
  AssessmentProfile,
  CategoryScores,
  CategoryDrivers,
  HNDLRiskWindow,
  HNFLRiskWindow,
} from '../../hooks/assessmentTypes'
import { SIGNING_ALGORITHMS } from '../../hooks/assessmentData'

declare const __APP_VERSION__: string
const APP_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.0.0'

/** Resolves icon name string to LucideIcon component for report CTAs. */
const CTA_ICONS: Record<string, LucideIcon> = {
  Share2,
  Calendar,
  BookOpen,
  FlaskConical,
  Package,
  BarChart3,
  Terminal,
  Layers,
}

/** Maps PQC replacement algorithm names to relevant Learn module paths. */
const ALGO_LEARN_LINKS: Record<string, { path: string; label: string }> = {
  'ML-KEM': { path: '/learn/pki-workshop', label: 'PKI Workshop' },
  'ML-DSA': { path: '/learn/pki-workshop', label: 'PKI Workshop' },
  'SLH-DSA': { path: '/learn/stateful-signatures', label: 'Signatures' },
  LMS: { path: '/learn/stateful-signatures', label: 'Signatures' },
  hybrid: { path: '/learn/hybrid-crypto', label: 'Hybrid Crypto' },
}
function getLearnLink(replacement: string): { path: string; label: string } | null {
  if (replacement.includes('hybrid') || replacement.includes('Hybrid'))
    return ALGO_LEARN_LINKS['hybrid']
  for (const [key, value] of Object.entries(ALGO_LEARN_LINKS)) {
    if (replacement.includes(key)) return value
  }
  return null
}

export function SectionInfoTip({ sectionId }: { sectionId: string }) {
  const [open, setOpen] = useState(false)
  return (
    <span className="relative inline-flex print:hidden">
      <Button
        variant="ghost"
        onClick={(e) => {
          e.stopPropagation()
          setOpen(true)
        }}
        className="p-1 h-auto w-auto rounded hover:bg-muted/30 text-muted-foreground hover:text-foreground"
        aria-label="Section info"
      >
        <Info size={14} />
      </Button>
      <SectionInfoModal isOpen={open} onClose={() => setOpen(false)} sectionId={sectionId} />
    </span>
  )
}

/** Report-specific wrapper that converts `infoTip` string IDs to SectionInfoTip nodes */
export function CollapsibleSection({
  infoTip,
  ...rest
}: {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
  defaultOpen?: boolean
  infoTip?: string
  className?: string
  headerExtra?: React.ReactNode
}) {
  return (
    <BaseCollapsibleSection
      {...rest}
      infoTip={infoTip ? <SectionInfoTip sectionId={infoTip} /> : undefined}
    />
  )
}

const riskConfig = {
  low: {
    color: 'text-success',
    bg: 'bg-success/10',
    border: 'border-success',
    label: 'Low Risk',
    emoji: '🟢',
  },
  medium: {
    color: 'text-warning',
    bg: 'bg-warning/10',
    border: 'border-warning',
    label: 'Medium Risk',
    emoji: '🟡',
  },
  high: {
    color: 'text-destructive',
    bg: 'bg-destructive/10',
    border: 'border-destructive',
    label: 'High Risk',
    emoji: '🔴',
  },
  critical: {
    color: 'text-destructive',
    bg: 'bg-destructive/20',
    border: 'border-destructive',
    label: 'Critical Risk',
    emoji: '⚫',
  },
}

const effortConfig = {
  low: { color: 'text-success', bg: 'bg-success/10', label: 'Low' },
  medium: { color: 'text-primary', bg: 'bg-primary/10', label: 'Medium' },
  high: { color: 'text-warning', bg: 'bg-warning/10', label: 'High' },
}

const complexityConfig = {
  low: { color: 'text-success', bg: 'bg-success/10', label: 'Low' },
  medium: { color: 'text-primary', bg: 'bg-primary/10', label: 'Medium' },
  high: { color: 'text-warning', bg: 'bg-warning/10', label: 'High' },
  critical: { color: 'text-destructive', bg: 'bg-destructive/10', label: 'Critical' },
}

const scopeConfig = {
  'quick-win': { color: 'text-success', bg: 'bg-success/10', label: 'Quick Win' },
  moderate: { color: 'text-primary', bg: 'bg-primary/10', label: 'Moderate' },
  'major-project': { color: 'text-warning', bg: 'bg-warning/10', label: 'Major Project' },
  'multi-year': { color: 'text-destructive', bg: 'bg-destructive/10', label: 'Multi-Year' },
}

const RiskGauge = ({ score, level }: { score: number; level: AssessmentResult['riskLevel'] }) => {
  // eslint-disable-next-line security/detect-object-injection
  const config = riskConfig[level]
  const angle = (score / 100) * 180 - 90 // -90 to 90 degrees

  return (
    <div className="flex flex-col items-center">
      <svg
        viewBox="0 0 200 120"
        className="w-32 h-20 md:w-48 md:h-28"
        role="img"
        aria-label={`Risk score: ${score} out of 100, rated ${config.label}`}
      >
        <title>{`Risk gauge showing score of ${score}/100`}</title>
        {/* Background arc */}
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="currentColor"
          strokeWidth="12"
          className="text-border"
          strokeLinecap="round"
        />
        {/* Colored arc */}
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="currentColor"
          strokeWidth="12"
          className={config.color}
          strokeLinecap="round"
          strokeDasharray={`${(score / 100) * 251.2} 251.2`}
        />
        {/* Needle */}
        <line
          x1="100"
          y1="100"
          x2={100 + 60 * Math.cos((angle * Math.PI) / 180)}
          y2={100 - 60 * Math.sin((angle * Math.PI) / 180)}
          stroke="currentColor"
          strokeWidth="3"
          className="text-foreground"
          strokeLinecap="round"
        />
        <circle cx="100" cy="100" r="5" fill="currentColor" className="text-foreground" />
        {/* Score text */}
        <text
          x="100"
          y="90"
          textAnchor="middle"
          className={config.color}
          fill="currentColor"
          fontSize="28"
          fontWeight="bold"
        >
          {score}
        </text>
      </svg>
      <div className={clsx('text-lg font-bold mt-1', config.color)}>
        {config.emoji} {config.label}
      </div>
    </div>
  )
}

const CategoryBreakdown = ({
  scores,
  drivers,
  defaultOpen = true,
  headerExtra,
}: {
  scores: CategoryScores
  drivers?: CategoryDrivers
  defaultOpen?: boolean
  headerExtra?: React.ReactNode
}) => {
  const categories = [
    { label: 'Quantum Exposure', key: 'quantumExposure' as const },
    { label: 'Migration Complexity', key: 'migrationComplexity' as const },
    { label: 'Regulatory Pressure', key: 'regulatoryPressure' as const },
    { label: 'Organizational Readiness', key: 'organizationalReadiness' as const },
  ]

  const getBarColor = (score: number) => {
    if (score <= 30) return 'bg-success'
    if (score <= 60) return 'bg-warning'
    return 'bg-destructive'
  }

  const getScoreColor = (score: number) => {
    if (score <= 30) return 'text-success'
    if (score <= 60) return 'text-warning'
    return 'text-destructive'
  }

  return (
    <CollapsibleSection
      title="Risk Breakdown"
      icon={<BarChart3 className="text-primary" size={20} />}
      defaultOpen={defaultOpen}
      headerExtra={headerExtra}
      infoTip="riskBreakdown"
    >
      <div className="space-y-4">
        {categories.map(({ label, key }) => {
          // eslint-disable-next-line security/detect-object-injection
          const score = scores[key]
          return (
            <div key={key}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-muted-foreground">{label}</span>
                <span className={clsx('text-sm font-bold', getScoreColor(score))}>{score}/100</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-border overflow-hidden">
                <div
                  className={clsx(
                    'h-full rounded-full transition-all duration-500',
                    getBarColor(score)
                  )}
                  style={{ width: `${score}%` }}
                  role="progressbar"
                  aria-valuenow={score}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${label}: ${score} out of 100`}
                />
              </div>
              {/* eslint-disable-next-line security/detect-object-injection */}
              {drivers?.[key] && (
                <p className="text-xs text-muted-foreground/70 mt-1 capitalize">
                  {/* eslint-disable-next-line security/detect-object-injection */}
                  {drivers[key]}
                </p>
              )}
            </div>
          )
        })}
      </div>
    </CollapsibleSection>
  )
}

const AGILITY_LABELS: Record<string, string> = {
  'fully-abstracted': 'Fully abstracted',
  'partially-abstracted': 'Partially abstracted',
  hardcoded: 'Hardcoded',
  unknown: 'Unknown',
}

const MIGRATION_STATUS_LABELS: Record<string, string> = {
  started: 'Started',
  planning: 'Planning',
  'not-started': 'Not started',
  unknown: 'Unknown',
}

const TIMELINE_LABELS: Record<string, string> = {
  'within-1y': 'Within 1 year',
  'within-2-3y': 'Within 2-3 years',
  'internal-deadline': 'Internal deadline',
  'no-deadline': 'No deadline',
  unknown: 'Unknown',
}

const ProfileField = ({ label, value }: { label: string; value: string | undefined }) => {
  if (!value) return null
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-medium">
        {label}
      </span>
      <span className="text-xs text-foreground">{value}</span>
    </div>
  )
}

const AssessmentProfileSummary = ({
  profile,
  defaultOpen = false,
}: {
  profile: AssessmentProfile
  defaultOpen?: boolean
}) => {
  return (
    <CollapsibleSection
      title="Assessment Profile"
      icon={<Briefcase className="text-primary" size={20} />}
      defaultOpen={defaultOpen}
      infoTip="assessmentProfile"
    >
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <ProfileField label="Industry" value={profile.industry} />
        <ProfileField label="Country" value={profile.country || 'Not specified'} />
        <ProfileField
          label="Algorithms"
          value={
            profile.algorithmUnknown
              ? 'Unknown (conservative defaults)'
              : profile.algorithmsSelected.length > 0
                ? `${profile.algorithmsSelected.length} selected`
                : 'None'
          }
        />
        <ProfileField
          label="Sensitivity"
          value={
            profile.sensitivityUnknown
              ? 'Unknown (assumed high)'
              : profile.sensitivityLevels.join(', ') || 'None'
          }
        />
        <ProfileField
          label="Compliance"
          value={
            profile.complianceUnknown
              ? 'Unknown'
              : profile.complianceFrameworks.length > 0
                ? `${profile.complianceFrameworks.length} framework${profile.complianceFrameworks.length !== 1 ? 's' : ''}`
                : 'None'
          }
        />
        <ProfileField
          label="Migration Status"
          value={MIGRATION_STATUS_LABELS[profile.migrationStatus] ?? profile.migrationStatus}
        />
        {profile.mode === 'comprehensive' && (
          <>
            <ProfileField
              label="Use Cases"
              value={
                profile.useCasesUnknown
                  ? 'Unknown'
                  : profile.useCases?.length
                    ? `${profile.useCases.length} selected`
                    : 'None'
              }
            />
            <ProfileField
              label="Data Retention"
              value={
                profile.retentionUnknown
                  ? 'Unknown (industry default)'
                  : profile.retentionPeriods?.join(', ') || 'None'
              }
            />
            <ProfileField
              label="Crypto Agility"
              value={profile.cryptoAgility ? AGILITY_LABELS[profile.cryptoAgility] : undefined}
            />
            <ProfileField
              label="Infrastructure"
              value={
                profile.infrastructureUnknown
                  ? 'Unknown'
                  : profile.infrastructure?.length
                    ? `${profile.infrastructure.length} layer${profile.infrastructure.length !== 1 ? 's' : ''}`
                    : 'None'
              }
            />
            <ProfileField
              label="Vendor Model"
              value={
                profile.vendorUnknown
                  ? 'Unknown'
                  : profile.vendorDependency?.replace('-', ' ') || undefined
              }
            />
            <ProfileField
              label="Timeline Pressure"
              value={
                profile.timelinePressure ? TIMELINE_LABELS[profile.timelinePressure] : undefined
              }
            />
          </>
        )}
      </div>
      <div className="mt-2">
        <span
          className={clsx(
            'inline-flex text-[10px] font-bold px-2 py-0.5 rounded-full',
            profile.mode === 'comprehensive'
              ? 'bg-primary/10 text-primary'
              : 'bg-muted/20 text-muted-foreground'
          )}
        >
          {profile.mode === 'comprehensive' ? 'Comprehensive' : 'Quick'} Assessment
        </span>
      </div>
    </CollapsibleSection>
  )
}

interface AssessReportProps {
  result: AssessmentResult
}

/** Report-specific HNDL/HNFL wrapper that injects SectionInfoTip */
const ReportHNDLHNFLSection = (props: {
  hndl?: HNDLRiskWindow
  hnfl?: HNFLRiskWindow
  defaultOpen?: boolean
  headerExtra?: React.ReactNode
}) => <SharedHNDLHNFLSection {...props} infoTip={<SectionInfoTip sectionId="hndlHnfl" />} />

export const ReportContent: React.FC<AssessReportProps> = ({ result }) => {
  const navigate = useNavigate()
  const { reset, editFromStep } = useAssessmentStore()
  const assessmentStatus = useAssessmentStore((s) => s.assessmentStatus)
  const { workflowActive, startWorkflow } = useMigrationWorkflowStore()
  const previousRiskScore = useAssessmentStore((s) => s.previousRiskScore)
  const lastModifiedAt = useAssessmentStore((s) => s.lastModifiedAt)
  const assessmentHistory = useAssessmentStore((s) => s.assessmentHistory)
  const industry = useAssessmentStore((s) => s.industry)
  const country = useAssessmentStore((s) => s.country)
  const dataSensitivity = useAssessmentStore((s) => s.dataSensitivity)
  const currentCrypto = useAssessmentStore((s) => s.currentCrypto)
  const cryptoUnknown = useAssessmentStore((s) => s.cryptoUnknown)
  const hasSigningAlgos =
    (currentCrypto ?? []).some((a) => SIGNING_ALGORITHMS.has(a)) || cryptoUnknown
  const infrastructure = useAssessmentStore((s) => s.infrastructure)
  const infrastructureSubCategories = useAssessmentStore((s) => s.infrastructureSubCategories)
  const hiddenThreats = useAssessmentStore((s) => s.hiddenThreats)
  const hideThreat = useAssessmentStore((s) => s.hideThreat)
  const restoreAllThreats = useAssessmentStore((s) => s.restoreAllThreats)
  const selectedPersona = usePersonaStore((s) => s.selectedPersona)
  const hiddenProducts = useMigrateSelectionStore((s) => s.hiddenProducts)

  const hiddenForIndustryCount = useMemo(() => {
    if (!hiddenThreats.length || !industry) return 0
    // eslint-disable-next-line security/detect-object-injection
    const threatIndustryNames = ASSESS_TO_THREATS_INDUSTRY[industry] ?? []
    const industryThreatIds = new Set(
      threatsData.filter((t) => threatIndustryNames.includes(t.industry)).map((t) => t.threatId)
    )
    return hiddenThreats.filter((id) => industryThreatIds.has(id)).length
  }, [industry, hiddenThreats])

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
    const sectionIds: ReportSectionId[] = [
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
    return sectionIds.some((id) => getReportSectionConfig(selectedPersona, id).state === 'hidden')
  }, [selectedPersona])

  /** Top migrate catalog products relevant to this assessment's industry + infrastructure. */
  const relevantSoftware = useMemo(() => {
    if (!industry || !softwareData?.length) return []
    const industryLower = industry.toLowerCase()
    const hiddenSet = new Set(hiddenProducts)
    return softwareData
      .filter((item) => {
        // Respect migrate page selections
        const key = `${item.softwareName}::${item.categoryId}`
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

  const config = riskConfig[result.riskLevel]

  const handlePrint = () => {
    window.print()
  }

  const handleShare = async () => {
    const input = useAssessmentStore.getState().getInput()
    const params = new URLSearchParams()
    if (input) {
      params.set('i', input.industry)
      params.set('c', input.currentCrypto.join(','))
      params.set('d', input.dataSensitivity.join(','))
      if (input.complianceRequirements.length > 0) {
        params.set('f', input.complianceRequirements.join(','))
      }
      params.set('m', input.migrationStatus)
      // Extended params
      if (input.country) params.set('cy', encodeURIComponent(input.country))
      if (input.cryptoUseCases?.length) params.set('u', input.cryptoUseCases.join(','))
      if (input.dataRetention?.length) params.set('r', input.dataRetention.join(','))
      if (input.systemCount) params.set('s', input.systemCount)
      if (input.teamSize) params.set('t', input.teamSize)
      if (input.cryptoAgility) params.set('a', input.cryptoAgility)
      if (input.infrastructure?.length) params.set('n', input.infrastructure.join(','))
      if (input.vendorDependency) params.set('v', input.vendorDependency)
      if (input.timelinePressure) params.set('p', input.timelinePressure)
    }
    const url = `${window.location.origin}${window.location.pathname}?${params.toString()}`

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'PQC Risk Assessment Report',
          text: `Quantum Risk Score: ${result.riskScore}/100 — ${result.narrative}`,
          url,
        })
      } catch {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(url)
    }
  }

  const handleCSVExport = () => {
    const hasEffort = result.migrationEffort && result.migrationEffort.length > 0
    const effortMap = new Map(result.migrationEffort?.map((e) => [e.algorithm, e]))

    const headers = hasEffort
      ? [
          'Algorithm',
          'Quantum Vulnerable',
          'PQC Replacement',
          'Urgency',
          'Migration Effort',
          'Estimated Scope',
          'Rationale',
          'Notes',
        ]
      : ['Algorithm', 'Quantum Vulnerable', 'PQC Replacement', 'Urgency', 'Notes']

    const rows = result.algorithmMigrations.map((algo) => {
      const effort = effortMap.get(algo.classical)
      const baseRow = [
        algo.classical,
        algo.quantumVulnerable ? 'Yes' : 'No',
        algo.replacement,
        algo.urgency,
      ]
      if (hasEffort) {
        baseRow.push(
          effort?.complexity ?? 'N/A',
          effort?.estimatedScope ?? 'N/A',
          `"${(effort?.rationale ?? '').replace(/"/g, '""')}"`
        )
      }
      baseRow.push(`"${algo.notes.replace(/"/g, '""')}"`)
      return baseRow
    })

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `pqc-risk-assessment-${new Date(result.generatedAt).toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

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
    <div className={clsx('assess-report print:max-w-none', showBoardBrief && 'exec-brief-mode')}>
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
                    <div className="flex items-center justify-center gap-2">
                      <h2 className="text-3xl font-bold text-gradient mb-2 print:text-black">
                        Your PQC Risk Assessment Report
                      </h2>
                      <Button
                        variant="ghost"
                        onClick={() => setMethodologyOpen(true)}
                        className="p-1.5 h-auto w-auto rounded-lg hover:bg-muted/30 text-muted-foreground hover:text-foreground print:hidden mb-2"
                        aria-label="How this report works"
                      >
                        <Info size={18} />
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground print:text-gray-600">
                      Generated on {generatedDate}
                    </p>
                    <span
                      className={clsx(
                        'inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border mt-2',
                        result.categoryScores
                          ? 'border-primary/30 bg-primary/10 text-primary'
                          : 'border-border bg-muted/20 text-muted-foreground'
                      )}
                    >
                      {result.categoryScores ? 'Comprehensive Assessment' : 'Quick Assessment'}
                    </span>
                  </div>

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
                  {cfg('countryTimeline').state !== 'hidden' && (
                    <CollapsibleSection
                      title={
                        country
                          ? `${country} PQC Migration Timeline`
                          : 'Country PQC Migration Timeline'
                      }
                      icon={<Calendar className="text-primary" size={20} />}
                      defaultOpen={cfg('countryTimeline').state === 'open'}
                      infoTip="countryTimeline"
                    >
                      <ReportTimelineStrip countryName={country} />
                      <Link
                        to={
                          country ? `/timeline?country=${encodeURIComponent(country)}` : '/timeline'
                        }
                        className="flex items-center gap-1.5 text-xs text-primary hover:underline mt-3 print:hidden"
                      >
                        <ArrowRight size={12} />
                        View full {country ? `${country} ` : ''}timeline
                      </Link>
                    </CollapsibleSection>
                  )}

                  {/* Risk Score */}
                  <CollapsibleSection
                    title="Risk Score"
                    icon={<ShieldAlert className={config.color} size={20} />}
                    defaultOpen={cfg('riskScore').state === 'open'}
                    className={clsx('border-l-4', config.border)}
                    infoTip="riskScore"
                  >
                    <RiskGauge score={result.riskScore} level={result.riskLevel} />
                    {previousRiskScore !== null && previousRiskScore !== result.riskScore && (
                      <div className="flex items-center justify-center gap-2 mt-2 print:hidden">
                        <span
                          className={clsx(
                            'text-xs font-mono px-2 py-0.5 rounded-full',
                            result.riskScore < previousRiskScore
                              ? 'bg-success/10 text-success'
                              : 'bg-destructive/10 text-destructive'
                          )}
                        >
                          {result.riskScore < previousRiskScore ? '' : '+'}
                          {result.riskScore - previousRiskScore} since last assessment
                        </span>
                      </div>
                    )}
                    {lastModifiedAt && (
                      <p className="text-[10px] text-muted-foreground/60 text-center mt-1 font-mono print:hidden">
                        Last updated:{' '}
                        {new Date(lastModifiedAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground text-center mt-4 leading-relaxed print:text-gray-600">
                      {result.personaNarrative ?? result.narrative}
                    </p>
                  </CollapsibleSection>

                  {/* Key Findings */}
                  {result.keyFindings &&
                    result.keyFindings.length > 0 &&
                    cfg('keyFindings').state !== 'hidden' && (
                      <CollapsibleSection
                        title="Key Findings"
                        icon={<AlertTriangle className="text-warning" size={20} />}
                        defaultOpen={cfg('keyFindings').state === 'open'}
                        className="border-l-4 border-l-warning"
                        infoTip="keyFindings"
                      >
                        <ul className="space-y-2">
                          {result.keyFindings.map((finding, i) => (
                            <li
                              key={i}
                              className="flex gap-2 text-sm text-muted-foreground leading-relaxed"
                            >
                              <span className="text-warning font-bold shrink-0">{i + 1}.</span>
                              {finding}
                            </li>
                          ))}
                        </ul>
                      </CollapsibleSection>
                    )}

                  {/* Category Score Breakdown */}
                  {result.categoryScores && cfg('riskBreakdown').state !== 'hidden' && (
                    <CategoryBreakdown
                      scores={result.categoryScores}
                      drivers={result.categoryDrivers}
                      defaultOpen={cfg('riskBreakdown').state === 'open'}
                      headerExtra={
                        <AskAssistantButton
                          question={`Explain my PQC risk score of ${result.riskScore}/100 (${result.riskLevel}) for ${industry}`}
                          className="print:hidden"
                        />
                      }
                    />
                  )}

                  {/* Executive Summary */}
                  {result.executiveSummary && cfg('executiveSummary').state !== 'hidden' && (
                    <CollapsibleSection
                      title="Executive Summary"
                      icon={<Briefcase className="text-primary" size={20} />}
                      defaultOpen={cfg('executiveSummary').state === 'open'}
                      className="border-l-4 border-l-primary"
                      infoTip="executiveSummary"
                    >
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {result.executiveSummary}
                      </p>
                    </CollapsibleSection>
                  )}

                  {/* Assessment Profile */}
                  {result.assessmentProfile && cfg('assessmentProfile').state !== 'hidden' && (
                    <AssessmentProfileSummary
                      profile={result.assessmentProfile}
                      defaultOpen={cfg('assessmentProfile').state === 'open'}
                    />
                  )}

                  {/* Consolidated HNDL / HNFL Risk Windows */}
                  {(result.hndlRiskWindow || result.hnflRiskWindow) &&
                    cfg('hndlHnfl').state !== 'hidden' && (
                      <ReportHNDLHNFLSection
                        hndl={result.hndlRiskWindow}
                        hnfl={result.hnflRiskWindow}
                        defaultOpen={cfg('hndlHnfl').state === 'open'}
                        headerExtra={
                          <AskAssistantButton
                            question="Explain Harvest Now Decrypt Later risk for my organization"
                            className="print:hidden"
                          />
                        }
                      />
                    )}

                  {/* HNDL warning for quick assessments with high sensitivity */}
                  {!result.categoryScores &&
                    !result.hndlRiskWindow &&
                    ((dataSensitivity ?? []).includes('critical') ||
                      (dataSensitivity ?? []).includes('high')) && (
                      <div className="glass-panel p-4 border-l-4 border-l-warning flex items-start gap-3">
                        <AlertTriangle size={18} className="text-warning shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            HNDL Risk Not Quantified
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            This quick assessment did not include data retention information.
                            Harvest-Now-Decrypt-Later risk cannot be calculated. For sensitive
                            long-lived data, run a Comprehensive Assessment to quantify this
                            exposure.
                          </p>
                        </div>
                      </div>
                    )}

                  {/* HNFL warning for quick assessments with signing algorithms */}
                  {!result.categoryScores && !result.hnflRiskWindow && hasSigningAlgos && (
                    <div className="glass-panel p-4 border-l-4 border-l-destructive flex items-start gap-3">
                      <AlertTriangle size={18} className="text-destructive shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          HNFL Risk Not Quantified
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Your assessment includes signature algorithms vulnerable to Shor&apos;s
                          algorithm. Harvest-Now-Forge-Later risk cannot be calculated without
                          credential lifetime data. Run a Comprehensive Assessment to quantify
                          signature key exposure.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Algorithm Migration Matrix */}
                  {result.algorithmMigrations.length > 0 &&
                    cfg('algorithmMigration').state !== 'hidden' && (
                      <CollapsibleSection
                        title="Algorithm Migration Priority"
                        icon={<ShieldAlert className="text-primary" size={20} />}
                        defaultOpen={cfg('algorithmMigration').state === 'open'}
                        className="print:break-inside-auto"
                        infoTip="algorithmMigration"
                        headerExtra={
                          <AskAssistantButton
                            question={`What are the recommended PQC algorithm migrations for ${industry}?`}
                            className="print:hidden"
                          />
                        }
                      >
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-border text-left">
                                <th
                                  scope="col"
                                  className="py-2 pr-3 text-muted-foreground font-medium"
                                >
                                  Current
                                </th>
                                <th
                                  scope="col"
                                  className="py-2 pr-3 text-muted-foreground font-medium"
                                >
                                  Vulnerable?
                                </th>
                                <th
                                  scope="col"
                                  className="py-2 pr-3 text-muted-foreground font-medium"
                                >
                                  PQC Replacement
                                </th>
                                {result.migrationEffort && (
                                  <>
                                    <th
                                      scope="col"
                                      className="py-2 pr-3 text-muted-foreground font-medium"
                                    >
                                      Effort
                                    </th>
                                    <th
                                      scope="col"
                                      className="py-2 pr-3 text-muted-foreground font-medium"
                                    >
                                      Scope
                                    </th>
                                  </>
                                )}
                                <th scope="col" className="py-2 text-muted-foreground font-medium">
                                  Notes
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {result.algorithmMigrations.map((algo) => {
                                const effort = result.migrationEffort?.find(
                                  (e) => e.algorithm === algo.classical
                                )
                                return (
                                  <tr key={algo.classical} className="border-b border-border/50">
                                    <td className="py-2.5 pr-3 font-medium text-foreground">
                                      {algo.classical}
                                    </td>
                                    <td className="py-2.5 pr-3">
                                      {algo.quantumVulnerable ? (
                                        <span className="flex items-center gap-1 text-destructive">
                                          <AlertTriangle size={14} /> Yes
                                        </span>
                                      ) : (
                                        <span className="flex items-center gap-1 text-success">
                                          <CheckCircle size={14} /> No
                                        </span>
                                      )}
                                    </td>
                                    <td className="py-2.5 pr-3 text-primary">
                                      <div className="flex items-center gap-2">
                                        <span>{algo.replacement}</span>
                                        {algo.quantumVulnerable &&
                                          !algo.replacement.includes('No change') && (
                                            <>
                                              <Link
                                                to="/playground"
                                                className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground hover:text-primary transition-colors whitespace-nowrap print:hidden"
                                                title="Try in Playground"
                                              >
                                                <FlaskConical size={10} />
                                                <span className="hidden lg:inline">Try</span>
                                              </Link>
                                              {(() => {
                                                const learnLink = getLearnLink(algo.replacement)
                                                if (!learnLink) return null
                                                return (
                                                  <Link
                                                    to={learnLink.path}
                                                    className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground hover:text-primary transition-colors whitespace-nowrap print:hidden"
                                                    title={`Learn about ${learnLink.label}`}
                                                  >
                                                    <BookOpen size={10} />
                                                    <span className="hidden lg:inline">
                                                      {learnLink.label}
                                                    </span>
                                                  </Link>
                                                )
                                              })()}
                                            </>
                                          )}
                                      </div>
                                    </td>
                                    {result.migrationEffort && (
                                      <>
                                        <td className="py-2.5 pr-3">
                                          {effort ? (
                                            <span
                                              className={clsx(
                                                'text-xs font-bold px-2 py-0.5 rounded-full',

                                                complexityConfig[effort.complexity]?.bg ??
                                                  'bg-muted',

                                                complexityConfig[effort.complexity]?.color ??
                                                  'text-muted-foreground'
                                              )}
                                            >
                                              {effort.complexity}
                                            </span>
                                          ) : (
                                            <span className="text-xs text-muted-foreground">—</span>
                                          )}
                                        </td>
                                        <td className="py-2.5 pr-3">
                                          {effort ? (
                                            <span
                                              className={clsx(
                                                'text-xs font-bold px-2 py-0.5 rounded-full',

                                                scopeConfig[effort.estimatedScope]?.bg ??
                                                  'bg-muted',

                                                scopeConfig[effort.estimatedScope]?.color ??
                                                  'text-muted-foreground'
                                              )}
                                            >
                                              {scopeConfig[effort.estimatedScope]?.label ??
                                                effort.estimatedScope}
                                            </span>
                                          ) : (
                                            <span className="text-xs text-muted-foreground">—</span>
                                          )}
                                        </td>
                                      </>
                                    )}
                                    <td className="py-2.5 text-muted-foreground text-xs">
                                      {algo.notes}
                                    </td>
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                          <div className="flex items-center gap-4 mt-3 print:hidden">
                            <Link
                              to={`/algorithms${
                                result.algorithmMigrations
                                  .filter((a) => a.quantumVulnerable)
                                  .map((a) => a.classical).length > 0
                                  ? `?highlight=${encodeURIComponent(
                                      result.algorithmMigrations
                                        .filter((a) => a.quantumVulnerable)
                                        .map((a) => a.classical)
                                        .join(',')
                                    )}`
                                  : ''
                              }`}
                              className="flex items-center gap-1.5 text-xs text-primary hover:underline"
                            >
                              <ArrowRight size={12} />
                              Compare algorithms
                            </Link>
                          </div>
                        </div>
                      </CollapsibleSection>
                    )}

                  {/* Compliance Impact */}
                  {result.complianceImpacts.length > 0 &&
                    cfg('complianceImpact').state !== 'hidden' && (
                      <CollapsibleSection
                        title="Compliance Impact"
                        icon={<CheckCircle className="text-primary" size={20} />}
                        defaultOpen={cfg('complianceImpact').state === 'open'}
                        className="print:break-inside-auto"
                        infoTip="complianceImpact"
                        headerExtra={
                          <AskAssistantButton
                            question={`What PQC compliance requirements apply to ${industry} in ${country}?`}
                            className="print:hidden"
                          />
                        }
                      >
                        <div className="space-y-3">
                          {result.complianceImpacts.map((c) => (
                            <div
                              key={c.framework}
                              className={clsx(
                                'p-3 rounded-lg border text-sm',
                                c.requiresPQC === true
                                  ? 'border-warning/30 bg-warning/5'
                                  : c.requiresPQC === null
                                    ? 'border-muted/50 bg-muted/5'
                                    : 'border-border'
                              )}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-semibold text-foreground">{c.framework}</span>
                                <span
                                  className={clsx(
                                    'text-xs font-bold px-2 py-0.5 rounded-full',
                                    c.requiresPQC === true
                                      ? 'bg-warning/10 text-warning'
                                      : c.requiresPQC === null
                                        ? 'bg-muted/20 text-muted-foreground'
                                        : 'bg-muted text-muted-foreground'
                                  )}
                                >
                                  {c.requiresPQC === true
                                    ? 'PQC Required'
                                    : c.requiresPQC === null
                                      ? 'Status unknown'
                                      : 'No PQC mandate yet'}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                <strong>Deadline:</strong> {c.deadline}
                              </p>
                              <p className="text-xs text-muted-foreground">{c.notes}</p>
                              {(() => {
                                const fullFw = complianceFrameworks.find(
                                  (f) => f.label === c.framework
                                )
                                if (!fullFw) return null
                                const hasRefs =
                                  fullFw.libraryRefs.length > 0 || fullFw.timelineRefs.length > 0
                                if (!hasRefs) return null
                                return (
                                  <div className="flex flex-wrap gap-1 mt-1.5 print:hidden">
                                    {fullFw.libraryRefs.map((ref) => (
                                      <Link
                                        to={`/library?q=${encodeURIComponent(ref)}`}
                                        key={ref}
                                        className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium hover:bg-primary/20 transition-colors"
                                        title={`View ${ref} in Library`}
                                      >
                                        <BookOpen size={8} />
                                        {ref}
                                      </Link>
                                    ))}
                                    {fullFw.timelineRefs.map((ref) => (
                                      <Link
                                        to="/timeline"
                                        key={ref}
                                        className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-accent/10 text-accent font-medium hover:bg-accent/20 transition-colors"
                                        title={`${ref} in Timeline`}
                                      >
                                        <Calendar size={8} />
                                        {ref}
                                      </Link>
                                    ))}
                                  </div>
                                )
                              })()}
                            </div>
                          ))}
                          <Link
                            to="/compliance"
                            className="flex items-center gap-1.5 text-xs text-primary hover:underline mt-3 print:hidden"
                          >
                            <ArrowRight size={12} />
                            Explore all compliance frameworks
                          </Link>
                        </div>
                      </CollapsibleSection>
                    )}

                  {/* Recommended Actions */}
                  {cfg('recommendedActions').state !== 'hidden' && (
                    <CollapsibleSection
                      title={`Recommended Actions${cfg('recommendedActions').maxItems ? ` (Top ${cfg('recommendedActions').maxItems})` : ''}`}
                      icon={<ArrowRight className="text-primary" size={20} />}
                      defaultOpen={cfg('recommendedActions').state === 'open'}
                      className="print:break-inside-auto"
                      infoTip="recommendedActions"
                      headerExtra={
                        <AskAssistantButton
                          question={`What should I prioritize for PQC migration in ${industry}?`}
                          className="print:hidden"
                        />
                      }
                    >
                      <div className="space-y-3">
                        {result.recommendedActions
                          .slice(0, cfg('recommendedActions').maxItems)
                          .map((action) => (
                            <div
                              key={action.priority}
                              className="flex items-start gap-3 p-3 rounded-lg border border-border hover:border-primary/30 transition-colors"
                            >
                              <div
                                className={clsx(
                                  'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 border-2',
                                  action.category === 'immediate'
                                    ? 'border-destructive text-destructive'
                                    : action.category === 'short-term'
                                      ? 'border-warning text-warning'
                                      : 'border-border text-muted-foreground'
                                )}
                              >
                                {action.priority}
                              </div>
                              <div className="flex-1">
                                <p className="text-sm text-foreground">{action.action}</p>
                                <div className="flex items-center gap-3 mt-1">
                                  <span
                                    className={clsx(
                                      'text-[10px] font-bold uppercase',
                                      action.category === 'immediate'
                                        ? 'text-destructive'
                                        : action.category === 'short-term'
                                          ? 'text-warning'
                                          : 'text-muted-foreground'
                                    )}
                                  >
                                    {action.category}
                                  </span>
                                  {action.effort && (
                                    <span
                                      className={clsx(
                                        'text-[10px] font-bold uppercase px-1.5 py-0.5 rounded',

                                        effortConfig[action.effort]?.bg ?? 'bg-muted',

                                        effortConfig[action.effort]?.color ??
                                          'text-muted-foreground'
                                      )}
                                    >
                                      {effortConfig[action.effort]?.label ?? action.effort} effort
                                    </span>
                                  )}
                                  {isPathVisible(action.relatedModule) && (
                                    <Link
                                      to={
                                        action.relatedModule.startsWith('/migrate') && industry
                                          ? `${action.relatedModule}${action.relatedModule.includes('?') ? '&' : '?'}industry=${encodeURIComponent(industry)}`
                                          : action.relatedModule
                                      }
                                      className="text-xs text-primary hover:underline flex items-center gap-1 print:hidden"
                                    >
                                      <ArrowRight size={10} />
                                      Explore
                                    </Link>
                                  )}
                                </div>
                                {action.relatedModule.startsWith('/migrate') &&
                                  relevantSoftware.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-1.5 print:hidden">
                                      <span className="text-[10px] text-muted-foreground/70">
                                        Tools:
                                      </span>
                                      {relevantSoftware.slice(0, 2).map((sw) => (
                                        <Link
                                          to={`/migrate?industry=${encodeURIComponent(industry)}`}
                                          key={sw.softwareName}
                                          className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium hover:bg-primary/20 transition-colors"
                                        >
                                          {sw.softwareName}
                                        </Link>
                                      ))}
                                    </div>
                                  )}
                              </div>
                            </div>
                          ))}
                      </div>
                    </CollapsibleSection>
                  )}

                  {/* Migration Roadmap */}
                  {cfg('migrationRoadmap').state !== 'hidden' && (
                    <MigrationRoadmap
                      actions={result.recommendedActions}
                      countryName={country || undefined}
                      defaultOpen={cfg('migrationRoadmap').state === 'open'}
                    />
                  )}

                  {/* Migration Toolkit — products from Migrate catalog */}
                  {cfg('migrationToolkit').state !== 'hidden' && (
                    <MigrationToolkit
                      assessmentInfrastructure={infrastructure}
                      assessmentSubCategories={infrastructureSubCategories}
                      assessmentIndustry={industry}
                      defaultOpen={cfg('migrationToolkit').state === 'open'}
                    />
                  )}

                  {/* ROI Calculator */}
                  <ROICalculatorSection
                    result={result}
                    industry={industry}
                    defaultOpen={false}
                    onSummaryChange={setRoiSummary}
                    infoTip={<SectionInfoTip sectionId="roiCalculator" />}
                  />

                  {/* KPI Trending */}
                  {result.categoryScores && (
                    <KPITrendingSection
                      history={assessmentHistory}
                      currentResult={result}
                      defaultOpen={false}
                    />
                  )}

                  {/* Industry Threat Landscape */}
                  {cfg('threatLandscape').state !== 'hidden' && (
                    <div className="print:break-before-page print:break-inside-auto">
                      <CollapsibleSection
                        title={
                          industry ? `${industry} Threat Landscape` : 'Industry Threat Landscape'
                        }
                        icon={<ShieldAlert className="text-destructive" size={20} />}
                        defaultOpen={cfg('threatLandscape').state === 'open'}
                        infoTip="threatLandscape"
                        headerExtra={
                          hiddenForIndustryCount > 0 ? (
                            <Button
                              variant="ghost"
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                restoreAllThreats()
                              }}
                              className="text-xs px-2.5 py-1 h-auto rounded-full bg-status-warning/10 text-status-warning border border-status-warning/30 hover:bg-status-warning/20 print:hidden"
                            >
                              {hiddenForIndustryCount} hidden · Restore
                            </Button>
                          ) : undefined
                        }
                      >
                        <ReportThreatsAppendix
                          industry={industry}
                          userAlgorithms={currentCrypto}
                          hiddenThreatIds={hiddenThreats}
                          onHideThreat={hideThreat}
                        />
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
                          if (cta.isShareAction) {
                            return (
                              <Button
                                key={cta.label}
                                variant="outline"
                                onClick={handleShare}
                                className="flex items-center gap-2"
                              >
                                <Icon size={16} className="shrink-0" />
                                {cta.label}
                              </Button>
                            )
                          }
                          return (
                            <Link
                              key={cta.label}
                              to={cta.path}
                              className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
                            >
                              <Icon size={16} className="shrink-0" />
                              {cta.label}
                            </Link>
                          )
                        })}
                      </div>
                      <p className="text-xs text-muted-foreground/60 mt-2">
                        {PERSONAS[selectedPersona].label} learning path —{' '}
                        {PERSONAS[selectedPersona].recommendedPath.length - 1} modules, ~
                        {Math.round(PERSONAS[selectedPersona].estimatedMinutes / 60)} hours
                      </p>
                    </div>
                  )}

                  {/* Migration Workflow activation CTA */}
                  {!workflowActive && assessmentStatus === 'complete' && (
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
                        Download PDF
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
                      <Button
                        variant="ghost"
                        onClick={handleCSVExport}
                        className="gap-2 border border-border rounded-lg text-muted-foreground hover:text-foreground hover:border-primary/30"
                      >
                        <Download size={16} />
                        Export CSV
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={handleShare}
                        className="gap-2 border border-border rounded-lg text-muted-foreground hover:text-foreground hover:border-primary/30"
                      >
                        <Share2 size={16} />
                        Share
                      </Button>
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
              />
            </td>
          </tr>
        </tbody>
      </table>

      <ReportMethodologyModal isOpen={methodologyOpen} onClose={() => setMethodologyOpen(false)} />
    </div>
  )
}
