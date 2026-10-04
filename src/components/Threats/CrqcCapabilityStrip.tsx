// SPDX-License-Identifier: GPL-3.0-only
import React, { useMemo, useState } from 'react'
import { Activity, ChevronDown, Cpu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  CRQC_ESTIMATE_KIND_LABELS,
  CRQC_QUBIT_THRESHOLDS,
  CURRENT_QUANTUM_COMPUTERS,
  getCrqcForecast,
  getCrqcMigrationDeadlines,
  formatEstimateYears,
  type CRQCEstimate,
} from '@/components/PKILearning/modules/QuantumThreats/data/quantumConstants'
import { UnresolvedEstimatesNotice } from '@/components/common/UnresolvedEstimatesNotice'
import { ClaimCard, ClaimStateMark } from '@/components/common/ClaimCard'
import { openQuestions, type OpenClaim } from '@/data/openClaimsData'
import { headStatement, headStatements } from '@/data/openClaimsView'

/**
 * Consolidated CRQC-timeline / capability strip (PER-PAGE-CHANGES Threats #5).
 *
 * Surfaces a single CTI-style banner on the Threats page: the one CRQC expert
 * forecast (`getCrqcForecast()`, ruling R5 — arrival forecasts only), the
 * migration deadlines regulators have set (shown separately, never as a
 * forecast), plus a compact modality-progress readout from the live
 * `CURRENT_QUANTUM_COMPUTERS` table. Both data sets are reused verbatim from
 * the QuantumThreats module — this component renders, it does not re-author.
 *
 * Additive: the headline strip is always visible; the per-source / per-machine
 * detail is collapsed by default, so nothing else on the page is affected when
 * it is not expanded.
 *
 * Each estimate that has a published claim (`claimId`) shows that claim's card under its
 * line: the state in words, the newest statement first with the earlier one a step away,
 * and the sources side by side where they disagree. Estimates are never averaged and no
 * one source is picked as the answer. Estimates with no claim, or no claims file, read
 * as they always did.
 */

const CURRENT_YEAR = new Date().getFullYear()

/**
 * The Google Quantum AI and Ethereum Foundation paper is a resource estimate, not an arrival
 * date, so it has no row in CRQC_ESTIMATES. This is the published claim that describes it.
 */
const GOOGLE_EF_CLAIM_ID = 'crqc-google-ef-secp256k1-resources'

/**
 * The statement to show for an estimate: the newest one that replaces or updates its claim
 * (the older statement stays one link away inside the card). Nothing when the estimate has no
 * claim, or the published claims file is not there.
 */
function claimFor(e: Pick<CRQCEstimate, 'claimId'>): OpenClaim | undefined {
  return e.claimId ? headStatement(e.claimId) : undefined
}

/**
 * At a glance the strip flags only what is not settled (an open question, a claim that did not
 * hold, one replaced by a newer statement); the full card for every estimate is under Sources.
 * The state is always words next to the icon, never colour alone.
 */
const UnsettledMark: React.FC<{ claim: OpenClaim | undefined }> = ({ claim }) =>
  claim && claim.state !== 'Settled' ? <ClaimStateMark state={claim.state} /> : null

