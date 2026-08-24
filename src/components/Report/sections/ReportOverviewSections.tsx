// SPDX-License-Identifier: GPL-3.0-only
// /report's leading overview sections — countryTimeline, riskScore,
// keyFindings, executiveSummary (REPORT_SECTION_ORDER). Grouped in one module
// since each is a small, single-CollapsibleSection block. Visibility/phase
// gating stays in ReportContent.tsx; these components only render the body.
// Extracted from ReportContent.tsx — see reportSectionToCswp39.ts.
import { Calendar, ShieldAlert, AlertTriangle, ArrowRight, Briefcase } from 'lucide-react'
import { Link } from 'react-router'
import clsx from 'clsx'
import type { AssessmentResult } from '../../../hooks/assessmentTypes'
import { RiskGauge } from '../../shared/widgets/RiskGauge'
import { riskConfig } from '@/data/riskConfig'
import { GlossaryAutoWrap } from '../../PKILearning/common/GlossaryAutoWrap'
import { ReportTimelineStrip } from '../ReportTimelineStrip'
import { CollapsibleSection } from './reportContentShared'
import { RiskScoreWorking } from '../RiskScoreWorking'

export const CountryTimelineSection = ({
  country,
  defaultOpen,
}: {
  country: string
  defaultOpen: boolean
}) => (
  <CollapsibleSection
    id="report-section-countryTimeline"
    title={country ? `${country} PQC Migration Timeline` : 'Country PQC Migration Timeline'}
    icon={<Calendar className="text-primary" size={20} />}
    defaultOpen={defaultOpen}
    infoTip="countryTimeline"
  >
    <ReportTimelineStrip countryName={country} />
    <Link
      to={country ? `/timeline?country=${encodeURIComponent(country)}` : '/timeline'}
      className="flex items-center gap-1.5 text-xs text-primary hover:underline mt-3 print:hidden"
    >
      <ArrowRight size={12} />
      View full {country ? `${country} ` : ''}timeline
    </Link>
  </CollapsibleSection>
)

export const RiskScoreSection = ({
  result,
  previousRiskScore,
  lastModifiedAt,
  defaultOpen,
  industry,
}: {
  result: AssessmentResult
  previousRiskScore: number | null
  lastModifiedAt: string | null
  defaultOpen: boolean
  /** Drives which composite weighting the "how this was calculated" table
   *  reports — B+ remediation 3.6. */
  industry: string
}) => {
  const config = riskConfig[result.riskLevel]
  return (
    <CollapsibleSection
      id="report-section-riskScore"
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
        <p className="text-[10px] text-muted-foreground text-center mt-1 font-mono print:hidden">
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
        {/* Neutral, role-independent explanation of the number — the
            persona-flavored take now leads in the Verdict block above,
            so this section no longer repeats result.personaNarrative.
            Glossary tooltips help every persona decode acronyms
            (execs/ops most of all), not just the curious reader. */}
        <GlossaryAutoWrap>{result.narrative}</GlossaryAutoWrap>
      </p>
      {result.boosts && result.boosts.length > 0 && result.preBoostScore !== undefined && (
        <div className="mt-4 p-3 rounded-lg border border-border bg-muted/20 print:bg-transparent">
          <p className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground mb-2">
            Situational boosts raised this score from {result.preBoostScore} to {result.riskScore}
          </p>
          <ul className="space-y-1">
            {result.boosts.map((b) => (
              <li key={b.id} className="flex items-start gap-2 text-xs text-foreground">
                <span className="text-destructive shrink-0 font-mono">
                  +{(b.delta * 100).toFixed(0)}%
                </span>
                <span>{b.label}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {/* B+ remediation 3.6 (2026-08-10): the boosts block above already showed
          the LAST step of the calculation. This shows the steps before it —
          which weights this industry uses and what each category contributed —
          so the number stops arriving as an oracle. */}
      <RiskScoreWorking result={result} industry={industry} />
    </CollapsibleSection>
  )
}

export const KeyFindingsSection = ({
  keyFindings,
  defaultOpen,
}: {
  keyFindings: string[]
  defaultOpen: boolean
}) => (
  <CollapsibleSection
    id="report-section-keyFindings"
    title="Key Findings"
    icon={<AlertTriangle className="text-warning" size={20} />}
    defaultOpen={defaultOpen}
    className="border-l-4 border-l-warning"
    infoTip="keyFindings"
  >
    <ul className="space-y-2">
      {keyFindings.map((finding, i) => (
        <li key={i} className="flex gap-2 text-sm text-muted-foreground leading-relaxed">
          <span className="text-warning font-bold shrink-0">{i + 1}.</span>
          {finding}
        </li>
      ))}
    </ul>
  </CollapsibleSection>
)

export const ExecutiveSummarySection = ({
  executiveSummary,
  defaultOpen,
}: {
  executiveSummary: string
  defaultOpen: boolean
}) => (
  <CollapsibleSection
    id="report-section-executiveSummary"
    title="Executive Summary"
    icon={<Briefcase className="text-primary" size={20} />}
    defaultOpen={defaultOpen}
    className="border-l-4 border-l-primary"
    infoTip="executiveSummary"
  >
    <p className="text-sm text-muted-foreground leading-relaxed">{executiveSummary}</p>
  </CollapsibleSection>
)
