// SPDX-License-Identifier: GPL-3.0-only
import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from 'recharts'
import {
  Info,
  Server,
  Cpu,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Gauge,
  Download,
} from 'lucide-react'
import clsx from 'clsx'
import { Button } from '@/components/ui/button'
import { CollapsibleSection } from '@/components/ui/CollapsibleSection'
import {
  USE_CASES,
  CLASSICAL_HSM_DEFAULT,
  PQC_HSM_DEFAULT,
  SIZE_PRESETS,
  ALGO_IDS,
  ALGO_LABELS,
  ALGO_SLIDER_RANGES,
  type AlgoId,
  type DeploymentSize,
  type UseCase,
  type HsmProfile,
} from '@/data/hsmCapacityDefaults'
import { generateCsv, downloadCsv, csvFilename } from '@/utils/csvExport'

type Workload = 'classical' | 'pqc'
type Redundancy = 'n+1' | '2n'

interface UseCaseState {
  enabled: boolean
  tps: number
}

interface AlgoLoad {
  algo: AlgoId
  opsPerSec: number
}

interface ScenarioResult {
  key: string
  label: string
  shortLabel: string
  workload: Workload
  hsmProfile: HsmProfile
  algoLoad: AlgoLoad[]
  /** HSMs needed per algo (ceil(load / capacity)). */
  perAlgoHsms: Array<{
    algo: AlgoId
    hsms: number
    utilizationPct: number
    load: number
    capacity: number
  }>
  /** Bottleneck algo (max perAlgoHsms). */
  bottleneck: AlgoId
  /** Minimum HSMs required to meet load (before redundancy). */
  requiredRaw: number
  /** Minimum HSMs after redundancy uplift. */
  requiredWithRedundancy: number
  /** User-selected HSM count (from slider). */
  deployedHsms: number
  /** Utilization % of deployed fleet against peak algo demand. */
  fleetUtilizationPct: number
  sufficient: boolean
}

function applyRedundancy(n: number, mode: Redundancy): number {
  if (n <= 0) return 0
  return mode === '2n' ? n * 2 : n + 1
}

function computeAlgoLoad(
  useCases: UseCase[],
  state: Record<string, UseCaseState>,
  workload: Workload
): AlgoLoad[] {
  const totals: Record<AlgoId, number> = {
    'rsa-2048': 0,
    'ecdsa-p256': 0,
    'ecdh-p256': 0,
    'ml-dsa-65': 0,
    'aes-128': 0,
    'aes-256': 0,
  }
  for (const uc of useCases) {
    const s = state[uc.id]
    if (!s || !s.enabled) continue
    const ops = workload === 'classical' ? uc.classicalOps : uc.pqcOps
    for (const [algo, perTx] of Object.entries(ops)) {
      totals[algo as AlgoId] += s.tps * (perTx as number)
    }
  }
  return ALGO_IDS.map((algo) => ({ algo, opsPerSec: totals[algo] }))
}

function computeScenario(
  key: string,
  label: string,
  shortLabel: string,
  workload: Workload,
  hsmProfile: HsmProfile,
  useCases: UseCase[],
  state: Record<string, UseCaseState>,
  redundancy: Redundancy,
  deployedHsms: number
): ScenarioResult {
  const algoLoad = computeAlgoLoad(useCases, state, workload)
  const perAlgoHsms = algoLoad.map(({ algo, opsPerSec }) => {
    const capacity = hsmProfile.opsPerSec[algo]
    const hsms = opsPerSec > 0 ? Math.ceil(opsPerSec / capacity) : 0
    const utilizationPct = deployedHsms > 0 ? (opsPerSec / (capacity * deployedHsms)) * 100 : 0
    return { algo, hsms, utilizationPct, load: opsPerSec, capacity }
  })
  const requiredRaw = perAlgoHsms.reduce((m, r) => Math.max(m, r.hsms), 0)
  const bottleneck = perAlgoHsms.reduce<{ algo: AlgoId; hsms: number }>(
    (m, r) => (r.hsms > m.hsms ? { algo: r.algo, hsms: r.hsms } : m),
    { algo: 'rsa-2048', hsms: 0 }
  ).algo
  const requiredWithRedundancy = applyRedundancy(requiredRaw, redundancy)
  const fleetUtilizationPct = perAlgoHsms.reduce((m, r) => Math.max(m, r.utilizationPct), 0)
  const sufficient = deployedHsms >= requiredWithRedundancy
  return {
    key,
    label,
    shortLabel,
    workload,
    hsmProfile,
    algoLoad,
    perAlgoHsms,
    bottleneck,
    requiredRaw,
    requiredWithRedundancy,
    deployedHsms,
    fleetUtilizationPct,
    sufficient,
  }
}

