// SPDX-License-Identifier: GPL-3.0-only
import { motion } from 'framer-motion'
import { useState, useMemo } from 'react'
import {
  type AlgorithmDetail,
  getPerformanceCategory,
  getPerformanceColor,
  getSecurityLevelColor,
  getFunctionGroup,
  RESEARCH_NEEDED,
  isResearchNeeded,
} from '../../data/pqcAlgorithmsData'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import {
  Shield,
  Zap,
  HardDrive,
  TrendingUp,
  Info,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  SearchX,
  Scale,
  ShieldAlert,
  FlaskConical,
} from 'lucide-react'
import clsx from 'clsx'
import { TrustScoreBadge } from '@/components/ui/TrustScoreBadge'
import { Button } from '@/components/ui/button'
import { ImplementationAttacksView } from './ImplementationAttacksView'
import { KATView } from './KATView'
import { AlgoCtaStrip } from './AlgoCtaStrip'

type SortField = 'name' | 'type' | 'keygen' | 'sign' | 'verify' | 'ram' | 'optimization'
type SortDir = 'asc' | 'desc'

function getPerformanceMultiplier(cycles: string): number {
  if (cycles === 'Baseline' || cycles.includes('Baseline')) return 1
  // eslint-disable-next-line security/detect-unsafe-regex
  const match = cycles.match(/(\d+(?:\.\d+)?)x/)
  return match ? parseFloat(match[1]) : 1
}

type SubTab = 'performance' | 'security' | 'sizes' | 'usecases' | 'attacks' | 'kat'

interface AlgorithmDetailedComparisonProps {
  highlightAlgorithms?: Set<string>
  onInfoOpen?: () => void
  filteredAlgorithms: AlgorithmDetail[]
  compareSet: Set<string>
  compareType: 'KEM' | 'Signature' | null
  maxCompareReached: boolean
  onToggleCompare: (name: string) => void
  activeSubTab?: SubTab
  onSubTabChange?: (tab: SubTab) => void
}

