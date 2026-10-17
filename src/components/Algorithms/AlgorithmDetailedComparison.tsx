// SPDX-License-Identifier: AGPL-3.0-only
import { useState, useMemo } from 'react'
import React from 'react'
import {
  type AlgorithmDetail,
  type AlgorithmSizeField,
  getSecurityLevelColor,
  getFunctionGroup,
  algorithmSizeState,
  algorithmSizeBytes,
  formatAlgorithmSize,
  formatSecurityLevel,
  formatStackRam,
  stackRamState,
  statusTierLabel,
} from '../../data/pqcAlgorithmsData'
import {
  Info,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  SearchX,
  LayoutList,
  GitCompare,
  ArrowRight,
} from 'lucide-react'
import clsx from 'clsx'
import { resolveAlgoXrefs } from '../../data/algoProductXrefData'
import { tierBadge, tierBadgeClasses } from '../../data/algorithmStatusTier'
import { getAlgorithmAdvisory } from '../../data/algorithmAdvisories'
import { Button } from '@/components/ui/button'
import { AlgoCtaStrip } from './AlgoCtaStrip'
import { AlgorithmCheckButton } from './AlgorithmCheckButton'
import { classifyCnsa20, cnsa20ChipClasses } from './cnsa20'
import { MAX_COMPARE } from './useAlgorithmExplorer'
import { AlgorithmComparisonPanel } from './AlgorithmComparisonPanel'
import { algoMatchesHighlight } from './highlightMatch'
import { HardwareBenchmarkEvidence } from './HardwareBenchmarkEvidence'

/**
 * What the RAM column can and cannot tell a reader.
 *
 * ADDED 2026-08-22 after a catalogue-vs-module check reported three "disagreements"
 * that were not module errors. The catalogue's `stack_ram_bytes` gives ML-DSA-44 and
 * ML-DSA-65 the SAME ~14000 — two parameter sets cannot genuinely need identical
 * stack — so the column is a coarse family-level estimate, and it carries no
 * operation qualifier even though signing and verifying differ by an order of
 * magnitude for lattice signatures.
 *
 * The numbers are NOT changed: correcting them needs measured, citable per-parameter-set
 * figures, which is a research task under the proof gate. What is fixed is the silence —
 * a reader comparing two rows with the same value deserves to know why.
 */
const RAM_CAVEAT =
  'Coarse family-level estimates from the algorithm catalogue, not measured per parameter set — ' +
  'some parameter sets within a family share a single figure. They carry no sign/verify ' +
  'qualifier, and for lattice signatures those differ by roughly an order of magnitude. ' +
  'Measure on your own target before sizing hardware.'

type SortField = 'name' | 'type' | 'pubkey' | 'sig' | 'ram'
type SortDir = 'asc' | 'desc'

interface AlgorithmDetailedComparisonProps {
  highlightAlgorithms?: Set<string>
  onInfoOpen?: () => void
  filteredAlgorithms: AlgorithmDetail[]
  compareSet: Set<string>
  compareType: 'KEM' | 'Signature' | null
  maxCompareReached: boolean
  selectionLimit?: number
  onToggleCompare: (name: string) => void
  /** Browse (unified table) ↔ Compare (transposed matrix). */
  detailMode: 'browse' | 'compare'
  onDetailModeChange: (mode: 'browse' | 'compare') => void
  /** Resolved algorithms + baseline for Compare mode (from the explorer hook). */
  comparisonAlgos: AlgorithmDetail[]
  baselineAlgo: AlgorithmDetail | null
  /**
   * Hides the Browse/Compare mode switch entirely (Browse-only). Compare
   * mode's transposed matrix (AlgorithmComparisonPanel) has no mobile
   * layout — confirmed 2026-08-24 — so the mobile-shell caller sets this
   * rather than exposing a toggle that leads to an unusable view.
   */
  hideCompareToggle?: boolean
  /** `algorithm_id` of the algorithm whose detail drawer is open (?algo). */
  selectedAlgoId?: string | null
  /** Opens the detail drawer. Omitted by hosts without one (the sim embed),
   *  where the algorithm name stays plain text. */
  onOpenAlgorithm?: (algo: AlgorithmDetail) => void
}

