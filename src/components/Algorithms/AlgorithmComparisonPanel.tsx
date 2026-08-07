// SPDX-License-Identifier: GPL-3.0-only
import { Fragment, useState, useCallback, useMemo } from 'react'
import { X, Loader2, Play, AlertTriangle, ChevronRight } from 'lucide-react'
import { Button } from '../ui/button'
import { InlineTooltip } from '../ui/InlineTooltip'
import {
  type AlgorithmDetail,
  getCryptoFamilyColor,
  isClassical,
  isResearchNeeded,
  RESEARCH_NEEDED,
} from '../../data/pqcAlgorithmsData'
import {
  resolveEngine,
  getEngineLabel,
  runBenchmark,
} from '../../services/crypto/algorithmEngineResolver'
import { WorkshopOperationLog, type LogEntry } from '../PKILearning/common/WorkshopOperationLog'
import { TrustScoreBadge } from '../ui/TrustScoreBadge'
import { ReviewedBadge } from '../ui/ReviewedBadge'
import { RevisionDrilldownPanel } from '../ui/RevisionDrilldownPanel'
import { useRevisions, byRecord } from '@/hooks/useRevisions'
import clsx from 'clsx'

interface ComparisonField {
  key: string
  label: string
  tooltip?: string
  getValue: (algo: AlgorithmDetail) => string | number | null
  compare?: 'lower-better' | 'higher-better'
}

const DETAIL_FIELDS: ComparisonField[] = [
  { key: 'cryptoFamily', label: 'Crypto Family', getValue: (a) => a.cryptoFamily },
  {
    key: 'securityLevel',
    label: 'Security Level',
    tooltip: 'Classical Security Bits',
    getValue: (a) =>
      a.securityLevel !== null ? `Level ${a.securityLevel} (${a.aesEquivalent})` : a.aesEquivalent,
  },
  {
    key: 'publicKeySize',
    label: 'Public Key',
    getValue: (a) => (a.sizesUnknown ? RESEARCH_NEEDED : a.publicKeySize),
    compare: 'lower-better',
  },
  {
    key: 'privateKeySize',
    label: 'Private Key',
    getValue: (a) => (a.sizesUnknown ? RESEARCH_NEEDED : a.privateKeySize),
    compare: 'lower-better',
  },
  {
    key: 'sigCt',
    label: 'Sig / Ciphertext',
    getValue: (a) => (a.sizesUnknown ? RESEARCH_NEEDED : a.signatureCiphertextSize),
    compare: 'lower-better',
  },
  {
    key: 'keygen',
    label: 'KeyGen Cycles',
    getValue: (a) => (isResearchNeeded(a.keyGenCycles) ? RESEARCH_NEEDED : a.keyGenCycles),
  },
  {
    key: 'signEncaps',
    label: 'Sign / Encaps Cycles',
    getValue: (a) => (isResearchNeeded(a.signEncapsCycles) ? RESEARCH_NEEDED : a.signEncapsCycles),
  },
  {
    key: 'verifyDecaps',
    label: 'Verify / Decaps Cycles',
    getValue: (a) =>
      isResearchNeeded(a.verifyDecapsCycles) ? RESEARCH_NEEDED : a.verifyDecapsCycles,
  },
  {
    key: 'stackRam',
    label: 'Stack RAM',
    getValue: (a) => (a.stackRAM > 0 ? a.stackRAM : RESEARCH_NEEDED),
    compare: 'lower-better',
  },
  { key: 'fips', label: 'FIPS Standard', getValue: (a) => a.fipsStandard },
  { key: 'useCase', label: 'Use Case', getValue: (a) => a.useCaseNotes },
]

function formatValue(val: string | number | null): string {
  if (val === null || val === undefined) return '—'
  if (typeof val === 'number') return val.toLocaleString() + ' B'
  return val
}

interface AlgorithmComparisonPanelProps {
  algorithms: AlgorithmDetail[]
  baseline: AlgorithmDetail | null
  activeTab: 'transition' | 'detailed'
  onClose: () => void
}

