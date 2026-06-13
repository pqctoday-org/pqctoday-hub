// SPDX-License-Identifier: GPL-3.0-only
import React, { useState } from 'react'
import { ChevronDown, Map } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ROADMAP_5_YEAR } from '@/data/regulatoryTimelines'
import { FRAMEWORK_PHASES, type PhaseId } from '@/data/frameworkPhases'

/**
 * "Build Your Roadmap" overlay (PER-PAGE-CHANGES Timeline #1).
 *
 * Layers the framework's Phase 4 §4.2 (p.84–85) Year 1–5 milestone skeleton
 * (Foundation → Tier-1 → Bulk → Long Tail/OT → Hardening) over the national
 * deadline backdrop, turning the passive comparative Gantt into an actionable
 * org template. Each year is annotated with the AQ phases it advances, read
 * from `FRAMEWORK_PHASES`.
 *
 * Additive: collapsed by default — the Gantt is unchanged unless expanded.
 */

const phaseBadge = (id: PhaseId): string => {
  // eslint-disable-next-line security/detect-object-injection
  const def = FRAMEWORK_PHASES[id]
  return def.number === null ? def.name : `P${def.number}`
}

export const RoadmapOverlay: React.FC = () => {
  const [expanded, setExpanded] = useState(false)

  return (
    <section
      className="glass-panel p-4 mb-4 border border-border"
      aria-labelledby="roadmap-overlay-heading"
      data-testid="roadmap-overlay"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Map size={20} className="text-primary mt-0.5 shrink-0" aria-hidden="true" />
          <div>
            <h2
              id="roadmap-overlay-heading"
              className="text-base font-bold text-foreground flex items-center gap-2 flex-wrap"
            >
              Build Your Roadmap
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded border border-primary/30 bg-primary/10 text-primary uppercase tracking-wide">
                Phase 4 · Roadmap &amp; Governance
              </span>
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Superimpose the framework&apos;s 5-year migration skeleton over the national deadline
              backdrop — a template for your own multi-year plan.
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          aria-controls="roadmap-overlay-body"
          className="shrink-0 text-xs gap-1"
        >
          {expanded ? 'Hide' : 'Show roadmap'}
          <ChevronDown
            size={14}
            aria-hidden="true"
            className={`transition-transform ${expanded ? 'rotate-180' : ''}`}
          />
        </Button>
      </div>

      {expanded && (
        <div id="roadmap-overlay-body" className="mt-4">
          <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {ROADMAP_5_YEAR.map((y) => (
              <li
                key={y.year}
                className="rounded-lg border border-border bg-muted/30 p-3 flex flex-col"
                data-testid={`roadmap-year-${y.year}`}
              >
                <div className="flex items-baseline justify-between gap-2 mb-1">
                  <span className="text-xs font-bold text-primary uppercase tracking-wide">
                    Year {y.year}
                  </span>
                </div>
                <span className="text-sm font-semibold text-foreground mb-2">{y.theme}</span>
                <ul className="space-y-1 mb-2 flex-1">
                  {y.milestones.map((m) => (
                    <li key={m} className="text-[11px] text-muted-foreground flex gap-1.5">
                      <span aria-hidden="true" className="text-primary/70">
                        ▸
                      </span>
                      <span>{m}</span>
                    </li>
                  ))}
                </ul>
                <div className="flex flex-wrap gap-1 pt-1 border-t border-border/60">
                  {y.phases.map((p) => (
                    <span
                      key={p}
                      className="text-[9px] font-medium px-1 py-0.5 rounded border border-primary/30 bg-primary/5 text-primary"
                    >
                      {phaseBadge(p)}
                    </span>
                  ))}
                </div>
              </li>
            ))}
          </ol>
          <p className="text-[10px] text-muted-foreground mt-3">
            Source: Applied Quantum Phase 4 Activity 4.2 (p.84–85). The national deadlines above are
            the backdrop; this is the template you execute against them.
          </p>
        </div>
      )}
    </section>
  )
}