export const CrqcCapabilityStrip: React.FC<{
  defaultExpanded?: boolean
  /**
   * Optionally-controlled expand state (Phase 7 item 2 of the 2026-pages plan):
   * when both `expanded` and `onExpandedChange` are supplied, the parent owns
   * the toggle (e.g. so it can share it with a sibling like CrqcTrajectoryChart)
   * and the internal `useState` below is bypassed entirely. Any existing caller
   * that only passes `defaultExpanded` (or nothing) keeps managing its own
   * state exactly as before.
   */
  expanded?: boolean
  onExpandedChange?: (expanded: boolean) => void
}> = ({ defaultExpanded = false, expanded: controlledExpanded, onExpandedChange }) => {
  const [internalExpanded, setInternalExpanded] = useState(defaultExpanded)
  const isControlled = controlledExpanded !== undefined && onExpandedChange !== undefined
  const expanded = isControlled ? controlledExpanded : internalExpanded
  const setExpanded = (next: boolean | ((v: boolean) => boolean)) => {
    const resolved = typeof next === 'function' ? next(expanded) : next
    if (isControlled) {
      onExpandedChange(resolved)
    } else {
      setInternalExpanded(resolved)
    }
  }

  // The one CRQC window (ruling R5) — the same function the trajectory chart,
  // exposure hero, economics calculator and mobile screen read.
  const forecast = useMemo(() => getCrqcForecast(), [])
  const deadlines = useMemo(() => getCrqcMigrationDeadlines(), [])
  const yearsToLow = forecast.low - CURRENT_YEAR

  // Claims shown with the estimates, and the open questions that have no estimate of their own.
  // Both are empty if the published claims file is absent, and then the strip reads as before.
  const googleClaim = useMemo(() => headStatement(GOOGLE_EF_CLAIM_ID), [])
  const otherOpenQuestions = useMemo(() => {
    const cards = [...forecast.sources, ...deadlines]
      .map((e) => claimFor(e))
      .filter((c): c is OpenClaim => c !== undefined)
    if (googleClaim) cards.push(googleClaim)
    // An open claim reached through a card above (as its earlier statement) is not listed again.
    const shown = new Set(cards.flatMap((c) => [c.id, ...(c.earlier ?? []).map((e) => e.claim)]))
    return headStatements(openQuestions().map((c) => c.id)).filter(
      (c) => c.state === 'Open' && !shown.has(c.id)
    )
  }, [forecast.sources, deadlines, googleClaim])
  const showsClaims =
    googleClaim !== undefined ||
    otherOpenQuestions.length > 0 ||
    [...forecast.sources, ...deadlines].some((e) => claimFor(e) !== undefined)

  const leadMachine = useMemo(
    () =>
      [...CURRENT_QUANTUM_COMPUTERS].sort(
        (a, b) => b.estimatedLogicalQubits - a.estimatedLogicalQubits
      )[0],
    []
  )

  // The most-urgent target needs the fewest logical qubits — show progress toward the
  // low-end Shor target for ECC-256, derived from the same CRQC_QUBIT_THRESHOLDS
  // the trajectory chart's reference lines use (Threats #1), not a separate hardcoded
  // number. Published estimates range to ~2,330+.
  const shorTargetQubits = CRQC_QUBIT_THRESHOLDS.bitcoinEcc256
  const progressPct = useMemo(
    () => Math.min(100, (leadMachine.estimatedLogicalQubits / shorTargetQubits) * 100),
    [leadMachine, shorTargetQubits]
  )

  return (
    <section
      className="glass-panel p-4 mb-4 border border-border"
      aria-labelledby="crqc-strip-heading"
      data-testid="crqc-capability-strip"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Activity size={20} className="text-warning mt-0.5 shrink-0" aria-hidden="true" />
          <div>
            <h2
              id="crqc-strip-heading"
              className="text-base font-bold text-foreground flex items-center gap-2 flex-wrap"
            >
              CRQC Capability Watch
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded border border-warning/30 bg-warning/10 text-warning uppercase tracking-wide">
                CTI
              </span>
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              When the clock stops: the published expert forecast of CRQC arrival, the migration
              deadlines regulators have set (deadlines, not forecasts), and how far today&apos;s
              hardware has come.
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          aria-controls="crqc-strip-body"
          className="shrink-0 text-xs gap-1"
        >
          <Cpu size={14} aria-hidden="true" />
          {expanded ? 'Hide sources' : 'Sources'}
          <ChevronDown
            size={14}
            aria-hidden="true"
            className={`transition-transform ${expanded ? 'rotate-180' : ''}`}
          />
        </Button>
      </div>

      <UnresolvedEstimatesNotice
        detail={showsClaims ? 'claimsShown' : 'sourcesListed'}
        className="mt-3"
      />

      {/* Headline strip — always visible */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
        <div className="rounded-lg border border-border bg-muted/30 p-3">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
              CRQC expert survey
            </div>
            {forecast.sources.map((e) => (
              <UnsettledMark key={e.source} claim={claimFor(e)} />
            ))}
          </div>
          <div className="text-2xl font-bold text-warning">{forecast.headline}</div>
          <div className="text-xs text-muted-foreground mt-0.5">{forecast.label}</div>
        </div>
        <div className="rounded-lg border border-border bg-muted/30 p-3">
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Migration deadlines (not forecasts)
          </div>
          <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">
            {deadlines.map((e) => (
              <li key={e.source}>
                <span className="font-semibold text-foreground">{e.source}</span>:{' '}
                {formatEstimateYears(e)} <UnsettledMark claim={claimFor(e)} />
              </li>
            ))}
          </ul>
          <div className="text-[10px] text-muted-foreground mt-1">
            {yearsToLow > 0
              ? `Calculators on this page start their ${forecast.rangeLabel} ${yearsToLow} year${yearsToLow === 1 ? '' : 's'} out.`
              : `Calculators on this page use a ${forecast.rangeLabel}, which has already begun.`}
          </div>
        </div>
        <div className="rounded-lg border border-border bg-muted/30 p-3">
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Hardware progress
          </div>
          <div className="text-2xl font-bold text-primary">
            {leadMachine.estimatedLogicalQubits}
            <span className="text-sm font-normal text-muted-foreground">
              {' '}
              / ~{shorTargetQubits.toLocaleString()} LQ
            </span>
          </div>
          <div
            className="mt-1.5 h-1.5 w-full rounded-full bg-muted overflow-hidden"
            role="progressbar"
            aria-valuenow={Math.round(progressPct)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Logical-qubit progress toward the smallest Shor target"
          >
            <div className="h-full bg-primary rounded-full" style={{ width: `${progressPct}%` }} />
          </div>
          <div className="text-[10px] text-muted-foreground mt-1">
            ~{shorTargetQubits.toLocaleString()} LQ is the low-end ECC-256 estimate
            (Google/Ethereum, 2026); earlier work ranged to ~2,330+ LQ (Roetteler et al. 2017,
            arXiv:1706.06752). The bar to break RSA-2048 keeps falling: ~20M physical qubits (2019)
            → &lt;1M (Gidney 2025) → &lt;100k projected (qLDPC, 2026).
          </div>
          <div className="text-[10px] text-muted-foreground mt-1">
            The <em>logical</em>-qubit count for the same RSA-2048 target has fallen too: 2n+2,
            which gives 4,098 (2016-era estimate, arXiv:1611.07995) → ~1,730
            (Chevignard–Fouque–Schrottenloher, ePrint 2024/222) → ~1,537 (Gidney 2025,
            arXiv:2505.15917) — an algorithmic improvement independent of the
            physical-qubit-overhead cuts above.
          </div>
          <div className="text-[10px] text-muted-foreground mt-1">
            Lead: {leadMachine.vendor} {leadMachine.name} ({leadMachine.qubitType})
          </div>
        </div>
      </div>

      {/* Per-source + per-machine detail — collapsible */}
      {expanded && (
        <div id="crqc-strip-body" className="mt-4 space-y-4">
          <EstimateList title="CRQC arrival forecast — the window above" items={forecast.sources} />
          <EstimateList
            title="Migration deadlines and planning guidance — dates to finish migrating, not forecasts"
            items={deadlines}
          />
          <ResourceEstimates claim={googleClaim} />
          <OpenQuestions claims={otherOpenQuestions} />
          <div>
            <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Current modality progress (logical-qubit estimates)
            </h3>
            <ul className="space-y-1.5">
              {[...CURRENT_QUANTUM_COMPUTERS]
                .sort((a, b) => b.estimatedLogicalQubits - a.estimatedLogicalQubits)
                .map((m) => (
                  <li
                    key={`${m.vendor}-${m.name}`}
                    className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-xs"
                  >
                    <span className="font-mono font-semibold text-primary w-12 shrink-0">
                      {m.estimatedLogicalQubits} LQ
                    </span>
                    <span className="font-medium text-foreground sm:w-48 shrink-0">
                      {m.vendor} {m.name}
                    </span>
                    <span className="text-muted-foreground">
                      {m.qubitType} · {m.physicalQubits} physical · {m.year}
                    </span>
                  </li>
                ))}
            </ul>
          </div>
        </div>
      )}
    </section>
  )
}

const GROUP_TITLE_CLASS =
  'text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2'

/**
 * One attributed list of CRQC_ESTIMATES entries, each tagged with its kind. An estimate that has
 * a published claim shows that claim's card under its line (state, sources in their own words,
 * the earlier statement one step away); an estimate without one shows only its line.
 */
function EstimateList({ title, items }: { title: string; items: CRQCEstimate[] }) {
  if (items.length === 0) return null
  const rows = items.map((e) => ({ e, claim: claimFor(e) }))
  return (
    <div>
      <h3 className={GROUP_TITLE_CLASS}>{title}</h3>
      <ul className={rows.some((r) => r.claim !== undefined) ? 'space-y-3' : 'space-y-1.5'}>
        {rows.map(({ e, claim }) => (
          <li key={e.source} className="space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-xs">
              <span className="font-mono font-semibold text-warning w-24 shrink-0">
                {formatEstimateYears(e)}
              </span>
              <a
                href={e.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-foreground sm:w-64 shrink-0 hover:text-primary hover:underline"
              >
                {e.source}
              </a>
              <span className="text-muted-foreground">
                <span className="font-semibold">{CRQC_ESTIMATE_KIND_LABELS[e.kind]}</span> ·{' '}
                {e.confidence}
              </span>
            </div>
            {claim && <ClaimCard claim={claim} headingLevel={4} />}
          </li>
        ))}
      </ul>
    </div>
  )
}

/**
 * The Google Quantum AI and Ethereum Foundation paper: what a machine would need, not when one
 * could exist. With its published claim the figures and the source come from the claim card;
 * without it the page keeps the paragraph it had.
 */
function ResourceEstimates({ claim }: { claim: OpenClaim | undefined }) {
  if (claim) {
    return (
      <div data-testid="crqc-resource-estimates">
        <h3 className={GROUP_TITLE_CLASS}>Resource estimates, not arrival dates.</h3>
        <ClaimCard claim={claim} headingLevel={4} />
        <p className="text-xs text-muted-foreground leading-relaxed mt-2">
          No reliable estimate of when such a machine could exist is established.
        </p>
      </div>
    )
  }
  return (
    <p className="text-xs text-muted-foreground leading-relaxed">
      <span className="font-semibold text-foreground">Resource estimates, not arrival dates.</span>{' '}
      Google Quantum AI and collaborators (paper dated 30 March 2026) estimate that breaking the
      elliptic-curve cryptography used by Bitcoin and Ethereum needs at most 1,200 logical qubits
      (at most 1,450 in a variant) and, on superconducting machines with 10
      <sup>&minus;3</sup> physical error rates and planar connectivity, fewer than half a million
      physical qubits. No reliable estimate of when such a machine could exist is established.{' '}
      <a
        href="https://quantumai.google/static/site-assets/downloads/cryptocurrency-whitepaper.pdf"
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary underline underline-offset-2 hover:text-primary/80"
      >
        The paper
      </a>
    </p>
  )
}

/** Open questions that have no estimate row above, each as a claim card. */
function OpenQuestions({ claims }: { claims: readonly OpenClaim[] }) {
  if (claims.length === 0) return null
  return (
    <div data-testid="crqc-other-open-questions">
      <h3 className={GROUP_TITLE_CLASS}>Other open questions</h3>
      <ul className="space-y-3">
        {claims.map((c) => (
          <li key={c.id}>
            <ClaimCard claim={c} headingLevel={4} />
          </li>
        ))}
      </ul>
    </div>
  )
}
