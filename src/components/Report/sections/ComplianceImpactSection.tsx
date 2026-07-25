// SPDX-License-Identifier: GPL-3.0-only
// /report's "Compliance Impact" section (REPORT_SECTION_ORDER:
// 'complianceImpact'). Extracted from ReportContent.tsx — see
// reportSectionToCswp39.ts.
import { Link } from 'react-router'
import { CheckCircle, ArrowRight, BookOpen, Calendar } from 'lucide-react'
import clsx from 'clsx'
import type { ComplianceImpact } from '../../../hooks/assessmentTypes'
import { complianceFrameworks } from '../../../data/complianceData'
import { ApplicabilityPanel } from '../../applicability/ApplicabilityPanel'
import { AskAssistantButton } from '../../ui/AskAssistantButton'
import { CollapsibleSection } from './reportContentShared'

export const ComplianceImpactSection = ({
  complianceImpacts,
  industry,
  country,
  defaultOpen,
}: {
  complianceImpacts: ComplianceImpact[]
  industry: string
  country: string
  defaultOpen: boolean
}) => (
  <CollapsibleSection
    id="report-section-complianceImpact"
    title="Compliance Impact"
    icon={<CheckCircle className="text-primary" size={20} />}
    defaultOpen={defaultOpen}
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
      {complianceImpacts.map((c) => (
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
            const fullFw = complianceFrameworks.find((f) => f.label === c.framework)
            if (!fullFw) return null
            const hasRefs = fullFw.libraryRefs.length > 0 || fullFw.timelineRefs.length > 0
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
        to={`/compliance?tab=compliance${industry ? `&industry=${encodeURIComponent(industry)}` : ''}${country ? `&country=${encodeURIComponent(country)}` : ''}`}
        className="flex items-center gap-1.5 text-xs text-primary hover:underline mt-3 print:hidden"
      >
        <ArrowRight size={12} />
        Explore all compliance frameworks
      </Link>
    </div>
    <div className="mt-4 pt-4 border-t border-border">
      <h4 className="text-sm font-semibold text-foreground mb-2">Profile-driven applicability</h4>
      <p className="text-xs text-muted-foreground mb-3">
        Frameworks, threats, library docs, and milestones the engine identifies as applicable to
        your industry and country.
      </p>
      <ApplicabilityPanel variant="report-section" />
    </div>
  </CollapsibleSection>
)
