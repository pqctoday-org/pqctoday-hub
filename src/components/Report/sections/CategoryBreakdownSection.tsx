// SPDX-License-Identifier: GPL-3.0-only
// /report's "Risk Breakdown" section (REPORT_SECTION_ORDER: 'riskBreakdown').
// Extracted from ReportContent.tsx — see reportSectionToCswp39.ts.
import React from 'react'
import { BarChart3, ShieldAlert } from 'lucide-react'
import clsx from 'clsx'
import type { CategoryScores, CategoryDrivers, FrameworkRisk } from '../../../hooks/assessmentTypes'
import { ReportLockedOverlay } from '../redesign/ReportLockedOverlay'
import { CategoryBreakdownPreviewSkeleton } from '../redesign/ReportKpiStates'
import { AskAssistantButton } from '../../ui/AskAssistantButton'
import { CollapsibleSection } from './reportContentShared'

export const CategoryBreakdown = ({
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
  // organizationalReadiness is higher-is-better (a true readiness score); the
  // other three are higher-is-worse. `higherIsBetter` inverts the concern value
  // used for colouring so a high readiness bar reads green, not red.
  const categories = [
    { label: 'Quantum Exposure', key: 'quantumExposure' as const, higherIsBetter: false },
    { label: 'Migration Complexity', key: 'migrationComplexity' as const, higherIsBetter: false },
    { label: 'Regulatory Pressure', key: 'regulatoryPressure' as const, higherIsBetter: false },
    {
      label: 'Organizational Readiness',
      key: 'organizationalReadiness' as const,
      higherIsBetter: true,
    },
  ]

  // Canonical risk-level thresholds (match orchestrator.ts riskLevel mapping
  // and SECTION_INFO copy). Previously this component used 30/60 boundaries
  // which contradicted the gauge — same score rendered yellow here, red there.
  const getBarColor = (score: number) => {
    if (score <= 25) return 'bg-success'
    if (score <= 55) return 'bg-warning'
    if (score <= 75) return 'bg-destructive'
    return 'bg-critical'
  }

  const getScoreColor = (score: number) => {
    if (score <= 25) return 'text-success'
    if (score <= 55) return 'text-warning'
    if (score <= 75) return 'text-destructive'
    return 'text-critical'
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
        {categories.map(({ label, key, higherIsBetter }) => {
          // eslint-disable-next-line security/detect-object-injection
          const score = scores[key]
          // Concern drives colour: for higher-is-better axes a high score is LOW
          // concern (green), so invert before thresholding.
          const concern = higherIsBetter ? 100 - score : score
          return (
            <div key={key}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-muted-foreground">{label}</span>
                <span className={clsx('text-sm font-bold', getScoreColor(concern))}>
                  {score}/100
                </span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-border overflow-hidden">
                <div
                  className={clsx(
                    'h-full rounded-full transition-all duration-500',
                    getBarColor(concern)
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

export const RiskBreakdownUnlocked = ({
  scores,
  drivers,
  riskScore,
  riskLevel,
  industry,
  defaultOpen,
}: {
  scores: CategoryScores
  drivers?: CategoryDrivers
  riskScore: number
  riskLevel: string
  industry: string
  defaultOpen: boolean
}) => (
  <div id="report-section-riskBreakdown">
    <CategoryBreakdown
      scores={scores}
      drivers={drivers}
      defaultOpen={defaultOpen}
      headerExtra={
        <AskAssistantButton
          question={`Explain my PQC risk score of ${riskScore}/100 (${riskLevel}) for ${industry}`}
          className="print:hidden"
        />
      }
    />
  </div>
)

export const RiskBreakdownLocked = () => (
  <div id="report-section-riskBreakdown">
    <ReportLockedOverlay
      reason="Per-domain scores need the full assessment"
      detail="A quick assessment can't separate Quantum Exposure, Migration Complexity, Regulatory Pressure and Organizational Readiness. Finish the full assessment to unlock the breakdown."
    >
      <CategoryBreakdownPreviewSkeleton />
    </ReportLockedOverlay>
  </div>
)

export const FrameworkRiskLensSection = ({ frameworkRisk }: { frameworkRisk: FrameworkRisk }) => (
  <CollapsibleSection
    title="Framework Risk Lens (Applied Quantum)"
    icon={<ShieldAlert className="text-primary" size={20} />}
    defaultOpen={false}
  >
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {(
        [
          ['HNDL', frameworkRisk.hndl, 'Harvest-now confidentiality'],
          ['TNFL', frameworkRisk.tnfl, 'Forge-later integrity'],
          ['Regulatory', frameworkRisk.regulatory, 'Compliance / deadline pressure'],
          ['Feasibility', frameworkRisk.feasibility, 'Ease of migration (higher = easier)'],
        ] as const
      ).map(([label, val, note]) => (
        <div key={label} className="rounded-lg border border-border bg-card p-3">
          <div className="text-2xl font-extrabold text-foreground">{val}</div>
          <div className="text-sm font-semibold text-foreground">{label}</div>
          <div className="text-xs text-muted-foreground">{note}</div>
        </div>
      ))}
    </div>
    <p className="mt-2 text-xs text-muted-foreground">
      The framework&apos;s P3 risk dimensions, derived alongside the category scores. HNDL / TNFL /
      Regulatory are exposure (higher = more risk); Feasibility is ease of migration (higher =
      easier).
    </p>
  </CollapsibleSection>
)