export const AlgorithmDetailedComparison: React.FC<AlgorithmDetailedComparisonProps> = ({
  highlightAlgorithms,
  onInfoOpen,
  filteredAlgorithms,
  compareSet,
  compareType,
  maxCompareReached,
  selectionLimit = MAX_COMPARE,
  onToggleCompare,
  detailMode,
  onDetailModeChange,
  comparisonAlgos,
  baselineAlgo,
  hideCompareToggle,
  selectedAlgoId,
  onOpenAlgorithm,
}) => {
  const selectedCount = compareSet.size

  return (
    <div className="space-y-3">
      <section className="rounded-lg border border-status-info/30 bg-status-info/5 p-3 text-xs leading-relaxed text-foreground/85">
        <strong className="text-foreground">How to compare responsibly.</strong> Start with function
        and security level, then compare serialized sizes and protocol fit. Catalogue performance
        text is historical and heterogeneous; it is not a fair ranking. Use a shared-harness dataset
        or measure the exact operation and implementation on your target.
      </section>
      <HardwareBenchmarkEvidence />
      {/* Mode switch + About */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        {!hideCompareToggle && (
          <div
            className="inline-flex rounded-md border border-border bg-card p-0.5"
            role="group"
            aria-label="Detailed comparison view mode"
          >
            <Button
              type="button"
              variant={detailMode === 'browse' ? 'gradient' : 'ghost'}
              size="sm"
              onClick={() => onDetailModeChange('browse')}
              aria-pressed={detailMode === 'browse'}
              className="h-8 gap-1.5 px-3 text-xs"
            >
              <LayoutList size={14} />
              Browse all
            </Button>
            <Button
              type="button"
              variant={detailMode === 'compare' ? 'gradient' : 'ghost'}
              size="sm"
              onClick={() => onDetailModeChange('compare')}
              aria-pressed={detailMode === 'compare'}
              className="h-8 gap-1.5 px-3 text-xs"
            >
              <GitCompare size={14} />
              Compare side-by-side
              {selectedCount > 0 && (
                <span className="rounded-full bg-background/30 px-1.5 text-[10px] font-bold">
                  {selectedCount}
                </span>
              )}
            </Button>
          </div>
        )}

        <div className="flex items-center gap-2">
          <span className="hidden sm:inline text-xs text-muted-foreground">
            All filters above apply to both views.
          </span>
          {onInfoOpen && (
            <Button
              variant="ghost"
              onClick={onInfoOpen}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-muted/50 border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors text-xs h-auto"
              aria-label="Performance data methodology"
              title="About performance data"
            >
              <Info size={14} />
              <span className="hidden sm:inline">About</span>
            </Button>
          )}
        </div>
      </div>

      {detailMode === 'compare' ? (
        <CompareView
          comparisonAlgos={comparisonAlgos}
          baselineAlgo={baselineAlgo}
          phoneLimit={Math.min(selectionLimit, PHONE_COMPARE_LIMIT)}
          onBrowse={() => onDetailModeChange('browse')}
        />
      ) : (
        <>
          <BrowseTable
            algorithms={filteredAlgorithms}
            highlightAlgorithms={highlightAlgorithms}
            compareSet={compareSet}
            compareType={compareType}
            maxCompareReached={maxCompareReached}
            selectionLimit={selectionLimit}
            onToggleCompare={onToggleCompare}
            selectedAlgoId={selectedAlgoId}
            onOpenAlgorithm={onOpenAlgorithm}
          />
          <SelectionBar
            count={selectedCount}
            compareType={compareType}
            selectionLimit={selectionLimit}
            onCompare={() => onDetailModeChange('compare')}
          />
        </>
      )}
    </div>
  )
}

/* ────────────────────────────────────────────────────────────────────────────
 * Compare mode — the transposed side-by-side matrix is the centerpiece.
 * ────────────────────────────────────────────────────────────────────────── */
/** Phone compare cards fit three across; later picks are named, not dropped. */
const PHONE_COMPARE_LIMIT = 3

function CompareView({
  comparisonAlgos,
  baselineAlgo,
  phoneLimit,
  onBrowse,
}: {
  comparisonAlgos: AlgorithmDetail[]
  baselineAlgo: AlgorithmDetail | null
  phoneLimit: number
  onBrowse: () => void
}) {
  const shown = comparisonAlgos.slice(0, phoneLimit)
  const hidden = comparisonAlgos.slice(phoneLimit)
  if (comparisonAlgos.length < 2) {
    return (
      <div className="glass-panel border-dashed border-2 border-border p-10 flex flex-col items-center justify-center text-center">
        <GitCompare size={40} className="text-muted-foreground/50 mb-3" />
        <h4 className="text-base font-semibold text-foreground mb-1">Pick algorithms to compare</h4>
        <p className="text-sm text-muted-foreground max-w-sm mb-4">
          Select at least two algorithms of the same function type in Browse to see a transposed
          side-by-side comparison against a classical baseline.
        </p>
        <Button variant="gradient" size="sm" onClick={onBrowse} className="gap-1.5">
          <LayoutList size={14} />
          Browse algorithms
        </Button>
      </div>
    )
  }
  return (
    <div className="space-y-2">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={onBrowse} className="gap-1.5">
          <ArrowRight size={14} className="rotate-180" />
          Edit picks
        </Button>
      </div>
      <div className="md:hidden overflow-x-auto rounded-lg border border-border bg-card p-3">
        <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
          Swipe across up to {phoneLimit} picks. Compare function, maturity, security level and
          serialized sizes first; performance depends on the implementation and device.
        </p>
        {hidden.length > 0 && (
          <p
            className="mb-3 rounded border border-border bg-muted px-2 py-1.5 text-xs text-foreground"
            data-testid="phone-compare-hidden"
          >
            Showing {shown.length} of {comparisonAlgos.length} — hidden:{' '}
            {hidden.map((a) => a.name).join(', ')}. Remove a pick in Browse to see them here, or use
            a wider screen.
          </p>
        )}
        <div
          className="grid min-w-max gap-2"
          style={{
            gridTemplateColumns: `repeat(${shown.length}, minmax(9rem, 1fr))`,
          }}
        >
          {shown.map((algo) => (
            <article key={algo.id} className="rounded-md border border-border bg-background p-3">
              <h4 className="text-sm font-semibold text-foreground">{algo.name}</h4>
              <p className="mt-0.5 text-[11px] text-muted-foreground">{algo.family}</p>
              <dl className="mt-3 space-y-2 text-xs">
                <Fact label="Maturity">{statusTierLabel(algo.statusTier)}</Fact>
                <Fact label="Security">{formatSecurityLevel(algo)}</Fact>
                <Fact label="Public key">
                  <ByteSize algo={algo} field="publicKey" />
                </Fact>
                <Fact label="Signature / ciphertext">
                  <ByteSize algo={algo} field="signatureOrCiphertext" />
                </Fact>
                <Fact label="Standard">{algo.fipsStandard || 'Not recorded'}</Fact>
              </dl>
            </article>
          ))}
        </div>
      </div>
      <div className="hidden md:block">
        <AlgorithmComparisonPanel
          algorithms={comparisonAlgos}
          baseline={baselineAlgo}
          activeTab="detailed"
          onClose={onBrowse}
        />
      </div>
    </div>
  )
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-foreground">{children}</dd>
    </div>
  )
}

