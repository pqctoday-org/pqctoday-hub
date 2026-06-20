// SPDX-License-Identifier: GPL-3.0-only
import { useState, useMemo } from 'react'
import React from 'react'
import {
  type AlgorithmDetail,
  getPerformanceCategory,
  getPerformanceColor,
  getSecurityLevelColor,
  getFunctionGroup,
  RESEARCH_NEEDED,
  isResearchNeeded,
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
import { TrustScoreBadge } from '@/components/ui/TrustScoreBadge'
import { ReviewedBadge } from '@/components/ui/ReviewedBadge'
import { RevisionDrilldownPanel } from '@/components/ui/RevisionDrilldownPanel'
import { useRevisions, byRecord } from '@/hooks/useRevisions'
import { Button } from '@/components/ui/button'
import { AlgoCtaStrip } from './AlgoCtaStrip'
import { classifyCnsa20, cnsa20ChipClasses } from './cnsa20'
import { MAX_COMPARE } from './useAlgorithmExplorer'
import { AlgorithmComparisonPanel } from './AlgorithmComparisonPanel'

type SortField = 'name' | 'type' | 'pubkey' | 'sig' | 'keygen' | 'sign' | 'verify' | 'ram'
type SortDir = 'asc' | 'desc'

function getPerformanceMultiplier(cycles: string): number {
  if (cycles === 'Baseline' || cycles.includes('Baseline')) return 1
  // eslint-disable-next-line security/detect-unsafe-regex
  const match = cycles.match(/(\d+(?:\.\d+)?)x/)
  return match ? parseFloat(match[1]) : 1
}

interface AlgorithmDetailedComparisonProps {
  highlightAlgorithms?: Set<string>
  onInfoOpen?: () => void
  filteredAlgorithms: AlgorithmDetail[]
  compareSet: Set<string>
  compareType: 'KEM' | 'Signature' | null
  maxCompareReached: boolean
  onToggleCompare: (name: string) => void
  /** Browse (unified table) ↔ Compare (transposed matrix). */
  detailMode: 'browse' | 'compare'
  onDetailModeChange: (mode: 'browse' | 'compare') => void
  /** Resolved algorithms + baseline for Compare mode (from the explorer hook). */
  comparisonAlgos: AlgorithmDetail[]
  baselineAlgo: AlgorithmDetail | null
}

export const AlgorithmDetailedComparison: React.FC<AlgorithmDetailedComparisonProps> = ({
  highlightAlgorithms,
  onInfoOpen,
  filteredAlgorithms,
  compareSet,
  compareType,
  maxCompareReached,
  onToggleCompare,
  detailMode,
  onDetailModeChange,
  comparisonAlgos,
  baselineAlgo,
}) => {
  const selectedCount = compareSet.size

  return (
    <div className="space-y-3">
      {/* Mode switch + About */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
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
            onToggleCompare={onToggleCompare}
          />
          <SelectionBar
            count={selectedCount}
            compareType={compareType}
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
function CompareView({
  comparisonAlgos,
  baselineAlgo,
  onBrowse,
}: {
  comparisonAlgos: AlgorithmDetail[]
  baselineAlgo: AlgorithmDetail | null
  onBrowse: () => void
}) {
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
      <AlgorithmComparisonPanel
        algorithms={comparisonAlgos}
        baseline={baselineAlgo}
        activeTab="detailed"
        onClose={onBrowse}
      />
    </div>
  )
}

/* ────────────────────────────────────────────────────────────────────────────
 * Browse-mode selection footer.
 * ────────────────────────────────────────────────────────────────────────── */
function SelectionBar({
  count,
  compareType,
  onCompare,
}: {
  count: number
  compareType: 'KEM' | 'Signature' | null
  onCompare: () => void
}) {
  return (
    <div className="glass-panel p-3 flex items-center justify-between gap-3 flex-wrap">
      <span className="text-sm text-muted-foreground">
        <strong className="text-foreground">{count}</strong> of {MAX_COMPARE} selected
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
  onToggleCompare: (name: string) => void
}

/** Checkbox that toggles comparison membership, honoring the type-lock + cap. */
function CompareCheckbox({
  algo,
  compareSet,
  compareType,
  maxCompareReached,
  onToggleCompare,
}: BrowseTableProps & { algo: AlgorithmDetail }) {
  const algoGroup = getFunctionGroup(algo)
  if (algoGroup !== 'KEM' && algoGroup !== 'Signature') {
    return <span className="inline-block w-4 shrink-0" aria-hidden="true" />
  }
  const isCompared = compareSet.has(algo.name)
  const canToggle =
    isCompared || (!maxCompareReached && (compareType === null || compareType === algoGroup))
  const reason = isCompared
    ? 'Remove from comparison'
    : !canToggle
      ? maxCompareReached
        ? `Max ${MAX_COMPARE} reached`
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
      className="h-4 w-4 shrink-0 rounded border-border accent-primary cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
    />
  )
}

function isHighlighted(algo: AlgorithmDetail, highlights?: Set<string>): boolean {
  if (!highlights) return false
  return Array.from(highlights).some(
    (h) =>
      algo.name.toLowerCase().includes(h.toLowerCase()) ||
      h.toLowerCase().includes(algo.name.toLowerCase())
  )
}

function isDraftCandidate(algo: AlgorithmDetail): boolean {
  return (
    algo.status === 'Candidate' ||
    algo.status === 'Draft' ||
    (algo.fipsStandard.includes('Draft') && !algo.fipsStandard.startsWith('FIPS'))
  )
}

function DraftBadge({ algo }: { algo: AlgorithmDetail }) {
  if (!isDraftCandidate(algo)) return null
  return (
    <span
      className="inline-flex items-center text-[10px] px-1.5 py-0.5 rounded bg-status-warning/15 text-status-warning border border-status-warning/30 font-medium"
      title="Draft or candidate standard — sizes and parameters may change before finalization"
    >
      Draft
    </span>
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

/** Render either the formatted byte count or the literal "Research needed" placeholder. */
function ByteSize({ value, unknown }: { value: number | null; unknown: boolean }) {
  if (unknown || value === null || value === undefined) {
    return (
      <span className="italic text-muted-foreground" title="Not yet researched">
        {RESEARCH_NEEDED}
      </span>
    )
  }
  return <>{value.toLocaleString()} B</>
}

/** Render either the cycles string or the literal "Research needed" placeholder. */
function CyclesValue({ value }: { value: string }) {
  if (isResearchNeeded(value)) {
    return (
      <span className="italic text-muted-foreground" title="Not yet benchmarked">
        {RESEARCH_NEEDED}
      </span>
    )
  }
  return <>{value}</>
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
  onToggleCompare,
}: BrowseTableProps) {
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [drilldownAlgo, setDrilldownAlgo] = useState<string | null>(null)
  const { revisions } = useRevisions()

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  const sizeForSort = (algo: AlgorithmDetail, key: 'publicKeySize' | 'signatureCiphertextSize') =>
    algo.sizesUnknown ? Number.MAX_SAFE_INTEGER : (algo[key] ?? Number.MAX_SAFE_INTEGER)

  const sorted = useMemo(() => {
    return [...algorithms].sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1
      switch (sortField) {
        case 'name':
          return dir * a.name.localeCompare(b.name)
        case 'type':
          return dir * a.family.localeCompare(b.family)
        case 'pubkey':
          return dir * (sizeForSort(a, 'publicKeySize') - sizeForSort(b, 'publicKeySize'))
        case 'sig':
          return (
            dir *
            (sizeForSort(a, 'signatureCiphertextSize') - sizeForSort(b, 'signatureCiphertextSize'))
          )
        case 'keygen':
          return (
            dir *
            (getPerformanceMultiplier(a.keyGenCycles) - getPerformanceMultiplier(b.keyGenCycles))
          )
        case 'sign':
          return (
            dir *
            (getPerformanceMultiplier(a.signEncapsCycles) -
              getPerformanceMultiplier(b.signEncapsCycles))
          )
        case 'verify':
          return (
            dir *
            (getPerformanceMultiplier(a.verifyDecapsCycles) -
              getPerformanceMultiplier(b.verifyDecapsCycles))
          )
        case 'ram':
          return dir * (a.stackRAM - b.stackRAM)
        default:
          return 0
      }
    })
  }, [algorithms, sortField, sortDir])

  // Max values for normalizing inline bar widths (relative across visible rows).
  const maxValues = useMemo(() => {
    const maxKeygen = Math.max(...sorted.map((a) => getPerformanceMultiplier(a.keyGenCycles)), 1)
    const maxSign = Math.max(...sorted.map((a) => getPerformanceMultiplier(a.signEncapsCycles)), 1)
    const maxVerify = Math.max(
      ...sorted.map((a) => getPerformanceMultiplier(a.verifyDecapsCycles)),
      1
    )
    const maxRam = Math.max(...sorted.map((a) => a.stackRAM), 1)
    return { maxKeygen, maxSign, maxVerify, maxRam }
  }, [sorted])

  const PerfBar = ({ value, max, color }: { value: number; max: number; color: string }) => {
    const pct = Math.min((value / max) * 100, 100)
    return (
      <div className="w-full h-1 rounded-full bg-border/50 mt-1" aria-hidden="true">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    )
  }

  const SortIcon = ({ field }: { field: SortField }) => {
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
    ['keygen', 'KeyGen'],
    ['sign', 'Sign / Enc'],
    ['verify', 'Verify / Dec'],
    ['ram', 'RAM'],
  ]

  const perfCell = (
    category: string,
    cycles: string,
    multiplier: number,
    max: number,
    barColor: string
  ) => (
    <div className="flex flex-col gap-0.5">
      <span
        className={clsx(
          'text-xs px-2 py-1 rounded border font-medium w-fit',
          getPerformanceColor(category)
        )}
      >
        {category}
      </span>
      <span className="text-xs text-muted-foreground font-mono">
        <CyclesValue value={cycles} />
      </span>
      {!isResearchNeeded(cycles) && <PerfBar value={multiplier} max={max} color={barColor} />}
    </div>
  )

  return (
    <div className="glass-panel overflow-hidden">
      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-muted/50 text-muted-foreground text-xs uppercase tracking-wider border-b border-border">
              <th className="p-3 w-8" aria-label="Select for comparison" />
              {headers.map(([field, label]) => (
                <th key={field} className="p-3 font-semibold">
                  <Button
                    variant="ghost"
                    onClick={() => handleSort(field)}
                    className="flex items-center gap-1.5 hover:text-foreground transition-colors h-auto p-0 text-xs uppercase tracking-wider"
                  >
                    {label}
                    <SortIcon field={field} />
                  </Button>
                </th>
              ))}
              <th className="p-3 font-semibold">Standard</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {sorted.map((algo, index) => {
              const keyGenPerf = getPerformanceCategory(algo.keyGenCycles)
              const signPerf = getPerformanceCategory(algo.signEncapsCycles)
              const verifyPerf = getPerformanceCategory(algo.verifyDecapsCycles)
              const highlighted = isHighlighted(algo, highlightAlgorithms)
              const checked = compareSet.has(algo.name)

              return (
                <tr
                  key={`${algo.name}-${index}`}
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
                        onToggleCompare={onToggleCompare}
                      />
                    </div>
                  </td>
                  <td className="p-3 align-top">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-foreground">{algo.name}</span>
                        <TrustScoreBadge
                          resourceType="algorithm"
                          resourceId={algo.name}
                          size="sm"
                        />
                        <ReviewedBadge
                          domain="algorithms"
                          entityId={algo.name}
                          showUnreviewed={false}
                          onOpenDrilldown={() => setDrilldownAlgo(algo.name)}
                        />
                        <DraftBadge algo={algo} />
                        <Cnsa20Badge algo={algo} />
                        <ResearchNeededBadge algo={algo} />
                      </div>
                      {algo.securityLevel && (
                        <span
                          className={clsx(
                            'text-xs px-2 py-0.5 rounded border w-fit',
                            getSecurityLevelColor(algo.securityLevel)
                          )}
                        >
                          Level {algo.securityLevel}
                        </span>
                      )}
                      <AlgoCtaStrip algoName={algo.name} />
                    </div>
                  </td>
                  <td className="p-3 align-top text-sm text-muted-foreground">{algo.family}</td>
                  <td className="p-3 align-top text-xs font-mono text-foreground whitespace-nowrap">
                    <ByteSize value={algo.publicKeySize} unknown={algo.sizesUnknown} />
                  </td>
                  <td className="p-3 align-top text-xs font-mono text-foreground whitespace-nowrap">
                    <ByteSize value={algo.signatureCiphertextSize} unknown={algo.sizesUnknown} />
                  </td>
                  <td className="p-3 align-top min-w-[110px]">
                    {perfCell(
                      keyGenPerf,
                      algo.keyGenCycles,
                      getPerformanceMultiplier(algo.keyGenCycles),
                      maxValues.maxKeygen,
                      'bg-primary/50'
                    )}
                  </td>
                  <td className="p-3 align-top min-w-[110px]">
                    {perfCell(
                      signPerf,
                      algo.signEncapsCycles,
                      getPerformanceMultiplier(algo.signEncapsCycles),
                      maxValues.maxSign,
                      'bg-accent/50'
                    )}
                  </td>
                  <td className="p-3 align-top min-w-[110px]">
                    {perfCell(
                      verifyPerf,
                      algo.verifyDecapsCycles,
                      getPerformanceMultiplier(algo.verifyDecapsCycles),
                      maxValues.maxVerify,
                      'bg-secondary/50'
                    )}
                  </td>
                  <td className="p-3 align-top min-w-[80px]">
                    {algo.stackRAM > 0 ? (
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-mono text-muted-foreground">
                          ~{(algo.stackRAM / 1000).toFixed(1)}KB
                        </span>
                        <PerfBar
                          value={algo.stackRAM}
                          max={maxValues.maxRam}
                          color="bg-muted-foreground/40"
                        />
                      </div>
                    ) : (
                      <span
                        className="text-xs italic text-muted-foreground"
                        title="Not yet researched"
                      >
                        {RESEARCH_NEEDED}
                      </span>
                    )}
                  </td>
                  <td className="p-3 align-top text-xs font-mono text-muted-foreground whitespace-nowrap">
                    {algo.fipsStandard}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden divide-y divide-border/50">
        {sorted.map((algo, index) => {
          const keyGenPerf = getPerformanceCategory(algo.keyGenCycles)
          const signPerf = getPerformanceCategory(algo.signEncapsCycles)
          const verifyPerf = getPerformanceCategory(algo.verifyDecapsCycles)
          const checked = compareSet.has(algo.name)

          return (
            <div
              key={`${algo.name}-${index}`}
              className={clsx('p-4 space-y-2', checked && 'bg-secondary/10')}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <CompareCheckbox
                    algo={algo}
                    algorithms={algorithms}
                    compareSet={compareSet}
                    compareType={compareType}
                    maxCompareReached={maxCompareReached}
                    onToggleCompare={onToggleCompare}
                  />
                  <span className="font-semibold text-foreground">{algo.name}</span>
                  <DraftBadge algo={algo} />
                  <Cnsa20Badge algo={algo} />
                  <ResearchNeededBadge algo={algo} />
                  <span className="text-xs text-muted-foreground">{algo.family}</span>
                </div>
                {algo.securityLevel && (
                  <span
                    className={clsx(
                      'text-xs px-2 py-0.5 rounded border shrink-0',
                      getSecurityLevelColor(algo.securityLevel)
                    )}
                  >
                    L{algo.securityLevel}
                  </span>
                )}
              </div>
              <AlgoCtaStrip algoName={algo.name} />
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground block">Pub key</span>
                  <span className="font-mono text-foreground">
                    <ByteSize value={algo.publicKeySize} unknown={algo.sizesUnknown} />
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Sig / CT</span>
                  <span className="font-mono text-foreground">
                    <ByteSize value={algo.signatureCiphertextSize} unknown={algo.sizesUnknown} />
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground block">KeyGen</span>
                  <span
                    className={clsx(
                      'px-1.5 py-0.5 rounded border',
                      getPerformanceColor(keyGenPerf)
                    )}
                  >
                    {keyGenPerf}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Sign/Enc</span>
                  <span
                    className={clsx('px-1.5 py-0.5 rounded border', getPerformanceColor(signPerf))}
                  >
                    {signPerf}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Verify/Dec</span>
                  <span
                    className={clsx(
                      'px-1.5 py-0.5 rounded border',
                      getPerformanceColor(verifyPerf)
                    )}
                  >
                    {verifyPerf}
                  </span>
                </div>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>
                  RAM:{' '}
                  {algo.stackRAM > 0 ? (
                    <>~{(algo.stackRAM / 1000).toFixed(1)}KB</>
                  ) : (
                    <span className="italic">{RESEARCH_NEEDED}</span>
                  )}
                </span>
                <span className="font-mono">{algo.fipsStandard}</span>
              </div>
            </div>
          )
        })}
      </div>
      {drilldownAlgo && (
        <RevisionDrilldownPanel
          domain="algorithms"
          entityId={drilldownAlgo}
          entityLabel={drilldownAlgo}
          revisions={byRecord(revisions, 'algorithms', drilldownAlgo)}
          onClose={() => setDrilldownAlgo(null)}
        />
      )}
    </div>
  )
}
