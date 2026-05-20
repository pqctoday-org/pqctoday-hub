// SPDX-License-Identifier: GPL-3.0-only
import React, { useMemo, useCallback } from 'react'
import {
  GraduationCap,
  Briefcase,
  BookOpen,
  ArrowRight,
  Download,
  ChevronRight,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { generateNiceGapReport } from '@/utils/niceGapReport'
import { NICE_COMPETENCY_AREAS } from '@/data/niceFramework'
import type { AssessmentResult, AssessmentInput } from '@/hooks/assessmentTypes'
import type { NiceCompetencyAreaId } from '@/data/niceFramework'
import { Button } from '../ui/button'

// ---------------------------------------------------------------------------
// Tier badge
// ---------------------------------------------------------------------------
const TIER_CONFIG = {
  awareness: {
    label: 'Awareness',
    className: 'bg-primary/10 text-primary border border-primary/20',
  },
  practitioner: {
    label: 'Practitioner',
    className: 'bg-warning/10 text-warning border border-warning/20',
  },
  expert: {
    label: 'Expert',
    className: 'bg-destructive/10 text-destructive border border-destructive/20',
  },
}

const CA_COLORS: Partial<Record<NiceCompetencyAreaId, string>> = {
  'CA-CRYPTO': 'bg-primary/10 text-primary',
  'CA-RISK': 'bg-warning/10 text-warning',
  'CA-GOVCOMP': 'bg-destructive/10 text-destructive',
  'CA-NETDEF': 'bg-success/10 text-success',
  'CA-IDENT': 'bg-primary/15 text-primary',
  'CA-DATASEC': 'bg-warning/15 text-warning',
  'CA-SYSARCH': 'bg-muted-foreground/15 text-muted-foreground',
  'CA-SECPROG': 'bg-success/15 text-success',
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface NiceGapReportSectionProps {
  result: AssessmentResult
  input: AssessmentInput
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export const NiceGapReportSection: React.FC<NiceGapReportSectionProps> = ({ result, input }) => {
  const report = useMemo(() => generateNiceGapReport(input, result), [input, result])

  const handleExport = useCallback(() => {
    const blob = new Blob([JSON.stringify(report.exportData, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `pqctoday-nice-gap-report-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [report])

  if (report.competencyGaps.length === 0) return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="text-sm text-muted-foreground">
            Mapped to <span className="font-medium text-foreground">NICE Framework</span> (NIST SP
            800-181 Rev 1 + IR 8355) · Self-attested,{' '}
            <a
              href="https://www.nist.gov/nice/framework"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-primary"
            >
              pqctoday.org
            </a>
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleExport}
          className="gap-2 text-sm print:hidden shrink-0"
        >
          <Download size={14} />
          Export JSON
        </Button>
      </div>

      {/* Section A: Competency Gaps */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <GraduationCap size={16} className="text-primary shrink-0" />
          Competency Areas to Develop
        </h3>
        <div className="space-y-3">
          {report.competencyGaps.map((gap) => {
            const tierCfg = TIER_CONFIG[gap.targetTier]
            const caColor = CA_COLORS[gap.competencyAreaId] ?? 'bg-muted text-foreground'
            const ca = NICE_COMPETENCY_AREAS[gap.competencyAreaId]
            return (
              <div key={gap.competencyAreaId} className="glass-panel p-4 space-y-2">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs font-mono px-2 py-0.5 rounded ${caColor}`}>
                      {gap.competencyAreaId}
                    </span>
                    <span className="text-sm font-medium text-foreground">{gap.title}</span>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${tierCfg.className}`}
                  >
                    {tierCfg.label}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{gap.rationale}</p>
                {gap.recommendedModules.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {gap.recommendedModules.map((moduleId) => (
                      <Link
                        key={moduleId}
                        to={`/learn/${moduleId}`}
                        className="inline-flex items-center gap-1 text-xs bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground px-2 py-1 rounded transition-colors"
                      >
                        <BookOpen size={10} />
                        {moduleId}
                      </Link>
                    ))}
                  </div>
                )}
                <p className="text-xs text-muted-foreground/60">
                  Sample TKS:{' '}
                  {ca.tksSample
                    .slice(0, 2)
                    .map((t) => t.id)
                    .join(' · ')}
                </p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Section B: Work Roles */}
      {report.workRoleRecommendations.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Briefcase size={16} className="text-primary shrink-0" />
            Work Roles to Hire or Upskill
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {report.workRoleRecommendations.map((role) => (
              <div key={role.workRoleId} className="glass-panel p-4 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-muted-foreground">{role.niceCode}</span>
                  <span className="text-sm font-medium text-foreground">{role.title}</span>
                </div>
                <p className="text-xs text-muted-foreground">{role.rationale}</p>
                {role.onboardingModules.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {role.onboardingModules.slice(0, 3).map((m) => (
                      <Link
                        key={m}
                        to={`/learn/${m}`}
                        className="text-xs bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground px-1.5 py-0.5 rounded transition-colors"
                      >
                        {m}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section C: Learning Sequence */}
      {report.learningSequence.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <ArrowRight size={16} className="text-primary shrink-0" />
            Recommended Learning Sequence
          </h3>
          <div className="space-y-1.5">
            {report.learningSequence.slice(0, 8).map((step, idx) => {
              const caColor = CA_COLORS[step.competencyAreaId] ?? 'bg-muted text-foreground'
              return (
                <Link
                  key={step.moduleId}
                  to={`/learn/${step.moduleId}`}
                  className="flex items-center gap-3 glass-panel px-3 py-2.5 hover:bg-muted/30 transition-colors group"
                >
                  <span className="text-xs font-mono text-muted-foreground w-5 shrink-0 text-right">
                    {idx + 1}
                  </span>
                  <span className={`text-xs px-1.5 py-0.5 rounded font-mono shrink-0 ${caColor}`}>
                    {step.competencyAreaId}
                  </span>
                  <span className="text-sm text-foreground flex-1 truncate">{step.moduleId}</span>
                  <ChevronRight
                    size={14}
                    className="text-muted-foreground/40 group-hover:text-muted-foreground transition-colors shrink-0"
                  />
                </Link>
              )
            })}
            {report.learningSequence.length > 8 && (
              <Link
                to="/learn"
                className="flex items-center gap-2 text-xs text-primary hover:underline px-3 py-2"
              >
                +{report.learningSequence.length - 8} more modules in the full learning path
                <ArrowRight size={12} />
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Partial coverage note */}
      {report.partialCoverage.length > 0 && (
        <p className="text-xs text-muted-foreground/70 border-t border-border pt-3">
          Partial coverage: your active migration already addresses{' '}
          {report.partialCoverage.join(', ')} — modules shown for completion.
        </p>
      )}
    </div>
  )
}