/* ────────────────────────────────────────────────────────────────────────────
 * Browse-mode selection footer.
 * ────────────────────────────────────────────────────────────────────────── */
function SelectionBar({
  count,
  compareType,
  selectionLimit,
  onCompare,
}: {
  count: number
  compareType: 'KEM' | 'Signature' | null
  selectionLimit: number
  onCompare: () => void
}) {
  return (
    <div className="glass-panel p-3 flex items-center justify-between gap-3 flex-wrap">
      <span className="text-sm text-muted-foreground">
        {count > selectionLimit ? (
          <>
            <strong className="text-foreground">{count}</strong> selected · first {selectionLimit}{' '}
            shown side by side
          </>
        ) : (
          <>
            <strong className="text-foreground">{count}</strong> of {selectionLimit} selected
          </>
        )}
        {compareType && (
          <>
            {' · '}
            <span className="text-primary font-medium">{compareType}</span> locked by 1st pick
          </>
        )}
      </span>
      <Button
        variant="gradient"
        size="sm"
        disabled={count < 2}
        onClick={onCompare}
        className="gap-1.5"
      >
        Compare side-by-side
        <ArrowRight size={14} />
      </Button>
    </div>
  )
}

const EmptyState = () => (
  <div className="glass-panel p-12 flex flex-col items-center justify-center text-center">
    <SearchX size={48} className="text-muted-foreground/50 mb-4" />
    <h4 className="text-lg font-semibold text-foreground mb-2">No algorithms match</h4>
    <p className="text-sm text-muted-foreground max-w-md">
      Try adjusting your filters or search query to see results.
    </p>
  </div>
)