export function computeScenarios(params: {
  useCases: UseCase[]
  state: Record<string, UseCaseState>
  classical: HsmProfile
  pqc: HsmProfile
  redundancy: Redundancy
  hsmCounts: { today: number; tomorrow: number; upgraded: number }
}): ScenarioResult[] {
  const { useCases, state, classical, pqc, redundancy, hsmCounts } = params
  return [
    computeScenario(
      'today',
      'Today — classical workload on classical HSM',
      'Today',
      'classical',
      classical,
      useCases,
      state,
      redundancy,
      hsmCounts.today
    ),
    computeScenario(
      'tomorrow',
      'Post-PQC migration on existing classical HSM fleet',
      'Post-PQC (existing fleet)',
      'pqc',
      classical,
      useCases,
      state,
      redundancy,
      hsmCounts.tomorrow
    ),
    computeScenario(
      'upgraded',
      'Post-PQC migration with next-gen PQC HSM',
      'Post-PQC (next-gen HSM)',
      'pqc',
      pqc,
      useCases,
      state,
      redundancy,
      hsmCounts.upgraded
    ),
  ]
}

function utilizationColor(pct: number): string {
  if (pct > 100) return 'var(--destructive)'
  if (pct >= 70) return 'var(--warning, #f59e0b)'
  return 'var(--primary)'
}

