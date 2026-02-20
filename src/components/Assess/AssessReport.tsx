import React, { useState } from 'react'
import { Link } from 'react-router-dom'
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
  Clock,
  Briefcase,
  Calendar,
  ChevronDown,
} from 'lucide-react'
import type {
  AssessmentResult,
  CategoryScores,
  HNDLRiskWindow,
} from '../../hooks/useAssessmentEngine'
import { useAssessmentStore } from '../../store/useAssessmentStore'
import { ReportTimelineStrip } from './ReportTimelineStrip'
import { ReportThreatsAppendix } from './ReportThreatsAppendix'
import clsx from 'clsx'

declare const __APP_VERSION__: string
const APP_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.0.0'

function CollapsibleSection({
  title,
  icon,
  children,
}: {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className="glass-panel p-6 print:border print:border-gray-300">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between print:hidden"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2 font-semibold text-foreground">
          {icon}
          {title}
        </div>
        <ChevronDown
          size={18}
          className={clsx(
            'text-muted-foreground transition-transform duration-200',
            open && 'rotate-180'
          )}
        />
      </button>
      {/* Print-only static title (no button/chevron) */}
      <div className="hidden print:flex items-center gap-2 font-semibold text-foreground">
        {icon}
        {title}
      </div>
      <div className={clsx('mt-4', !open && 'hidden print:block')}>{children}</div>
    </div>
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
        className="w-48 h-28"
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

const CategoryBreakdown = ({ scores }: { scores: CategoryScores }) => {
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
    <div className="glass-panel p-6 print:border print:border-gray-300">
      <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
        <BarChart3 className="text-primary" size={20} />
        Risk Breakdown
      </h3>
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
            </div>
          )
        })}
      </div>
    </div>
  )
}

const HNDLTimeline = ({ hndl }: { hndl: HNDLRiskWindow }) => {
  const totalSpan = Math.max(
    hndl.dataRetentionYears + 5,
    hndl.estimatedQuantumThreatYear - hndl.currentYear + 10
  )
  const threatOffset = ((hndl.estimatedQuantumThreatYear - hndl.currentYear) / totalSpan) * 100
  const dataEndOffset = (hndl.dataRetentionYears / totalSpan) * 100

  return (
    <div className="glass-panel p-6 print:border print:border-gray-300">
      <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
        <Clock className="text-primary" size={20} />
        HNDL Risk Window
      </h3>

      <div
        className="relative h-12 mb-6"
        role="img"
        aria-label={
          hndl.isAtRisk
            ? `Your data persists ${hndl.riskWindowYears} years beyond the quantum threat horizon. HNDL attacks are an active concern.`
            : 'Your data retention period does not extend beyond the estimated quantum threat year.'
        }
      >
        {/* Base timeline bar */}
        <div className="absolute top-5 left-0 right-0 h-2 rounded-full bg-border" />

        {/* Safe zone (green) */}
        <div
          className="absolute top-5 left-0 h-2 rounded-l-full bg-success/40"
          style={{ width: `${Math.min(threatOffset, 100)}%` }}
        />

        {/* Risk zone (red) — data extends beyond threat */}
        {hndl.isAtRisk && (
          <div
            className="absolute top-5 h-2 rounded-r-full bg-destructive/40"
            style={{
              left: `${Math.min(threatOffset, 100)}%`,
              width: `${Math.min(dataEndOffset - threatOffset, 100 - threatOffset)}%`,
            }}
          />
        )}

        {/* Current year marker */}
        <div className="absolute top-0 left-0 flex flex-col items-center">
          <div className="w-0.5 h-4 bg-foreground" />
          <span className="text-[10px] text-muted-foreground mt-3">{hndl.currentYear}</span>
        </div>

        {/* Quantum threat marker */}
        <div
          className="absolute top-0 flex flex-col items-center"
          style={{ left: `${Math.min(threatOffset, 95)}%` }}
        >
          <div className="w-0.5 h-4 bg-warning" />
          <span className="text-[10px] text-warning font-bold mt-3">
            ~{hndl.estimatedQuantumThreatYear}
          </span>
        </div>

        {/* Data expiration marker */}
        <div
          className="absolute top-0 flex flex-col items-center"
          style={{ left: `${Math.min(dataEndOffset, 95)}%` }}
        >
          <div className={clsx('w-0.5 h-4', hndl.isAtRisk ? 'bg-destructive' : 'bg-success')} />
          <span
            className={clsx(
              'text-[10px] font-bold mt-3',
              hndl.isAtRisk ? 'text-destructive' : 'text-success'
            )}
          >
            {hndl.currentYear + hndl.dataRetentionYears}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="w-3 h-2 rounded-sm bg-success/40" /> Safe zone
        </span>
        {hndl.isAtRisk && (
          <span className="flex items-center gap-1">
            <span className="w-3 h-2 rounded-sm bg-destructive/40" /> At risk
          </span>
        )}
      </div>

      {hndl.isAtRisk ? (
        <p className="text-sm text-destructive mt-3 font-medium">
          Your data persists {hndl.riskWindowYears} year{hndl.riskWindowYears !== 1 ? 's' : ''}{' '}
          beyond the estimated quantum threat horizon. HNDL attacks are an active concern.
        </p>
      ) : (
        <p className="text-sm text-success mt-3 font-medium">
          Your data retention period does not extend beyond the estimated quantum threat year.
        </p>
      )}
    </div>
  )
}

