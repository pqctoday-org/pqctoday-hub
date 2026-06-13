// SPDX-License-Identifier: GPL-3.0-only
/**
 * "Framework output that satisfies it" view (PER-PAGE-CHANGES.md Compliance #2).
 *
 * For each regulatory obligation, names the concrete Migration-Program
 * deliverable (an artifact a team actually produces on another page) that
 * *proves* the obligation is met, plus the phase that owns it and where to
 * build it. The deliverable → phase linkage is read from
 * `@/data/frameworkPhases` (single source of truth); the obligation → deliverable
 * mapping is the authoritative reg-map reference (CSWP.39 / framework §4 reg map,
 * p.156–157).
 *
 * Pure render over local reference rows + `FRAMEWORK_PHASES`. Additive: a new
 * section inside the Compliance Framework Explorer; nothing else changes.
 */
import React from 'react'
import { ClipboardCheck } from 'lucide-react'
import { FRAMEWORK_PHASES } from '@/data/frameworkPhases'
import type { FrameworkPhase, PhaseId } from '@/data/frameworkPhases'

/** A regulatory obligation and the deliverable that demonstrates compliance. */
interface SatisfiesRow {
  /** The regulation / clause that imposes the obligation. */
  regulation: string
  /** What the regulation asks for, in plain language. */
  obligation: string
  /** The Migration-Program deliverable that proves it. */
  deliverable: string
  /** Phase that owns the deliverable — links the row to the phase rail. */
  phase: PhaseId
}

/**
 * Authoritative reg-map rows (framework §4 regulatory map, p.156–157 + App. G).
 * Each obligation is paired with the single deliverable a team would hand an
 * auditor to demonstrate it, and the phase that produces that deliverable.
 */
const SATISFIES_ROWS: ReadonlyArray<SatisfiesRow> = [
  {
    regulation: 'PCI DSS 4.0 — 12.3.3',
    obligation: 'Maintain an inventory of cryptographic cipher suites & protocols in use.',
    deliverable: 'Machine-verifiable CBOM (CycloneDX export)',
    phase: 'p2',
  },
  {
    regulation: 'NIS2 — Art. 21 risk-management',
    obligation: 'Document a risk-based assessment of cryptographic exposure.',
    deliverable: 'Quantum Risk Assessment (QRA)',
    phase: 'p3',
  },
  {
    regulation: 'US OMB M-23-02 / NSM-10',
    obligation: 'Submit a prioritised cryptographic inventory of in-scope systems.',
    deliverable: 'Crypto inventory & asset map',
    phase: 'p1',
  },
  {
    regulation: 'EU DORA — ICT risk framework',
    obligation: 'Board-approved governance for ICT/crypto resilience.',
    deliverable: 'Program Charter & governance structure',
    phase: 'p0',
  },
  {
    regulation: 'CNSA 2.0 (NSM-8)',
    obligation: 'Multi-year plan to transition NSS to quantum-resistant algorithms.',
    deliverable: 'Multi-year migration roadmap',
    phase: 'p4',
  },
  {
    regulation: 'BSI TR-02102 / migration guidance',
    obligation: 'Evidence of validated pilots before production cutover.',
    deliverable: 'Pilot results report',
    phase: 'p5',
  },
  {
    regulation: 'FIPS 140-3 (validated modules)',
    obligation: 'Use validated cryptographic modules; document performance fitness.',
    deliverable: 'Infrastructure / PKI-HSM modernisation plan',
    phase: 'p6',
  },
  {
    regulation: 'ISO 27001 A.5.19 / supply chain',
    obligation: 'Ongoing assurance that vendors meet PQC requirements.',
    deliverable: 'Vendor scorecard & contract clauses',
    phase: 'p7',
  },
  {
    regulation: 'NIST CSF 2.0 — GV / ID.IM',
    obligation: 'Demonstrate crypto-agility maturity & continuous improvement.',
    deliverable: 'Maturity self-rating (L0–L4) & KPI dashboard',
    phase: 'foundations',
  },
]

/** Human-readable phase label, e.g. "Phase 3 — Risk Scoring" or "Foundations". */
function phaseLabel(phase: FrameworkPhase): string {
  return phase.number === null ? phase.name : `Phase ${phase.number} — ${phase.name}`
}

export const RegulatorySatisfiesView: React.FC = () => {
  return (
    <section
      id="reg-satisfies"
      className="glass-panel p-5 border border-border rounded-lg scroll-mt-24"
      aria-labelledby="reg-satisfies-heading"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 rounded-lg bg-status-success/10">
          <ClipboardCheck size={20} className="text-status-success" />
        </div>
        <div>
          <h2 id="reg-satisfies-heading" className="text-base font-bold text-foreground">
            Framework output that satisfies it
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            For each obligation, the concrete deliverable you hand an auditor to prove it — and the
            Migration-Program phase that produces that artifact.
          </p>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs border border-border">
          <caption className="sr-only">
            Regulatory obligations mapped to the Migration-Program deliverable that satisfies each
            one and the phase that produces it.
          </caption>
          <thead>
            <tr className="bg-muted/60">
              <th scope="col" className="text-left p-2 border-b border-border align-bottom">
                Regulation / clause
              </th>
              <th scope="col" className="text-left p-2 border-b border-border align-bottom">
                What it asks for
              </th>
              <th scope="col" className="text-left p-2 border-b border-border align-bottom">
                Deliverable that satisfies it
              </th>
              <th scope="col" className="text-left p-2 border-b border-border align-bottom">
                Owning phase
              </th>
            </tr>
          </thead>
          <tbody>
            {SATISFIES_ROWS.map((row) => {
              const phase = FRAMEWORK_PHASES[row.phase]
              return (
                <tr key={row.regulation}>
                  <th
                    scope="row"
                    className="p-2 border-b border-border font-bold align-top text-left whitespace-nowrap"
                  >
                    {row.regulation}
                  </th>
                  <td className="p-2 border-b border-border align-top text-foreground/80">
                    {row.obligation}
                  </td>
                  <td className="p-2 border-b border-border align-top">
                    <span className="inline-block rounded bg-status-success/10 border border-status-success/30 px-1.5 py-0.5 text-[11px] font-medium text-foreground">
                      {row.deliverable}
                    </span>
                  </td>
                  <td className="p-2 border-b border-border align-top text-foreground/80 whitespace-nowrap">
                    {phaseLabel(phase)}
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
