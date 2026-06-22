// SPDX-License-Identifier: GPL-3.0-only
/**
 * Hybrid-position / jurisdiction matrix (PER-PAGE-CHANGES.md Compliance #3,
 * Applied Quantum App. D, p.194).
 *
 * For each major regulatory regime it states the official stance on *hybrid*
 * (classical + PQC composite) deployments: mandated, interim/permitted, or
 * discouraged in favour of pure PQC. Boards need this to know whether a hybrid
 * design choice will pass muster in a given jurisdiction.
 *
 * Self-contained authoritative reference (App. D data lives here under Compliance
 * ownership). Additive section in the Compliance Framework Explorer; pure render.
 */
import React from 'react'
import { Globe } from 'lucide-react'

/** The official stance a regime takes on hybrid (composite) PQC deployments. */
type HybridStance = 'mandated' | 'interim' | 'discouraged'

interface JurisdictionRow {
  /** Regulatory regime / authority. */
  regime: string
  /** Jurisdiction label. */
  jurisdiction: string
  /** Stance on hybrid deployments. */
  stance: HybridStance
  /** One-line rationale / citation note. */
  position: string
}

const STANCE_META: Record<HybridStance, { label: string; chip: string; cell: string }> = {
  mandated: {
    label: 'Hybrid mandated',
    chip: 'bg-status-success/10 border-status-success/30 text-status-success',
    cell: 'bg-status-success/5',
  },
  interim: {
    label: 'Hybrid permitted (interim)',
    chip: 'bg-status-warning/10 border-status-warning/30 text-status-warning',
    cell: 'bg-status-warning/5',
  },
  discouraged: {
    label: 'Pure PQC preferred',
    chip: 'bg-status-info/10 border-status-info/30 text-status-info',
    cell: 'bg-status-info/5',
  },
}

/** Authoritative App. D rows — regime stance on hybrid/composite deployments. */
const JURISDICTION_ROWS: ReadonlyArray<JurisdictionRow> = [
  {
    regime: 'BSI (TR-02102)',
    jurisdiction: 'Germany / EU',
    stance: 'mandated',
    position: 'Requires hybrid (classical + PQC) during the transition; pure PQC not yet trusted.',
  },
  {
    regime: 'ANSSI',
    jurisdiction: 'France',
    stance: 'mandated',
    position: 'Defence-in-depth: hybrid required until PQC schemes have longer field exposure.',
  },
  {
    regime: 'NCSC',
    jurisdiction: 'United Kingdom',
    stance: 'discouraged',
    position: 'Prefers pure standardised PQC; hybrid acceptable only where unavoidable.',
  },
  {
    regime: 'NSA / CNSA 2.0',
    jurisdiction: 'United States (NSS)',
    stance: 'interim',
    position: 'Hybrid tolerated as interim; target end-state is pure CNSA-2.0 algorithms.',
  },
  {
    regime: 'NIST',
    jurisdiction: 'United States (civilian)',
    stance: 'interim',
    position: 'Permits hybrid key-establishment as a bridging measure during migration.',
  },
  {
    regime: 'ETSI TR 103 619',
    jurisdiction: 'EU (standards)',
    stance: 'interim',
    position: 'Hybrid recommended for the migration window; converge to PQC-only over time.',
  },
]

export const HybridJurisdictionMatrix: React.FC = () => {
  return (
    <section
      id="hybrid-jurisdiction-matrix"
      className="glass-panel p-5 border border-border rounded-lg scroll-mt-24"
      aria-labelledby="hybrid-jurisdiction-heading"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 rounded-lg bg-status-info/10">
          <Globe size={20} className="text-status-info" />
        </div>
        <div>
          <h2 id="hybrid-jurisdiction-heading" className="text-base font-bold text-foreground">
            Hybrid position by jurisdiction (App. D)
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Whether each regime mandates, permits (interim), or discourages hybrid (classical + PQC
            composite) deployments — the answer differs sharply by jurisdiction.
          </p>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 mb-3">
        {Object.entries(STANCE_META).map(([key, meta]) => (
          <span
            key={key}
            className={`inline-block rounded border px-2 py-0.5 text-[11px] font-medium ${meta.chip}`}
          >
            {meta.label}
          </span>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs border border-border">
          <caption className="sr-only">
            Regulatory regimes and their official stance (mandated, interim, or discouraged) on
            hybrid post-quantum deployments by jurisdiction.
          </caption>
          <thead>
            <tr className="bg-muted/60">
              <th scope="col" className="text-left p-2 border-b border-border align-bottom">
                Regime
              </th>
              <th scope="col" className="text-left p-2 border-b border-border align-bottom">
                Jurisdiction
              </th>
              <th scope="col" className="text-left p-2 border-b border-border align-bottom">
                Hybrid stance
              </th>
              <th scope="col" className="text-left p-2 border-b border-border align-bottom">
                Official position
              </th>
            </tr>
          </thead>
          <tbody>
            {JURISDICTION_ROWS.map((row) => {
              const meta = STANCE_META[row.stance]
              return (
                <tr key={row.regime}>
                  <th
                    scope="row"
                    className="p-2 border-b border-border font-bold align-top text-left whitespace-nowrap"
                  >
                    {row.regime}
                  </th>
                  <td className="p-2 border-b border-border align-top text-foreground/80 whitespace-nowrap">
                    {row.jurisdiction}
                  </td>
                  <td className={`p-2 border-b border-border align-top ${meta.cell}`}>
                    <span
                      className={`inline-block rounded border px-1.5 py-0.5 text-[11px] font-medium ${meta.chip}`}
                    >
                      {meta.label}
                    </span>
                  </td>
                  <td className="p-2 border-b border-border align-top text-foreground/80">
                    {row.position}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}