interface BrowseTableProps {
  algorithms: AlgorithmDetail[]
  highlightAlgorithms?: Set<string>
  compareSet: Set<string>
  compareType: 'KEM' | 'Signature' | null
  maxCompareReached: boolean
  selectionLimit: number
  onToggleCompare: (name: string) => void
  selectedAlgoId?: string | null
  onOpenAlgorithm?: (algo: AlgorithmDetail) => void
}

/** The algorithm name — a button opening its detail drawer when the host has one. */
function AlgoName({
  algo,
  onOpenAlgorithm,
}: {
  algo: AlgorithmDetail
  onOpenAlgorithm?: (algo: AlgorithmDetail) => void
}) {
  if (!onOpenAlgorithm) return <span className="font-semibold text-foreground">{algo.name}</span>
  return (
    <Button
      type="button"
      variant="link"
      onClick={() => onOpenAlgorithm(algo)}
      title={`Open ${algo.name} details`}
      className="h-auto p-0 text-left text-base font-semibold text-foreground underline-offset-2 hover:text-primary hover:underline"
    >
      {algo.name}
    </Button>
  )
}

/** Checkbox that toggles comparison membership, honoring the type-lock + cap. */
function CompareCheckbox({
  algo,
  compareSet,
  compareType,
  maxCompareReached,
  selectionLimit,
  onToggleCompare,
}: BrowseTableProps & { algo: AlgorithmDetail }) {
  const algoGroup = getFunctionGroup(algo)
  if (algoGroup !== 'KEM' && algoGroup !== 'Signature') {
    return <span className="inline-block w-6 md:w-4 shrink-0" aria-hidden="true" />
  }
  const isCompared = compareSet.has(algo.name)
  const canToggle =
    isCompared || (!maxCompareReached && (compareType === null || compareType === algoGroup))
  const reason = isCompared
    ? 'Remove from comparison'
    : !canToggle
      ? maxCompareReached
        ? `Max ${selectionLimit} reached`
        : `${compareType} only`
      : 'Add to comparison'
  return (
    <input
      type="checkbox"
      checked={isCompared}
      disabled={!canToggle && !isCompared}
      onChange={() => onToggleCompare(algo.name)}
      title={reason}
      aria-label={`${reason}: ${algo.name}`}
      className="h-6 w-6 md:h-4 md:w-4 shrink-0 rounded border-border accent-primary cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
    />
  )
}

function isHighlighted(algo: AlgorithmDetail, highlights?: Set<string>): boolean {
  if (!highlights) return false
  return Array.from(highlights).some((h) => algoMatchesHighlight(algo.name, h))
}

function DraftBadge({ algo }: { algo: AlgorithmDetail }) {
  const badge = tierBadge(algo.statusTier)
  if (!badge) return null
  return (
    <span
      className={clsx(
        'inline-flex items-center text-[10px] px-1.5 py-0.5 rounded border font-medium',
        tierBadgeClasses(badge.tone)
      )}
      title={badge.tooltip}
    >
      {badge.label}
    </span>
  )
}

/** Dated advisory chip (e.g. the BSI's 1 Oct 2026 Classic McEliece notice). Independent
 *  of the status tier: the algorithm stays standardised; the advice for new use changed. */
