// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable react-refresh/only-export-components -- exports the AQ-detect predicate alongside the panel for reuse + unit test */
/**
 * FrameworkCrosswalkPanel — additive App. G crosswalk + App. H protocol-coverage
 * surface for the Applied Quantum PQC Migration Framework library entry.
 *
 * Closes three Library gap-closers from
 * `reports/framework-gap/PER-PAGE-CHANGES.md` (Library §):
 *   #2  Framework-crosswalk relation on the AQ entry — links the 4 source
 *       frameworks (NIST CSF 2.0 / PQCC / ETSI TR 103619 / Dutch Handbook) via
 *       `FRAMEWORK_PHASES[*].crosswalk`, navigable per phase.
 *   #3  Protocol-coverage matrix view — cross-links to the canonical
 *       `/algorithms` PQCProtocolMatrix (`?tab=support`) and summarises the
 *       families the App. H matrix already covers (read from `PROTOCOL_MATRIX`).
 *   #4  App. H long-tail flag — surfaces the "forgotten" families (DKIM / WPA3 /
 *       Bluetooth) that are not yet tracked in the protocol matrix.
 *
 * Additive: this panel renders ONLY for the AQ framework entry (detected via
 * `manualCategory === 'applied-quantum'`). For every other library item the
 * detail popover behaves exactly as before. No new data is ingested — the
 * crosswalk reads `FRAMEWORK_PHASES` and the coverage reads `PROTOCOL_MATRIX`,
 * both already shipped.
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, GitCompareArrows, ExternalLink, AlertTriangle, Grid3x3 } from 'lucide-react'
import clsx from 'clsx'
import { Button } from '@/components/ui/button'
import type { LibraryItem } from '../../data/libraryData'
import { FRAMEWORK_PHASES, PHASE_ORDER, type FrameworkPhase } from '../../data/frameworkPhases'
import { PROTOCOL_MATRIX } from '../../data/pqcProtocolMatrix'

/** The four external frameworks the AQ App. G appendix crosswalks against. */
const CROSSWALK_FRAMEWORKS = [
  {
    key: 'nistCsf' as const,
    label: 'NIST CSF 2.0',
    description: 'Cybersecurity Framework subcategories (GV / ID / PR functions).',
  },
  {
    key: 'pqcc' as const,
    label: 'PQCC Roadmap',
    description: 'Post-Quantum Cryptography Coalition migration roadmap step.',
  },
  {
    key: 'etsiTr103619' as const,
    label: 'ETSI TR 103 619',
    description: 'ETSI migration-phase reference.',
  },
  {
    key: 'dutchHandbook' as const,
    label: 'Dutch PQC Migration Handbook',
    description: 'AIVD/TNO/CWI handbook migration step.',
  },
]

/**
 * App. H long-tail families that the framework calls out but the protocol
 * matrix does not yet track (0–1 hits — the "forgotten" families). Kept
 * data-grounded by asserting absence from `PROTOCOL_MATRIX` at render.
 */
const APP_H_LONG_TAIL = [
  { name: 'DKIM', context: 'Email authentication (DNS TXT signatures)' },
  { name: 'WPA3', context: 'Wi-Fi (802.11) link-layer security' },
  { name: 'Bluetooth', context: 'Personal-area-network pairing & link encryption' },
] as const

/**
 * Detect the Applied Quantum framework library entry. Both the active v2.1 and
 * the deprecated v1.1 carry `manual_category=applied-quantum` in the CSV.
 */
export function isAppliedQuantumFramework(item: LibraryItem): boolean {
  return item.manualCategory === 'applied-quantum'
}

/** Stable render order for the crosswalk: phase rail order. */
const ORDERED_PHASES: FrameworkPhase[] = PHASE_ORDER.map(
  // eslint-disable-next-line security/detect-object-injection -- id is a typed PhaseId from PHASE_ORDER
  (id) => FRAMEWORK_PHASES[id]
)

/** Lower-cased set of protocol family names already tracked in the matrix. */
const COVERED_FAMILY_NAMES = new Set(PROTOCOL_MATRIX.map((p) => p.name.toLowerCase()))

interface FrameworkCrosswalkPanelProps {
  item: LibraryItem
}

