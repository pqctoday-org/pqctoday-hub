import clsx from 'clsx'
import { ShieldAlert } from 'lucide-react'
import type { AssessmentResult } from '../../../hooks/assessmentTypes'
import { CollapsibleSection } from '../ReportContent'
import { RiskGauge, riskConfig } from '../../shared/widgets/RiskGauge'

// Re-exports for backwards compatibility — anything importing from here still works.
export { RiskGauge, riskConfig }

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
      <p className="text-sm text-muted-foreground text-center mt-4 leading-relaxed print:text-muted-foreground">
        {result.personaNarrative ?? result.narrative}
      </p>
    </CollapsibleSection>
  )
}