function AdvisoryBadge({ algo }: { algo: AlgorithmDetail }) {
  const advisory = getAlgorithmAdvisory(algo.name)
  if (!advisory) return null
  return (
    <a
      href={advisory.sourceUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center text-[10px] px-1.5 py-0.5 rounded bg-status-warning/15 text-status-warning border border-status-warning/30 font-medium hover:underline"
      title={advisory.note}
    >
      {advisory.label}
    </a>
  )
}

/**
 * CNSA 2.0 chip — shown only for algorithms with a meaningful CNSA 2.0 stance
 * (required selections, the firmware-only stateful-hash approval, and the
 * explicitly-excluded SLH-DSA). Below-floor / not-in-suite rows show nothing.
 */
function Cnsa20Badge({ algo }: { algo: AlgorithmDetail }) {
  const verdict = classifyCnsa20(algo)
  if (
    verdict.status !== 'required' &&
    verdict.status !== 'approved-limited' &&
    verdict.status !== 'excluded'
  ) {
    return null
  }
  return (
    <span
      className={clsx(
        'inline-flex items-center text-[10px] px-1.5 py-0.5 rounded border font-medium',
        cnsa20ChipClasses(verdict.status)
      )}
      title={verdict.rationale}
    >
      {verdict.label}
    </span>
  )
}

function ResearchNeededBadge({ algo }: { algo: AlgorithmDetail }) {
  if (!algo.hasResearchGap) return null
  return (
    <span
      className="inline-flex items-center text-[10px] px-1.5 py-0.5 rounded bg-status-info/15 text-status-info border border-status-info/30 font-medium"
      title="Some fields for this entry are not yet researched and are shown as 'Research needed'."
    >
      Research needed
    </span>
  )
}

/** Badge for algorithms with zero indexed library/reference implementations — same
 *  match logic as the Implementations modal, so the badge and its drilldown agree. */
function NoImplementationBadge({ algo }: { algo: AlgorithmDetail }) {
  const hasImpls = useMemo(() => resolveAlgoXrefs(algo.name).length > 0, [algo.name])
  if (hasImpls) return null
  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border font-medium"
      title="No implementation is recorded for this algorithm in the libraries PQC Today has reviewed. That is not evidence that none exists."
    >
      <SearchX size={10} aria-hidden="true" />
      No reviewed implementation evidence
    </span>
  )
}

/** A size field's shared text: the bytes, or the field's missing-data words. */
function ByteSize({ algo, field }: { algo: AlgorithmDetail; field: AlgorithmSizeField }) {
  const text = formatAlgorithmSize(algo, field)
  if (algorithmSizeState(algo, field) === 'stated') return <>{text}</>
  return <span className="italic text-muted-foreground">{text}</span>
}

/** Stack RAM's shared text ("~6,000 B" for an estimate), or its missing-data words. */
function RamSize({ algo }: { algo: AlgorithmDetail }) {
  const text = formatStackRam(algo)
  if (stackRamState(algo) === 'stated') return <>{text}</>
  return <span className="italic">{text}</span>
}

/* ────────────────────────────────────────────────────────────────────────────
 * Browse mode — ONE unified, sortable table; one row per algorithm carrying all
 * metrics (sizes + performance + standard), with a comparison checkbox.
 * ────────────────────────────────────────────────────────────────────────── */
