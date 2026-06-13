// SPDX-License-Identifier: GPL-3.0-only
import React, { useState } from 'react'
import { ChevronDown, Info, RefreshCw, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  PHASE_REGULATION_SATISFIES,
  CNSA_2_0_BY_CLASS,
  type SatisfiesItEntry,
} from '@/data/regulatoryTimelines'
import { FRAMEWORK_PHASES, type PhaseId } from '@/data/frameworkPhases'

/**
 * Timeline planning-context panel — bundles three small framework notes that
 * turn the deadline backdrop into planning context:
 *
 *  #5  Phase → regulation "what output satisfies it" reference (p.156–157) —
 *      connects a deadline to the artifact an org must produce.
 *  #6  Infrastructure-refresh alignment + Accelerated-Profile note
 *      (§4.3 / §4.5 / §4.7, p.84–89) — dates are movable planning assumptions.
 *  #7  CNSA 2.0 per-class deadline labels reconciled to framework wording
 *      (Mapping table p.156) via `CNSA_2_0_BY_CLASS`.
 *
 * Additive: collapsed by default — the Gantt is unchanged unless expanded.
 */

const phaseLabel = (id: PhaseId): string => {
  // eslint-disable-next-line security/detect-object-injection
  const def = FRAMEWORK_PHASES[id]
  return def.number === null ? def.name : `P${def.number} · ${def.name}`
}

const SatisfiesRow: React.FC<{ entry: SatisfiesItEntry }> = ({ entry }) => (
  <tr className="border-t border-border" data-testid={`satisfies-row-${entry.regulation}`}>
    <td className="px-3 py-2 text-foreground whitespace-nowrap font-medium">{entry.regulation}</td>
    <td className="px-3 py-2 text-muted-foreground">{entry.satisfiedBy}</td>
    <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">
      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded border border-primary/30 bg-primary/5 text-primary">
        {phaseLabel(entry.phase)}
      </span>
    </td>
  </tr>
)

export const TimelinePlanningNotes: React.FC = () => {
  const [expanded, setExpanded] = useState(false)

  return (
    <section
      className="glass-panel p-4 mb-4 border border-border"
      aria-labelledby="planning-notes-heading"
      data-testid="timeline-planning-notes"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Info size={20} className="text-primary mt-0.5 shrink-0" aria-hidden="true" />
          <div>
            <h2
              id="planning-notes-heading"
              className="text-base font-bold text-foreground flex items-center gap-2 flex-wrap"
            >
              Planning Context
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded border border-primary/30 bg-primary/10 text-primary uppercase tracking-wide">
                Phase 4 · Foundations
              </span>
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              What each deadline satisfies, how to piggyback refresh cycles, and the CNSA 2.0
              per-class deadlines.
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          aria-controls="planning-notes-body"
          className="shrink-0 text-xs gap-1"
        >
          {expanded ? 'Hide' : 'Show context'}
          <ChevronDown
            size={14}
            aria-hidden="true"
            className={`transition-transform ${expanded ? 'rotate-180' : ''}`}
          />
        </Button>
      </div>

      {expanded && (
        <div id="planning-notes-body" className="mt-4 space-y-5">
          {/* #5 — phase → regulation "what satisfies it" */}
          <div data-testid="satisfies-it-section">
            <h3 className="text-xs font-bold text-foreground mb-2">
              What output satisfies each mandate?
            </h3>
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-muted/40 text-muted-foreground">
                    <th className="text-left font-semibold px-3 py-2">Regulation</th>
                    <th className="text-left font-semibold px-3 py-2">Satisfied by</th>
                    <th className="text-left font-semibold px-3 py-2">Phase</th>
                  </tr>
                </thead>
                <tbody>
                  {PHASE_REGULATION_SATISFIES.map((entry) => (
                    <SatisfiesRow key={entry.regulation} entry={entry} />
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              Source: Reg &amp; Standards Alignment Map (p.156–157).
            </p>
          </div>

          {/* #7 — CNSA 2.0 per-class reconcile */}
          <div data-testid="cnsa-by-class-section">
            <h3 className="text-xs font-bold text-foreground mb-2 flex items-center gap-1.5">
              <ShieldCheck size={13} className="text-destructive" aria-hidden="true" />
              CNSA 2.0 deadlines by equipment class
            </h3>
            <ul className="space-y-1">
              {CNSA_2_0_BY_CLASS.map((c) => (
                <li
                  key={c.class}
                  className="flex items-start gap-2 text-xs"
                  data-testid={`cnsa-class-${c.year}`}
                >
                  <span className="font-mono font-bold text-destructive w-12 shrink-0">
                    {c.year}
                  </span>
                  <span className="text-foreground font-medium">{c.class}</span>
                  <span className="text-muted-foreground">— {c.requirement}</span>
                </li>
              ))}
            </ul>
            <p className="text-[10px] text-muted-foreground mt-1">
              Reconciled to framework Mapping-table wording (p.156): networking by 2030;
              web/cloud/OS by 2033; all NSS by 2035.
            </p>
          </div>

          {/* #6 — infra-refresh + accelerated-profile note */}
          <div
            className="rounded-lg border border-primary/30 bg-primary/5 p-3"
            data-testid="infra-refresh-note"
          >
            <h3 className="text-xs font-bold text-foreground mb-1.5 flex items-center gap-1.5">
              <RefreshCw size={13} className="text-primary" aria-hidden="true" />
              These dates are movable planning assumptions
            </h3>
            <ul className="space-y-1.5 text-[11px] text-muted-foreground">
              <li>
                <span className="font-semibold text-foreground">Piggyback refresh cycles.</span>{' '}
                Align PQC upgrades with scheduled hardware/software refreshes to fold migration cost
                into planned spend (Phase 4 §4.3, p.84–85).
              </li>
              <li>
                <span className="font-semibold text-foreground">
                  Accelerated-Execution Profile.
                </span>{' '}
                If CRQC estimates shorten, a regulatory deadline compresses, or a cryptanalytic
                event lands, shift to the pre-drafted accelerated track (Phase 4 §4.5 / §4.7,
                p.87–89).
              </li>
            </ul>
          </div>
        </div>
      )}
    </section>
  )
}