export function FrameworkCrosswalkPanel({ item }: FrameworkCrosswalkPanelProps) {
  const navigate = useNavigate()
  const [crosswalkOpen, setCrosswalkOpen] = useState(false)
  const [coverageOpen, setCoverageOpen] = useState(false)

  if (!isAppliedQuantumFramework(item)) return null

  // App. H long-tail families that are genuinely absent from the matrix.
  const missingFamilies = APP_H_LONG_TAIL.filter(
    (f) => !COVERED_FAMILY_NAMES.has(f.name.toLowerCase())
  )
  // Top-level (non-inheritance) families the matrix covers — App. H "mainline".
  const coveredFamilies = PROTOCOL_MATRIX.filter((p) => !p.inheritsFromProtocolId)

  return (
    <div className="space-y-4">
      {/* #2 Framework crosswalk (App. G) */}
      <div className="glass-panel p-3">
        <Button
          variant="ghost"
          onClick={() => setCrosswalkOpen((o) => !o)}
          className="flex w-full h-auto items-center justify-between px-1 py-1.5"
          aria-expanded={crosswalkOpen}
        >
          <div className="flex items-center gap-2 font-semibold text-foreground text-sm">
            <GitCompareArrows size={16} className="text-primary" />
            Framework Crosswalk (App. G)
          </div>
          <ChevronDown
            size={16}
            className={clsx(
              'text-muted-foreground transition-transform duration-200',
              crosswalkOpen && 'rotate-180'
            )}
          />
        </Button>

        {crosswalkOpen && (
          <div className="mt-3 pl-1">
            <p className="text-xs text-muted-foreground/80 mb-3">
              The framework&apos;s Appendix G maps each migration phase onto four external
              frameworks. Rows are the Applied Quantum phases (0–7 + Foundations); columns are the
              equivalent step in each source framework.
            </p>

            {/* Source-framework legend */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {CROSSWALK_FRAMEWORKS.map((fw) => (
                <span
                  key={fw.key}
                  className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border bg-status-info/10 text-status-info border-status-info/20"
                  title={fw.description}
                >
                  {fw.label}
                </span>
              ))}
            </div>

            <ul className="space-y-2">
              {ORDERED_PHASES.map((phase) => (
                <li key={phase.id} className="rounded-md border border-border bg-card/40 p-2.5">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="shrink-0 inline-flex items-center justify-center min-w-[2.25rem] px-1.5 py-0.5 rounded text-[10px] font-bold border bg-primary/10 text-primary border-primary/20">
                      {phase.number === null ? 'Found.' : `P${phase.number}`}
                    </span>
                    <span className="text-xs font-semibold text-foreground">{phase.name}</span>
                  </div>
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1.5">
                    <div>
                      <dt className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        NIST CSF 2.0
                      </dt>
                      <dd className="text-[11px] text-foreground flex flex-wrap gap-1 mt-0.5">
                        {phase.crosswalk.nistCsf.map((code) => (
                          <span
                            key={code}
                            className="inline-flex items-center px-1 py-px rounded bg-muted/40 border border-border font-mono text-[10px]"
                          >
                            {code}
                          </span>
                        ))}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        PQCC
                      </dt>
                      <dd className="text-[11px] text-foreground mt-0.5">{phase.crosswalk.pqcc}</dd>
                    </div>
                    <div>
                      <dt className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        ETSI TR 103 619
                      </dt>
                      <dd className="text-[11px] text-foreground mt-0.5">
                        {phase.crosswalk.etsiTr103619}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Dutch Handbook
                      </dt>
                      <dd className="text-[11px] text-foreground mt-0.5">
                        {phase.crosswalk.dutchHandbook}
                      </dd>
                    </div>
                  </dl>
                </li>
              ))}
            </ul>

            <Button
              variant="outline"
              onClick={() => navigate('/compliance?tab=cswp39#appendix-g-crosswalk')}
              className="mt-3 h-auto py-1.5 px-2.5 text-xs"
            >
              <ExternalLink size={13} className="mr-1.5" aria-hidden="true" />
              Open full crosswalk on Compliance
            </Button>
          </div>
        )}
      </div>

      {/* #3 Protocol-coverage matrix + #4 App. H long-tail flag */}
      <div className="glass-panel p-3">
        <Button
          variant="ghost"
          onClick={() => setCoverageOpen((o) => !o)}
          className="flex w-full h-auto items-center justify-between px-1 py-1.5"
          aria-expanded={coverageOpen}
        >
          <div className="flex items-center gap-2 font-semibold text-foreground text-sm">
            <Grid3x3 size={16} className="text-primary" />
            Protocol Coverage (App. H) ({coveredFamilies.length})
          </div>
          <ChevronDown
            size={16}
            className={clsx(
              'text-muted-foreground transition-transform duration-200',
              coverageOpen && 'rotate-180'
            )}
          />
        </Button>

        {coverageOpen && (
          <div className="mt-3 pl-1">
            <p className="text-xs text-muted-foreground/80 mb-3">
              Appendix H tracks PQC readiness per standard family across pure/hybrid KEM and
              signature dimensions. The full, weekly-updated matrix lives on the Algorithms page.
            </p>

            {/* Covered families chips */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {coveredFamilies.map((fam) => (
                <span
                  key={fam.id}
                  className={clsx(
                    'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border',
                    fam.recommended
                      ? 'bg-status-success/10 text-status-success border-status-success/20'
                      : 'bg-muted/30 text-muted-foreground border-border'
                  )}
                  title={fam.recommended ? fam.recommendedReason : fam.description}
                >
                  {fam.name}
                </span>
              ))}
            </div>

            <Button
              variant="outline"
              onClick={() => navigate('/algorithms?tab=support')}
              className="h-auto py-1.5 px-2.5 text-xs"
            >
              <ExternalLink size={13} className="mr-1.5" aria-hidden="true" />
              Open Protocol Support matrix
            </Button>

            {/* #4 App. H long-tail flag */}
            {missingFamilies.length > 0 && (
              <div className="mt-3 rounded-md border border-status-warning/30 bg-status-warning/10 p-2.5">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <AlertTriangle
                    size={14}
                    className="text-status-warning shrink-0"
                    aria-hidden="true"
                  />
                  <span className="text-xs font-semibold text-status-warning">
                    App. H long-tail — not yet tracked
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground mb-2">
                  Appendix H flags these &quot;forgotten&quot; protocol families as having little to
                  no published PQC migration path. They are not yet represented in the protocol
                  matrix.
                </p>
                <ul className="space-y-1">
                  {missingFamilies.map((fam) => (
                    <li
                      key={fam.name}
                      className="text-[11px] text-foreground flex items-baseline gap-1.5"
                    >
                      <span className="shrink-0 inline-flex items-center px-1.5 py-px rounded text-[10px] font-semibold border bg-status-warning/15 text-status-warning border-status-warning/30">
                        {fam.name}
                      </span>
                      <span className="text-muted-foreground">{fam.context}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