export const AlgorithmDetailedComparison: React.FC<AlgorithmDetailedComparisonProps> = ({
  highlightAlgorithms,
  onInfoOpen,
  filteredAlgorithms,
  compareSet,
  compareType,
  maxCompareReached,
  onToggleCompare,
  activeSubTab = 'performance',
  onSubTabChange,
}) => {
  return (
    <div className="space-y-6">
      {/* Tabs */}
      <Tabs value={activeSubTab} onValueChange={(v) => onSubTabChange?.(v as SubTab)}>
        <div className="flex items-center gap-2 mb-4">
          <TabsList className="bg-muted/50 border border-border flex w-full overflow-x-auto hide-scrollbar justify-start sm:justify-center p-1 rounded-lg">
            <TabsTrigger
              value="performance"
              className="flex items-center gap-2 shrink-0 data-[state=active]:bg-background shadow-sm"
            >
              <Zap size={16} />
              <span>Performance</span>
            </TabsTrigger>
            <TabsTrigger
              value="security"
              className="flex items-center gap-2 shrink-0 data-[state=active]:bg-background shadow-sm"
            >
              <Shield size={16} />
              <span>Security Levels</span>
            </TabsTrigger>
            <TabsTrigger
              value="sizes"
              className="flex items-center gap-2 shrink-0 data-[state=active]:bg-background shadow-sm"
            >
              <HardDrive size={16} />
              <span>Size Comparison</span>
            </TabsTrigger>
            <TabsTrigger
              value="usecases"
              className="flex items-center gap-2 shrink-0 data-[state=active]:bg-background shadow-sm"
            >
              <TrendingUp size={16} />
              <span>Use Cases</span>
            </TabsTrigger>
            <TabsTrigger
              value="attacks"
              className="flex items-center gap-2 shrink-0 data-[state=active]:bg-background shadow-sm"
            >
              <ShieldAlert size={16} />
              <span>Impl. Attacks</span>
            </TabsTrigger>
            <TabsTrigger
              value="kat"
              className="flex items-center gap-2 shrink-0 data-[state=active]:bg-background shadow-sm"
            >
              <FlaskConical size={16} />
              <span>KAT Validation</span>
            </TabsTrigger>
          </TabsList>
          {onInfoOpen && (
            <Button
              variant="ghost"
              onClick={onInfoOpen}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-muted/50 border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors text-xs"
              aria-label="Performance data methodology"
              title="About performance data"
            >
              <Info size={14} />
              <span className="hidden sm:inline">About</span>
            </Button>
          )}
        </div>

        <TabsContent value="performance">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <PerformanceView
              algorithms={filteredAlgorithms}
              highlightAlgorithms={highlightAlgorithms}
              compareSet={compareSet}
              compareType={compareType}
              maxCompareReached={maxCompareReached}
              onToggleCompare={onToggleCompare}
            />
          </motion.div>
        </TabsContent>

        <TabsContent value="security">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <SecurityView
              algorithms={filteredAlgorithms}
              highlightAlgorithms={highlightAlgorithms}
              compareSet={compareSet}
              compareType={compareType}
              maxCompareReached={maxCompareReached}
              onToggleCompare={onToggleCompare}
            />
          </motion.div>
        </TabsContent>

        <TabsContent value="sizes">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <SizesView
              algorithms={filteredAlgorithms}
              highlightAlgorithms={highlightAlgorithms}
              compareSet={compareSet}
              compareType={compareType}
              maxCompareReached={maxCompareReached}
              onToggleCompare={onToggleCompare}
            />
          </motion.div>
        </TabsContent>

        <TabsContent value="usecases">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <UseCasesView
              algorithms={filteredAlgorithms}
              highlightAlgorithms={highlightAlgorithms}
              compareSet={compareSet}
              compareType={compareType}
              maxCompareReached={maxCompareReached}
              onToggleCompare={onToggleCompare}
            />
          </motion.div>
        </TabsContent>

        <TabsContent value="attacks">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <ImplementationAttacksView />
          </motion.div>
        </TabsContent>

        <TabsContent value="kat">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <KATView />
          </motion.div>
        </TabsContent>
      </Tabs>
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

interface DetailViewProps {
  algorithms: AlgorithmDetail[]
  highlightAlgorithms?: Set<string>
  compareSet?: Set<string>
  compareType?: 'KEM' | 'Signature' | null
  maxCompareReached?: boolean
  onToggleCompare?: (name: string) => void
}

function CompareButton({
  algo,
  compareSet,
  compareType,
  maxCompareReached,
  onToggleCompare,
}: {
  algo: AlgorithmDetail
  compareSet?: Set<string>
  compareType?: 'KEM' | 'Signature' | null
  maxCompareReached?: boolean
  onToggleCompare?: (name: string) => void
}) {
  if (!onToggleCompare) return null
  const algoGroup = getFunctionGroup(algo)
  if (algoGroup !== 'KEM' && algoGroup !== 'Signature') return null
  const isCompared = compareSet?.has(algo.name) ?? false
  const canToggle =
    isCompared || (!maxCompareReached && (compareType === null || compareType === algoGroup))
  return (
    <div className="relative group/compare flex items-center shrink-0">
      <Button
        variant="ghost"
        type="button"
        onClick={() => onToggleCompare(algo.name)}
        disabled={!canToggle && !isCompared}
        title={
          isCompared
            ? 'Remove from comparison'
            : !canToggle
              ? maxCompareReached
                ? 'Max 3 reached'
                : `Requires ${compareType}`
              : 'Add to comparison'
        }
        className={clsx(
          'shrink-0 p-1 rounded transition-colors',
          isCompared
            ? 'text-secondary bg-secondary/10'
            : canToggle
              ? 'text-muted-foreground hover:text-secondary hover:bg-secondary/10'
              : 'text-muted-foreground/30 cursor-not-allowed'
        )}
      >
        <Scale size={14} />
      </Button>
      {!canToggle && !isCompared && (
        <span className="absolute left-full ml-2 whitespace-nowrap bg-status-error text-status-error-foreground text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover/compare:opacity-100 transition-opacity pointer-events-none z-10 hidden sm:block">
          {maxCompareReached ? 'Max 3 reached' : `Compare ${compareType} only`}
        </span>
      )}
    </div>
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
function ByteSize({ value, unknown }: { value: number; unknown: boolean }) {
  if (unknown) {
    return (
      <span className="italic text-muted-foreground" title="Not yet researched">
        {RESEARCH_NEEDED}
      </span>
    )
  }
  return <>{value.toLocaleString()} bytes</>
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

// Performance View Component
const PerformanceView = ({
  algorithms,
  highlightAlgorithms,
  compareSet,
  compareType,
  maxCompareReached,
  onToggleCompare,
}: DetailViewProps) => {
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

  const sorted = useMemo(() => {
    return [...algorithms].sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1
      switch (sortField) {
        case 'name':
          return dir * a.name.localeCompare(b.name)
        case 'type':
          return dir * a.family.localeCompare(b.family)
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
        case 'optimization':
          return dir * a.optimizationTarget.localeCompare(b.optimizationTarget)
        default:
          return 0
      }
    })
  }, [algorithms, sortField, sortDir])

  // Max values for normalizing inline bar widths (relative comparison across visible rows)
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

  return (
    <div className="glass-panel overflow-hidden">
      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-muted/50 text-muted-foreground text-xs uppercase tracking-wider border-b border-border">
              {(
                [
                  ['name', 'Algorithm'],
                  ['type', 'Type'],
                  ['keygen', 'KeyGen'],
                  ['sign', 'Sign/Encaps'],
                  ['verify', 'Verify/Decaps'],
                  ['ram', 'Stack RAM'],
                  ['optimization', 'Optimization'],
                ] as [SortField, string][]
              ).map(([field, label]) => (
                <th key={field} className="p-4 font-semibold">
                  <Button
                    variant="ghost"
                    onClick={() => handleSort(field)}
                    className="flex items-center gap-1.5 hover:text-foreground transition-colors"
                  >
                    {label}
                    <SortIcon field={field} />
                  </Button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {sorted.map((algo, index) => {
              const keyGenPerf = getPerformanceCategory(algo.keyGenCycles)
              const signPerf = getPerformanceCategory(algo.signEncapsCycles)
              const verifyPerf = getPerformanceCategory(algo.verifyDecapsCycles)
              const highlighted = isHighlighted(algo, highlightAlgorithms)

              return (
                <tr
                  key={`${algo.name}-${index}`}
                  className={clsx(
                    'transition-colors hover:bg-primary/10',
                    highlighted
                      ? 'bg-primary/15 ring-1 ring-inset ring-primary/30'
                      : index % 2 === 0
                        ? 'bg-card/50'
                        : 'bg-muted/20'
                  )}
                >
                  <td className="p-4">
                    <div className="flex items-start gap-2">
                      <CompareButton
                        algo={algo}
                        compareSet={compareSet}
                        compareType={compareType}
                        maxCompareReached={maxCompareReached}
                        onToggleCompare={onToggleCompare}
                      />
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-foreground">{algo.name}</span>
                          <TrustScoreBadge
                            resourceType="algorithm"
                            resourceId={algo.name}
                            size="sm"
                          />
                          <DraftBadge algo={algo} />
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
                    </div>
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">{algo.family}</td>
                  <td className="p-4 min-w-[110px]">
                    <div className="flex flex-col gap-0.5">
                      <span
                        className={clsx(
                          'text-xs px-2 py-1 rounded border font-medium w-fit',
                          getPerformanceColor(keyGenPerf)
                        )}
                      >
                        {keyGenPerf}
                      </span>
                      <span className="text-xs text-muted-foreground font-mono">
                        <CyclesValue value={algo.keyGenCycles} />
                      </span>
                      {!isResearchNeeded(algo.keyGenCycles) && (
                        <PerfBar
                          value={getPerformanceMultiplier(algo.keyGenCycles)}
                          max={maxValues.maxKeygen}
                          color="bg-primary/50"
                        />
                      )}
                    </div>
                  </td>
                  <td className="p-4 min-w-[110px]">
                    <div className="flex flex-col gap-0.5">
                      <span
                        className={clsx(
                          'text-xs px-2 py-1 rounded border font-medium w-fit',
                          getPerformanceColor(signPerf)
                        )}
                      >
                        {signPerf}
                      </span>
                      <span className="text-xs text-muted-foreground font-mono">
                        <CyclesValue value={algo.signEncapsCycles} />
                      </span>
                      {!isResearchNeeded(algo.signEncapsCycles) && (
                        <PerfBar
                          value={getPerformanceMultiplier(algo.signEncapsCycles)}
                          max={maxValues.maxSign}
                          color="bg-accent/50"
                        />
                      )}
                    </div>
                  </td>
                  <td className="p-4 min-w-[110px]">
                    <div className="flex flex-col gap-0.5">
                      <span
                        className={clsx(
                          'text-xs px-2 py-1 rounded border font-medium w-fit',
                          getPerformanceColor(verifyPerf)
                        )}
                      >
                        {verifyPerf}
                      </span>
                      <span className="text-xs text-muted-foreground font-mono">
                        <CyclesValue value={algo.verifyDecapsCycles} />
                      </span>
                      {!isResearchNeeded(algo.verifyDecapsCycles) && (
                        <PerfBar
                          value={getPerformanceMultiplier(algo.verifyDecapsCycles)}
                          max={maxValues.maxVerify}
                          color="bg-secondary/50"
                        />
                      )}
                    </div>
                  </td>
                  <td className="p-4 min-w-[90px]">
                    <div className="flex flex-col gap-0.5">
                      {algo.stackRAM > 0 ? (
                        <>
                          <span className="text-sm font-mono text-muted-foreground">
                            ~{(algo.stackRAM / 1000).toFixed(1)}KB
                          </span>
                          <PerfBar
                            value={algo.stackRAM}
                            max={maxValues.maxRam}
                            color="bg-muted-foreground/40"
                          />
                        </>
                      ) : (
                        <span
                          className="text-xs italic text-muted-foreground"
                          title="Not yet researched"
                        >
                          {RESEARCH_NEEDED}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">{algo.optimizationTarget}</td>
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

          return (
            <div key={`${algo.name}-${index}`} className="p-4 space-y-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-semibold text-foreground">{algo.name}</span>
                  <DraftBadge algo={algo} />
                  <ResearchNeededBadge algo={algo} />
                  <span className="text-xs text-muted-foreground">{algo.family}</span>
                </div>
                {algo.securityLevel && (
                  <span
                    className={clsx(
                      'text-xs px-2 py-0.5 rounded border',
                      getSecurityLevelColor(algo.securityLevel)
                    )}
                  >
                    L{algo.securityLevel}
                  </span>
                )}
              </div>
              <AlgoCtaStrip algoName={algo.name} />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
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
                <span>{algo.optimizationTarget}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const HARDNESS_ASSUMPTIONS: Record<string, string> = {
  Lattice: 'Module-LWE / NTRU (shortest vector problems on structured lattices)',
  'Code-based': 'Decoding random linear / quasi-cyclic codes',
  'Hash-based': 'Hash function collision and preimage resistance',
  Multivariate: 'Solving systems of multivariate quadratic equations (MQ problem)',
  Isogeny: 'Computing isogenies between supersingular elliptic curves',
  Hybrid: 'Combination of classical (DLP/factoring) and PQC hardness assumptions',
  Classical: 'Integer factoring (RSA) or discrete logarithm (ECC/DH)',
}

// Security View Component
const SecurityView = ({
  algorithms,
  highlightAlgorithms,
  compareSet,
  compareType,
  maxCompareReached,
  onToggleCompare,
}: DetailViewProps) => {
  if (algorithms.length === 0) return <EmptyState />

  const groupedByLevel = algorithms.reduce(
    (acc, algo) => {
      const level = algo.securityLevel?.toString() || 'Classical'
      if (level === '__proto__' || level === 'constructor' || level === 'prototype') return acc

      // eslint-disable-next-line security/detect-object-injection
      if (!acc[level]) acc[level] = []
      // eslint-disable-next-line security/detect-object-injection
      acc[level].push(algo)
      return acc
    },
    {} as Record<string, AlgorithmDetail[]>
  )

  return (
    <div className="space-y-6">
      {Object.entries(groupedByLevel)
        .sort(([a], [b]) => {
          if (a === 'Classical') return 1
          if (b === 'Classical') return -1
          return parseInt(a) - parseInt(b)
        })
        .map(([level, algos]) => (
          <div key={level} className="glass-panel p-6">
            <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Shield className="text-primary" size={20} />
              {level === 'Classical' ? (
                'Classical Algorithms'
              ) : (
                <>
                  NIST Security Level {level}
                  <span className="text-sm font-normal text-muted-foreground">
                    ({algos[0]?.aesEquivalent})
                  </span>
                </>
              )}
            </h4>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {algos.map((algo, index) => (
                <div
                  key={`${algo.name}-${index}`}
                  className={clsx(
                    'border border-border rounded-lg p-4 hover:border-primary/50 transition-colors',
                    isHighlighted(algo, highlightAlgorithms)
                      ? 'bg-primary/15 ring-1 ring-inset ring-primary/30'
                      : 'bg-muted/30'
                  )}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <CompareButton
                        algo={algo}
                        compareSet={compareSet}
                        compareType={compareType}
                        maxCompareReached={maxCompareReached}
                        onToggleCompare={onToggleCompare}
                      />
                      <h5 className="font-semibold text-foreground">{algo.name}</h5>
                    </div>
                    <span className="text-xs px-2 py-1 rounded bg-primary/20 text-primary border border-primary/30">
                      {algo.family}
                    </span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Standard:</span>
                      <span className="text-foreground font-mono text-xs">{algo.fipsStandard}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Pub Key:</span>
                      <span className="text-foreground font-mono text-xs">
                        <ByteSize value={algo.publicKeySize} unknown={algo.sizesUnknown} />
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Priv Key:</span>
                      <span className="text-foreground font-mono text-xs">
                        <ByteSize value={algo.privateKeySize} unknown={algo.sizesUnknown} />
                      </span>
                    </div>
                    {HARDNESS_ASSUMPTIONS[algo.cryptoFamily] && (
                      <div className="pt-1 border-t border-border/50">
                        <span className="text-[10px] text-muted-foreground leading-snug">
                          <span className="font-medium text-foreground">{algo.cryptoFamily}:</span>{' '}
                          {HARDNESS_ASSUMPTIONS[algo.cryptoFamily]}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
    </div>
  )
}

// Sizes View Component
const SizesView = ({
  algorithms,
  highlightAlgorithms,
  compareSet,
  compareType,
  maxCompareReached,
  onToggleCompare,
}: DetailViewProps) => {
  if (algorithms.length === 0) return <EmptyState />

  // Skip entries with unknown sizes when computing chart maxima so bars stay meaningful.
  const knownSizeAlgos = algorithms.filter((a) => !a.sizesUnknown)
  const maxPubKey = Math.max(1, ...knownSizeAlgos.map((a) => a.publicKeySize))
  const maxPrivKey = Math.max(1, ...knownSizeAlgos.map((a) => a.privateKeySize))
  const maxSig = Math.max(1, ...knownSizeAlgos.map((a) => a.signatureCiphertextSize || 0))

  return (
    <div className="glass-panel p-4 md:p-6">
      <div className="space-y-6">
        {algorithms.map((algo, index) => (
          <div
            key={`${algo.name}-${index}`}
            className={clsx(
              'border-b border-border/50 last:border-0 pb-6 last:pb-0',
              isHighlighted(algo, highlightAlgorithms) &&
                'bg-primary/15 ring-1 ring-inset ring-primary/30 rounded-lg p-4'
            )}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <CompareButton
                  algo={algo}
                  compareSet={compareSet}
                  compareType={compareType}
                  maxCompareReached={maxCompareReached}
                  onToggleCompare={onToggleCompare}
                />
                <h5 className="font-semibold text-foreground">{algo.name}</h5>
                <DraftBadge algo={algo} />
                <ResearchNeededBadge algo={algo} />
              </div>
              <span className="text-xs px-2 py-1 rounded bg-primary/20 text-primary border border-primary/30">
                {algo.family}
              </span>
            </div>

            <div className="space-y-3">
              {/* Public Key */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Public Key</span>
                  <span className="font-mono text-foreground">
                    <ByteSize value={algo.publicKeySize} unknown={algo.sizesUnknown} />
                  </span>
                </div>
                {!algo.sizesUnknown && (
                  <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary/50 rounded-full"
                      style={{ width: `${(algo.publicKeySize / maxPubKey) * 100}%` }}
                    />
                  </div>
                )}
              </div>

              {/* Private Key */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Private Key</span>
                  <span className="font-mono text-foreground">
                    <ByteSize value={algo.privateKeySize} unknown={algo.sizesUnknown} />
                  </span>
                </div>
                {!algo.sizesUnknown && (
                  <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent/50 rounded-full"
                      style={{ width: `${(algo.privateKeySize / maxPrivKey) * 100}%` }}
                    />
                  </div>
                )}
              </div>

              {/* Signature/Ciphertext */}
              {algo.signatureCiphertextSize && maxSig > 0 && !algo.sizesUnknown && (
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">
                      {algo.family.includes('Sig') ? 'Signature' : 'Ciphertext'}
                    </span>
                    <span className="font-mono text-foreground">
                      {algo.signatureCiphertextSize.toLocaleString()} bytes
                    </span>
                  </div>
                  <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-secondary/50 rounded-full"
                      style={{
                        width: `${(algo.signatureCiphertextSize / maxSig) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Shared Secret */}
              {algo.sharedSecretSize && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shared Secret</span>
                  <span className="font-mono text-foreground">{algo.sharedSecretSize} bytes</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Use Cases View Component
const UseCasesView = ({
  algorithms,
  highlightAlgorithms,
  compareSet,
  compareType,
  maxCompareReached,
  onToggleCompare,
}: DetailViewProps) => {
  if (algorithms.length === 0) return <EmptyState />

  return (
    <div className="space-y-6">
      <div className="glass-panel p-4 md:p-6">
        <div className="flex items-start gap-3 mb-6 p-4 bg-status-info border border-border rounded-lg">
          <Info className="text-primary flex-shrink-0 mt-0.5" size={20} />
          <div className="text-sm">
            <p className="font-semibold mb-1 text-foreground">Global Use Case Recommendations</p>
            <p className="text-muted-foreground">
              These recommendations apply across all industries including finance, healthcare,
              government, telecommunications, IoT, and enterprise applications.
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {algorithms.map((algo, index) => (
            <div
              key={`${algo.name}-${index}`}
              className={clsx(
                'border border-border rounded-lg p-5 hover:border-primary/50 transition-colors',
                isHighlighted(algo, highlightAlgorithms)
                  ? 'bg-primary/15 ring-1 ring-inset ring-primary/30'
                  : 'bg-muted/30'
              )}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-1.5">
                  <CompareButton
                    algo={algo}
                    compareSet={compareSet}
                    compareType={compareType}
                    maxCompareReached={maxCompareReached}
                    onToggleCompare={onToggleCompare}
                  />
                  <h5 className="font-semibold text-foreground text-lg">{algo.name}</h5>
                </div>
                {algo.securityLevel && (
                  <span
                    className={clsx(
                      'text-xs px-2 py-1 rounded border',
                      getSecurityLevelColor(algo.securityLevel)
                    )}
                  >
                    L{algo.securityLevel}
                  </span>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                    Optimization
                  </span>
                  <p className="text-sm text-muted-foreground mt-1">{algo.optimizationTarget}</p>
                </div>

                {algo.useCaseNotes && (
                  <div>
                    <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                      Recommendations
                    </span>
                    <p className="text-sm text-foreground mt-1 leading-relaxed">
                      {algo.useCaseNotes}
                    </p>
                  </div>
                )}

                <div className="pt-3 border-t border-border">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Standard
                  </span>
                  <p className="text-sm text-foreground mt-1 font-mono">{algo.fipsStandard}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