export function AlgorithmComparisonPanel({
  algorithms,
  baseline,
  onClose,
}: AlgorithmComparisonPanelProps) {
  const [drilldownAlgo, setDrilldownAlgo] = useState<string | null>(null)
  const { revisions } = useRevisions()
  if (algorithms.length < 2) return null

  // Build deduplicated allAlgos: fixed baseline first, then selected algorithms
  const seen = new Set<string>()
  const allAlgos: AlgorithmDetail[] = []
  if (baseline) {
    seen.add(baseline.name)
    allAlgos.push(baseline)
  }
  for (const a of algorithms) {
    if (!seen.has(a.name)) {
      seen.add(a.name)
      allAlgos.push(a)
    }
  }

  return (
    <div className="glass-panel p-4 md:p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground">
          Comparing {algorithms.length} Algorithms
          {baseline && (
            <span className="text-muted-foreground font-normal"> vs {baseline.name} baseline</span>
          )}
        </h3>
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onClose}>
          <X size={14} />
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="sticky left-0 z-10 bg-background text-left px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider w-40">
                Attribute
              </th>
              {allAlgos.map((a) => {
                const isBase = baseline?.name === a.name
                const isClassicalAlgo = isClassical(a)
                return (
                  <th
                    key={a.name}
                    className={clsx(
                      'text-left px-3 py-2 text-xs font-semibold',
                      isBase
                        ? 'text-primary'
                        : isClassicalAlgo
                          ? 'text-muted-foreground'
                          : 'text-foreground'
                    )}
                  >
                    {a.name}
                    {isBase && (
                      <span className="ml-1 text-[10px] font-medium text-primary/70 uppercase">
                        baseline
                      </span>
                    )}
                    {!isBase && isClassicalAlgo && (
                      <span className="ml-1 text-[10px] font-medium text-muted-foreground uppercase">
                        classical
                      </span>
                    )}
                    {!isClassicalAlgo && (
                      <span className="ml-1 text-[10px] font-medium text-status-success/70 uppercase">
                        pqc
                      </span>
                    )}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {DETAIL_FIELDS.map((field) => {
              // Best-in-row: for lower-is-better numeric rows, find the minimum
              // value across ALL columns (baseline + PQC) and flag it green ✓.
              const rowMin =
                field.compare === 'lower-better'
                  ? Math.min(
                      ...allAlgos
                        .map((a) => field.getValue(a))
                        .filter((v): v is number => typeof v === 'number')
                    )
                  : Infinity
              return (
                <tr key={field.key} className="border-b border-border/50 hover:bg-muted/30">
                  <td className="sticky left-0 z-10 bg-background px-3 py-2 text-xs font-medium text-muted-foreground whitespace-nowrap">
                    {field.tooltip ? (
                      <InlineTooltip term={field.tooltip}>{field.label}</InlineTooltip>
                    ) : (
                      field.label
                    )}
                  </td>
                  {allAlgos.map((a) => {
                    const val = field.getValue(a)
                    const isBest =
                      allAlgos.length > 1 &&
                      Number.isFinite(rowMin) &&
                      typeof val === 'number' &&
                      val === rowMin
                    const isFamilyField = field.key === 'cryptoFamily'
                    return (
                      <td
                        key={a.name}
                        className={clsx(
                          'px-3 py-2 text-xs',
                          isBest ? 'text-status-success font-semibold' : 'text-foreground'
                        )}
                      >
                        {isFamilyField && typeof val === 'string' ? (
                          <span
                            className={clsx(
                              'inline-block px-2 py-0.5 rounded-full text-[10px] font-medium border',
                              getCryptoFamilyColor(val)
                            )}
                          >
                            {val}
                          </span>
                        ) : (
                          <>
                            {isBest && (
                              <span aria-hidden="true" className="mr-0.5">
                                ✓
                              </span>
                            )}
                            {formatValue(val)}
                          </>
                        )}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
            {/* Trust + review provenance lives here, in the detail pane — not in
                the browse rows, where the reviewer/approved_via string is
                unbounded and wraps across the table. */}
            <tr className="border-b border-border/50 hover:bg-muted/30">
              <td className="sticky left-0 z-10 bg-background px-3 py-2 text-xs font-medium text-muted-foreground whitespace-nowrap">
                Trust &amp; review
              </td>
              {allAlgos.map((a) => (
                <td key={a.name} className="px-3 py-2 text-xs">
                  <div className="flex flex-col items-start gap-1">
                    <TrustScoreBadge resourceType="algorithm" resourceId={a.name} size="sm" />
                    <ReviewedBadge
                      domain="algorithms"
                      entityId={a.name}
                      showUnreviewed={false}
                      onOpenDrilldown={() => setDrilldownAlgo(a.name)}
                    />
                  </div>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
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

      {/* Benchmark section */}
      <BenchmarkSection algorithms={allAlgos} baseline={baseline} />
    </div>
  )
}

// ── Benchmark sub-component ──

interface BenchmarkRun {
  algoName: string
  engine: string
  runIndex: number
  keyGenMs: number
  signEncapsTps: number
  verifyDecapsTps: number
  error?: string
}

interface BenchmarkSummary {
  algoName: string
  engine: string
  count: number
  errors: number
  avgKeyGenMs: number
  avgSignEncapsTps: number
  avgVerifyDecapsTps: number
  minKeyGenMs: number
  maxKeyGenMs: number
  minSignEncapsTps: number
  maxSignEncapsTps: number
  minVerifyDecapsTps: number
  maxVerifyDecapsTps: number
  runs: BenchmarkRun[]
}

function BenchmarkSection({
  algorithms,
  baseline,
}: {
  algorithms: AlgorithmDetail[]
  baseline: AlgorithmDetail | null
}) {
  const classicalNameSet = useMemo(
    () => new Set(algorithms.filter((a) => isClassical(a)).map((a) => a.name)),
    [algorithms]
  )
  const [opsCount, setOpsCount] = useState(1)
  const [running, setRunning] = useState(false)
  const [progress, setProgress] = useState('')
  const [runs, setRuns] = useState<BenchmarkRun[]>([])
  const [expandedAlgos, setExpandedAlgos] = useState<Set<string>>(new Set())
  const [logEntries, setLogEntries] = useState<LogEntry[]>([])

  const toggleExpanded = useCallback((algoName: string) => {
    setExpandedAlgos((prev) => {
      const next = new Set(prev)
      if (next.has(algoName)) next.delete(algoName)
      else next.add(algoName)
      return next
    })
  }, [])

  const summaries = useMemo<BenchmarkSummary[]>(() => {
    if (runs.length === 0) return []
    const groups = new Map<string, BenchmarkRun[]>()
    for (const run of runs) {
      const existing = groups.get(run.algoName)
      if (existing) existing.push(run)
      else groups.set(run.algoName, [run])
    }
    return Array.from(groups.entries()).map(([algoName, algoRuns]) => {
      const successRuns = algoRuns.filter((r) => r.keyGenMs >= 0)
      const errorCount = algoRuns.length - successRuns.length
      if (successRuns.length === 0) {
        return {
          algoName,
          engine: algoRuns[0].engine,
          count: algoRuns.length,
          errors: errorCount,
          avgKeyGenMs: -1,
          avgSignEncapsTps: -1,
          avgVerifyDecapsTps: -1,
          minKeyGenMs: -1,
          maxKeyGenMs: -1,
          minSignEncapsTps: -1,
          maxSignEncapsTps: -1,
          minVerifyDecapsTps: -1,
          maxVerifyDecapsTps: -1,
          runs: algoRuns,
        }
      }
      const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length
      const keyGens = successRuns.map((r) => r.keyGenMs)
      const signTps = successRuns.map((r) => r.signEncapsTps)
      const verifyTps = successRuns.map((r) => r.verifyDecapsTps)
      return {
        algoName,
        engine: successRuns[0].engine,
        count: algoRuns.length,
        errors: errorCount,
        avgKeyGenMs: avg(keyGens),
        avgSignEncapsTps: avg(signTps),
        avgVerifyDecapsTps: avg(verifyTps),
        minKeyGenMs: Math.min(...keyGens),
        maxKeyGenMs: Math.max(...keyGens),
        minSignEncapsTps: Math.min(...signTps),
        maxSignEncapsTps: Math.max(...signTps),
        minVerifyDecapsTps: Math.min(...verifyTps),
        maxVerifyDecapsTps: Math.max(...verifyTps),
        runs: algoRuns,
      }
    })
  }, [runs])

  const handleRun = useCallback(async () => {
    setRunning(true)
    setRuns([])
    setExpandedAlgos(new Set())
    setLogEntries([])
    const allRuns: BenchmarkRun[] = []

    for (const algo of algorithms) {
      const engine = resolveEngine(algo.name)
      if (!engine) continue

      setProgress(`Running ${algo.name}...`)
      for (let i = 0; i < opsCount; i++) {
        const opLabel = `${algo.name} — run ${i + 1}/${opsCount}`
        const startedAt = performance.now()
        setLogEntries((prev) => [...prev, { status: 'pending', message: opLabel }])
        try {
          const result = await runBenchmark(algo.name)
          allRuns.push({
            algoName: algo.name,
            engine: getEngineLabel(result.engine),
            runIndex: i + 1,
            keyGenMs: result.keyGenMs,
            signEncapsTps: result.signEncapsMs > 0 ? 1000 / result.signEncapsMs : 0,
            verifyDecapsTps: result.verifyDecapsMs > 0 ? 1000 / result.verifyDecapsMs : 0,
          })
          setRuns([...allRuns])
          const signTps = result.signEncapsMs > 0 ? 1000 / result.signEncapsMs : 0
          const verifyTps = result.verifyDecapsMs > 0 ? 1000 / result.verifyDecapsMs : 0
          setLogEntries((prev) => {
            const next = [...prev]
            next[next.length - 1] = {
              status: 'success',
              message: `${opLabel} — keyGen ${result.keyGenMs.toFixed(1)}ms · sign/encap ${signTps.toFixed(0)} ops/s · verify/decap ${verifyTps.toFixed(0)} ops/s`,
              durationMs: Math.round(performance.now() - startedAt),
            }
            return next
          })
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Unknown error'
          console.error(`[Benchmark] ${algo.name} run ${i + 1} failed:`, err)
          allRuns.push({
            algoName: algo.name,
            engine: getEngineLabel(engine),
            runIndex: i + 1,
            keyGenMs: -1,
            signEncapsTps: -1,
            verifyDecapsTps: -1,
            error: message,
          })
          setRuns([...allRuns])
          setLogEntries((prev) => {
            const next = [...prev]
            next[next.length - 1] = {
              status: 'error',
              message: `${opLabel} — ${message}`,
              durationMs: Math.round(performance.now() - startedAt),
            }
            return next
          })
        }
      }
    }

    setProgress('')
    setRunning(false)
  }, [algorithms, opsCount])

  return (
    <div className="mt-6 border-t border-border pt-4">
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <h4 className="text-sm font-semibold text-foreground">Live Benchmark</h4>

        <div className="flex items-center gap-2">
          <label htmlFor="ops-slider" className="text-xs text-muted-foreground">
            Operations:
          </label>
          <input
            id="ops-slider"
            type="range"
            min={1}
            max={10}
            value={opsCount}
            onChange={(e) => setOpsCount(parseInt(e.target.value))}
            className="w-24 accent-primary"
            disabled={running}
          />
          <span className="text-xs font-mono text-foreground w-4">{opsCount}</span>
        </div>

        <Button
          variant="gradient"
          size="sm"
          disabled={running}
          onClick={handleRun}
          className="gap-1.5"
        >
          {running ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
          {running ? progress || 'Running...' : 'Run Benchmark'}
        </Button>
      </div>

      {logEntries.length > 0 && (
        <WorkshopOperationLog entries={logEntries} className="mb-4 max-h-48" />
      )}

      {runs.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground uppercase tracking-wider">
                {opsCount > 1 && <th className="w-6 px-1 py-2" />}
                <th className="text-left px-3 py-2">Algorithm</th>
                <th className="text-left px-3 py-2">Engine</th>
                <th className="text-left px-3 py-2">{opsCount > 1 ? 'Runs' : 'Run #'}</th>
                <th className="text-right px-3 py-2">KeyGen (ms)</th>
                <th className="text-right px-3 py-2">Sign/Encaps TPS</th>
                <th className="text-right px-3 py-2">Verify/Decaps TPS</th>
              </tr>
            </thead>
            <tbody>
              {opsCount === 1
                ? runs.map((run, i) => {
                    const isBaseline = baseline && run.algoName === baseline.name
                    const isClassicalRun = classicalNameSet.has(run.algoName)
                    return (
                      <tr
                        key={`${run.algoName}-${run.runIndex}`}
                        className={clsx(
                          'border-b border-border/50',
                          isBaseline && 'bg-primary/5',
                          i % 2 === 0 ? 'bg-card/50' : 'bg-muted/20'
                        )}
                      >
                        <td
                          className={clsx(
                            'px-3 py-2 text-xs font-medium',
                            isBaseline
                              ? 'text-primary'
                              : isClassicalRun
                                ? 'text-muted-foreground'
                                : 'text-foreground'
                          )}
                        >
                          {run.algoName}
                          {isBaseline && (
                            <span className="ml-1 text-[10px] text-primary/70 uppercase">
                              baseline
                            </span>
                          )}
                          {!isBaseline && isClassicalRun && (
                            <span className="ml-1 text-[10px] text-muted-foreground uppercase">
                              classical
                            </span>
                          )}
                          {!isClassicalRun && (
                            <span className="ml-1 text-[10px] text-status-success/60 uppercase">
                              pqc
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <span
                            className={clsx(
                              'text-[10px] px-1.5 py-0.5 rounded border',
                              run.error
                                ? 'bg-destructive/10 border-destructive/20 text-status-error'
                                : 'bg-muted border-border text-muted-foreground'
                            )}
                            title={run.error || undefined}
                          >
                            {run.error ? (
                              <span className="inline-flex items-center gap-1">
                                <AlertTriangle size={10} />
                                {run.engine}
                              </span>
                            ) : (
                              run.engine
                            )}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-xs text-muted-foreground">{run.runIndex}</td>
                        <td className="px-3 py-2 text-xs text-right font-mono">
                          {run.keyGenMs >= 0 ? `${run.keyGenMs.toFixed(1)}` : '—'}
                        </td>
                        <td className="px-3 py-2 text-xs text-right font-mono">
                          {run.signEncapsTps >= 0 ? `${run.signEncapsTps.toFixed(0)}` : '—'}
                        </td>
                        <td className="px-3 py-2 text-xs text-right font-mono">
                          {run.verifyDecapsTps >= 0 ? `${run.verifyDecapsTps.toFixed(0)}` : '—'}
                        </td>
                      </tr>
                    )
                  })
                : summaries.map((summary) => {
                    const isBaseline = baseline && summary.algoName === baseline.name
                    const isClassicalSummary = classicalNameSet.has(summary.algoName)
                    const isExpanded = expandedAlgos.has(summary.algoName)
                    return (
                      <Fragment key={summary.algoName}>
                        {/* Summary row */}
                        <tr
                          className={clsx(
                            'border-b border-border/50 cursor-pointer hover:bg-muted/40',
                            isBaseline && 'bg-primary/5'
                          )}
                          onClick={() => toggleExpanded(summary.algoName)}
                        >
                          <td className="px-1 py-2 text-center">
                            <ChevronRight
                              size={12}
                              className={clsx(
                                'text-muted-foreground transition-transform duration-200',
                                isExpanded && 'rotate-90'
                              )}
                            />
                          </td>
                          <td
                            className={clsx(
                              'px-3 py-2 text-xs font-medium',
                              isBaseline
                                ? 'text-primary'
                                : isClassicalSummary
                                  ? 'text-muted-foreground'
                                  : 'text-foreground'
                            )}
                          >
                            {summary.algoName}
                            {isBaseline && (
                              <span className="ml-1 text-[10px] text-primary/70 uppercase">
                                baseline
                              </span>
                            )}
                            {!isBaseline && isClassicalSummary && (
                              <span className="ml-1 text-[10px] text-muted-foreground uppercase">
                                classical
                              </span>
                            )}
                            {!isClassicalSummary && (
                              <span className="ml-1 text-[10px] text-status-success/60 uppercase">
                                pqc
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            <span
                              className={clsx(
                                'text-[10px] px-1.5 py-0.5 rounded border',
                                summary.errors > 0
                                  ? 'bg-destructive/10 border-destructive/20 text-status-error'
                                  : 'bg-muted border-border text-muted-foreground'
                              )}
                            >
                              {summary.errors > 0 ? (
                                <span className="inline-flex items-center gap-1">
                                  <AlertTriangle size={10} />
                                  {summary.engine}
                                </span>
                              ) : (
                                summary.engine
                              )}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-xs">
                            <span className="text-muted-foreground">
                              {summary.count - summary.errors} ok
                            </span>
                            {summary.errors > 0 && (
                              <span className="ml-1 text-status-error">{summary.errors} err</span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-xs text-right font-mono">
                            {summary.avgKeyGenMs >= 0 ? (
                              <div>
                                <div>{summary.avgKeyGenMs.toFixed(1)}</div>
                                <div className="text-[10px] text-muted-foreground">
                                  ({summary.minKeyGenMs.toFixed(1)}–{summary.maxKeyGenMs.toFixed(1)}
                                  )
                                </div>
                              </div>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td className="px-3 py-2 text-xs text-right font-mono">
                            {summary.avgSignEncapsTps >= 0 ? (
                              <div>
                                <div>{summary.avgSignEncapsTps.toFixed(0)}</div>
                                <div className="text-[10px] text-muted-foreground">
                                  ({summary.minSignEncapsTps.toFixed(0)}–
                                  {summary.maxSignEncapsTps.toFixed(0)})
                                </div>
                              </div>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td className="px-3 py-2 text-xs text-right font-mono">
                            {summary.avgVerifyDecapsTps >= 0 ? (
                              <div>
                                <div>{summary.avgVerifyDecapsTps.toFixed(0)}</div>
                                <div className="text-[10px] text-muted-foreground">
                                  ({summary.minVerifyDecapsTps.toFixed(0)}–
                                  {summary.maxVerifyDecapsTps.toFixed(0)})
                                </div>
                              </div>
                            ) : (
                              '—'
                            )}
                          </td>
                        </tr>
                        {/* Collapsible detail rows */}
                        {isExpanded &&
                          summary.runs.map((run) => (
                            <tr
                              key={`${run.algoName}-${run.runIndex}`}
                              className="border-b border-border/30 bg-muted/10"
                            >
                              <td />
                              <td className="pl-8 pr-3 py-1.5 text-xs text-muted-foreground">
                                #{run.runIndex}
                              </td>
                              <td className="px-3 py-1.5">
                                <span
                                  className={clsx(
                                    'text-[10px] px-1.5 py-0.5 rounded border',
                                    run.error
                                      ? 'bg-destructive/10 border-destructive/20 text-status-error'
                                      : 'bg-muted border-border text-muted-foreground'
                                  )}
                                  title={run.error || undefined}
                                >
                                  {run.error ? (
                                    <span className="inline-flex items-center gap-1">
                                      <AlertTriangle size={10} />
                                      {run.engine}
                                    </span>
                                  ) : (
                                    run.engine
                                  )}
                                </span>
                              </td>
                              <td className="px-3 py-1.5 text-xs text-muted-foreground">
                                {run.runIndex}
                              </td>
                              <td className="px-3 py-1.5 text-xs text-right font-mono text-muted-foreground">
                                {run.keyGenMs >= 0 ? `${run.keyGenMs.toFixed(1)}` : '—'}
                              </td>
                              <td className="px-3 py-1.5 text-xs text-right font-mono text-muted-foreground">
                                {run.signEncapsTps >= 0 ? `${run.signEncapsTps.toFixed(0)}` : '—'}
                              </td>
                              <td className="px-3 py-1.5 text-xs text-right font-mono text-muted-foreground">
                                {run.verifyDecapsTps >= 0
                                  ? `${run.verifyDecapsTps.toFixed(0)}`
                                  : '—'}
                              </td>
                            </tr>
                          ))}
                      </Fragment>
                    )
                  })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
