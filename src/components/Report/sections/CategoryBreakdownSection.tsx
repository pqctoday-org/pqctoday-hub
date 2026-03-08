import React from 'react'
import clsx from 'clsx'
import { BarChart3 } from 'lucide-react'
import type { CategoryScores, CategoryDrivers } from '../../../hooks/assessmentTypes'
import { CollapsibleSection } from '../ReportContent'

export const CategoryBreakdownSection = ({
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
                  {String(drivers[key])}
                </p>
              )}
            </div>
          )
        })}
      </div>
    </CollapsibleSection>
  )
}
