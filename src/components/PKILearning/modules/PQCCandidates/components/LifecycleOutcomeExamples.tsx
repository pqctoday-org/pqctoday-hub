// SPDX-License-Identifier: AGPL-3.0-only
import React from 'react'
import { Link } from 'react-router'
import { ExternalLink, BookOpen } from 'lucide-react'
import {
  LIFECYCLE_OUTCOME_DIFFERENCE,
  LIFECYCLE_OUTCOME_EXAMPLES,
  type OutcomeSource,
} from '../data/lifecycleOutcomes'

const SourceLink: React.FC<{ source: OutcomeSource }> = ({ source }) => {
  if (source.libraryRef) {
    return (
      <Link
        to={`/library?ref=${encodeURIComponent(source.libraryRef)}`}
        className="inline-flex items-center gap-1 text-primary hover:underline"
      >
        <BookOpen size={11} /> {source.label}
      </Link>
    )
  }
  return (
    <a
      href={source.url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-primary hover:underline"
    >
      <ExternalLink size={11} /> {source.label}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  )
}

/** Two real outcomes of the selection process, side by side, with their sources. */
export const LifecycleOutcomeExamples: React.FC = () => (
  <div className="space-y-3" data-testid="lifecycle-outcome-examples">
    <h3 className="text-base font-bold text-foreground">Two real outcomes, compared</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {LIFECYCLE_OUTCOME_EXAMPLES.map((ex) => (
        <div key={ex.id} className="rounded-lg border border-border bg-card/50 p-4 space-y-2">
          <div>
            <h4 className="text-sm font-bold text-foreground">{ex.scheme}</h4>
            <div className="text-xs font-semibold text-status-warning">{ex.outcome}</div>
          </div>
          <ol className="space-y-1.5">
            {ex.steps.map((step) => (
              <li key={step.date} className="flex items-start gap-2 text-xs">
                <span className="font-mono text-muted-foreground w-20 shrink-0">{step.date}</span>
                <span className="text-foreground/85 leading-relaxed">{step.text}</span>
              </li>
            ))}
          </ol>
          <p className="text-xs text-muted-foreground leading-relaxed">{ex.meaning}</p>
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px]">
            {ex.sources.map((s) => (
              <SourceLink key={s.label} source={s} />
            ))}
          </div>
        </div>
      ))}
    </div>
    <p className="text-xs text-foreground/80 leading-relaxed rounded-md border border-primary/30 bg-primary/5 p-3">
      <span className="font-semibold">The difference: </span>
      {LIFECYCLE_OUTCOME_DIFFERENCE}
    </p>
  </div>
)
