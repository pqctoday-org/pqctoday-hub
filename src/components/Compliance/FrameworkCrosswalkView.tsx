// SPDX-License-Identifier: GPL-3.0-only
/**
 * App. G — "Crosswalk to Other Frameworks" view.
 *
 * Surfaces the per-phase {@link FrameworkPhase.crosswalk} data that already
 * lives in `@/data/frameworkPhases` (spec §6.7, App. G). For each Migration
 * Program phase it shows the equivalent step in NIST CSF 2.0, the PQCC roadmap,
 * ETSI TR 103 619, and the Dutch PQC Migration Handbook.
 *
 * Pure read over `FRAMEWORK_PHASES` — additive, no data is authored here.
 * Rendered as a section inside the Compliance Framework Explorer
 * (`CSWP39Explorer`); see PER-PAGE-CHANGES.md Compliance #1.
 */
import React from 'react'
import { Columns3 } from 'lucide-react'
import { FRAMEWORK_PHASES, PHASE_ORDER } from '@/data/frameworkPhases'
import type { FrameworkPhase } from '@/data/frameworkPhases'

/** Column definition for the crosswalk table — label + accessor over a phase. */
const CROSSWALK_COLUMNS: ReadonlyArray<{
  key: string
  label: string
  render: (phase: FrameworkPhase) => React.ReactNode
}> = [
  {
    key: 'nistCsf',
    label: 'NIST CSF 2.0',
    render: (phase) =>
      phase.crosswalk.nistCsf.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {phase.crosswalk.nistCsf.map((code) => (
            <span
              key={code}
              className="inline-block rounded bg-muted/60 border border-border px-1.5 py-0.5 text-[10px] font-mono text-foreground/80"
            >
              {code}
            </span>
          ))}
        </div>
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
  },
  {
    key: 'pqcc',
    label: 'PQCC Roadmap',
    render: (phase) => phase.crosswalk.pqcc || <span className="text-muted-foreground">—</span>,
  },
  {
    key: 'etsiTr103619',
    label: 'ETSI TR 103 619',
    render: (phase) =>
      phase.crosswalk.etsiTr103619 || <span className="text-muted-foreground">—</span>,
  },
  {
    key: 'dutchHandbook',
    label: 'Dutch PQC Migration Handbook',
    render: (phase) =>
      phase.crosswalk.dutchHandbook || <span className="text-muted-foreground">—</span>,
  },
]

/** Human-readable phase label, e.g. "Phase 3 — Risk Scoring" or "Foundations". */
function phaseLabel(phase: FrameworkPhase): string {
  return phase.number === null ? phase.name : `Phase ${phase.number} — ${phase.name}`
}

export const FrameworkCrosswalkView: React.FC = () => {
  // Iterate in canonical rail order (0→1∥2→3→4→5⇄6, 7, Foundations).
  const phases = PHASE_ORDER.map((id): FrameworkPhase => Reflect.get(FRAMEWORK_PHASES, id))

  return (
    <section
      id="appendix-g-crosswalk"
      className="glass-panel p-5 border border-border rounded-lg scroll-mt-24"
      aria-labelledby="appendix-g-crosswalk-heading"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 rounded-lg bg-status-info/10">
          <Columns3 size={20} className="text-status-info" />
        </div>
        <div>
          <h2 id="appendix-g-crosswalk-heading" className="text-base font-bold text-foreground">
            App. G — Crosswalk to Other Frameworks
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            How each Migration Program phase maps onto NIST CSF 2.0, the PQCC roadmap, ETSI TR 103
            619, and the Dutch PQC Migration Handbook. Read straight across a row to find the
            equivalent step in any framework.
          </p>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs border border-border">
          <caption className="sr-only">
            Migration Program phases mapped to NIST CSF 2.0, PQCC, ETSI TR 103 619, and the Dutch
            PQC Migration Handbook.
          </caption>
          <thead>
            <tr className="bg-muted/60">
              <th scope="col" className="text-left p-2 border-b border-border align-bottom">
                Migration Program phase
              </th>
              {CROSSWALK_COLUMNS.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className="text-left p-2 border-b border-border align-bottom"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {phases.map((phase) => (
              <tr key={phase.id}>
                <th
                  scope="row"
                  className="p-2 border-b border-border font-bold align-top whitespace-nowrap text-left"
                >
                  {phaseLabel(phase)}
                  <div className="text-[10px] font-normal text-muted-foreground">
                    {phase.tagline}
                  </div>
                </th>
                {CROSSWALK_COLUMNS.map((col) => (
                  <td
                    key={col.key}
                    className="p-2 border-b border-border align-top text-foreground/80"
                  >
                    {col.render(phase)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