function utilizationClass(pct: number): string {
  if (pct > 100) return 'text-status-error'
  if (pct >= 70) return 'text-status-warning'
  return 'text-status-success'
}

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  format,
  tooltip,
  onChange,
  disabled,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  format: (v: number) => string
  tooltip?: string
  onChange: (v: number) => void
  disabled?: boolean
}) {
  return (
    <div className={clsx('space-y-1', disabled && 'opacity-50')}>
      <div className="flex items-center justify-between gap-2">
        <label className="text-xs font-medium text-foreground flex items-center gap-1">
          {label}
          {tooltip && (
            <span
              title={tooltip}
              className="text-muted-foreground cursor-help"
              aria-label={tooltip}
            >
              <Info size={11} />
            </span>
          )}
        </label>
        <span className="text-xs font-mono text-primary">{format(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-primary"
        aria-label={label}
        disabled={disabled}
      />
    </div>
  )
}

function ScenarioCard({
  scenario,
  onHsmCountChange,
  onResetToRequired,
  hsmCountMax,
}: {
  scenario: ScenarioResult
  onHsmCountChange: (v: number) => void
  onResetToRequired: () => void
  hsmCountMax: number
}) {
  const sufficient = scenario.sufficient
  const Icon = sufficient ? CheckCircle2 : AlertTriangle
  const statusClass = sufficient ? 'text-status-success' : 'text-status-error'
  const statusBg = sufficient
    ? 'bg-status-success/10 border-status-success/40'
    : 'bg-status-error/10 border-status-error/40'

  return (
    <div className="glass-panel p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
            {scenario.shortLabel}
          </p>
          <p className="text-sm text-foreground mt-1">{scenario.hsmProfile.name}</p>
        </div>
        <div className={clsx('rounded-md border px-2 py-1 flex items-center gap-1', statusBg)}>
          <Icon size={14} className={statusClass} aria-hidden="true" />
          <span className={clsx('text-xs font-medium', statusClass)}>
            {sufficient ? 'Sufficient' : 'Overloaded'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-md bg-muted/30 px-2 py-1.5">
          <p className="text-muted-foreground">Required</p>
          <p className="font-mono text-foreground text-base">
            {scenario.requiredWithRedundancy}{' '}
            <span className="text-xs text-muted-foreground">HSMs</span>
          </p>
          <p className="text-[10px] text-muted-foreground">
            {scenario.requiredRaw} raw + redundancy
          </p>
        </div>
        <div className="rounded-md bg-muted/30 px-2 py-1.5">
          <p className="text-muted-foreground">Deployed</p>
          <p className="font-mono text-foreground text-base">
            {scenario.deployedHsms} <span className="text-xs text-muted-foreground">HSMs</span>
          </p>
          <p className={clsx('text-[10px]', utilizationClass(scenario.fleetUtilizationPct))}>
            Peak {scenario.fleetUtilizationPct.toFixed(0)}% util
          </p>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <p className="text-[11px] font-medium text-muted-foreground">Deployed HSMs (slider)</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={onResetToRequired}
            className="h-5 text-[10px] px-1.5"
            aria-label="Set to required"
          >
            Use required
          </Button>
        </div>
        <input
          type="range"
          min={1}
          max={hsmCountMax}
          step={1}
          value={scenario.deployedHsms}
          onChange={(e) => onHsmCountChange(Number(e.target.value))}
          className="w-full accent-primary"
          aria-label={`${scenario.shortLabel} HSM count`}
        />
      </div>

      {/* Per-algo utilization bars */}
      <div className="space-y-1">
        {scenario.perAlgoHsms
          .filter((r) => r.load > 0)
          .map((r) => (
            <div key={r.algo} className="space-y-0.5">
              <div className="flex items-center justify-between text-[10px] font-mono">
                <span className="text-muted-foreground">{ALGO_LABELS[r.algo]}</span>
                <span className={utilizationClass(r.utilizationPct)}>
                  {r.utilizationPct.toFixed(0)}%
                </span>
              </div>
              <div className="h-1.5 bg-muted/40 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(r.utilizationPct, 100)}%`,
                    background: utilizationColor(r.utilizationPct),
                  }}
                />
              </div>
            </div>
          ))}
      </div>

      <p className="text-[10px] text-muted-foreground italic">
        Bottleneck: <span className="font-mono">{ALGO_LABELS[scenario.bottleneck]}</span>
      </p>
    </div>
  )
}

function HsmFleetVisual({
  count,
  sufficient,
  max,
}: {
  count: number
  sufficient: boolean
  max: number
}) {
  const display = Math.min(count, max)
  const statusClass = sufficient ? 'text-status-success' : 'text-status-error'
  return (
    <div className="flex flex-wrap gap-0.5 items-center">
      {Array.from({ length: display }).map((_, i) => (
        <Server key={i} size={14} className={clsx(statusClass, 'shrink-0')} aria-hidden="true" />
      ))}
      {count > max && (
        <span className="text-[10px] font-mono text-muted-foreground ml-1">+{count - max}</span>
      )}
    </div>
  )
}

export function HsmCapacityCalculator() {
  const [size, setSize] = useState<DeploymentSize>('medium')
  const [redundancy, setRedundancy] = useState<Redundancy>('n+1')

  const [useCaseState, setUseCaseState] = useState<Record<string, UseCaseState>>(() => {
    const out: Record<string, UseCaseState> = {}
    for (const uc of USE_CASES) {
      out[uc.id] = { enabled: uc.defaultEnabled, tps: uc.defaultTps.medium }
    }
    return out
  })

  const [classicalHsm, setClassicalHsm] = useState<HsmProfile>(CLASSICAL_HSM_DEFAULT)
  const [pqcHsm, setPqcHsm] = useState<HsmProfile>(PQC_HSM_DEFAULT)

  // Deployed HSM counts (user-adjustable via sliders). Default snaps to the
  // computed requirement whenever the user picks a new size preset or when
  // the user clicks "Use required" in a card.
  const [hsmCounts, setHsmCounts] = useState({ today: 2, tomorrow: 20, upgraded: 2 })
  // When true, HSM count sliders auto-track the computed requirement. Any
  // manual slider change flips the flag off for that scenario.
  const autoTrackRef = useRef<Record<'today' | 'tomorrow' | 'upgraded', boolean>>({
    today: true,
    tomorrow: true,
    upgraded: true,
  })

  // When size preset changes, re-seed TPS defaults for all enabled use cases.
  // Unchecked use cases retain their TPS value so user tuning isn't lost but
  // still contributes 0 to the total load.
  const handleSizeChange = useCallback((next: DeploymentSize) => {
    setSize(next)
    setUseCaseState((prev) => {
      const out: Record<string, UseCaseState> = {}
      for (const uc of USE_CASES) {
        out[uc.id] = {
          enabled: prev[uc.id]?.enabled ?? uc.defaultEnabled,
          tps: uc.defaultTps[next],
        }
      }
      return out
    })
    autoTrackRef.current = { today: true, tomorrow: true, upgraded: true }
  }, [])

  const scenarios = useMemo(
    () =>
      computeScenarios({
        useCases: USE_CASES,
        state: useCaseState,
        classical: classicalHsm,
        pqc: pqcHsm,
        redundancy,
        hsmCounts,
      }),
    [useCaseState, classicalHsm, pqcHsm, redundancy, hsmCounts]
  )

  // Auto-track: whenever the requirement changes and the user hasn't manually
  // overridden, snap the deployed-count slider to the required count. This
  // gives a natural "as you check more use cases the fleet grows" feel.
  useEffect(() => {
    setHsmCounts((prev) => {
      const next = { ...prev }
      let changed = false
      const keys = ['today', 'tomorrow', 'upgraded'] as const
      keys.forEach((k, i) => {
        const req = scenarios[i].requiredWithRedundancy
        if (autoTrackRef.current[k] && prev[k] !== req) {
          next[k] = Math.max(1, req)
          changed = true
        }
      })
      return changed ? next : prev
    })
  }, [scenarios])

  const setUseCaseEnabled = useCallback((id: string, enabled: boolean) => {
    setUseCaseState((prev) => ({ ...prev, [id]: { ...prev[id], enabled } }))
  }, [])

  const setUseCaseTps = useCallback((id: string, tps: number) => {
    setUseCaseState((prev) => ({ ...prev, [id]: { ...prev[id], tps } }))
  }, [])

  const setHsmProfileAlgo = useCallback((which: 'classical' | 'pqc', algo: AlgoId, v: number) => {
    const setter = which === 'classical' ? setClassicalHsm : setPqcHsm
    setter((prev) => ({ ...prev, opsPerSec: { ...prev.opsPerSec, [algo]: v } }))
  }, [])

  const setHsmCount = useCallback((key: 'today' | 'tomorrow' | 'upgraded', v: number) => {
    autoTrackRef.current[key] = false
    setHsmCounts((prev) => ({ ...prev, [key]: v }))
  }, [])

  const resetHsmCount = useCallback(
    (key: 'today' | 'tomorrow' | 'upgraded') => {
      autoTrackRef.current[key] = true
      setHsmCounts((prev) => ({
        ...prev,
        [key]: Math.max(
          1,
          scenarios[key === 'today' ? 0 : key === 'tomorrow' ? 1 : 2].requiredWithRedundancy
        ),
      }))
    },
    [scenarios]
  )

  const hsmCountMax = useMemo(
    () => Math.max(20, ...scenarios.map((s) => s.requiredWithRedundancy * 3)),
    [scenarios]
  )

  // Chart data
  const fleetChartData = scenarios.map((s) => ({
    name: s.shortLabel,
    Required: s.requiredWithRedundancy,
    Deployed: s.deployedHsms,
  }))

  // Aggregate workload bar (per-algo ops/s across all enabled use cases, PQC workload)
  const pqcLoad = useMemo(() => computeAlgoLoad(USE_CASES, useCaseState, 'pqc'), [useCaseState])
  const classicalLoad = useMemo(
    () => computeAlgoLoad(USE_CASES, useCaseState, 'classical'),
    [useCaseState]
  )
  const loadChartData = ALGO_IDS.map((algo) => ({
    name: ALGO_LABELS[algo],
    Classical: classicalLoad.find((l) => l.algo === algo)?.opsPerSec ?? 0,
    PQC: pqcLoad.find((l) => l.algo === algo)?.opsPerSec ?? 0,
  }))

  const totalEnabledTps = useMemo(
    () =>
      USE_CASES.reduce(
        (sum, uc) => sum + (useCaseState[uc.id]?.enabled ? useCaseState[uc.id].tps : 0),
        0
      ),
    [useCaseState]
  )

  const handleExport = useCallback(() => {
    const rows = scenarios.flatMap((s) =>
      s.perAlgoHsms
        .filter((r) => r.load > 0)
        .map((r) => ({
          scenario: s.shortLabel,
          workload: s.workload,
          hsmProfile: s.hsmProfile.name,
          algorithm: ALGO_LABELS[r.algo],
          load: Math.round(r.load),
          capacity: r.capacity,
          hsmsRequired: r.hsms,
          deployedHsms: s.deployedHsms,
          utilizationPct: Math.round(r.utilizationPct),
          sufficient: s.sufficient ? 'Yes' : 'No',
        }))
    )
    downloadCsv(
      generateCsv(rows, [
        { header: 'Scenario', accessor: (r) => r.scenario },
        { header: 'Workload', accessor: (r) => r.workload },
        { header: 'HSM profile', accessor: (r) => r.hsmProfile },
        { header: 'Algorithm', accessor: (r) => r.algorithm },
        { header: 'Load (ops/s)', accessor: (r) => r.load },
        { header: 'HSM capacity (ops/s)', accessor: (r) => r.capacity },
        { header: 'HSMs required', accessor: (r) => r.hsmsRequired },
        { header: 'Deployed HSMs', accessor: (r) => r.deployedHsms },
        { header: 'Utilization %', accessor: (r) => r.utilizationPct },
        { header: 'Sufficient', accessor: (r) => r.sufficient },
      ]),
      csvFilename('hsm-capacity')
    )
  }, [scenarios])

  return (
    <div className="space-y-6">
      {/* Disclaimer */}
      <div className="rounded-lg border border-status-warning/40 bg-status-warning/5 px-4 py-3">
        <p className="text-xs text-status-warning leading-relaxed">
          Educational model — HSM performance numbers are illustrative reference values from public
          vendor datasheets (Thales Luna 7, Entrust nShield 5c, Utimaco SecurityServer). No vendor
          currently publishes production ML-DSA hardware-accelerated TPS; that value is an
          extrapolation. Adjust every parameter to match your measured environment.
        </p>
      </div>

      {/* Sizing model */}
      <div className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3">
        <p className="text-xs text-foreground leading-relaxed">
          <span className="font-semibold text-primary">Shared-fleet sizing model.</span> A single
          HSM fleet serves all enabled use cases. Load is aggregated per algorithm across every
          checked use case, then divided by the HSM&apos;s per-algorithm capacity. The bottleneck
          algorithm (highest load / capacity ratio) determines the minimum fleet size; redundancy is
          added on top.
        </p>
      </div>

      {/* Deployment size + redundancy */}
      <div className="glass-panel p-4 space-y-4">
        <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
          Deployment profile
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {SIZE_PRESETS.map((p) => (
            <Button
              key={p.id}
              variant="ghost"
              onClick={() => handleSizeChange(p.id)}
              className={clsx(
                'text-left rounded-lg border px-3 py-2 h-auto flex-col items-start transition-colors',
                size === p.id
                  ? 'border-primary bg-primary/10 hover:bg-primary/15'
                  : 'border-border bg-muted/20 hover:border-primary/40'
              )}
              aria-pressed={size === p.id}
            >
              <p className="text-sm font-semibold text-foreground">{p.name}</p>
              <p className="text-[10px] text-muted-foreground whitespace-normal">{p.description}</p>
              <p className="text-[10px] font-mono text-primary mt-0.5">
                ~{p.aggregateTps.toLocaleString()} TPS aggregate
              </p>
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">Redundancy:</span>
          <div className="flex rounded-md overflow-hidden border border-border">
            {(['n+1', '2n'] as Redundancy[]).map((r) => (
              <Button
                key={r}
                variant="ghost"
                size="sm"
                onClick={() => setRedundancy(r)}
                className={clsx(
                  'px-3 py-1 text-xs font-mono rounded-none h-auto',
                  redundancy === r
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                    : 'bg-muted/30 text-foreground hover:bg-muted/60'
                )}
                aria-pressed={redundancy === r}
              >
                {r === 'n+1' ? 'N + 1' : '2N'}
              </Button>
            ))}
          </div>
          <span className="ml-auto text-xs text-muted-foreground">
            Checked TPS total:{' '}
            <span className="font-mono text-primary">{totalEnabledTps.toLocaleString()}</span>
          </span>
        </div>
      </div>

      {/* Use cases — checkboxes + TPS sliders */}
      <div className="glass-panel p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
            Enterprise use cases
          </p>
          <p className="text-[10px] text-muted-foreground">
            Check a use case to add its load to the fleet requirement.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {USE_CASES.map((uc) => {
            const s = useCaseState[uc.id]
            const pqcAlgos = Object.keys(uc.pqcOps) as AlgoId[]
            return (
              <div
                key={uc.id}
                className={clsx(
                  'rounded-lg border p-3 space-y-2 transition-colors',
                  s.enabled ? 'border-primary/40 bg-primary/5' : 'border-border bg-muted/10'
                )}
              >
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={s.enabled}
                    onChange={(e) => setUseCaseEnabled(uc.id, e.target.checked)}
                    className="mt-0.5 accent-primary"
                    aria-label={`Enable ${uc.name}`}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{uc.name}</p>
                    <p className="text-[10px] text-muted-foreground">{uc.description}</p>
                    <p className="text-[10px] font-mono text-secondary mt-1">
                      Post-PQC ops: {pqcAlgos.map((a) => ALGO_LABELS[a]).join(' + ')}
                    </p>
                  </div>
                </label>
                <SliderRow
                  label="Transactions / sec"
                  value={s.tps}
                  min={0}
                  max={Math.max(uc.defaultTps.large * 3, 100)}
                  step={Math.max(1, Math.floor(uc.defaultTps[size] / 50) || 1)}
                  format={(v) => v.toLocaleString()}
                  onChange={(v) => setUseCaseTps(uc.id, v)}
                  disabled={!s.enabled}
                />
              </div>
            )
          })}
        </div>
      </div>

      {/* Scenario cards — the main visualization */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Gauge size={16} className="text-primary" aria-hidden="true" />
          <p className="text-sm font-semibold text-foreground">Fleet sizing & sufficiency</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {scenarios.map((s, idx) => (
            <ScenarioCard
              key={s.key}
              scenario={s}
              hsmCountMax={hsmCountMax}
              onHsmCountChange={(v) =>
                setHsmCount(idx === 0 ? 'today' : idx === 1 ? 'tomorrow' : 'upgraded', v)
              }
              onResetToRequired={() =>
                resetHsmCount(idx === 0 ? 'today' : idx === 1 ? 'tomorrow' : 'upgraded')
              }
            />
          ))}
        </div>
      </div>

      {/* HSM fleet visual */}
      <div className="glass-panel p-4">
        <div className="flex items-center gap-2 mb-3">
          <Server size={14} className="text-primary" aria-hidden="true" />
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
            Fleet at a glance
          </p>
        </div>
        <div className="space-y-3">
          {scenarios.map((s) => (
            <div key={s.key} className="flex items-start gap-3">
              <div className="w-40 shrink-0 text-xs">
                <p className="font-medium text-foreground">{s.shortLabel}</p>
                <p className="text-[10px] text-muted-foreground">{s.hsmProfile.name}</p>
              </div>
              <HsmFleetVisual count={s.deployedHsms} sufficient={s.sufficient} max={40} />
            </div>
          ))}
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-panel p-4">
          <div className="flex items-center gap-2 mb-3">
            <Cpu size={14} className="text-primary" aria-hidden="true" />
            <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
              HSMs required vs deployed
            </p>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={fleetChartData} margin={{ top: 5, right: 5, bottom: 40, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 9, fill: 'var(--color-muted-foreground)' }}
                angle={-25}
                textAnchor="end"
                interval={0}
              />
              <YAxis tick={{ fontSize: 9, fill: 'var(--color-muted-foreground)' }} />
              <Tooltip
                contentStyle={{
                  background: 'var(--color-card)',
                  border: '1px solid var(--color-border)',
                  fontSize: 11,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Bar dataKey="Required" fill="var(--color-primary)" radius={[3, 3, 0, 0]}>
                {fleetChartData.map((_, i) => (
                  <Cell key={i} fill="var(--color-primary)" />
                ))}
              </Bar>
              <Bar dataKey="Deployed" fill="var(--color-secondary)" radius={[3, 3, 0, 0]}>
                {fleetChartData.map((_d, i) => (
                  <Cell
                    key={i}
                    fill={scenarios[i].sufficient ? 'var(--color-secondary)' : 'var(--destructive)'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-panel p-4">
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck size={14} className="text-accent" aria-hidden="true" />
            <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
              Workload per algorithm (ops / sec)
            </p>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={loadChartData} margin={{ top: 5, right: 5, bottom: 40, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 9, fill: 'var(--color-muted-foreground)' }}
                angle={-25}
                textAnchor="end"
                interval={0}
              />
              <YAxis tick={{ fontSize: 9, fill: 'var(--color-muted-foreground)' }} />
              <Tooltip
                contentStyle={{
                  background: 'var(--color-card)',
                  border: '1px solid var(--color-border)',
                  fontSize: 11,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Bar dataKey="Classical" fill="var(--color-primary)" radius={[3, 3, 0, 0]} />
              <Bar dataKey="PQC" fill="var(--color-accent)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* HSM performance profiles — sliders */}
      <CollapsibleSection
        title="HSM performance profiles (advanced)"
        icon={<Cpu size={14} className="text-primary" aria-hidden="true" />}
        defaultOpen={false}
      >
        <p className="text-[10px] text-muted-foreground mb-3">
          All values start at public-datasheet reference numbers. Tune each slider to match your
          vendor&apos;s benchmarked TPS.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {([classicalHsm, pqcHsm] as HsmProfile[]).map((profile) => (
            <div key={profile.id} className="space-y-3">
              <div>
                <p className="text-sm font-semibold text-foreground">{profile.name}</p>
                <p className="text-[10px] text-muted-foreground">{profile.description}</p>
                <p className="text-[10px] text-muted-foreground italic mt-1">
                  {profile.sourceNote}
                </p>
              </div>
              {ALGO_IDS.map((algo) => {
                const range = ALGO_SLIDER_RANGES[algo]
                return (
                  <SliderRow
                    key={algo}
                    label={`${ALGO_LABELS[algo]} — ops/sec`}
                    value={profile.opsPerSec[algo]}
                    min={range.min}
                    max={range.max}
                    step={range.step}
                    format={(v) => v.toLocaleString()}
                    onChange={(v) => setHsmProfileAlgo(profile.id, algo, v)}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </CollapsibleSection>

      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
          <Download size={14} />
          Export CSV
        </Button>
      </div>
    </div>
  )
}