interface AssessReportProps {
  result: AssessmentResult
}

export const AssessReport: React.FC<AssessReportProps> = ({ result }) => {
  const { reset, editFromStep } = useAssessmentStore()
  const industry = useAssessmentStore((s) => s.industry)
  const country = useAssessmentStore((s) => s.country)

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
    <div className="assess-report max-w-3xl mx-auto print:max-w-none">
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

      <div className="space-y-6 print:space-y-4">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gradient mb-2 print:text-black">
            Your PQC Risk Assessment Report
          </h2>
          <p className="text-sm text-muted-foreground print:text-gray-600">
            Generated on {generatedDate}
          </p>
        </div>

        {/* Country PQC Migration Timeline */}
        <CollapsibleSection
          title={country ? `${country} PQC Migration Timeline` : 'Country PQC Migration Timeline'}
          icon={<Calendar className="text-primary" size={20} />}
        >
          <ReportTimelineStrip countryName={country} />
        </CollapsibleSection>

        {/* Risk Score */}
        <div
          className={clsx(
            'glass-panel p-6 border-l-4',
            config.border,
            'print:border print:border-gray-300'
          )}
        >
          <RiskGauge score={result.riskScore} level={result.riskLevel} />
          <p className="text-sm text-muted-foreground text-center mt-4 leading-relaxed print:text-gray-600">
            {result.narrative}
          </p>
        </div>

        {/* Category Score Breakdown */}
        {result.categoryScores && <CategoryBreakdown scores={result.categoryScores} />}

        {/* Executive Summary */}
        {result.executiveSummary && (
          <div className="glass-panel p-6 border-l-4 border-l-primary print:border print:border-gray-300">
            <h3 className="text-lg font-bold text-foreground mb-2 flex items-center gap-2">
              <Briefcase className="text-primary" size={20} />
              Executive Summary
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {result.executiveSummary}
            </p>
          </div>
        )}

        {/* HNDL Risk Window */}
        {result.hndlRiskWindow && <HNDLTimeline hndl={result.hndlRiskWindow} />}

        {/* Algorithm Migration Matrix */}
        {result.algorithmMigrations.length > 0 && (
          <div className="glass-panel p-6 print:border print:border-gray-300">
            <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <ShieldAlert className="text-primary" size={20} />
              Algorithm Migration Priority
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="py-2 pr-3 text-muted-foreground font-medium">Current</th>
                    <th className="py-2 pr-3 text-muted-foreground font-medium">Vulnerable?</th>
                    <th className="py-2 pr-3 text-muted-foreground font-medium">PQC Replacement</th>
                    {result.migrationEffort && (
                      <>
                        <th className="py-2 pr-3 text-muted-foreground font-medium">Effort</th>
                        <th className="py-2 pr-3 text-muted-foreground font-medium">Scope</th>
                      </>
                    )}
                    <th className="py-2 text-muted-foreground font-medium">Notes</th>
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
                        <td className="py-2.5 pr-3 text-primary">{algo.replacement}</td>
                        {result.migrationEffort && (
                          <>
                            <td className="py-2.5 pr-3">
                              {effort ? (
                                <span
                                  className={clsx(
                                    'text-xs font-bold px-2 py-0.5 rounded-full',

                                    complexityConfig[effort.complexity]?.bg ?? 'bg-muted',

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

                                    scopeConfig[effort.estimatedScope]?.bg ?? 'bg-muted',

                                    scopeConfig[effort.estimatedScope]?.color ??
                                      'text-muted-foreground'
                                  )}
                                >
                                  {}
                                  {scopeConfig[effort.estimatedScope]?.label ??
                                    effort.estimatedScope}
                                </span>
                              ) : (
                                <span className="text-xs text-muted-foreground">—</span>
                              )}
                            </td>
                          </>
                        )}
                        <td className="py-2.5 text-muted-foreground text-xs">{algo.notes}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Compliance Impact */}
        {result.complianceImpacts.length > 0 && (
          <div className="glass-panel p-6 print:border print:border-gray-300">
            <h3 className="text-lg font-bold text-foreground mb-4">Compliance Impact</h3>
            <div className="space-y-3">
              {result.complianceImpacts.map((c) => (
                <div
                  key={c.framework}
                  className={clsx(
                    'p-3 rounded-lg border text-sm',
                    c.requiresPQC ? 'border-warning/30 bg-warning/5' : 'border-border'
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-foreground">{c.framework}</span>
                    <span
                      className={clsx(
                        'text-xs font-bold px-2 py-0.5 rounded-full',
                        c.requiresPQC
                          ? 'bg-warning/10 text-warning'
                          : 'bg-muted text-muted-foreground'
                      )}
                    >
                      {c.requiresPQC ? 'PQC Required' : 'No PQC mandate yet'}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    <strong>Deadline:</strong> {c.deadline}
                  </p>
                  <p className="text-xs text-muted-foreground">{c.notes}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommended Actions */}
        <div className="glass-panel p-6 print:border print:border-gray-300">
          <h3 className="text-lg font-bold text-foreground mb-4">Recommended Actions</h3>
          <div className="space-y-3">
            {result.recommendedActions.map((action) => (
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

                          effortConfig[action.effort]?.color ?? 'text-muted-foreground'
                        )}
                      >
                        {}
                        {effortConfig[action.effort]?.label ?? action.effort} effort
                      </span>
                    )}
                    <Link
                      to={action.relatedModule}
                      className="text-xs text-primary hover:underline flex items-center gap-1 print:hidden"
                    >
                      <ArrowRight size={10} />
                      Explore
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Industry Threat Landscape */}
        <div className="print:break-before-page print:break-inside-auto">
          <CollapsibleSection
            title={industry ? `${industry} Threat Landscape` : 'Industry Threat Landscape'}
            icon={<ShieldAlert className="text-destructive" size={20} />}
          >
            <ReportThreatsAppendix industry={industry} />
          </CollapsibleSection>
        </div>

        <div className="flex flex-col items-center gap-2 print:hidden">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
            >
              <Printer size={16} />
              Download PDF
            </button>
            <button
              onClick={handleCSVExport}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
            >
              <Download size={16} />
              Export CSV
            </button>
            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
            >
              <Share2 size={16} />
              Share
            </button>
            <button
              onClick={() => editFromStep(0)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
            >
              <Pencil size={16} />
              Edit Answers
            </button>
            <button
              onClick={reset}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
            >
              <RotateCcw size={16} />
              Start Over
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
