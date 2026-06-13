// SPDX-License-Identifier: GPL-3.0-only
import React, { useState } from 'react'
import { ChevronDown, Flag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FRAMEWORK_PHASES, PHASE_ORDER, type FrameworkPhase } from '@/data/frameworkPhases'

/**
 * Milestone-gate column / legend (PER-PAGE-CHANGES Timeline #3).
 *
 * The Gantt's Status field tells you *when* things are due; the framework's
 * Phase 4 §4.6 (p.88) decision gates G0–G7 tell you *what must be true to
 * advance*. This surfaces each phase's gate criterion and decision authority
 * directly from `FRAMEWORK_PHASES[*].gate`, so the timeline gains the gate model
 * it lacks. Phases without a gate (continuous / spanning) are shown as such.
 *
 * Additive: collapsed by default — the Gantt is unchanged unless expanded.
 */

// Ordered phases that actually define a gate (G0–G7).
const GATED_PHASES: FrameworkPhase[] = PHASE_ORDER.map(
  // eslint-disable-next-line security/detect-object-injection
  (id) => FRAMEWORK_PHASES[id]
).filter((p): p is FrameworkPhase => p.gate !== undefined)

export const MilestoneGateColumn: React.FC = () => {
  const [expanded, setExpanded] = useState(false)

  return (
    <section
      className="glass-panel p-4 mb-4 border border-border"
      aria-labelledby="milestone-gate-heading"
      data-testid="milestone-gate-column"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Flag size={20} className="text-primary mt-0.5 shrink-0" aria-hidden="true" />
          <div>
            <h2
              id="milestone-gate-heading"
              className="text-base font-bold text-foreground flex items-center gap-2 flex-wrap"
            >
              Milestone Gates (G0–G7)
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded border border-primary/30 bg-primary/10 text-primary uppercase tracking-wide">
                Phase 4 · Governance
              </span>
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              What must be true to advance — each phase&apos;s decision gate criterion and
              authority.
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          aria-controls="milestone-gate-body"
          className="shrink-0 text-xs gap-1"
        >
          {expanded ? 'Hide' : 'Show gates'}
          <ChevronDown
            size={14}
            aria-hidden="true"
            className={`transition-transform ${expanded ? 'rotate-180' : ''}`}
          />
        </Button>
      </div>

      {expanded && (
        <div id="milestone-gate-body" className="mt-4">
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-muted/40 text-muted-foreground">
                  <th className="text-left font-semibold px-3 py-2">Gate</th>
                  <th className="text-left font-semibold px-3 py-2">Phase</th>
                  <th className="text-left font-semibold px-3 py-2">Must be true to advance</th>
                  <th className="text-left font-semibold px-3 py-2">Decision authority</th>
                </tr>
              </thead>
              <tbody>
                {GATED_PHASES.map((p) => (
                  <tr
                    key={p.id}
                    className="border-t border-border"
                    data-testid={`gate-row-${p.gate!.id}`}
                  >
                    <td className="px-3 py-2">
                      <span className="font-mono font-bold text-primary">{p.gate!.id}</span>
                    </td>
                    <td className="px-3 py-2 text-foreground whitespace-nowrap">
                      {p.number !== null ? `P${p.number} · ` : ''}
                      {p.name}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">{p.gate!.criterion}</td>
                    <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">
                      {p.gate!.authority}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[10px] text-muted-foreground mt-3">
            Source: Applied Quantum Phase 4 Activity 4.6 (p.88). Gates are informational labels in
            v1 — phase context, not enforced sign-off.
          </p>
        </div>
      )}
    </section>
  )
}
