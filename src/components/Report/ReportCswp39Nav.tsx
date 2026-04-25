// SPDX-License-Identifier: GPL-3.0-only
import { Link } from 'react-router-dom'
import { REPORT_SECTION_LABELS, getReportSectionsForStep } from '@/data/reportSectionToCswp39'
import type { CSWP39StepId } from '@/components/shared/CSWP39StepBadge'

const STEPS: { id: CSWP39StepId; number: number; title: string }[] = [
  { id: 'govern', number: 1, title: 'Govern' },
  { id: 'inventory', number: 2, title: 'Inventory' },
  { id: 'identify-gaps', number: 3, title: 'Identify Gaps' },
  { id: 'prioritise', number: 4, title: 'Prioritise' },
  { id: 'implement', number: 5, title: 'Implement' },
]

/**
 * Educational legend rendered at the top of /report. Maps each CSWP.39 step
 * to the report sections that contribute to it, so the long-form report tells
 * the same 5-step story as the Command Center. Links jump back to /business.
 */
export function ReportCswp39Nav() {
  return (
    <section className="glass-panel p-4 mb-6 print:hidden" aria-labelledby="cswp39-nav-heading">
      <div className="flex items-baseline justify-between gap-3 flex-wrap mb-3">
        <h2 id="cswp39-nav-heading" className="text-base font-semibold text-foreground">
          CSWP.39 view of this report
        </h2>
        <p className="text-xs text-muted-foreground">
          The sections below are organised on /report by topic. This legend re-groups them under the
          5-step CSWP.39 narrative so the journey across /business → /assess → /report stays
          coherent.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {STEPS.map((step) => {
          const sections = getReportSectionsForStep(step.id)
          return (
            <Link
              key={step.id}
              to={`/business#step-${step.id}`}
              className="rounded-md border border-border bg-muted/30 p-3 hover:bg-primary/10 hover:border-primary/40 transition-colors no-underline"
              title={`Open the ${step.title} step on Command Center`}
            >
              <div className="text-[10px] font-semibold uppercase tracking-wide text-primary">
                Step {step.number}
              </div>
              <div className="text-sm font-semibold text-foreground mt-0.5">{step.title}</div>
              {sections.length > 0 && (
                <ul className="mt-2 space-y-0.5">
                  {sections.map((id) => (
                    <li key={id} className="text-[11px] text-muted-foreground">
                      • {REPORT_SECTION_LABELS[id]}
                    </li>
                  ))}
                </ul>
              )}
            </Link>
          )
        })}
      </div>
    </section>
  )
}