function BrowseTable({
  algorithms,
  highlightAlgorithms,
  compareSet,
  compareType,
  maxCompareReached,
  selectionLimit,
  onToggleCompare,
  selectedAlgoId,
  onOpenAlgorithm,
}: BrowseTableProps) {
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  // A field's own value, or null when it is missing; each field is judged on
  // its own evidence state, not on whether any other size is missing.
  const sizeForSort = (
    algo: AlgorithmDetail,
    key: 'publicKeySize' | 'signatureCiphertextSize' | 'stackRAM'
  ): number | null => {
    if (key === 'stackRAM') return stackRamState(algo) === 'stated' ? algo.stackRAM : null
    return algorithmSizeBytes(algo, key === 'publicKeySize' ? 'publicKey' : 'signatureOrCiphertext')
  }
  // Missing values always sort last, whichever direction is chosen.
  const compareSizes = (a: number | null, b: number | null, dir: number) => {
    if (a === null && b === null) return 0
    if (a === null) return 1
    if (b === null) return -1
    return dir * (a - b)
  }

  const sorted = useMemo(() => {
    return [...algorithms].sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1
      switch (sortField) {
        case 'name':
          return dir * a.name.localeCompare(b.name)
        case 'type':
          return dir * a.family.localeCompare(b.family)
        case 'pubkey':
          return compareSizes(sizeForSort(a, 'publicKeySize'), sizeForSort(b, 'publicKeySize'), dir)
        case 'sig':
          return compareSizes(
            sizeForSort(a, 'signatureCiphertextSize'),
            sizeForSort(b, 'signatureCiphertextSize'),
            dir
          )
        case 'ram':
          return compareSizes(sizeForSort(a, 'stackRAM'), sizeForSort(b, 'stackRAM'), dir)
        default:
          return 0
      }
    })
  }, [algorithms, sortField, sortDir])

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown size={14} className="text-muted-foreground/50" />
    return sortDir === 'asc' ? (
      <ArrowUp size={14} className="text-primary" />
    ) : (
      <ArrowDown size={14} className="text-primary" />
    )
  }

  if (algorithms.length === 0) return <EmptyState />

  const headers: [SortField, string][] = [
    ['name', 'Algorithm'],
    ['type', 'Family'],
    ['pubkey', 'Pub key'],
    ['sig', 'Sig / CT'],
  ]

  return (
    <div className="glass-panel overflow-hidden">
      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <caption className="sr-only">
            Algorithm catalogue: sizes, security level and maturity for the rows matching the
            current filters
          </caption>
          <thead>
            <tr className="bg-muted/50 text-muted-foreground text-xs uppercase tracking-wider border-b border-border">
              <th className="p-3 w-8" aria-label="Select for comparison" />
              {headers.map(([field, label]) => (
                <th
                  key={field}
                  className="p-3 font-semibold"
                  title={field === 'ram' ? RAM_CAVEAT : undefined}
                >
                  <Button
                    variant="ghost"
                    onClick={() => handleSort(field)}
                    className="flex items-center gap-1.5 hover:text-foreground transition-colors h-auto p-0 text-xs uppercase tracking-wider"
                  >
                    {label}
                    {renderSortIcon(field)}
                  </Button>
                </th>
              ))}
              <th className="p-3 font-semibold" title={RAM_CAVEAT}>
                <Button
                  variant="ghost"
                  onClick={() => handleSort('ram')}
                  className="flex h-auto items-center gap-1.5 p-0 text-xs uppercase tracking-wider"
                >
                  RAM {renderSortIcon('ram')}
                </Button>
              </th>
              <th className="p-3 font-semibold">Standard</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {sorted.map((algo, index) => {
              const highlighted =
                algo.id === selectedAlgoId || isHighlighted(algo, highlightAlgorithms)
              const checked = compareSet.has(algo.name)

              return (
                <tr
                  key={`${algo.name}-${index}`}
                  data-deeplink-id={algo.name}
                  className={clsx(
                    'transition-colors hover:bg-primary/10',
                    checked
                      ? 'bg-secondary/10'
                      : highlighted
                        ? 'bg-primary/15 ring-1 ring-inset ring-primary/30'
                        : index % 2 === 0
                          ? 'bg-card/50'
                          : 'bg-muted/20'
                  )}
                >
                  <td className="p-3 align-top">
                    <div className="pt-1">
                      <CompareCheckbox
                        algo={algo}
                        algorithms={algorithms}
                        compareSet={compareSet}
                        compareType={compareType}
                        maxCompareReached={maxCompareReached}
                        selectionLimit={selectionLimit}
                        onToggleCompare={onToggleCompare}
                      />
                    </div>
                  </td>
                  {/* min-width sized so the CTA strip below reads as ONE line, the
                      same as the Transition Guide's row. The table scrolls
                      horizontally, so widening this column is free. */}
                  <td className="p-3 align-top min-w-[19.5rem]">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <AlgoName algo={algo} onOpenAlgorithm={onOpenAlgorithm} />
                        <DraftBadge algo={algo} />
                        <AdvisoryBadge algo={algo} />
                        <Cnsa20Badge algo={algo} />
                        <ResearchNeededBadge algo={algo} />
                        <NoImplementationBadge algo={algo} />
                      </div>
                      {algo.securityLevel ? (
                        <span
                          className={clsx(
                            'text-xs px-2 py-0.5 rounded border w-fit',
                            getSecurityLevelColor(algo.securityLevel)
                          )}
                        >
                          {formatSecurityLevel(algo)}
                        </span>
                      ) : (
                        <span className="text-xs italic text-muted-foreground">
                          Security level: {formatSecurityLevel(algo)}
                        </span>
                      )}
                      <AlgoCtaStrip
                        algoName={algo.name}
                        trailing={<AlgorithmCheckButton algorithm={algo} />}
                      />
                    </div>
                  </td>
                  <td className="p-3 align-top text-sm text-muted-foreground">{algo.family}</td>
                  <td className="p-3 align-top text-xs font-mono text-foreground whitespace-nowrap">
                    <ByteSize algo={algo} field="publicKey" />
                  </td>
                  <td className="p-3 align-top text-xs font-mono text-foreground whitespace-nowrap">
                    <ByteSize algo={algo} field="signatureOrCiphertext" />
                  </td>
                  <td className="p-3 align-top min-w-[80px] whitespace-nowrap text-xs font-mono text-muted-foreground">
                    <RamSize algo={algo} />
                  </td>
                  <td className="p-3 align-top text-xs font-mono text-muted-foreground whitespace-nowrap">
                    {algo.fipsStandard}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <p className="px-3 pb-3 pt-2 text-xs text-muted-foreground">
          <span className="font-semibold">RAM figures are approximate.</span> {RAM_CAVEAT}
        </p>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden divide-y divide-border/50">
        {sorted.map((algo, index) => {
          const checked = compareSet.has(algo.name)

          return (
            <div
              key={`${algo.name}-${index}`}
              data-deeplink-id={algo.name}
              className={clsx(
                'p-4 space-y-2',
                checked
                  ? 'bg-secondary/10'
                  : (algo.id === selectedAlgoId || isHighlighted(algo, highlightAlgorithms)) &&
                      'bg-primary/15'
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  {/* eslint-disable-next-line jsx-a11y/label-has-associated-control -- control is
                      the <input> rendered inside CompareCheckbox, which the static rule can't see through */}
                  <label className="inline-flex items-center justify-center shrink-0 min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0">
                    <CompareCheckbox
                      algo={algo}
                      algorithms={algorithms}
                      compareSet={compareSet}
                      compareType={compareType}
                      maxCompareReached={maxCompareReached}
                      selectionLimit={selectionLimit}
                      onToggleCompare={onToggleCompare}
                    />
                  </label>
                  <AlgoName algo={algo} onOpenAlgorithm={onOpenAlgorithm} />
                  <DraftBadge algo={algo} />
                  <AdvisoryBadge algo={algo} />
                  <Cnsa20Badge algo={algo} />
                  <ResearchNeededBadge algo={algo} />
                  <NoImplementationBadge algo={algo} />
                  <span className="text-xs text-muted-foreground">{algo.family}</span>
                </div>
                {algo.securityLevel ? (
                  <span
                    className={clsx(
                      'text-xs px-2 py-0.5 rounded border shrink-0',
                      getSecurityLevelColor(algo.securityLevel)
                    )}
                    title={formatSecurityLevel(algo)}
                  >
                    L{algo.securityLevel}
                  </span>
                ) : (
                  <span className="text-[11px] italic text-muted-foreground shrink-0">
                    Level: {formatSecurityLevel(algo)}
                  </span>
                )}
              </div>
              <AlgoCtaStrip
                algoName={algo.name}
                trailing={<AlgorithmCheckButton algorithm={algo} />}
              />
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground block">Pub key</span>
                  <span className="font-mono text-foreground">
                    <ByteSize algo={algo} field="publicKey" />
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Sig / CT</span>
                  <span className="font-mono text-foreground">
                    <ByteSize algo={algo} field="signatureOrCiphertext" />
                  </span>
                </div>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>
                  RAM: <RamSize algo={algo} />
                </span>
                <span className="font-mono">{algo.fipsStandard}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
