import React from 'react'
import clsx from 'clsx'
import { ShieldAlert } from 'lucide-react'
import type { AssessmentResult } from '../../../hooks/assessmentTypes'
import { CollapsibleSection } from '../ReportContent'

export const riskConfig = {
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

export const RiskGauge = ({
  score,
  level,
}: {
  score: number
  level: AssessmentResult['riskLevel']
}) => {
  const config = riskConfig[level]
  const angle = (score / 100) * 180 - 90

  return (
    <div className="flex flex-col items-center">
      <svg
        viewBox="0 0 200 120"
        className="w-32 h-20 md:w-48 md:h-28"
        role="img"
        aria-label={`Risk score: ${score} out of 100, rated ${config.label}`}
      >
        <title>{`Risk gauge showing score of ${score}/100`}</title>
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="currentColor"
          strokeWidth="12"
          className="text-border"
          strokeLinecap="round"
        />
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="currentColor"
          strokeWidth="12"
          className={config.color}
          strokeLinecap="round"
          strokeDasharray={`${(score / 100) * 251.2} 251.2`}
        />
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

export const RiskScoreSection = ({
  result,
  previousRiskScore,
  lastModifiedAt,
  defaultOpen = true,
}: {
  result: AssessmentResult
  previousRiskScore: number | null
  lastModifiedAt: string | null
  defaultOpen?: boolean
}) => {
  const config = riskConfig[result.riskLevel]

  return (
    <CollapsibleSection
      title="Risk Score"
      icon={<ShieldAlert className={config.color} size={20} />}
      defaultOpen={defaultOpen}
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
  )
}
